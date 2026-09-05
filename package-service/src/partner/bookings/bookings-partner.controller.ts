import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsPartnerService } from './bookings-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsPartnerController {
  constructor(private readonly bookingsService: BookingsPartnerService) {}

  @Get()
  async listBookings(@Req() req: any, @Query() query: any) {
    const data = await this.bookingsService.listBookings(req.user.id, query);
    return { success: true, data };
  }

  @Get(':id')
  async getBooking(@Req() req: any, @Param('id') id: string) {
    const data = await this.bookingsService.getBooking(req.user.id, id);
    return { success: true, data };
  }

  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(@Req() req: any, @Param('id') id: string) {
    const data = await this.bookingsService.checkIn(req.user.id, id);
    return { success: true, message: 'Guest checked in successfully', data };
  }

  @Post(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  async reschedule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.bookingsService.reschedule(req.user.id, id, body);
    return { success: true, message: 'Booking rescheduled successfully and customer notified', data };
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Req() req: any, @Param('id') id: string) {
    const data = await this.bookingsService.confirm(req.user.id, id);
    return { success: true, message: 'Booking confirmed', data };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    const data = await this.bookingsService.cancel(req.user.id, id, body.reason);
    return { success: true, message: 'Booking cancelled and refund initiated', data };
  }
}
