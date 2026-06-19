import { Controller, Post, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hotel')
  createHotelBooking(@Body() bookingDto: any) {
    return this.bookingsService.createBooking(bookingDto);
  }
}
