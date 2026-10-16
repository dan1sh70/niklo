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

  // --- HOTEL PARTNER BOOKING & SUMMARY ENDPOINTS --- //

  @Get('hotel/partner/bookings')
  getPartnerBookings(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('hotelId') hotelId?: string,
  ) {
    return this.bookingsService.getPartnerBookings(req.user.id, status, hotelId);
  }

  @Post('hotel/:bookingId/check-in')
  @HttpCode(HttpStatus.OK)
  checkInBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.checkInBooking(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/check-out')
  @HttpCode(HttpStatus.OK)
  checkOutBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.checkOutBooking(req.user.id, bookingId);
  }

  @Post('hotel/partner/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  partnerCancelBooking(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.partnerCancelBooking(req.user.id, bookingId, body?.reason);
  }

  @Post('hotel/:bookingId/collect-cash')
  @HttpCode(HttpStatus.OK)
  collectCashAndCheckIn(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.collectCashAndCheckIn(req.user.id, bookingId);
  }

  @Get('hotel/partner/summary')
  getPartnerSummary(@Req() req: any) {
    return this.bookingsService.getPartnerSummary(req.user.id);
  }

  @Get('hotel/partner/earnings')
  getPartnerEarnings(@Req() req: any) {
    return this.bookingsService.getPartnerEarnings(req.user.id);
  }

  @Get('hotel/partner/calendar')
  getPartnerCalendar(@Req() req: any, @Query('days') days = '30') {
    return this.bookingsService.getPartnerCalendar(req.user.id, parseInt(days, 10));
  }

  @Get('hotel/partner/occupancy/monthly')
  getPartnerMonthlyOccupancy(@Req() req: any, @Query('months') months = '6') {
    return this.bookingsService.getPartnerMonthlyOccupancy(req.user.id, parseInt(months, 10));
  }

  @Get('hotel/partner/notifications')
  getPartnerNotifications(@Req() req: any, @Query('limit') limit = '30') {
    return this.bookingsService.getPartnerNotifications(req.user.id, parseInt(limit, 10));
  }
}
