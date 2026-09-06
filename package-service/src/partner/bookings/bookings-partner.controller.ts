import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BookingsPartnerService } from './bookings-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsPartnerController {
  constructor(private readonly bookingsService: BookingsPartnerService) {}

  @Get()
  async listBookings(@Req() req: any, @Query() query: any) {
    return { success: true, data: await this.bookingsService.listBookings(req.user.partnerProfileId, query.status) };
  }

  @Get(':id')
  async getBooking(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.bookingsService.getBooking(req.user.partnerProfileId, id) };
  }

  @Put(':id/accept')
  async acceptBooking(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.bookingsService.acceptBooking(req.user.partnerProfileId, id) };
  }

  @Put(':id/decline')
  async declineBooking(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.bookingsService.declineBooking(req.user.partnerProfileId, id, body.reason) };
  }

  @Put(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.bookingsService.cancelBooking(req.user.partnerProfileId, id, body) };
  }
  
  @Put(':id/reschedule')
  async reschedule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: {} }; // Missing in service
  }
  
  @Put(':id/confirm')
  async confirm(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: {} }; // Missing in service
  }
}
