import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageBooking } from './entities/package-booking.entity';
import { PackageBookingTraveler } from './entities/package-booking-traveler.entity';
import { PackageBookingCancellation } from './entities/package-booking-cancellation.entity';

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

    await this.cancellationRepository.save(this.cancellationRepository.create({
      booking_id: bookingId,
      cancelled_by: 'PARTNER',
      reason_category: body.reasonCategory || 'PARTNER_CANCELLED',
      custom_notes: body.customNotes,
      refund_amount: booking.gross_amount,
      partner_penalty_amount: body.penaltyAmount || 0
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

  async downloadVoucher(partnerId: string, bookingId: string) {
    return { voucherUrl: 'https://mock.url/voucher.pdf' };
  }
}
