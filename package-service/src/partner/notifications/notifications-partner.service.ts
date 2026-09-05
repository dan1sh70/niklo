import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageNotification } from './entities/adventure-notification.entity';
import { PackageDeviceToken } from './entities/adventure-device-token.entity';
import { PackageNotificationPreferences } from './entities/adventure-notification-preferences.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';

@Injectable()
export class NotificationsPartnerService {
  constructor(
    @InjectRepository(PackageNotification)
    private readonly notificationRepo: Repository<PackageNotification>,
    @InjectRepository(PackageDeviceToken)
    private readonly tokenRepo: Repository<PackageDeviceToken>,
    @InjectRepository(PackageNotificationPreferences)
    private readonly prefsRepo: Repository<PackageNotificationPreferences>,
    @InjectRepository(PackagePartner)
    private readonly partnerRepo: Repository<PackagePartner>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  async getNotifications(userId: string, query: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const { category, page = 1, limit = 50 } = query;

    const qb = this.notificationRepo.createQueryBuilder('n')
      .where('n.partner_id = :partnerId', { partnerId });

    if (category && category !== 'ALL') {
      qb.andWhere('n.category = :category', { category });
    }

    const unreadCount = await this.notificationRepo.count({
      where: { partner_id: partnerId, is_unread: true },
    });

    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await qb.orderBy('n.created_at', 'DESC')
      .skip(skip)
      .take(Number(limit))
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped = { today: [] as any[], yesterday: [] as any[], earlier: [] as any[] };
    notifications.forEach((n) => {
      const createdAt = new Date(n.created_at);
      const item = {
        id: n.id,
        category: n.category,
        eventType: n.event_type,
        title: n.title,
        description: n.description,
        isUnread: n.is_unread,
        hasBorderHighlight: n.has_border_highlight,
        time: createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        targetType: n.target_type,
        targetId: n.target_id,
        deepLinkUrl: n.deep_link_url,
      };

      if (createdAt >= today) {
        grouped.today.push(item);
      } else if (createdAt >= yesterday) {
        grouped.yesterday.push(item);
      } else {
        grouped.earlier.push({ ...item, time: createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) });
      }
    });

    return {
      unreadCount,
      sections: [
        { title: 'Today', data: grouped.today },
        { title: 'Yesterday', data: grouped.yesterday },
        { title: 'Earlier', data: grouped.earlier },
      ].filter(s => s.data.length > 0),
    };
  }

  async markAsRead(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    await this.notificationRepo.update({ id, partner_id: partnerId }, { is_unread: false });
  }

  async markAllAsRead(userId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    await this.notificationRepo.update({ partner_id: partnerId, is_unread: true }, { is_unread: false });
  }

  async dismissNotification(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    await this.notificationRepo.delete({ id, partner_id: partnerId });
  }

  async registerDeviceToken(userId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    let token = await this.tokenRepo.findOne({ where: { fcm_token: dto.fcmToken } });
    if (!token) {
      token = this.tokenRepo.create({
        partner_id: partnerId,
        fcm_token: dto.fcmToken,
        device_os: dto.deviceOs,
        device_model: dto.deviceModel,
        app_version: dto.appVersion,
      });
    } else {
      token.partner_id = partnerId; // Update ownership if changed
      token.last_active_at = new Date();
    }
    await this.tokenRepo.save(token);
  }

  async getPreferences(userId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    let prefs = await this.prefsRepo.findOne({ where: { partner_id: partnerId } });
    if (!prefs) {
      prefs = await this.prefsRepo.save(this.prefsRepo.create({ partner_id: partnerId }));
    }
    return {
      pushNewBookings: prefs.push_new_bookings,
      pushPaymentAlerts: prefs.push_payment_alerts,
      pushLowCapacity: prefs.push_low_capacity,
      pushSettlements: prefs.push_settlements,
      emailDailySummary: prefs.email_daily_summary,
      whatsappUrgent: prefs.whatsapp_urgent,
    };
  }

  async updatePreferences(userId: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    let prefs = await this.prefsRepo.findOne({ where: { partner_id: partnerId } });
    if (!prefs) {
      prefs = this.prefsRepo.create({ partner_id: partnerId });
    }
    
    if (dto.pushNewBookings !== undefined) prefs.push_new_bookings = dto.pushNewBookings;
    if (dto.pushPaymentAlerts !== undefined) prefs.push_payment_alerts = dto.pushPaymentAlerts;
    if (dto.pushLowCapacity !== undefined) prefs.push_low_capacity = dto.pushLowCapacity;
    if (dto.pushSettlements !== undefined) prefs.push_settlements = dto.pushSettlements;
    if (dto.emailDailySummary !== undefined) prefs.email_daily_summary = dto.emailDailySummary;
    if (dto.whatsappUrgent !== undefined) prefs.whatsapp_urgent = dto.whatsappUrgent;

    await this.prefsRepo.save(prefs);
    return this.getPreferences(userId);
  }
}
