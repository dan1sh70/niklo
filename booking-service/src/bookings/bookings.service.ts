import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';
import Redis from 'ioredis';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async lockSeats(userId: string, dto: { scheduleId: string; seatIds: string[] }) {
    const failedSeats: string[] = [];
    const lockedSeats: string[] = [];

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

  async getMyBookings(userId: string) {
    return this.bookingRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.getBookingDetails(id, userId);
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }

  // --- HOTEL PARTNER METHODS --- //

  // In a real system, you'd verify if the hotel belongs to the partner.
  // For demonstration, we assume authorization is checked or hotel belongs to partner.
  
  async hotelCheckIn(bookingId: string, partnerId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, booking_type: BookingType.HOTEL } });
    if (!booking) throw new NotFoundException('Booking not found');
    
    booking.status = BookingStatus.CHECKED_IN;
    // You could also record checkedInAt here if you add it to schema
    return this.bookingRepo.save(booking);
  }

  async hotelCheckOut(bookingId: string, partnerId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, booking_type: BookingType.HOTEL } });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = BookingStatus.CHECKED_OUT;
    return this.bookingRepo.save(booking);
  }

  async hotelPartnerCancel(bookingId: string, partnerId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, booking_type: BookingType.HOTEL } });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }

  async getHotelPartnerSummary(partnerId: string) {
    // Aggregation query: count bookings by status for hotels owned by this partner.
    // For simplicity, we are returning mock values for the structural API.
    // Ideally this does a query builder matching schedule_id = hotel_id.
    return {
      totalBookings: 142,
      todayCheckIns: 8,
      todayCheckOuts: 5,
      activeStays: 18,
      totalEarnings: 485000.00,
      monthlyEarnings: 125000.00,
      occupancyRate: 82.5
    };
  }

  async getHotelPartnerCalendar(partnerId: string) {
    return {
      calendar: [
        {
          date: new Date().toISOString().split('T')[0],
          totalAvailableRooms: 25,
          bookedRooms: 20,
          blockedRooms: 2,
          occupancyRate: 80.0,
          averageDailyRate: 5800.00
        }
      ]
    };
  }

  async getHotelPartnerEarnings(partnerId: string) {
    return {
      totalEarnings: 485000.00,
      monthlyEarnings: 125000.00,
      recentPayouts: []
    };
  }

  async getHotelPartnerOccupancy(partnerId: string) {
    return [
      { month: 'January', occupancy: 75.0 },
      { month: 'February', occupancy: 82.5 },
      { month: 'March', occupancy: 90.0 }
    ];
  }
}
