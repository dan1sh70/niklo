import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdventureBooking } from '../bookings/entities/adventure-booking.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';

@Injectable()
export class HomeDashboardService {
  constructor(
    @InjectRepository(AdventureBooking)
    private readonly bookingRepo: Repository<AdventureBooking>,
    @InjectRepository(AdventurePartner)
    private readonly partnerRepo: Repository<AdventurePartner>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  async getDashboard(userId: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const today = new Date().toISOString().split('T')[0];
    const monthPrefix = today.substring(0, 7);

    // Todays Bookings
    const todaysBookings = await this.bookingRepo.find({
      where: { partner_id: partnerId, booking_date: today, status: 'CONFIRMED' },
      relations: { activity: true },
      order: { time_slot: 'ASC' },
      take: 5,
    });

    const todaysCount = await this.bookingRepo.count({
      where: { partner_id: partnerId, booking_date: today },
    });

    // Month metrics
    const monthBookings = await this.bookingRepo.createQueryBuilder('b')
      .where('b.partner_id = :partnerId', { partnerId })
      .andWhere(`b.booking_date LIKE '${monthPrefix}%'`)
      .getMany();

    const revenueThisMonth = monthBookings.reduce((sum, b) => b.status !== 'CANCELLED' ? sum + Number(b.total_amount) : sum, 0);

    return {
      partnerId,
      metrics: {
        todaysBookings: todaysCount,
        pendingConfirmations: 0,
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
        rating: 4.8,
        reviewsCount: 120,
      },
      todaysSchedule: todaysBookings.map(b => ({
        id: b.id,
        bookingNumber: b.booking_number,
        activityTitle: (b as any).activity?.title,
        timeSlot: b.time_slot,
        participantsCount: b.participants_count,
        customerName: b.customer_name,
        paymentStatus: b.payment_status,
        status: b.status,
      })),
      recentNotifications: [
        { id: '1', title: 'New Booking Received', time: '10 mins ago', type: 'BOOKING' },
        { id: '2', title: 'Settlement Processed', time: '2 hours ago', type: 'PAYMENT' },
      ],
    };
  }

  async getChartData(userId: string, period: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const bookings = await this.bookingRepo.createQueryBuilder('b')
      .where('b.partner_id = :partnerId', { partnerId })
      .getMany();
    
    // Mock chart data based on booking count
    const count = bookings.length;
    return {
      period,
      labels: period === 'Week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Bookings',
          data: period === 'Week' 
            ? [count * 0.1, count * 0.15, count * 0.2, count * 0.1, count * 0.25, count * 0.1, count * 0.1]
            : [count * 0.2, count * 0.3, count * 0.25, count * 0.25],
        },
      ],
    };
  }
}
