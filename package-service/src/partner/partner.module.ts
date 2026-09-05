import { Module } from '@nestjs/common';
import { SetupModule } from './setup/setup.module';
import { ActivitiesPartnerModule } from './activities/activities-partner.module';
import { BookingsPartnerModule } from './bookings/bookings-partner.module';
import { EarningsModule } from './earnings/earnings.module';
import { AvailabilityModule } from './availability/availability.module';
import { HomeDashboardModule } from './home/home-dashboard.module';
import { PackagesPartnerModule } from './packages/packages-partner.module';
import { NotificationsPartnerModule } from './notifications/notifications-partner.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    SetupModule,
    ActivitiesPartnerModule,
    BookingsPartnerModule,
    EarningsModule,
    AvailabilityModule,
    HomeDashboardModule,
    PackagesPartnerModule,
    NotificationsPartnerModule,
    ProfileModule,
  ],
})
export class PartnerModule {}
