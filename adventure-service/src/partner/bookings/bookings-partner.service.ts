import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdventureBooking } from './entities/adventure-booking.entity';
import { AdventureBookingParticipant } from './entities/adventure-booking-participant.entity';
import { AdventureBookingInclusion } from './entities/adventure-booking-inclusion.entity';
import { AdventurePartner } from '../setup/entities/adventure-partner.entity';


@Injectable()
export class BookingsPartnerService {
  constructor(
    @InjectRepository(AdventureBooking)
    private readonly bookingRepo: Repository<AdventureBooking>,
    @InjectRepository(AdventureBookingParticipant)
    private readonly participantRepo: Repository<AdventureBookingParticipant>,
    @InjectRepository(AdventureBookingInclusion)
    private readonly inclusionRepo: Repository<AdventureBookingInclusion>,
    @InjectRepository(AdventurePartner)
    private readonly partnerRepo: Repository<AdventurePartner>,
  ) {}

  private async resolvePartnerId(userId: string): Promise<string> {
    const partner = await this.partnerRepo.findOne({ where: { user_id: userId } });
    if (!partner) throw new NotFoundException('Partner profile not found.');
    return partner.id;
  }

  private formatDate(d: string | Date): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async listBookings(userId: string, query: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const { status, search, date, page = 1, limit = 20 } = query;

    const qb = this.bookingRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.activity', 'a')
      .where('b.partner_id = :partnerId', { partnerId });

    if (status && status !== 'ALL') qb.andWhere('b.status = :status', { status });
    if (date) qb.andWhere('b.booking_date = :date', { date });
    if (search) {
      qb.andWhere(
        '(LOWER(b.customer_name) LIKE :s OR b.customer_phone LIKE :s OR LOWER(b.booking_number) LIKE :s OR LOWER(a.title) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }

    // Summary counts
    const allByPartner = await this.bookingRepo.createQueryBuilder('b')
      .select('b.status, COUNT(*) as cnt')
      .where('b.partner_id = :partnerId', { partnerId })
      .groupBy('b.status')
      .getRawMany();

    const counts: Record<string, number> = { all: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    allByPartner.forEach(({ b_status, cnt }) => {
      const s = b_status?.toLowerCase();
      counts.all += Number(cnt);
      if (counts[s] !== undefined) counts[s] += Number(cnt);
    });

    const skip = (Number(page) - 1) * Number(limit);
    const [items, totalItems] = await qb.skip(skip).take(Number(limit)).orderBy('b.created_at', 'DESC').getManyAndCount();

    return {
      bookings: items.map((b) => ({
        id: b.id,
        bookingNumber: b.booking_number,
        activityTitle: (b as any).activity?.title || '',
        activityLocation: (b as any).activity?.location || '',
        activityImageUrl: (b as any).activity?.cover_image_url || '',
        date: this.formatDate(b.booking_date),
        time: b.time_slot,
        participantsCount: b.participants_count,
        totalAmount: Number(b.total_amount),
        status: b.status,
        customerName: b.customer_name,
        customerPhone: b.customer_phone,
        customerEmail: b.customer_email,
        tierName: b.tier_name,
        instructor: b.instructor_name,
        paymentMethod: b.payment_method,
        paymentStatus: b.payment_status,
        createdAt: b.created_at,
      })),
      summaryCounts: counts,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit),
      },
    };
  }

  async getBooking(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { activity: true, participants: true, inclusions: true },
    });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.partner_id !== partnerId) throw new ForbiddenException('BOOKING_NOT_OWNED');

    return {
      id: booking.id,
      bookingNumber: booking.booking_number,
      status: booking.status,
      activity: {
        id: (booking as any).activity?.id,
        title: (booking as any).activity?.title,
        location: (booking as any).activity?.location,
        imageUrl: (booking as any).activity?.cover_image_url,
        tierName: booking.tier_name,
        instructor: booking.instructor_name,
      },
      schedule: {
        date: this.formatDate(booking.booking_date),
        time: booking.time_slot,
        isRescheduled: booking.is_rescheduled,
        rescheduledFromDate: booking.rescheduled_from_date,
        rescheduledFromSlot: booking.rescheduled_from_slot,
        rescheduledReason: booking.reschedule_reason,
      },
      checkIn: {
        isCheckedIn: !!booking.checked_in_at,
        checkedInAt: booking.checked_in_at,
      },
      customer: {
        name: booking.customer_name,
        phone: booking.customer_phone,
        email: booking.customer_email,
      },
      participants: booking.participants?.map((p) => ({ name: p.full_name, age: p.age, gender: p.gender })) || [],
      inclusions: booking.inclusions?.map((i) => i.title) || [],
      payment: {
        baseFare: Number(booking.total_amount),
        taxesAndGst: Math.round(Number(booking.total_amount) * 0.05 * 100) / 100,
        discount: 0,
        totalAmount: Math.round(Number(booking.total_amount) * 1.05 * 100) / 100,
        paymentMethod: booking.payment_method,
        paymentStatus: booking.payment_status,
        transactionId: booking.transaction_id,
      },
    };
  }

  async checkIn(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const booking = await this.bookingRepo.findOneBy({ id });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.partner_id !== partnerId) throw new ForbiddenException('BOOKING_NOT_OWNED');
    if (booking.checked_in_at) throw new ConflictException('ALREADY_CHECKED_IN');

    const now = new Date();
    await this.bookingRepo.update(id, { status: 'CHECKED_IN', checked_in_at: now });

    return {
      bookingId: id,
      status: 'CHECKED_IN',
      checkedInAt: now.toISOString(),
      checkInTimeFormatted: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };
  }

  async reschedule(userId: string, id: string, dto: any) {
    const partnerId = await this.resolvePartnerId(userId);
    const booking = await this.bookingRepo.findOneBy({ id });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.partner_id !== partnerId) throw new ForbiddenException('BOOKING_NOT_OWNED');

    const newDate = new Date(dto.newDate);
    if (newDate < new Date()) throw new BadRequestException('New date cannot be in the past');

    await this.bookingRepo.update(id, {
      is_rescheduled: true,
      rescheduled_from_date: booking.booking_date,
      rescheduled_from_slot: booking.time_slot,
      reschedule_reason: dto.reason,
      booking_date: dto.newDate,
      time_slot: dto.newTimeSlot,
      status: 'CONFIRMED',
    });

    return {
      bookingId: id,
      status: 'CONFIRMED',
      isRescheduled: true,
      newDate: this.formatDate(dto.newDate),
      newTimeSlot: dto.newTimeSlot,
      rescheduledReason: dto.reason,
      customerNotified: dto.notifyCustomer ?? true,
    };
  }

  async confirm(userId: string, id: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const booking = await this.bookingRepo.findOneBy({ id });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.partner_id !== partnerId) throw new ForbiddenException('BOOKING_NOT_OWNED');
    await this.bookingRepo.update(id, { status: 'CONFIRMED' });
    return { bookingId: id, status: 'CONFIRMED' };
  }

  async cancel(userId: string, id: string, reason: string) {
    const partnerId = await this.resolvePartnerId(userId);
    const booking = await this.bookingRepo.findOneBy({ id });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    if (booking.partner_id !== partnerId) throw new ForbiddenException('BOOKING_NOT_OWNED');
    if (booking.status === 'COMPLETED') throw new BadRequestException({ errorCode: 'CANNOT_CANCEL_COMPLETED', message: 'Completed bookings cannot be cancelled' });

    await this.bookingRepo.update(id, {
      status: 'CANCELLED',
      cancellation_reason: reason,
      cancelled_at: new Date(),
    });

    return {
      bookingId: id,
      status: 'CANCELLED',
      refundStatus: 'PROCESSING',
      refundAmount: Math.round(Number(booking.total_amount) * 1.05 * 100) / 100,
    };
  }
}
