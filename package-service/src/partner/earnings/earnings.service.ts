import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagePartnerBank } from '../setup/entities/package_partner-bank.entity';
import { PackageSettlement } from './entities/package-settlement.entity';
import { PackageSettlementItem } from './entities/package-settlement-item.entity';
import { PackageWithdrawalRequest } from './entities/package-withdrawal-request.entity';
import { PackageBooking } from '../bookings/entities/package-booking.entity';
import { PdfUtil } from '../common/utils/pdf.util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
    const bookings = await this.bookingRepository.find({ where: { partner_id: partnerId } });
    
    let totalEarnings = 0;
    let upcomingPayout = 0;
    let pendingClearance = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    for (const b of bookings) {
      if (b.status === 'COMPLETED') {
        completedBookings++;
        totalEarnings += Number(b.partner_payout_amount) || 0;
      } else if (b.status === 'CANCELLED') {
        cancelledBookings++;
      } else if (b.status === 'CONFIRMED') {
        upcomingPayout += Number(b.partner_payout_amount) || 0;
      } else if (b.status === 'PENDING') {
        pendingClearance += Number(b.partner_payout_amount) || 0;
      }
    }

    return {
      totalEarnings,
      upcomingPayout,
      pendingClearance,
      availableBalance: totalEarnings > 1000 ? totalEarnings - 1000 : 0, // Mocked derivation
      stats: {
        totalBookings: bookings.length,
        completedBookings,
        cancelledBookings
      }
    };
  }

  async getChartData(partnerId: string, period: string) {
    const bookings = await this.bookingRepository.find({ where: { partner_id: partnerId, status: 'COMPLETED' } });
    const totalRev = bookings.reduce((sum, b) => sum + (Number(b.partner_payout_amount)||0), 0);
    const totalBkg = bookings.length;

    // Distribute the dynamic total across 4 weeks for the chart
    return [
      { label: 'Week 1', revenue: totalRev * 0.2, bookings: Math.floor(totalBkg * 0.2) },
      { label: 'Week 2', revenue: totalRev * 0.3, bookings: Math.floor(totalBkg * 0.3) },
      { label: 'Week 3', revenue: totalRev * 0.1, bookings: Math.floor(totalBkg * 0.1) },
      { label: 'Week 4', revenue: totalRev * 0.4, bookings: Math.floor(totalBkg * 0.4) }
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

  private async uploadBufferToS3(buffer: Buffer, filename: string): Promise<string> {
    if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
      return `https://mock-s3-bucket.s3.amazonaws.com/${filename}`;
    }

    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const key = `invoices/${Date.now()}-${filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async downloadInvoice(partnerId: string, id: string) {
    const settlement = await this.getSettlement(partnerId, id);
    if (!settlement) throw new NotFoundException('Settlement not found');
    const pdfBuffer = await PdfUtil.generateInvoicePdf(settlement);
    const downloadUrl = await this.uploadBufferToS3(pdfBuffer, `invoice_${id}.pdf`);
    return { downloadUrl };
  }

  async requestWithdrawal(partnerId: string, amount: number) {
    if (amount < 1000) {
      throw new BadRequestException('Minimum withdrawal amount is 1000 INR');
    }

    const pending = await this.withdrawalRequestRepository.findOne({ 
      where: [ 
        { partner_id: partnerId, status: 'REQUESTED' },
        { partner_id: partnerId, status: 'PENDING' } 
      ] 
    });
    if (pending) {
      throw new BadRequestException('You already have a pending withdrawal request');
    }

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
