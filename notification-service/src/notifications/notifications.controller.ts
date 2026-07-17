import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller(['api/v1/notify', 'api/v1/notifications'])
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

  // Travel Notification CRUD endpoints
  @Post()
  async create(@Body() dto: any) {
    const data = await this.notificationsService.create(dto);
    return { success: true, data };
  }

  @Get()
  async findAll() {
    const data = await this.notificationsService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.notificationsService.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const data = await this.notificationsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.notificationsService.remove(id);
    return { success: true, data };
  }
}
