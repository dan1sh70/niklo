import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Booking,
  HotelBookingStatus,
  HotelPaymentMethod,
  OCCUPYING_STATUSES,
} from './entities/booking.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { RoomType } from '../hotels/entities/room-type.entity';
import {
  CancelBookingDto,
  ConfirmPaymentDto,
  CreateHotelBookingDto,
  QuoteHotelBookingDto,
} from './dto/hotel-booking.dto';
import { calculatePrice, countNights, PriceBreakdown } from './booking-pricing.util';

/** Statuses a guest is allowed to cancel from. */
const CANCELLABLE_STATUSES = [
  HotelBookingStatus.PendingPayment,
  HotelBookingStatus.Confirmed,
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
  ) {}

  // ---------------------------------------------------------------- guest API

  /** Prices a stay without reserving anything, so the app can show a total. */
  async quote(dto: QuoteHotelBookingDto) {
    const { room } = await this.loadRoomForHotel(dto.roomTypeId, dto.hotelId);
    const breakdown = calculatePrice({
      roomPrice: room.price,
      roomTaxes: room.taxes,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      rooms: dto.rooms,
      adults: dto.adults,
      children: dto.children ?? 0,
      isHourly: dto.isHourly ?? false,
      hourlyDurationHours: dto.hourlyDurationHours,
    });

    const roomsLeft = await this.countAvailableRooms(
      room,
      dto.checkInDate,
      dto.checkOutDate,
    );

    return {
      hotelId: dto.hotelId,
      roomTypeId: dto.roomTypeId,
      roomTitle: room.title,
      available: roomsLeft >= dto.rooms,
      roomsLeft,
      priceBreakdown: breakdown,
      amount: breakdown.total,
      currency: breakdown.currency,
    };
  }

  async createBooking(userId: string, dto: CreateHotelBookingDto) {
    const { hotel, room } = await this.loadRoomForHotel(
      dto.roomTypeId,
      dto.hotelId,
    );

    if (!room.isActive || hotel.isActive === false) {
      throw new ConflictException('This room is not open for booking.');
    }

    this.assertNotInThePast(dto.checkInDate);

    const roomsLeft = await this.countAvailableRooms(
      room,
      dto.checkInDate,
      dto.checkOutDate,
    );
    if (roomsLeft < dto.rooms) {
      throw new ConflictException(
        roomsLeft > 0
          ? `Only ${roomsLeft} room(s) of this type are left for these dates.`
          : 'This room type is sold out for the selected dates.',
      );
    }

    // Price is derived from the stored room rate; whatever the client believed
    // the total was plays no part in it.
    const breakdown = calculatePrice({
      roomPrice: room.price,
      roomTaxes: room.taxes,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      rooms: dto.rooms,
      adults: dto.adults,
      children: dto.children ?? 0,
      isHourly: dto.isHourly ?? false,
      hourlyDurationHours: dto.hourlyDurationHours,
    });

    // A cash booking has nothing to wait for: no gateway will ever report a
    // capture, so leaving it pending would hold the room in a state the
    // partner cannot act on and the guest cannot clear.
    const paysCash = dto.paymentMethod === HotelPaymentMethod.Cash;

    const booking = this.bookingRepository.create({
      bookingId: this.generateBookingId(),
      hotelId: hotel.id,
      roomTypeId: room.id,
      hotelName: hotel.hotelName,
      hotelAddress: hotel.address,
      hotelImagePath: hotel.imagePath,
      roomTitle: room.title,
      hotelOwnerId: hotel.ownerId ?? null,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      nights: dto.isHourly ? 0 : countNights(dto.checkInDate, dto.checkOutDate),
      rooms: dto.rooms,
      adults: dto.adults,
      children: dto.children ?? 0,
      childAges: dto.childAges ?? [],
      isHourly: dto.isHourly ?? false,
      hourlyCheckInTime: dto.hourlyCheckInTime ?? null,
      hourlyDurationHours: dto.hourlyDurationHours ?? null,
      guests: dto.guests ?? [],
      contactEmail: dto.contactEmail ?? null,
      contactPhone: dto.contactPhone,
      totalAmount: breakdown.total,
      priceBreakdown: breakdown,
      userId,
      status: paysCash
        ? HotelBookingStatus.Confirmed
        : HotelBookingStatus.PendingPayment,
      confirmedAt: paysCash ? new Date() : null,
      paymentMethod: paysCash
        ? HotelPaymentMethod.Cash
        : HotelPaymentMethod.Online,
      currency: breakdown.currency,
      paymentGatewayOrderId: null,
    });

    await this.bookingRepository.save(booking);

    return {
      bookingId: booking.bookingId,
      status: booking.status,
      amount: booking.totalAmount,
      currency: booking.currency,
      priceBreakdown: booking.priceBreakdown,
      paymentMethod: booking.paymentMethod,
      paymentGatewayOrderId: booking.paymentGatewayOrderId,
    };
  }

  async getMyBookings(userId: string) {
    const bookings = await this.bookingRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { total: bookings.length, bookings };
  }

  async getBookingDetails(bookingId: string, userId: string) {
    const booking = await this.findByBookingId(bookingId);
    if (booking.userId !== userId) {
      throw new ForbiddenException('This booking belongs to another account.');
    }
    return booking;
  }

  /**
   * Marks a booking paid. Called by the client once the payment service reports
   * a successful capture; until then the booking stays `pending_payment`.
   */
  async confirmPayment(
    bookingId: string,
    userId: string,
    dto: ConfirmPaymentDto,
  ) {
    const booking = await this.findByBookingId(bookingId);
    if (booking.userId !== userId) {
      throw new ForbiddenException('This booking belongs to another account.');
    }
    if (booking.status === HotelBookingStatus.Cancelled) {
      throw new ConflictException('This booking was cancelled.');
    }
    // Re-confirming an already paid booking is a no-op rather than an error, so
    // a retried request from the client cannot corrupt the record.
    if (booking.status === HotelBookingStatus.PendingPayment) {
      booking.status = HotelBookingStatus.Confirmed;
      booking.confirmedAt = new Date();
    }
    booking.paymentId = dto.paymentId;
    if (dto.paymentGatewayOrderId) {
      booking.paymentGatewayOrderId = dto.paymentGatewayOrderId;
    }
    await this.bookingRepository.save(booking);
    return booking;
  }

  /**
   * Switches a booking to settle in cash at the property and confirms it.
   *
   * The guest picks how to pay on the checkout screen, which runs after the
   * booking already exists — so this is what a booking created for the online
   * flow becomes when they choose cash instead. Only a booking still waiting
   * for payment can move: one already paid for online would otherwise be
   * quietly rewritten as unpaid.
   */
  async payAtProperty(bookingId: string, userId: string) {
    const booking = await this.findByBookingId(bookingId);
    if (booking.userId !== userId) {
      throw new ForbiddenException('This booking belongs to another account.');
    }
    if (booking.paymentMethod === HotelPaymentMethod.Cash) {
      return booking; // Already set; repeating the request changes nothing.
    }
    if (booking.status !== HotelBookingStatus.PendingPayment) {
      throw new ConflictException(
        `A booking that is ${booking.status.replace('_', ' ')} cannot be switched to cash.`,
      );
    }

    booking.paymentMethod = HotelPaymentMethod.Cash;
    booking.status = HotelBookingStatus.Confirmed;
    booking.confirmedAt = new Date();
    await this.bookingRepository.save(booking);
    return booking;
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.findByBookingId(bookingId);
    if (booking.userId !== userId) {
      throw new ForbiddenException('This booking belongs to another account.');
    }
    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw new ConflictException(
        `A booking that is ${booking.status.replace('_', ' ')} cannot be cancelled.`,
      );
    }
    booking.status = HotelBookingStatus.Cancelled;
    booking.cancelledAt = new Date();
    booking.cancellationReason = dto.reason ?? null;
    await this.bookingRepository.save(booking);
    return booking;
  }

  // -------------------------------------------------------------- partner API

  /** Bookings across every property the partner owns. */
  async getPartnerBookings(ownerId: string, status?: string) {
    const hotelIds = await this.ownedHotelIds(ownerId);
    if (hotelIds.length === 0) return { total: 0, bookings: [] };

    const where: any = { hotelId: In(hotelIds) };
    if (status) {
      if (!Object.values(HotelBookingStatus).includes(status as HotelBookingStatus)) {
        throw new BadRequestException(`Unknown booking status "${status}".`);
      }
      where.status = status as HotelBookingStatus;
    }

    const bookings = await this.bookingRepository.find({
      where,
      order: { checkInDate: 'ASC', createdAt: 'DESC' },
    });
    return { total: bookings.length, bookings };
  }

  async checkIn(bookingId: string, ownerId: string) {
    const booking = await this.findOwnedBooking(bookingId, ownerId);
    if (booking.status !== HotelBookingStatus.Confirmed) {
      throw new ConflictException(
        'Only a confirmed booking can be checked in.',
      );
    }
    booking.status = HotelBookingStatus.CheckedIn;
    booking.checkedInAt = new Date();
    await this.bookingRepository.save(booking);
    return booking;
  }

  async checkOut(bookingId: string, ownerId: string) {
    const booking = await this.findOwnedBooking(bookingId, ownerId);
    if (booking.status !== HotelBookingStatus.CheckedIn) {
      throw new ConflictException(
        'Only a checked-in booking can be checked out.',
      );
    }
    booking.status = HotelBookingStatus.CheckedOut;
    booking.checkedOutAt = new Date();
    await this.bookingRepository.save(booking);
    return booking;
  }

  /** Revenue actually earned — pending and cancelled bookings are excluded. */
  async getPartnerEarnings(ownerId: string) {
    const hotelIds = await this.ownedHotelIds(ownerId);
    if (hotelIds.length === 0) {
      return {
        totalEarnings: 0,
        pendingPayout: 0,
        completedStays: 0,
        upcomingStays: 0,
        currency: 'INR',
        byHotel: [],
      };
    }

    const bookings = await this.bookingRepository.find({
      where: { hotelId: In(hotelIds) },
    });

    const earned = bookings.filter((b) =>
      [
        HotelBookingStatus.Confirmed,
        HotelBookingStatus.CheckedIn,
        HotelBookingStatus.CheckedOut,
      ].includes(b.status),
    );

    const byHotel = hotelIds.map((hotelId) => {
      const forHotel = earned.filter((b) => b.hotelId === hotelId);
      return {
        hotelId,
        hotelName: forHotel[0]?.hotelName ?? null,
        bookings: forHotel.length,
        earnings: forHotel.reduce((sum, b) => sum + b.totalAmount, 0),
      };
    });

    const isCash = (b: Booking) => b.paymentMethod === HotelPaymentMethod.Cash;
    const sum = (list: Booking[]) =>
      list.reduce((total, b) => total + b.totalAmount, 0);

    return {
      totalEarnings: sum(earned),
      // What we owe the partner: money that actually passed through us, for
      // stays that have not completed yet. Cash never reaches us, so paying it
      // out would be paying twice.
      pendingPayout: sum(
        earned.filter(
          (b) => !isCash(b) && b.status !== HotelBookingStatus.CheckedOut,
        ),
      ),
      // Cash the partner takes at the desk. Split by whether the stay is done,
      // so an unpaid arrival is visible rather than counted as money in hand.
      cashToCollect: sum(
        earned.filter(
          (b) => isCash(b) && b.status !== HotelBookingStatus.CheckedOut,
        ),
      ),
      cashCollected: sum(
        earned.filter(
          (b) => isCash(b) && b.status === HotelBookingStatus.CheckedOut,
        ),
      ),
      completedStays: earned.filter(
        (b) => b.status === HotelBookingStatus.CheckedOut,
      ).length,
      upcomingStays: earned.filter(
        (b) => b.status === HotelBookingStatus.Confirmed,
      ).length,
      currency: 'INR',
      byHotel,
    };
  }

  /** Headline counters for the partner dashboard. */
  async getPartnerSummary(ownerId: string) {
    const hotelIds = await this.ownedHotelIds(ownerId);
    if (hotelIds.length === 0) {
      return {
        properties: 0,
        totalBookings: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
        currentlyHosted: 0,
        pendingPayment: 0,
        totalEarnings: 0,
        currency: 'INR',
      };
    }

    const bookings = await this.bookingRepository.find({
      where: { hotelId: In(hotelIds) },
    });
    const today = new Date().toISOString().split('T')[0];

    return {
      properties: hotelIds.length,
      totalBookings: bookings.length,
      todayCheckIns: bookings.filter(
        (b) =>
          b.checkInDate === today && b.status === HotelBookingStatus.Confirmed,
      ).length,
      todayCheckOuts: bookings.filter(
        (b) =>
          b.checkOutDate === today && b.status === HotelBookingStatus.CheckedIn,
      ).length,
      currentlyHosted: bookings.filter(
        (b) => b.status === HotelBookingStatus.CheckedIn,
      ).length,
      pendingPayment: bookings.filter(
        (b) => b.status === HotelBookingStatus.PendingPayment,
      ).length,
      totalEarnings: bookings
        .filter((b) =>
          [
            HotelBookingStatus.Confirmed,
            HotelBookingStatus.CheckedIn,
            HotelBookingStatus.CheckedOut,
          ].includes(b.status),
        )
        .reduce((sum, b) => sum + b.totalAmount, 0),
      currency: 'INR',
    };
  }

  /**
   * Day-by-day occupancy for the partner calendar.
   *
   * `days` is capped so a wide range cannot turn into an unbounded response.
   */
  async getPartnerCalendar(ownerId: string, fromDate: string, days: number) {
    const hotelIds = await this.ownedHotelIds(ownerId);
    const span = Math.min(Math.max(days || 30, 1), 90);
    const start = ISO_DATE.test(fromDate)
      ? fromDate
      : new Date().toISOString().split('T')[0];

    if (hotelIds.length === 0) return { from: start, days: span, calendar: [] };

    const bookings = (
      await this.bookingRepository.find({
        where: { hotelId: In(hotelIds), status: In(OCCUPYING_STATUSES) },
      })
    ).filter((b) => ISO_DATE.test(b.checkInDate));

    const rooms = await this.roomTypeRepository
      .createQueryBuilder('room')
      .leftJoin('room.hotel', 'hotel')
      .where('hotel.id IN (:...hotelIds)', { hotelIds })
      .andWhere('room.isActive = true')
      .getMany();
    const totalRooms = rooms.reduce((sum, r) => sum + (r.totalRooms || 1), 0);

    const startMs = new Date(`${start}T00:00:00Z`).getTime();
    const calendar = Array.from({ length: span }, (_, offset) => {
      const date = new Date(startMs + offset * 86400000)
        .toISOString()
        .split('T')[0];
      const occupied = bookings
        .filter((b) => this.coversDate(b, date))
        .reduce((sum, b) => sum + b.rooms, 0);
      return {
        date,
        occupiedRooms: occupied,
        totalRooms,
        availableRooms: Math.max(0, totalRooms - occupied),
        checkIns: bookings.filter((b) => b.checkInDate === date).length,
        checkOuts: bookings.filter((b) => this.occupancyEnd(b) === date).length,
      };
    });

    return { from: start, days: span, calendar };
  }

  // ----------------------------------------------------------------- internals

  private async loadRoomForHotel(roomTypeId: string, hotelId: string) {
    const room = await this.roomTypeRepository.findOne({
      where: { id: roomTypeId },
      relations: { hotel: true },
    });
    if (!room) {
      throw new NotFoundException(`Room type ${roomTypeId} was not found.`);
    }
    if (!room.hotel || room.hotel.id !== hotelId) {
      throw new BadRequestException(
        'This room type does not belong to the given hotel.',
      );
    }
    return { hotel: room.hotel, room };
  }

  private async findByBookingId(bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} was not found.`);
    }
    return booking;
  }

  private async findOwnedBooking(bookingId: string, ownerId: string) {
    const booking = await this.findByBookingId(bookingId);
    const hotel = await this.hotelRepository.findOne({
      where: { id: booking.hotelId },
    });
    if (!hotel || hotel.ownerId !== ownerId) {
      throw new ForbiddenException(
        'This booking belongs to a property you do not manage.',
      );
    }
    return booking;
  }

  private async ownedHotelIds(ownerId: string): Promise<string[]> {
    const hotels = await this.hotelRepository.find({
      where: { ownerId },
      select: { id: true },
    });
    return hotels.map((h) => h.id);
  }

  /**
   * Rooms of this type still sellable for the range.
   *
   * Overlap is resolved in memory rather than SQL: rows written before dates
   * were validated can hold values that are not dates at all, and casting those
   * in a query would fail the whole request.
   */
  private async countAvailableRooms(
    room: RoomType,
    checkInDate: string,
    checkOutDate: string,
  ): Promise<number> {
    const held = await this.bookingRepository.find({
      where: { roomTypeId: room.id, status: In(OCCUPYING_STATUSES) },
    });

    const start = checkInDate;
    const end = this.effectiveEnd(checkInDate, checkOutDate);

    const overlapping = held.filter((b) => {
      if (!ISO_DATE.test(b.checkInDate)) return false;
      const bStart = b.checkInDate;
      const bEnd = this.occupancyEnd(b);
      return bStart < end && bEnd > start;
    });

    const roomsTaken = overlapping.reduce((sum, b) => sum + b.rooms, 0);
    return Math.max(0, (room.totalRooms || 1) - roomsTaken);
  }

  /** An hourly or same-day stay still occupies the room for that whole date. */
  private effectiveEnd(checkInDate: string, checkOutDate: string): string {
    if (ISO_DATE.test(checkOutDate) && checkOutDate > checkInDate) {
      return checkOutDate;
    }
    return this.nextDay(checkInDate);
  }

  private occupancyEnd(booking: Booking): string {
    return this.effectiveEnd(booking.checkInDate, booking.checkOutDate);
  }

  private coversDate(booking: Booking, date: string): boolean {
    return booking.checkInDate <= date && this.occupancyEnd(booking) > date;
  }

  private nextDay(date: string): string {
    const ms = new Date(`${date}T00:00:00Z`).getTime();
    if (Number.isNaN(ms)) return date;
    return new Date(ms + 86400000).toISOString().split('T')[0];
  }

  private assertNotInThePast(checkInDate: string) {
    const today = new Date().toISOString().split('T')[0];
    if (checkInDate < today) {
      throw new BadRequestException('checkInDate cannot be in the past.');
    }
  }

  /**
   * Booking references stay human-readable but are built from the clock rather
   * than a small random range, which used to make collisions plausible.
   */
  private generateBookingId(): string {
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase();
    const salt = Math.floor(Math.random() * 36 ** 2)
      .toString(36)
      .toUpperCase()
      .padStart(2, '0');
    return `BKG${year}${stamp}${salt}`;
  }
}
