import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { HolidayPackage } from './entities/holiday-package.entity';
import { PackageGalleryMedia } from './entities/package-gallery-media.entity';
import { PackageItineraryDay } from './entities/package-itinerary-day.entity';
import { PackageBooking } from '../partner/bookings/entities/package-booking.entity';
import { PackageBookingTraveler } from '../partner/bookings/entities/package-booking-traveler.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HolidayPackage,
      PackageGalleryMedia,
      PackageItineraryDay,
      PackageBooking,
      PackageBookingTraveler,
    ]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
