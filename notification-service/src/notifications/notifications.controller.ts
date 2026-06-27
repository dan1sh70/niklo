import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notify')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('sms')
  async sendSms(@Body() payload: { phone: string; message: string }) {
    const data = await this.notificationsService.sendSms(payload);
    return { success: true, data };
  }

  @Post('email')
  async sendEmail(
    @Body() payload: { to: string; subject: string; body: string },
  ) {
    const data = await this.notificationsService.sendEmail(payload);
    return { success: true, data };
  }

  @Post('push')
  async sendPush(
    @Body() payload: { token: string; title: string; body: string },
  ) {
    const data = await this.notificationsService.sendPush(payload);
    return { success: true, data };
  }
}
