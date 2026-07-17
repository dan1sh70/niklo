import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TravelNotification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TravelNotification])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
