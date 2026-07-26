import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  ConfirmPaymentDto,
  CreateBookingDto,
  LockSeatsDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('seats/lock')
  @HttpCode(HttpStatus.OK)
  async lockSeats(@Request() req: any, @Body() dto: LockSeatsDto) {
    return this.bookingsService.lockSeats(req.user.id, dto);
  }

  // The Authorization header is forwarded to bus-service so seat inventory
  // calls run as the same user rather than as an anonymous internal caller.
  @UseGuards(JwtAuthGuard)
  @Post()
  async createBooking(
    @Request() req: any,
    @Body() dto: CreateBookingDto,
    @Headers('authorization') authHeader: string,
  ) {
    return this.bookingsService.createBooking(req.user.id, dto, authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.id);
  }

  /**
   * Passenger manifest for a departure. Declared before `:id` so it is not
   * swallowed by the booking-detail route.
   */
  @UseGuards(JwtAuthGuard)
  @Get('schedule/:scheduleId')
  async getScheduleManifest(
    @Param('scheduleId') scheduleId: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.bookingsService.getScheduleManifest(scheduleId, authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingDetails(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-payment')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.bookingsService.confirmPayment(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @Request() req: any,
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.id, authHeader);
  }
}
