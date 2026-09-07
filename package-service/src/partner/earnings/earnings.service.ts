import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartnerBank } from '../setup/entities/package_partner-bank.entity';
import { PackageSettlement } from './entities/package-settlement.entity';
import { PackageSettlementItem } from './entities/package-settlement-item.entity';
import { PackageWithdrawalRequest } from './entities/package-withdrawal-request.entity';
import { PackageBooking } from '../bookings/entities/package-booking.entity';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(PackagePartnerBank)
    private readonly bankAccountRepository: Repository<PackagePartnerBank>,
    @InjectRepository(PackageSettlement)
    private readonly settlementRepository: Repository<PackageSettlement>,
    @InjectRepository(PackageSettlementItem)
    private readonly settlementItemRepository: Repository<PackageSettlementItem>,
    @InjectRepository(PackageWithdrawalRequest)
    private readonly withdrawalRequestRepository: Repository<PackageWithdrawalRequest>,
    @InjectRepository(PackageBooking)
    private readonly bookingRepository: Repository<PackageBooking>,
  ) {}

  async getOverview(partnerId: string, query: any) {
    return {
      totalEarnings: 150000,
      upcomingPayout: 40000,
      pendingClearance: 12000,
      availableBalance: 68000,
      stats: {
        totalBookings: 45,
        completedBookings: 40,
        cancelledBookings: 5
      }
    };
  }

  async getChartData(partnerId: string, period: string) {
    return [
      { label: 'Week 1', revenue: 15000, bookings: 3 },
      { label: 'Week 2', revenue: 22000, bookings: 4 },
      { label: 'Week 3', revenue: 18000, bookings: 3 },
      { label: 'Week 4', revenue: 32500, bookings: 5 }
    ];
  }

  async getPayoutPolicy() {
    return {
      policy: "Weekly payouts on Mondays at 07:30 IST",
      tdsDeduction: "1% under Section 194-O",
      gstRules: "Platform fee includes 18% GST"
    };
  }

  async listSettlements(partnerId: string, query: any) {
    return await this.settlementRepository.find({
      where: { partner_id: partnerId },
      order: { created_at: 'DESC' }
    });
  }

  async getSettlement(partnerId: string, id: string) {
    return await this.settlementRepository.findOne({ where: { id, partner_id: partnerId } });
  }

  async requestWithdrawal(partnerId: string, amount: number) {
    const bank = await this.bankAccountRepository.findOne({ where: { partner_id: partnerId, is_primary: true } });
    if (!bank) throw new BadRequestException('No primary bank account found');

    const withdrawal = this.withdrawalRequestRepository.create({
      request_ref: 'WDR-' + Math.floor(Math.random() * 100000),
      partner_id: partnerId,
      bank_account_id: bank.id,
      amount,
      status: 'REQUESTED',
    });
    return await this.withdrawalRequestRepository.save(withdrawal);
  }
}
