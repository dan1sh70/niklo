import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartnerNotification } from './entities/package-partner-notification.entity';
import { PartnerDeviceFcmToken } from './entities/partner-device-fcm-token.entity';

@Injectable()
export class NotificationsPartnerService {
  constructor(
    @InjectRepository(PackagePartnerNotification)
    private readonly notificationRepository: Repository<PackagePartnerNotification>,
    @InjectRepository(PartnerDeviceFcmToken)
    private readonly fcmTokenRepository: Repository<PartnerDeviceFcmToken>,
  ) {}

  async getNotifications(partnerId: string, query: any) {
    return await this.notificationRepository.find({
      where: { partner_id: partnerId },
      order: { created_at: 'DESC' }
    });
  }

  async markAsRead(partnerId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId, partner_id: partnerId } });
    if (notification) {
      notification.is_read = true;
      notification.read_at = new Date();
      await this.notificationRepository.save(notification);
    }
    return notification;
  }

  async markAllAsRead(partnerId: string) {
    await this.notificationRepository.update(
      { partner_id: partnerId, is_read: false },
      { is_read: true, read_at: new Date() }
    );
    return { success: true };
  }

  async deleteNotification(partnerId: string, notificationId: string) {
    await this.notificationRepository.delete({ id: notificationId, partner_id: partnerId });
    return { success: true };
  }

  async updatePreferences(partnerId: string, body: any) {
    return { success: true };
  }

  async registerFcmToken(userId: string, partnerId: string, data: any) {
    let tokenRecord = await this.fcmTokenRepository.findOne({ where: { fcm_token: data.fcmToken } });
    if (!tokenRecord) {
      tokenRecord = this.fcmTokenRepository.create({
        fcm_token: data.fcmToken,
        user_id: userId,
        partner_id: partnerId,
        device_os: data.deviceOs || 'ANDROID',
        device_model: data.deviceModel,
        app_version: data.appVersion
      });
    } else {
      tokenRecord.user_id = userId;
      tokenRecord.partner_id = partnerId;
      tokenRecord.is_active = true;
      tokenRecord.last_active_at = new Date();
    }
    return await this.fcmTokenRepository.save(tokenRecord);
  }
}
