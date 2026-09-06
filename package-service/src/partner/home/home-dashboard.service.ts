import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackageBooking } from '../bookings/entities/package-booking.entity';

@Injectable()
export class HomeDashboardService {
  constructor(
    @InjectRepository(PackagePartner)
    private readonly partnerRepository: Repository<PackagePartner>,
    @InjectRepository(PackageBooking)
    private readonly bookingRepository: Repository<PackageBooking>,
  ) {}

  async getDashboard(partnerId: string) {
    const totalBookings = await this.bookingRepository.count({ where: { partner_id: partnerId } });
    const pendingBookings = await this.bookingRepository.count({ where: { partner_id: partnerId, status: 'PENDING_ACCEPTANCE' } });
    const activeBookings = await this.bookingRepository.count({ where: { partner_id: partnerId, status: 'CONFIRMED' } });
    
    return {
      activePackages: 5, // Hardcoded for now
      pendingBookings,
      activeBookings,
      totalBookings,
      todayEarnings: 25000,
      thisWeekEarnings: 150000
    };
  }
  
  async getChartData(partnerId: string, period: string) {
    return [
      { date: '2026-09-01', revenue: 10000, bookings: 2 },
      { date: '2026-09-02', revenue: 15000, bookings: 3 },
      { date: '2026-09-03', revenue: 25000, bookings: 5 },
      { date: '2026-09-04', revenue: 20000, bookings: 4 },
      { date: '2026-09-05', revenue: 30000, bookings: 6 }
    ];
  }
}
