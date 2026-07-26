import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { Hotel } from './entities/hotel.entity';
import { RoomType } from './entities/room-type.entity';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  // Booking is registered here (the entity, not the module) so reviews can be
  // gated on a real stay and room deletion can see live bookings, without the
  // two feature modules importing each other.
  imports: [TypeOrmModule.forFeature([Hotel, RoomType, Review, Booking])],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
