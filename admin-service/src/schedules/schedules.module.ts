import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { BusAdminService } from './bus-admin.service';
import { BusAdminController } from './bus-admin.controller';

@Module({
  imports: [HttpModule],
  providers: [SchedulesService, BusAdminService],
  controllers: [SchedulesController, BusAdminController],
  exports: [BusAdminService],
})
export class SchedulesModule {}

