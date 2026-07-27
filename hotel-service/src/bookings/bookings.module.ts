import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { RoomType } from '../hotels/entities/room-type.entity';

@Module({
  // Hotel/RoomType are read-only here: booking validates the room exists, prices
  // it from the stored rate, and scopes partner queries by property ownership.
  imports: [TypeOrmModule.forFeature([Booking, Hotel, RoomType])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
