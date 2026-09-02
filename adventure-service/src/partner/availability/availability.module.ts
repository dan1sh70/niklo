import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AdventureTimeSlot } from './entities/adventure-time-slot.entity';
import { AdventureSlotRecurrence } from './entities/adventure-slot-recurrence.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';
import { AdventureActivity } from '../activities/entities/adventure-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventureTimeSlot, AdventureSlotRecurrence, AdventurePartner, AdventureActivity,
  ])],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
