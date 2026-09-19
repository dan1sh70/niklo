import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageBooking } from './entities/package-booking.entity';
import { PackageBookingTraveler } from './entities/package-booking-traveler.entity';
import { PackageBookingCancellation } from './entities/package-booking-cancellation.entity';
import { PdfUtil } from '../common/utils/pdf.util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class BookingsPartnerService {
  constructor(
    @InjectRepository(PackageBooking)
    private readonly bookingRepository: Repository<PackageBooking>,
    @InjectRepository(PackageBookingTraveler)
    private readonly travelerRepository: Repository<PackageBookingTraveler>,
    @InjectRepository(PackageBookingCancellation)
    private readonly cancellationRepository: Repository<PackageBookingCancellation>,
  ) {}

  async listBookings(partnerId: string, status?: string) {
    const where: any = { partner_id: partnerId };
    if (status) {
      where.status = status;
    }
    const bookings = await this.bookingRepository.find({
      where,
      order: { created_at: 'DESC' }
    });
    return bookings;
  }

  async getBooking(partnerId: string, bookingId: string) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, partner_id: partnerId } });
    if (!booking) return null;
    const travelers = await this.travelerRepository.find({ where: { booking_id: bookingId } });
    return { ...booking, travelers };
  }

  async acceptBooking(partnerId: string, bookingId: string) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, partner_id: partnerId, status: 'PENDING_ACCEPTANCE' } });
    if (!booking) throw new Error('Booking not found or not in pending state');
    booking.status = 'CONFIRMED';
    booking.accepted_at = new Date();
    await this.bookingRepository.save(booking);
    return booking;
  }

  async declineBooking(partnerId: string, bookingId: string, reason: string) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, partner_id: partnerId, status: 'PENDING_ACCEPTANCE' } });
    if (!booking) throw new Error('Booking not found or not in pending state');
    booking.status = 'DECLINED';
    await this.bookingRepository.save(booking);
    
    // Create cancellation record
    await this.cancellationRepository.save(this.cancellationRepository.create({
      booking_id: bookingId,
      cancelled_by: 'PARTNER',
      reason_category: 'PARTNER_DECLINED',
      custom_notes: reason,
      refund_amount: booking.gross_amount, // Full refund
      partner_penalty_amount: 0
    }));
    
    return booking;
  }

  async cancelBooking(partnerId: string, bookingId: string, body: any) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, partner_id: partnerId } });
    if (!booking) throw new Error('Booking not found');
    booking.status = 'CANCELLED';
    await this.bookingRepository.save(booking);

    // Policy-based refund calculation
    let refundAmount = 0;
    if (booking.start_date) {
      const start = new Date(booking.start_date);
      const now = new Date();
      const diffTime = Math.abs(start.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 7) {
        refundAmount = booking.gross_amount; // 100%
      } else if (diffDays >= 2) {
        refundAmount = booking.gross_amount * 0.5; // 50%
      } else {
        refundAmount = 0;
      }
    } else {
       refundAmount = booking.gross_amount; // fallback
    }

    await this.cancellationRepository.save(this.cancellationRepository.create({
      booking_id: bookingId,
      cancelled_by: 'PARTNER',
      reason_category: body?.reasonCategory || 'PARTNER_CANCELLED',
      custom_notes: body?.customNotes || '',
      refund_amount: refundAmount,
      partner_penalty_amount: body?.penaltyAmount || 0
    }));

    return booking;
  }

  async completeBooking(partnerId: string, bookingId: string) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, partner_id: partnerId, status: 'CONFIRMED' } });
    if (!booking) throw new Error('Booking not found or not confirmed');
    booking.status = 'COMPLETED';
    booking.completed_at = new Date();
    await this.bookingRepository.save(booking);
    return booking;
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

    const key = `vouchers/${Date.now()}-${filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async downloadVoucher(partnerId: string, bookingId: string) {
    const booking = await this.getBooking(partnerId, bookingId);
    if (!booking) throw new Error('Booking not found');

    const pdfBuffer = await PdfUtil.generateVoucherPdf(booking);
    const voucherUrl = await this.uploadBufferToS3(pdfBuffer, `voucher_${bookingId}.pdf`);

    return { voucherUrl };
  }
}
