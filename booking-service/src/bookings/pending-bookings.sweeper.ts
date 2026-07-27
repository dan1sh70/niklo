import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { BusServiceClient } from './bus-service.client';

/** How long a booking may sit unpaid before its seats go back on sale. */
const PENDING_TTL_MS = 15 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Releases seats held by checkouts that were never paid for.
 *
 * Seats are claimed *before* payment so two people cannot buy the same seat.
 * The cost of that ordering is that an abandoned checkout — app closed on the
 * payment screen, card declined and never retried — would otherwise hold its
 * seats forever. This sweep is what makes the claim-then-pay ordering safe.
 */
@Injectable()
export class PendingBookingsSweeper implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PendingBookingsSweeper.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly busService: BusServiceClient,
  ) {}

  onModuleInit() {
    // unref() so the sweep never keeps the process alive on shutdown.
    this.timer = setInterval(() => {
      void this.sweep();
    }, SWEEP_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<number> {
    const cutoff = new Date(Date.now() - PENDING_TTL_MS);

    let stale: Booking[];
    try {
      stale = await this.bookingRepo.find({
        where: {
          status: BookingStatus.PENDING,
          created_at: LessThan(cutoff),
        },
        take: 100,
      });
    } catch (error) {
      this.logger.error(`Could not read stale bookings: ${String(error)}`);
      return 0;
    }

    if (!stale.length) return 0;

    let expired = 0;
    for (const booking of stale) {
      const seats = booking.seat_numbers ?? [];

      if (seats.length && booking.schedule_id) {
        try {
          await this.busService.releaseSeats(booking.schedule_id, {
            seat_numbers: seats,
            booking_id: booking.id,
          });
        } catch (error) {
          // Leave the booking PENDING so the next sweep retries it — marking it
          // cancelled here would strand the seats permanently.
          this.logger.warn(
            `Could not release seats for stale booking ${booking.id}: ${String(error)}`,
          );
          continue;
        }
      }

      booking.status = BookingStatus.CANCELLED;
      await this.bookingRepo.save(booking);
      expired++;
    }

    if (expired) {
      this.logger.log(`Expired ${expired} unpaid booking(s) and freed seats`);
    }
    return expired;
  }
}
