import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DeviceToken } from './entities/device-token.entity';
import { UserNotification } from './entities/user-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, UserNotification])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
