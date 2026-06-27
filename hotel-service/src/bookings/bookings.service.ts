import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(bookingDto: any) {
    const bookingData = {
      ...bookingDto,
      bookingId: `BKG${new Date().getFullYear()}${Math.floor(Math.random() * 10000)}`,
      status: 'pending_payment',
      currency: 'INR',
      paymentGatewayOrderId: `order_${Math.floor(Math.random() * 1000000)}`,
    };
    const booking = this.bookingRepository.create(
      bookingData as Partial<Booking>,
    );

    await this.bookingRepository.save(booking);

    return {
      bookingId: booking.bookingId,
      status: booking.status,
      amount: booking.totalAmount,
      currency: booking.currency,
      paymentGatewayOrderId: booking.paymentGatewayOrderId,
    };
  }
}
