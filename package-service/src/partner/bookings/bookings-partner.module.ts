import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsPartnerService } from './bookings-partner.service';
import { BookingsPartnerController } from './bookings-partner.controller';
import { PackageBooking } from './entities/adventure-booking.entity';
import { PackageBookingParticipant } from './entities/adventure-booking-participant.entity';
import { PackageBookingInclusion } from './entities/adventure-booking-inclusion.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackageBooking, PackageBookingParticipant, PackageBookingInclusion, PackagePartner,
  ])],
  controllers: [BookingsPartnerController],
  providers: [BookingsPartnerService],
  exports: [BookingsPartnerService, TypeOrmModule],
})
export class BookingsPartnerModule {}
