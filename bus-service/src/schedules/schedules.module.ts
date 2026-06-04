import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { SeatLayout } from '../buses/entities/seat-layout.entity';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, SeatLayout])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
