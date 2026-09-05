import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { PackageTimeSlot } from './entities/adventure-time-slot.entity';
import { PackageSlotRecurrence } from './entities/adventure-slot-recurrence.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackageActivity } from '../activities/entities/adventure-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackageTimeSlot, PackageSlotRecurrence, PackagePartner, PackageActivity,
  ])],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
