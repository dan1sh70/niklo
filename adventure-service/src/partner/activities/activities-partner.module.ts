import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesPartnerService } from './activities-partner.service';
import { ActivitiesPartnerController } from './activities-partner.controller';
import { AdventureActivity } from './entities/adventure-activity.entity';
import { AdventureActivityMedia } from './entities/adventure-activity-media.entity';
import { AdventureActivityRequirements } from './entities/adventure-activity-requirements.entity';
import { AdventureActivityInclusion } from './entities/adventure-activity-inclusion.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventureActivity,
    AdventureActivityMedia,
    AdventureActivityRequirements,
    AdventureActivityInclusion,
    AdventurePartner,
  ])],
  controllers: [ActivitiesPartnerController],
  providers: [ActivitiesPartnerService],
  exports: [ActivitiesPartnerService, TypeOrmModule],
})
export class ActivitiesPartnerModule {}
