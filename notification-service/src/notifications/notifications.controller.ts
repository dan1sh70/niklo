import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications() {
    const data = await this.notificationsService.getUserNotifications();
    return { success: true, statusCode: 200, data };
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(@Body() dto: any) {
    const data = await this.notificationsService.registerDeviceToken(dto);
    return { success: true, statusCode: 200, data };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(id);
    return { success: true, statusCode: 200, data };
  }
}
