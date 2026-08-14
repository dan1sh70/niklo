import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('history')
  async getHistory(@Query() query: any) {
    const data = await this.bookingsService.getHistory(query);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/cancellation-quote')
  @HttpCode(HttpStatus.OK)
  async getCancellationQuote(@Param('id') id: string) {
    const data = await this.bookingsService.getCancellationQuote(id);
    return { success: true, statusCode: 200, data };
  }

  @Post('verify-ticket')
  @HttpCode(HttpStatus.OK)
  async verifyTicket(@Body('token') token: string) {
    const data = await this.bookingsService.verifyTicket(token);
    return { success: true, statusCode: 200, data };
  }
}
