import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from './entities/user-notification.entity';
import { DeviceToken } from './entities/device-token.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class NotificationsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(UserNotification)
    private readonly userNotificationRepo: Repository<UserNotification>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.userNotificationRepo.count();
    if (count === 0) {
      await this.userNotificationRepo.save([
        {
          id: '10000000-0000-0000-0000-000000000001',
          user_id: this.MOCK_USER_ID,
          title: 'Booking Confirmed! 🎉',
          message: 'Your bus ticket to Siliguri (NIK-BUS-88210) has been confirmed.',
          category: 'BOOKING',
          deep_link: 'niklo://bookings/bkg_771029',
          is_read: false,
        },
        {
          id: '10000000-0000-0000-0000-000000000002',
          user_id: this.MOCK_USER_ID,
          title: 'Upcoming Ride',
          message: 'Your cab to the airport arrives in 30 minutes. Driver: Raj Kumar.',
          category: 'RIDE_UPDATE',
          deep_link: 'niklo://rides/ride_5521',
          is_read: true,
        },
        {
          id: '10000000-0000-0000-0000-000000000003',
          user_id: this.MOCK_USER_ID,
          title: 'Exclusive Offer!',
          message: 'Get 20% off on your next hotel booking in Manali.',
          category: 'OFFER',
          deep_link: 'niklo://offers/off_sum20',
          is_read: false,
        }
      ] as any[]);
      this.logger.log('Seeded user notifications mock data successfully.');
    }
  }

  private mapNotificationToDto(n: UserNotification) {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category,
      deep_link: n.deep_link,
      is_read: n.is_read,
      created_at: n.created_at ? n.created_at.toISOString() : new Date().toISOString(),
    };
  }

  async getUserNotifications(userId?: string) {
    const targetUserId = userId || this.MOCK_USER_ID;
    const notifications = await this.userNotificationRepo.find({
      where: { user_id: targetUserId },
      order: { created_at: 'DESC' },
    });
    
    return notifications.map(n => this.mapNotificationToDto(n));
  }

  async createNotification(dto: CreateNotificationDto) {
    const targetUserId = dto.userId || this.MOCK_USER_ID;
    const newNotif = this.userNotificationRepo.create({
      user_id: targetUserId,
      title: dto.title,
      message: dto.message,
      category: dto.category || 'BOOKING',
      deep_link: dto.deepLink || null,
      is_read: false,
    });

    const saved = await this.userNotificationRepo.save(newNotif);
    return this.mapNotificationToDto(saved);
  }

  async registerDeviceToken(dto: RegisterDeviceTokenDto) {
    const userId = this.MOCK_USER_ID;
    const { fcmToken, platform } = dto;

    if (!fcmToken) {
      throw new Error('fcmToken is required');
    }

    let deviceToken = await this.deviceTokenRepo.findOne({
      where: { user_id: userId, fcm_token: fcmToken }
    });

    if (!deviceToken) {
      deviceToken = this.deviceTokenRepo.create({
        user_id: userId,
        fcm_token: fcmToken,
        platform: platform || 'ANDROID'
      });
    } else {
      deviceToken.platform = platform || deviceToken.platform;
    }
    
    await this.deviceTokenRepo.save(deviceToken);
    return { message: 'Device token registered successfully' };
  }

  async markAsRead(notificationId: string) {
    const userNotif = await this.userNotificationRepo.findOne({
      where: { id: notificationId }
    });

    if (!userNotif) {
      throw new NotFoundException('Notification not found');
    }

    userNotif.is_read = true;
    const updated = await this.userNotificationRepo.save(userNotif);
    return this.mapNotificationToDto(updated);
  }

  async deleteNotification(notificationId: string) {
    const userNotif = await this.userNotificationRepo.findOne({
      where: { id: notificationId }
    });

    if (!userNotif) {
      throw new NotFoundException('Notification not found');
    }

    await this.userNotificationRepo.remove(userNotif);
    return { message: 'Notification deleted successfully' };
  }
}
