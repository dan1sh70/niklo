import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';

@Controller('api/v1/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hotel/quote')
  @HttpCode(HttpStatus.OK)
  quoteHotel(@Req() req: any, @Body() dto: any) {
    return this.bookingsService.quoteBooking(req.user.id, dto);
  }

  @Post('hotel')
  @HttpCode(HttpStatus.OK)
  createHotelBooking(@Req() req: any, @Body() dto: any) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @Get('hotel/my-bookings')
  getMyBookings(@Req() req: any, @Query('limit') limit = '20', @Query('offset') offset = '0') {
    return this.bookingsService.getMyBookings(req.user.id, +limit, +offset);
  }

  @Get('hotel/:bookingId')
  getBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.getBooking(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/confirm-payment')
  @HttpCode(HttpStatus.OK)
  confirmPayment(@Req() req: any, @Param('bookingId') bookingId: string, @Body() dto: any) {
    return this.bookingsService.confirmPayment(req.user.id, bookingId, dto);
  }

  @Post('hotel/:bookingId/pay-at-property')
  @HttpCode(HttpStatus.OK)
  payAtProperty(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.payAtProperty(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(@Req() req: any, @Param('bookingId') bookingId: string, @Body() dto: any) {
    return this.bookingsService.cancelBooking(req.user.id, bookingId, dto.reason);
  }
}
