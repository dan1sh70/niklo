import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CancelBookingDto,
  ConfirmPaymentDto,
  CreateHotelBookingDto,
  QuoteHotelBookingDto,
} from './dto/hotel-booking.dto';

/**
 * Hotel bookings.
 *
 * Every route is behind the JWT guard: the guest is read from the token, never
 * from the request body, so a booking can only ever be made or read by the
 * account that owns it. Static paths are declared before `:bookingId` so they
 * are not swallowed by the wildcard.
 */
@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('hotel/quote')
  quote(@Body() dto: QuoteHotelBookingDto) {
    return this.bookingsService.quote(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel')
  createHotelBooking(
    @Request() req: any,
    @Body() dto: CreateHotelBookingDto,
  ) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/my-bookings')
  getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.id);
  }

  // --- partner routes -------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/bookings')
  getPartnerBookings(@Request() req: any, @Query('status') status?: string) {
    return this.bookingsService.getPartnerBookings(req.user.id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/summary')
  getPartnerSummary(@Request() req: any) {
    return this.bookingsService.getPartnerSummary(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/earnings')
  getPartnerEarnings(@Request() req: any) {
    return this.bookingsService.getPartnerEarnings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/calendar')
  getPartnerCalendar(
    @Request() req: any,
    @Query('from') from: string,
    @Query('days') days: string,
  ) {
    return this.bookingsService.getPartnerCalendar(
      req.user.id,
      from,
      days ? parseInt(days, 10) : 30,
    );
  }

  // --- single booking -------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('hotel/:bookingId')
  getBooking(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.getBookingDetails(bookingId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel/:bookingId/confirm-payment')
  confirmPayment(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.bookingsService.confirmPayment(bookingId, req.user.id, dto);
  }

  /** Settle at the property instead of online. Confirms the booking. */
  @UseGuards(JwtAuthGuard)
  @Post('hotel/:bookingId/pay-at-property')
  payAtProperty(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.payAtProperty(bookingId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel/:bookingId/cancel')
  cancelBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(bookingId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel/:bookingId/check-in')
  checkIn(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.checkIn(bookingId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel/:bookingId/check-out')
  checkOut(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.checkOut(bookingId, req.user.id);
  }
}
