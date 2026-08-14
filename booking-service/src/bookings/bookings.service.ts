import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';

@Injectable()
export class BookingsService implements OnApplicationBootstrap {
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.bookingRepo.count();
    if (count === 0) {
      const mockBooking = this.bookingRepo.create({
        id: 'bkg_771029',
        user_id: this.MOCK_USER_ID,
        booking_type: BookingType.BUS,
        reference_id: '22222222-2222-2222-2222-222222222222',
        booking_reference: 'NIK-BUS-88210',
        title: 'Greenline Travels (AC Sleeper)',
        subtitle: 'Kolkata to Siliguri',
        from_location: 'Esplanade, Kolkata',
        to_location: 'Junction, Siliguri',
        travel_date: new Date('2026-08-28'),
        departure_time: '20:00',
        total_amount: 1200.00,
        status: BookingStatus.CONFIRMED,
        qr_code_token: 'eyJhbGciOiJIUzI1Ni...'
      });
      await this.bookingRepo.save(mockBooking);
      console.log('Seeded bookings mock data successfully.');
    }
  }

  private mapBookingToDto(b: Booking) {
    return {
      id: b.id,
      bookingReference: b.booking_reference,
      bookingType: b.booking_type,
      title: b.title,
      subtitle: b.subtitle,
      fromLocation: b.from_location,
      toLocation: b.to_location,
      travelDate: b.travel_date ? b.travel_date.toISOString().split('T')[0] : null,
      departureTime: b.departure_time,
      totalAmount: Number(b.total_amount),
      status: b.status,
      qrCodeToken: b.qr_code_token,
    };
  }

  async getHistory(query: any) {
    const { type, status, limit = 20, page = 1 } = query;
    // In production, user_id should come from req.user
    const qb = this.bookingRepo.createQueryBuilder('b')
      .where('b.user_id = :userId', { userId: this.MOCK_USER_ID })
      .orderBy('b.created_at', 'DESC');

    if (type && type !== 'ALL') {
      qb.andWhere('b.booking_type = :type', { type });
    }

    if (status) {
      // Basic mock implementation for status, if UPCOMING we check date and status
      if (status === 'UPCOMING') {
        qb.andWhere('b.status = :bStatus', { bStatus: BookingStatus.CONFIRMED })
          .andWhere('b.travel_date >= CURRENT_DATE');
      } else if (status === 'PAST') {
        qb.andWhere('b.status IN (:...bStatus)', { bStatus: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] });
      }
    }

    const bookings = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return bookings.map(b => this.mapBookingToDto(b));
  }

  async getCancellationQuote(id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id, user_id: this.MOCK_USER_ID },
    });
    
    if (!booking) throw new NotFoundException('Booking not found');

    const amountPaid = Number(booking.total_amount) || 0;
    const penaltyAmount = amountPaid * 0.10; // 10% penalty
    const refundAmount = amountPaid - penaltyAmount;

    return {
      booking_id: booking.id,
      total_paid: amountPaid,
      penalty_amount: penaltyAmount,
      refund_amount: refundAmount,
      currency: 'INR',
      cancellation_policy: '10% penalty applied for cancellation before 24 hours.'
    };
  }

  async verifyTicket(token: string) {
    const booking = await this.bookingRepo.findOne({
      where: { qr_code_token: token },
    });

    if (!booking) {
      throw new NotFoundException('Invalid or expired QR Ticket');
    }

    return {
      message: 'Ticket verified successfully',
      valid: true,
      booking_id: booking.id,
      passenger_id: booking.user_id,
      status: booking.status,
    };
  }
}
