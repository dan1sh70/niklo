import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import Redis from 'ioredis';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async lockSeats(userId: string, dto: { scheduleId: string; seatIds: number[] }) {
    const failedSeats: number[] = [];
    const lockedSeats: number[] = [];

    for (const seatId of dto.seatIds) {
      const lockKey = `seat:lock:${dto.scheduleId}:${seatId}`;
      const setnxResult = await this.redisClient.setnx(lockKey, userId);

      if (setnxResult === 1) {
        await this.redisClient.expire(lockKey, 300); // 5 minutes
        lockedSeats.push(seatId);
      } else {
        failedSeats.push(seatId);
      }
    }

    if (failedSeats.length > 0) {
      // Release any seats we locked since not all could be acquired
      for (const seatId of lockedSeats) {
        await this.redisClient.del(`seat:lock:${dto.scheduleId}:${seatId}`);
      }
      throw new ConflictException({
        message: 'Seats already locked or booked',
        failedSeats,
      });
    }

    return { message: 'Seats locked successfully for 5 minutes', lockedSeats };
  }

  async createBooking(userId: string, dto: any) {
    try {
      const booking = this.bookingRepo.create({
        user_id: userId,
        ...dto,
        status: BookingStatus.PENDING,
      } as Partial<Booking>);
      (booking as Booking).qr_code = Buffer.from(
        `TICKET-${Date.now()}-${userId}`,
      ).toString('base64');
      return await this.bookingRepo.save(booking as Booking);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Database error occurred');
    }
  }

  async getBookingDetails(id: string, userId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id, user_id: userId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.getBookingDetails(id, userId);
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }
}
