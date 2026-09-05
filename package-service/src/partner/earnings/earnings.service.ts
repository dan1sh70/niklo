import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageEarningsWallet } from './entities/adventure-earnings-wallet.entity';
import { PackageBankAccount } from './entities/adventure-bank-account.entity';
import { PackageSettlement } from './entities/adventure-settlement.entity';
import { PackagePartner } from '../setup/entities/package_partner.entity';
import { PackageBooking } from '../bookings/entities/adventure-booking.entity';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(PackageEarningsWallet)
    private readonly walletRepo: Repository<PackageEarningsWallet>,
    @InjectRepository(PackageBankAccount)
    private readonly bankRepo: Repository<PackageBankAccount>,
    @InjectRepository(PackageSettlement)
    private readonly settlementRepo: Repository<PackageSettlement>,
    @InjectRepository(PackagePartner)
    private readonly partnerRepo: Repository<PackagePartner>,
    @InjectRepository(PackageBooking)
    private readonly bookingRepo: Repository<PackageBooking>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  private async ensureWallet(partnerId: string): Promise<PackageEarningsWallet> {
    let wallet = await this.walletRepo.findOne({ where: { partner_id: partnerId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ partner_id: partnerId });
      wallet = await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getAnalytics(userId: string, query: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const { period = 'month', startDate, endDate } = query;

    const wallet = await this.ensureWallet(partnerId);

    // Date range calculation
    const now = new Date();
    let dateFrom: Date;
    const dateTo = new Date();
    if (period === 'today') {
      dateFrom = new Date(now.toDateString());
    } else if (period === 'week') {
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
    } else if (period === 'custom' && startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo.setTime(new Date(endDate).getTime());
    } else {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const bookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.partner_id = :partnerId', { partnerId })
      .andWhere('b.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED', 'CHECKED_IN'] })
      .andWhere('b.booking_date >= :dateFrom', { dateFrom: dateFrom.toISOString().split('T')[0] })
      .andWhere('b.booking_date <= :dateTo', { dateTo: dateTo.toISOString().split('T')[0] })
      .getMany();

    const grossRevenue = bookings.reduce((s, b) => s + Number(b.total_amount), 0);
    const commission = Math.round(grossRevenue * 0.10 * 100) / 100;
    const tdsGst = Math.round(grossRevenue * 0.011 * 100) / 100;
    const netEarnings = Math.round((grossRevenue - commission - tdsGst) * 100) / 100;
    const ordersCount = bookings.length;

    const labelMap: Record<string, string> = {
      today: "TODAY'S EARNINGS",
      week: 'THIS WEEK\'S EARNINGS',
      month: 'THIS MONTH\'S EARNINGS',
      custom: 'CUSTOM PERIOD EARNINGS',
    };

    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));

    return {
      period,
      label: labelMap[period] || 'EARNINGS',
      summary: {
        netEarnings,
        grossRevenue,
        commission: -commission,
        tdsGst: -tdsGst,
        refunds: 0,
        ordersCount,
        payoutStatus: wallet.payout_status === 'ON_TRACK' ? 'On Track' : wallet.payout_status,
      },
      chart: {
        points: ordersCount > 0 ? [0.3, 0.5, 0.4, 0.7, 0.45, 0.6, 0.8] : [0, 0, 0, 0, 0, 0, 0],
        labels: period === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        highestDayEarnings: grossRevenue > 0 ? Math.round(grossRevenue / Math.max(ordersCount, 1) * 1.5 * 100) / 100 : 0,
      },
      wallet: {
        availableBalance: Number(wallet.available_balance),
        pendingClearance: Number(wallet.pending_clearance),
        lifetimeEarnings: Number(wallet.total_net_earnings),
        nextPayoutDate: nextFriday.toISOString().split('T')[0],
      },
    };
  }

  async listSettlements(userId: string, query: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const { status, search, page = 1, limit = 20 } = query;

    const qb = this.settlementRepo.createQueryBuilder('s')
      .where('s.partner_id = :partnerId', { partnerId });

    if (status && status !== 'ALL') qb.andWhere('s.status = :status', { status: status.toUpperCase() });
    if (search) {
      qb.andWhere('(LOWER(s.reference_id) LIKE :s OR LOWER(s.utr_number) LIKE :s)', { s: `%${search.toLowerCase()}%` });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, totalItems] = await qb.skip(skip).take(Number(limit)).orderBy('s.created_at', 'DESC').getManyAndCount();

    return {
      settlements: items.map((s) => ({
        id: s.id,
        referenceId: s.reference_id,
        date: new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: Number(s.net_amount),
        grossAmount: Number(s.gross_amount),
        commission: -Number(s.commission_amount),
        tdsGst: -Number(s.tds_gst_amount),
        totalBookings: s.total_bookings_count,
        bankAccount: s.bank_display_text,
        utrNumber: s.utr_number,
        status: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
        failureReason: s.failure_reason,
        settledAt: s.settled_at,
      })),
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  }

  async getSettlement(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const settlement = await this.settlementRepo.findOne({ where: { id }, relations: { bank_account: true } });
    if (!settlement) throw new NotFoundException('SETTLEMENT_NOT_FOUND');
    if (settlement.partner_id !== partnerId) throw new NotFoundException('SETTLEMENT_NOT_FOUND');

    return {
      id: settlement.id,
      referenceId: settlement.reference_id,
      status: settlement.status.charAt(0) + settlement.status.slice(1).toLowerCase(),
      netAmount: Number(settlement.net_amount),
      grossAmount: Number(settlement.gross_amount),
      commission: -Number(settlement.commission_amount),
      tdsGst: -Number(settlement.tds_gst_amount),
      refundsDeducted: Number(settlement.refunds_deducted),
      totalBookings: settlement.total_bookings_count,
      bank: {
        accountDisplayText: settlement.bank_display_text,
        accountHolderName: settlement.bank_account?.account_holder_name,
        ifscCode: settlement.bank_account?.ifsc_code,
      },
      utrNumber: settlement.utr_number,
      payoutDate: settlement.settled_at
        ? new Date(settlement.settled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null,
      includedBookings: [],
    };
  }

  getPayoutPolicy() {
    return {
      settlementCycle: 'Weekly',
      payoutDay: 'Every Friday by 6:00 PM IST',
      coolingPeriodHours: 24,
      platformCommissionPercent: 10.0,
      tdsRatePercent: 1.0,
      minimumPayoutThreshold: 1000.00,
      supportEmail: 'finance@niklo.com',
      policyNotes: [
        'Payouts include all successfully completed activities up to Wednesday 11:59 PM.',
        'TDS certificates (Form 16A) are issued quarterly.',
        'Customer refunds due to safety/operator cancellations are deducted from the next settlement cycle.',
      ],
    };
  }
}
