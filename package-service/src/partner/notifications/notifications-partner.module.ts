import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsPartnerService } from './notifications-partner.service';
import { NotificationsPartnerController } from './notifications-partner.controller';
import { PackagePartnerNotification } from './entities/package-partner-notification.entity';
import { PartnerDeviceFcmToken } from './entities/partner-device-fcm-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PackagePartnerNotification,
      PartnerDeviceFcmToken,
    ]),
  ],
  controllers: [NotificationsPartnerController],
  providers: [NotificationsPartnerService],
  exports: [NotificationsPartnerService],
})
export class NotificationsPartnerModule {}
