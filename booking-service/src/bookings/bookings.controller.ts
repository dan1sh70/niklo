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

  @Post()
  async createBooking(@Body() dto: any) {
    const data = await this.bookingsService.create(dto);
    return { success: true, statusCode: 201, data };
  }

  @Post(':id/confirm-payment')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { payment_id?: string; payment_gateway_order_id?: string },
  ) {
    const data = await this.bookingsService.confirmPayment(id, body);
    return { success: true, statusCode: 200, data };
  }

  @Post('verify-ticket')
  @HttpCode(HttpStatus.OK)
  async verifyTicket(@Body('token') token: string) {
    const data = await this.bookingsService.verifyTicket(token);
    return { success: true, statusCode: 200, data };
  }

  @Post('verify-id')
  @HttpCode(HttpStatus.OK)
  async verifyId(@Body() body: any) {
    const data = await this.bookingsService.verifyGovId(body);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/id-verification')
  async getIdVerificationStatus(@Param('id') id: string) {
    const data = await this.bookingsService.getIdVerificationStatus(id);
    return { success: true, statusCode: 200, data };
  }
}
