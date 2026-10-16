import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsPartnerService } from './bookings-partner.service';
import { BookingsPartnerController } from './bookings-partner.controller';
import { PackageBooking } from './entities/package-booking.entity';
import { PackageBookingTraveler } from './entities/package-booking-traveler.entity';
import { PackageBookingCancellation } from './entities/package-booking-cancellation.entity';
import { HolidayPackage } from '../../packages/entities/holiday-package.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PackageBooking,
      PackageBookingTraveler,
      PackageBookingCancellation,
      HolidayPackage,
    ]),
  ],
  controllers: [BookingsPartnerController],
  providers: [BookingsPartnerService],
  exports: [BookingsPartnerService],
})
export class BookingsPartnerModule {}
