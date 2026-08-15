import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Query('userId') userId?: string) {
    const data = await this.notificationsService.getUserNotifications(userId);
    return { success: true, statusCode: 200, data };
  }

  @Post()
  async createNotification(@Body() dto: CreateNotificationDto) {
    const data = await this.notificationsService.createNotification(dto);
    return { success: true, statusCode: 201, data };
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(@Body() dto: RegisterDeviceTokenDto) {
    const data = await this.notificationsService.registerDeviceToken(dto);
    return { success: true, statusCode: 200, data };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(id);
    return { success: true, statusCode: 200, data };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    const data = await this.notificationsService.deleteNotification(id);
    return { success: true, statusCode: 200, data };
  }
}

