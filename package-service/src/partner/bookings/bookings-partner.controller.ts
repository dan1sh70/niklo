import { Controller, Get, Post, Patch, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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

  @Post(':id/accept')
  async acceptBooking(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.bookingsService.acceptBooking(req.user.partnerProfileId, id) };
  }

  @Post(':id/decline')
  async declineBooking(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.bookingsService.declineBooking(req.user.partnerProfileId, id, body.reason) };
  }

  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.bookingsService.cancelBooking(req.user.partnerProfileId, id, body) };
  }

  @Patch(':id/complete')
  async complete(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.bookingsService.completeBooking(req.user.partnerProfileId, id) };
  }

  @Get(':id/voucher')
  async getVoucher(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.bookingsService.downloadVoucher(req.user.partnerProfileId, id) };
  }
}
