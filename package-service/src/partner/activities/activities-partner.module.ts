import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesPartnerService } from './activities-partner.service';
import { ActivitiesPartnerController } from './activities-partner.controller';
import { PackageActivity } from './entities/adventure-activity.entity';
import { PackageActivityMedia } from './entities/adventure-activity-media.entity';
import { PackageActivityRequirements } from './entities/adventure-activity-requirements.entity';
import { PackageActivityInclusion } from './entities/adventure-activity-inclusion.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackageActivity,
    PackageActivityMedia,
    PackageActivityRequirements,
    PackageActivityInclusion,
    PackagePartner,
  ])],
  controllers: [ActivitiesPartnerController],
  providers: [ActivitiesPartnerService],
  exports: [ActivitiesPartnerService, TypeOrmModule],
})
export class ActivitiesPartnerModule {}
