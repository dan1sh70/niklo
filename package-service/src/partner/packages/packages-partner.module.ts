import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesPartnerService } from './packages-partner.service';
import { PackagesPartnerController } from './packages-partner.controller';
import { HolidayPackage } from '../../packages/entities/holiday-package.entity';
import { PackageItineraryDay } from '../../packages/entities/package-itinerary-day.entity';
import { PackageDeparture } from './entities/package-departure.entity';
import { PackageItineraryActivity } from './entities/package-itinerary-activity.entity';
import { PackageInclusion } from './entities/package-inclusion.entity';
import { PackageGalleryMedia } from '../../packages/entities/package-gallery-media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HolidayPackage,
      PackageItineraryDay,
      PackageDeparture,
      PackageItineraryActivity,
      PackageInclusion,
      PackageGalleryMedia,
    ]),
  ],
  controllers: [PackagesPartnerController],
  providers: [PackagesPartnerService],
  exports: [PackagesPartnerService],
})
export class PackagesPartnerModule {}
