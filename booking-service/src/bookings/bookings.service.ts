import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';
import {
  ConfirmPaymentDto,
  CreateBookingDto,
  LockSeatsDto,
} from './dto/booking.dto';
import { BusServiceClient } from './bus-service.client';
import Redis from 'ioredis';

const SEAT_LOCK_TTL_SECONDS = 300; // 5 minutes to get through checkout

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
    private readonly busService: BusServiceClient,
  ) {}

  private lockKey(scheduleId: string, seatId: string) {
    return `seat:lock:${scheduleId}:${seatId}`;
  }

  /**
   * Soft-holds seats while the user fills in passenger details and pays.
   *
   * This is a courtesy hold only — the authoritative claim happens in
   * [createBooking] against bus-service. Re-locking seats the same user already
   * holds is treated as success so a back-and-forth through the checkout screens
   * doesn't lock the user out of their own seats.
   */
  async lockSeats(userId: string, dto: LockSeatsDto) {
    const failedSeats: string[] = [];
    const lockedSeats: string[] = [];

    for (const seatId of dto.seatIds) {
      const key = this.lockKey(dto.scheduleId, seatId);
      const acquired = await this.redisClient.set(
        key,
        userId,
        'EX',
        SEAT_LOCK_TTL_SECONDS,
        'NX',
      );

      if (acquired) {
        lockedSeats.push(seatId);
        continue;
      }

      const holder = await this.redisClient.get(key);
      if (holder === userId) {
        // Already ours — refresh the window rather than failing the checkout.
        await this.redisClient.expire(key, SEAT_LOCK_TTL_SECONDS);
        lockedSeats.push(seatId);
      } else {
        failedSeats.push(seatId);
      }
    }

    if (failedSeats.length > 0) {
      // All-or-nothing: drop the ones we just took so a partial hold doesn't
      // strand seats for five minutes.
      for (const seatId of lockedSeats) {
        await this.releaseLockIfOwned(dto.scheduleId, seatId, userId);
      }
      throw new ConflictException({
        message: 'Seats already locked or booked',
        failedSeats,
      });
    }

    return {
      message: 'Seats locked successfully for 5 minutes',
      lockedSeats,
      expires_in: SEAT_LOCK_TTL_SECONDS,
    };
  }

  /** Deletes a lock only when this user holds it. */
  private async releaseLockIfOwned(
    scheduleId: string,
    seatId: string,
    userId: string,
  ) {
    const key = this.lockKey(scheduleId, seatId);
    const holder = await this.redisClient.get(key);
    if (holder === null || holder === userId) {
      await this.redisClient.del(key);
    }
  }

  /**
   * Creates a booking and claims its seats.
   *
   * The two live in different databases, so they cannot share a transaction.
   * Order of operations is: persist the booking (PENDING) to get an id → claim
   * the seats in bus-service against that id → mark the booking AWAITING
   * payment. If the claim fails the booking row is deleted, so a failed
   * checkout never leaves a ghost booking in the user's list.
   */
  async createBooking(
    userId: string,
    dto: CreateBookingDto,
    authHeader?: string,
  ) {
    const isSeated =
      dto.booking_type === BookingType.BUS ||
      dto.booking_type === BookingType.JOURNEY_LEG;
    const seatNumbers = dto.seat_numbers ?? [];

    // Held as a local so the seat-claim path below reads a definitely-present
    // id: `schedule_id` is optional on the DTO now that unseated types exist.
    let scheduleId = '';

    if (isSeated) {
      if (!dto.schedule_id) {
        throw new BadRequestException(
          `schedule_id is required for ${dto.booking_type} bookings`,
        );
      }
      scheduleId = dto.schedule_id;
      if (seatNumbers.length === 0) {
        throw new BadRequestException('At least one seat is required');
      }
      await this.assertSeatsHeldBy(userId, scheduleId, seatNumbers);
    } else if (!dto.item_id) {
      // An unseated booking with neither a schedule nor an item records a
      // payment against nothing — it would show up in the user's list with no
      // way to tell what they bought.
      throw new BadRequestException(
        `item_id is required for ${dto.booking_type} bookings`,
      );
    }

    let booking: Booking;
    try {
      booking = this.bookingRepo.create({
        ...dto,
        user_id: userId,
        status: BookingStatus.PENDING,
        travel_date: dto.travel_date ? new Date(dto.travel_date) : null,
      } as Partial<Booking>);
      booking.qr_code = Buffer.from(
        `TICKET-${Date.now()}-${userId}`,
      ).toString('base64');
      booking = await this.bookingRepo.save(booking);
    } catch (error: any) {
      this.logger.error(`Failed to persist booking: ${error?.message}`);
      throw new InternalServerErrorException(
        error?.message || 'Database error occurred',
      );
    }

    if (!isSeated) return booking;

    try {
      await this.busService.bookSeats(
        scheduleId,
        {
          seats: this.toSeatAssignments(seatNumbers, dto.passenger_details),
          booking_id: booking.id,
          user_id: userId,
        },
        authHeader,
      );
    } catch (error) {
      // The seats went to somebody else (or bus-service is down). Undo the
      // booking row so the user can retry cleanly.
      await this.bookingRepo.delete(booking.id).catch((deleteError) => {
        this.logger.error(
          `Orphaned booking ${booking.id} after failed seat claim: ${String(deleteError)}`,
        );
      });
      throw error;
    }

    // Seats are ours in the authoritative store now; the soft holds have done
    // their job.
    await this.releaseLocks(userId, scheduleId, seatNumbers);

    // Re-read so the client gets DB defaults it did not send. Falling back to
    // the in-memory row matters: the caller parses this response into a booking
    // and would choke on an empty body.
    return (
      (await this.bookingRepo.findOne({ where: { id: booking.id } })) ?? booking
    );
  }

  /**
   * Refuses to book a seat this user does not hold. A missing lock means the
   * hold expired mid-checkout — better to fail here than to let the claim race
   * somebody who legitimately holds it now.
   */
  private async assertSeatsHeldBy(
    userId: string,
    scheduleId: string,
    seatNumbers: string[],
  ) {
    const notHeld: string[] = [];
    for (const seat of seatNumbers) {
      const holder = await this.redisClient.get(this.lockKey(scheduleId, seat));
      if (holder !== userId) notHeld.push(seat);
    }
    if (notHeld.length) {
      throw new ConflictException({
        message:
          'Your seat hold expired or those seats were taken. Please pick your seats again.',
        failedSeats: notHeld,
      });
    }
  }

  /**
   * Pairs each seat with the gender of whoever sits in it, so the seat map can
   * enforce ladies-seat rules for later shoppers.
   */
  private toSeatAssignments(seatNumbers: string[], passengers?: any[]) {
    return seatNumbers.map((seat_number) => {
      const passenger = (passengers ?? []).find(
        (p) => p?.seat_number === seat_number,
      );
      const raw = String(passenger?.gender ?? '').trim().toUpperCase();
      const gender = ['M', 'F', 'O'].includes(raw[0])
        ? raw[0]
        : raw.startsWith('FEMALE')
          ? 'F'
          : raw.startsWith('MALE')
            ? 'M'
            : undefined;
      return gender ? { seat_number, gender } : { seat_number };
    });
  }

  private async releaseLocks(
    userId: string,
    scheduleId: string,
    seatNumbers: string[],
  ) {
    for (const seat of seatNumbers) {
      await this.releaseLockIfOwned(scheduleId, seat, userId);
    }
  }

  /**
   * Marks a booking paid. payment-service has no callback into this service, so
   * the client reports the capture — mirroring how hotel bookings are
   * confirmed. Idempotent: confirming twice is a no-op, not an error.
   */
  async confirmPayment(
    bookingId: string,
    userId: string,
    dto: ConfirmPaymentDto,
  ) {
    const booking = await this.getBookingDetails(bookingId, userId);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ConflictException('This booking was cancelled');
    }
    if (booking.status === BookingStatus.CONFIRMED) {
      return booking;
    }

    booking.payment_id = dto.payment_id ?? booking.payment_id;
    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepo.save(booking);
  }

  async getBookingDetails(id: string, userId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id, user_id: userId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getMyBookings(userId: string) {
    return this.bookingRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Passenger manifest for one departure, for the operator running it.
   *
   * Ownership is proved against bus-service: the schedule names its operator,
   * and bus-service confirms the caller owns that operator. Without both checks
   * this would hand any signed-in user a list of other people's travel details.
   */
  async getScheduleManifest(scheduleId: string, authHeader?: string) {
    if (!authHeader) {
      throw new ForbiddenException('Missing credentials');
    }

    const schedule = await this.busService.getSchedule(scheduleId);
    const operatorId = schedule?.operator_id;
    if (!operatorId) {
      throw new NotFoundException('Schedule not found');
    }

    const owned = await this.busService.ownsOperator(operatorId, authHeader);
    if (!owned) {
      throw new ForbiddenException(
        'You do not operate this trip',
      );
    }

    const bookings = await this.bookingRepo.find({
      where: { schedule_id: scheduleId },
      order: { created_at: 'DESC' },
    });

    // Cancelled bookings stay in the list so the operator can see the churn,
    // but they are excluded from the headline counts.
    const live = bookings.filter((b) => b.status !== BookingStatus.CANCELLED);

    return {
      schedule_id: scheduleId,
      operator_id: operatorId,
      departure_date: schedule?.departure_date ?? null,
      departure_time: schedule?.departure_time ?? null,
      route: schedule?.route
        ? {
            source_city: schedule.route.source_city,
            destination_city: schedule.route.destination_city,
          }
        : null,
      total_bookings: live.length,
      seats_sold: live.reduce(
        (sum, b) => sum + (b.seat_numbers?.length ?? 0),
        0,
      ),
      gross_amount: live.reduce((sum, b) => sum + Number(b.total_amount), 0),
      bookings,
    };
  }

  /** Cancels a booking and puts its seats back on sale. */
  async cancelBooking(id: string, userId: string, authHeader?: string) {
    const booking = await this.getBookingDetails(id, userId);

    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    const seatNumbers = booking.seat_numbers ?? [];
    if (seatNumbers.length && booking.schedule_id) {
      try {
        await this.busService.releaseSeats(
          booking.schedule_id,
          { seat_numbers: seatNumbers, booking_id: booking.id },
          authHeader,
        );
      } catch (error) {
        // Never block a cancellation on inventory bookkeeping — the seats can
        // be reconciled, a stuck cancellation cannot.
        this.logger.error(
          `Booking ${booking.id} cancelled but seats not released: ${String(error)}`,
        );
      }
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }
}
