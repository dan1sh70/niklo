import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, LockSeatsDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('seats/lock')
  async lockSeats(@Request() req: any, @Body() dto: LockSeatsDto) {
    return this.bookingsService.lockSeats(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createBooking(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingDetails(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancellation-quote')
  async getCancellationQuote(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.getCancellationQuote(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tickets/verify-qr')
  async verifyQrTicket(@Request() req: any, @Body() body: { qr_code: string }) {
    // Usually verified by an admin or operator, we pass user id just in case
    return this.bookingsService.verifyQrTicket(body.qr_code, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }

  // --- HOTEL PARTNER ENDPOINTS --- //

  @UseGuards(JwtAuthGuard)
  @Post('hotel/:id/check-in')
  async hotelCheckIn(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.hotelCheckIn(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel/:id/check-out')
  async hotelCheckOut(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.hotelCheckOut(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('hotel/partner/:id/cancel')
  async hotelPartnerCancel(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.hotelPartnerCancel(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/summary')
  async getHotelPartnerSummary(@Request() req: any) {
    return this.bookingsService.getHotelPartnerSummary(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/calendar')
  async getHotelPartnerCalendar(@Request() req: any) {
    return this.bookingsService.getHotelPartnerCalendar(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/earnings')
  async getHotelPartnerEarnings(@Request() req: any) {
    return this.bookingsService.getHotelPartnerEarnings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hotel/partner/occupancy/monthly')
  async getHotelPartnerOccupancy(@Request() req: any) {
    return this.bookingsService.getHotelPartnerOccupancy(req.user.id);
  }
}
