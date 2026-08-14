import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelNotification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { DeviceToken } from './entities/device-token.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(TravelNotification)
    private readonly notificationRepository: Repository<TravelNotification>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepo: Repository<UserNotification>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  async sendSms(payload: { phone: string; message: string }) {
    this.logger.log(`Sending SMS to ${payload.phone}: ${payload.message}`);
    return { messageId: 'msg91-mock-id', status: 'sent' };
  }

  async sendEmail(payload: { to: string; subject: string; body: string }) {
    this.logger.log(`Sending Email to ${payload.to}: ${payload.subject}`);
    return { messageId: 'sendgrid-mock-id', status: 'sent' };
  }

  async sendPush(payload: { token: string; title: string; body: string }) {
    this.logger.log(
      `Sending Push Notification to ${payload.token}: ${payload.title}`,
    );
    return { messageId: 'fcm-mock-id', status: 'sent' };
  }

  // TravelNotification CRUD logic
  async create(dto: any) {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async findAll() {
    return this.notificationRepository.find();
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async update(id: string, dto: any) {
    const notification = await this.findOne(id);
    Object.assign(notification, dto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: string) {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
    return { deleted: true };
  }

  async addDeviceToken(userId: string, tokenData: any) {
    // Upsert logic for device token
    let deviceToken = await this.deviceTokenRepo.findOne({
      where: { user_id: userId, token: tokenData.token }
    });

    if (!deviceToken) {
      deviceToken = this.deviceTokenRepo.create({
        user_id: userId,
        ...tokenData
      }) as unknown as DeviceToken;
    } else {
      Object.assign(deviceToken, tokenData);
    }
    
    return this.deviceTokenRepo.save(deviceToken as DeviceToken);
  }

  async markAsRead(notificationId: string, userId: string) {
    const userNotif = await this.userNotificationRepo.findOne({
      where: { id: notificationId, user_id: userId }
    });

    if (!userNotif) {
      throw new NotFoundException('Notification not found for user');
    }

    userNotif.is_read = true;
    return this.userNotificationRepo.save(userNotif);
  }
}
