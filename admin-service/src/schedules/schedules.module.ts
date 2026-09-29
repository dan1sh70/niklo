import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';

@Module({
  imports: [HttpModule],
  providers: [SchedulesService],
  controllers: [SchedulesController]
})
export class SchedulesModule {}
