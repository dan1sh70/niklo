import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsPartnerService } from './notifications-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsPartnerController {
  constructor(private readonly notifService: NotificationsPartnerService) {}

  @Get()
  async getNotifications(@Req() req: any, @Query() query: any) {
    return { success: true, data: await this.notifService.getNotifications(req.user.partnerProfileId, query) };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.notifService.markAsRead(req.user.partnerProfileId, id) };
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Req() req: any) {
    return { success: true, data: await this.notifService.markAllAsRead(req.user.partnerProfileId) };
  }

  @Delete(':id')
  async dismissNotification(@Req() req: any, @Param('id') id: string) {
    return { success: true, data: await this.notifService.deleteNotification(req.user.partnerProfileId, id) };
  }

  @Post('fcm-token')
  async registerDeviceToken(@Req() req: any, @Body() body: any) {
    return { success: true, data: await this.notifService.registerFcmToken(req.user.id, req.user.partnerProfileId, body) };
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    return { success: true, data: {} };
  }

  @Put('preferences')
  async updatePreferences(@Req() req: any, @Body() body: any) {
    return { success: true, data: await this.notifService.updatePreferences(req.user.partnerProfileId, body) };
  }
}
