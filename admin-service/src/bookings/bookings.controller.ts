import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';

@Controller('api/v1/admin/bookings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Permissions('read:bookings')
  async getBookings() {
    return this.bookingsService.getBookings();
  }

  @Post(':id/cancel')
  @Permissions('write:bookings')
  async cancelBooking(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }
}
