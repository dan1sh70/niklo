import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { SeatLayout } from './entities/seat-layout.entity';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, SeatLayout])],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}
