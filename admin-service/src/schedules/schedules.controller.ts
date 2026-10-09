import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Permissions } from '../auth/roles.guard';

@Controller('api/v1/admin/schedules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Permissions('read:schedules')
  async getSchedules() {
    return this.schedulesService.getSchedules();
  }

  @Post()
  @Permissions('write:schedules')
  async createSchedule(@Body() body: any) {
    return this.schedulesService.createSchedule(body);
  }
}
