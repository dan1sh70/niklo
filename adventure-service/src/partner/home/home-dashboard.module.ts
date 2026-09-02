import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeDashboardService } from './home-dashboard.service';
import { HomeDashboardController } from './home-dashboard.controller';
import { AdventureBooking } from '../bookings/entities/adventure-booking.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdventureBooking, AdventurePartner])],
  controllers: [HomeDashboardController],
  providers: [HomeDashboardService],
  exports: [HomeDashboardService],
})
export class HomeDashboardModule {}
