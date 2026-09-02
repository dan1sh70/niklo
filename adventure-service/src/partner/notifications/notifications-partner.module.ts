import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsPartnerService } from './notifications-partner.service';
import { NotificationsPartnerController } from './notifications-partner.controller';
import { AdventureNotification } from './entities/adventure-notification.entity';
import { AdventureDeviceToken } from './entities/adventure-device-token.entity';
import { AdventureNotificationPreferences } from './entities/adventure-notification-preferences.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    AdventureNotification, AdventureDeviceToken, AdventureNotificationPreferences, AdventurePartner,
  ])],
  controllers: [NotificationsPartnerController],
  providers: [NotificationsPartnerService],
  exports: [NotificationsPartnerService],
})
export class NotificationsPartnerModule {}
