import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdventuresService } from './adventures.service';
import { AdventuresController } from './adventures.controller';
import { TravelAdventure } from './entities/adventure.entity';
import { AdventureReview } from './entities/adventure-review.entity';
import { AdventureSlot } from './entities/adventure-slot.entity';
import { AdventureActivity } from '../partner/activities/entities/adventure-activity.entity';
import { AdventurePartner } from '../partner/setup/entities/adventure-partner.entity';
import { AdventureTimeSlot } from '../partner/availability/entities/adventure-time-slot.entity';
import { AdventureBooking } from '../partner/bookings/entities/adventure-booking.entity';
import { AdventureBookingParticipant } from '../partner/bookings/entities/adventure-booking-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TravelAdventure,
      AdventureReview,
      AdventureSlot,
      AdventureActivity,
      AdventurePartner,
      AdventureTimeSlot,
      AdventureBooking,
      AdventureBookingParticipant,
    ]),
  ],
  controllers: [AdventuresController],
  providers: [AdventuresService],
})
export class AdventuresModule {}
