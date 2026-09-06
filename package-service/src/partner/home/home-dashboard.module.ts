import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeDashboardService } from './home-dashboard.service';
import { HomeDashboardController } from './home-dashboard.controller';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackageBooking } from '../bookings/entities/package-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PackagePartner,
      PackageBooking,
    ]),
  ],
  controllers: [HomeDashboardController],
  providers: [HomeDashboardService],
})
export class HomeDashboardModule {}
