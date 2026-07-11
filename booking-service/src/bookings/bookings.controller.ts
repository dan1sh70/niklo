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
  @Get(':id')
  async getBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingDetails(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }
}
