import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BusServiceClient } from './bus-service.client';
import { PendingBookingsSweeper } from './pending-bookings.sweeper';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  controllers: [BookingsController],
  providers: [BookingsService, BusServiceClient, PendingBookingsSweeper],
  exports: [BookingsService],
})
export class BookingsModule {}
