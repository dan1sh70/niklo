import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsPartnerService } from './bookings-partner.service';
import { BookingsPartnerController } from './bookings-partner.controller';
import { AdventureBooking } from './entities/adventure-booking.entity';
import { AdventureBookingParticipant } from './entities/adventure-booking-participant.entity';
import { AdventureBookingInclusion } from './entities/adventure-booking-inclusion.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';
import { AdventureTimeSlot } from '../availability/entities/adventure-time-slot.entity';
import { EarningsModule } from '../earnings/earnings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdventureBooking,
      AdventureBookingParticipant,
      AdventureBookingInclusion,
      AdventurePartner,
      AdventureTimeSlot,
    ]),
    EarningsModule,
  ],
  controllers: [BookingsPartnerController],
  providers: [BookingsPartnerService],
  exports: [BookingsPartnerService, TypeOrmModule],
})
export class BookingsPartnerModule {}
