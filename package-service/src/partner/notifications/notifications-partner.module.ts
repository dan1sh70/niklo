import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsPartnerService } from './notifications-partner.service';
import { NotificationsPartnerController } from './notifications-partner.controller';
import { PackageNotification } from './entities/adventure-notification.entity';
import { PackageDeviceToken } from './entities/adventure-device-token.entity';
import { PackageNotificationPreferences } from './entities/adventure-notification-preferences.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PackageNotification, PackageDeviceToken, PackageNotificationPreferences, PackagePartner,
  ])],
  controllers: [NotificationsPartnerController],
  providers: [NotificationsPartnerService],
  exports: [NotificationsPartnerService],
})
export class NotificationsPartnerModule {}
