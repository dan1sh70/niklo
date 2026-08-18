import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';

@Injectable()
export class BookingsService implements OnApplicationBootstrap {
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly httpService: HttpService,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.bookingRepo.count();
    if (count === 0) {
      const mockBooking = this.bookingRepo.create({
        id: 'bkg_771029',
        user_id: this.MOCK_USER_ID,
        booking_type: BookingType.BUS,
        reference_id: '22222222-2222-2222-2222-222222222222',
        booking_reference: 'NIK-BUS-88210',
        title: 'Greenline Travels (AC Sleeper)',
        subtitle: 'Kolkata to Siliguri',
        from_location: 'Esplanade, Kolkata',
        to_location: 'Junction, Siliguri',
        travel_date: new Date('2026-08-28'),
        departure_time: '20:00',
        total_amount: 1200.00,
        status: BookingStatus.CONFIRMED,
        qr_code_token: 'eyJhbGciOiJIUzI1Ni...'
      });
      await this.bookingRepo.save(mockBooking);
      console.log('Seeded bookings mock data successfully.');
    }
  }

  private mapBookingToDto(b: Booking) {
    return {
      id: b.id,
      bookingReference: b.booking_reference,
      bookingType: b.booking_type,
      title: b.title,
      subtitle: b.subtitle,
      fromLocation: b.from_location,
      toLocation: b.to_location,
      travelDate: b.travel_date ? b.travel_date.toISOString().split('T')[0] : null,
      departureTime: b.departure_time,
      totalAmount: Number(b.total_amount),
      status: b.status,
      qrCodeToken: b.qr_code_token,
      couponCode: b.coupon_code,
      discountAmount: b.discount_amount ? Number(b.discount_amount) : 0,
    };
  }

  async create(dto: any) {
    let insurance_premium = 0;
    if (dto.has_insurance && dto.passenger_details) {
      insurance_premium = dto.passenger_details.length * 49;
    }

    const booking = this.bookingRepo.create({
      user_id: this.MOCK_USER_ID,
      booking_type: dto.booking_type || BookingType.BUS,
      reference_id: dto.schedule_id,
      booking_reference: `NIK-${dto.booking_type || 'B'}-${Math.floor(Math.random() * 100000)}`,
      title: 'Booking Title',
      subtitle: 'Booking Subtitle',
      from_location: dto.boarding_point || 'Unknown',
      to_location: dto.dropping_point || 'Unknown',
      travel_date: dto.travel_date || new Date(),
      departure_time: '10:00',
      total_amount: dto.total_amount + insurance_premium,
      status: BookingStatus.PENDING,
      qr_code_token: 'dummy_token_to_be_replaced',
      has_insurance: dto.has_insurance,
      insurance_premium,
      has_gov_id_verification: dto.has_gov_id_verification,
      primary_gov_id_type: dto.primary_gov_id_type,
      primary_gov_id_number: dto.primary_gov_id_number,
      id_verification_status: dto.has_gov_id_verification ? 'PENDING' : 'UNVERIFIED',
      seat_numbers: dto.seat_numbers,
    });

    await this.bookingRepo.save(booking);
    return this.mapBookingToDto(booking);
  }

  async getHistory(query: any) {
    const { type, status, limit = 20, page = 1 } = query;
    // In production, user_id should come from req.user
    const qb = this.bookingRepo.createQueryBuilder('b')
      .where('b.user_id = :userId', { userId: this.MOCK_USER_ID })
      .orderBy('b.created_at', 'DESC');

    if (type && type !== 'ALL') {
      qb.andWhere('b.booking_type = :type', { type });
    }

    if (status) {
      // Basic mock implementation for status, if UPCOMING we check date and status
      if (status === 'UPCOMING') {
        qb.andWhere('b.status = :bStatus', { bStatus: BookingStatus.CONFIRMED })
          .andWhere('b.travel_date >= CURRENT_DATE');
      } else if (status === 'PAST') {
        qb.andWhere('b.status IN (:...bStatus)', { bStatus: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] });
      }
    }

    const bookings = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return bookings.map(b => this.mapBookingToDto(b));
  }

  async getCancellationQuote(id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id, user_id: this.MOCK_USER_ID },
    });
    
    if (!booking) throw new NotFoundException('Booking not found');

    const amountPaid = Number(booking.total_amount) || 0;
    const penaltyAmount = amountPaid * 0.10; // 10% penalty
    const refundAmount = amountPaid - penaltyAmount;

    return {
      booking_id: booking.id,
      total_paid: amountPaid,
      cancellation_fee: penaltyAmount,
      refundable_amount: refundAmount,
      currency: 'INR',
      refund_policy: '90% refund prior to 24 hours of departure',
    };
  }

  async confirmPayment(id: string, body: any) {
    const booking = await this.bookingRepo.findOne({
      where: { id, user_id: this.MOCK_USER_ID },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = BookingStatus.CONFIRMED;
    // Issue insurance policy if applicable
    if (booking.has_insurance) {
      booking.insurance_policy_number = `POL-${Date.now()}`;
    }
    await this.bookingRepo.save(booking);

    if (booking.booking_type === BookingType.BUS && booking.reference_id && booking.seat_numbers?.length) {
      try {
        const busServiceUrl = process.env.BUS_SERVICE_URL || 'http://bus-service:3003';
        await lastValueFrom(
          this.httpService.post(
            `${busServiceUrl}/api/v1/bus/schedules/${booking.reference_id}/confirm-seats`,
            { seat_numbers: booking.seat_numbers },
          )
        );
      } catch (e) {
        // Log but don't fail — seats will auto-release after Redis TTL anyway
        console.error(`Failed to mark seats booked on bus-service: ${e.message}`);
      }
    }

    return {
      id: booking.id,
      status: booking.status,
      payment_id: body.payment_id,
      total_amount: Number(booking.total_amount),
    };
  }

  async applyCoupon(id: string, body: { coupon_code: string; discount_amount: number }) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const discount = Number(body.discount_amount) || 0;
    booking.coupon_code = body.coupon_code;
    booking.discount_amount = discount;
    booking.total_amount = Math.max(0, Number(booking.total_amount) - discount);
    await this.bookingRepo.save(booking);

    return this.mapBookingToDto(booking);
  }

  async verifyGovId(body: any) {
    const { booking_id, id_type, id_number } = body;
    const booking = await this.bookingRepo.findOne({ where: { id: booking_id } });
    if (!booking) throw new NotFoundException('Booking not found');

    booking.id_verification_status = 'VERIFIED';
    booking.primary_gov_id_type = id_type;
    booking.primary_gov_id_number = id_number;
    await this.bookingRepo.save(booking);

    return {
      verified: true,
      status: 'VERIFIED',
      id_type,
      masked_id: id_number ? id_number.replace(/.(?=.{4})/g, 'X') : 'XXXX',
      holder_name: 'Anish Dandapat', // Mock name
      fast_boarding_pass: true,
      verification_timestamp: new Date().toISOString(),
    };
  }

  async getIdVerificationStatus(id: string) {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      booking_id: booking.id,
      status: booking.id_verification_status,
      fast_boarding_eligible: booking.id_verification_status === 'VERIFIED',
      badge_text: booking.id_verification_status === 'VERIFIED' ? 'Verified Traveller' : 'Pending',
    };
  }

  async verifyTicket(token: string) {
    const booking = await this.bookingRepo.findOne({
      where: { qr_code_token: token },
    });

    if (!booking) {
      throw new NotFoundException('Invalid or expired QR Ticket');
    }

    return {
      message: 'Ticket verified successfully',
      valid: true,
      booking_id: booking.id,
      passenger_id: booking.user_id,
      status: booking.status,
    };
  }
}
