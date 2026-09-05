import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeDashboardService } from './home-dashboard.service';
import { HomeDashboardController } from './home-dashboard.controller';
import { PackageBooking } from '../bookings/entities/adventure-booking.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PackageBooking, PackagePartner])],
  controllers: [HomeDashboardController],
  providers: [HomeDashboardService],
  exports: [HomeDashboardService],
})
export class HomeDashboardModule {}
