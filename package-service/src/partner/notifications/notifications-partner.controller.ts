import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsPartnerService } from './notifications-partner.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/v1/package-partner/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsPartnerController {
  constructor(private readonly notifService: NotificationsPartnerService) {}

  @Get()
  async getNotifications(@Req() req: any, @Query() query: any) {
    const data = await this.notifService.getNotifications(req.user.id, query);
    return { success: true, data };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.notifService.markAsRead(req.user.id, id);
    return { success: true, message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    await this.notifService.markAllAsRead(req.user.id);
    return { success: true, message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async dismissNotification(@Req() req: any, @Param('id') id: string) {
    await this.notifService.dismissNotification(req.user.id, id);
    return { success: true, message: 'Notification dismissed' };
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(@Req() req: any, @Body() body: any) {
    await this.notifService.registerDeviceToken(req.user.id, body);
    return { success: true, message: 'Device token registered for push notifications' };
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    const data = await this.notifService.getPreferences(req.user.id);
    return { success: true, data };
  }

  @Patch('preferences')
  async updatePreferences(@Req() req: any, @Body() body: any) {
    const data = await this.notifService.updatePreferences(req.user.id, body);
    return { success: true, message: 'Notification preferences updated', data };
  }
}
