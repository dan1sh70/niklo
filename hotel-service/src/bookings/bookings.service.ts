import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async quoteBooking(userId: string, dto: any) {
    const { pricePerNight = 0, rooms = 1, checkInDate, checkOutDate, isHourly, hourlyDurationHours } = dto;
    let nights = 1;
    if (!isHourly && checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end   = new Date(checkOutDate);
      nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    }
    const base  = pricePerNight * rooms * (isHourly ? (hourlyDurationHours / 24) : nights);
    const tax   = Math.round(base * 0.12);
    const total = Math.round(base + tax);
    return { nights_count: nights, rooms, price_per_night: pricePerNight,
             base_price: Math.round(base), taxes_and_fees: tax, grand_total: total, currency: 'INR' };
  }

  async createBooking(userId: string, dto: any) {
    const { pricePerNight = 0, rooms = 1, checkInDate, checkOutDate,
            isHourly = false, hourlyDurationHours } = dto;
    let nights = 1;
    if (!isHourly && checkInDate && checkOutDate) {
      const s = new Date(checkInDate), e = new Date(checkOutDate);
      nights = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000));
    }
    const base  = pricePerNight * rooms * (isHourly ? hourlyDurationHours / 24 : nights);
    const total = Math.round(base + base * 0.12);

    const bookingId = `HTL${Date.now()}${Math.floor(Math.random()*100)}`;
    const booking = this.bookingRepository.create({
      bookingId, userId,
      hotelId: dto.hotelId, roomTypeId: dto.roomTypeId,
      checkInDate: dto.checkInDate, checkOutDate: dto.checkOutDate,
      rooms: dto.rooms || 1, adults: dto.adults || 1, children: dto.children || 0,
      childAges: dto.childAges || [], isHourly: dto.isHourly || false,
      hourlyCheckInTime: dto.hourlyCheckInTime || null,
      hourlyDurationHours: dto.hourlyDurationHours || null,
      guests: JSON.stringify(dto.guests || []),
      contactPhone: dto.contactPhone || '',
      contactEmail: dto.contactEmail || null,
      paymentMethod: dto.paymentMethod || 'online',
      totalAmount: total, status: 'pending_payment', currency: 'INR',
      paymentGatewayOrderId: `order_${Math.random().toString(36).substring(2,11)}`,
    });
    await this.bookingRepository.save(booking);
    return {
      bookingId: booking.bookingId, status: booking.status,
      amount: booking.totalAmount, currency: booking.currency,
      paymentGatewayOrderId: booking.paymentGatewayOrderId,
    };
  }

  async getMyBookings(userId: string, limit = 20, offset = 0) {
    const bookings = await this.bookingRepository.find({
      where: { userId }, order: { createdAt: 'DESC' },
      take: Math.min(limit, 100), skip: offset,
    });
    return { bookings: bookings.map(b => this._dto(b)) };
  }

  async getBooking(userId: string, bookingId: string) {
    const b = await this.bookingRepository.findOne({ where: { bookingId } });
    if (!b) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (b.userId !== userId) throw new ForbiddenException('Access denied');
    return this._dto(b);
  }

  async confirmPayment(userId: string, bookingId: string, dto: any) {
    const b = await this.bookingRepository.findOne({ where: { bookingId } });
    if (!b) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (b.userId !== userId) throw new ForbiddenException('Access denied');
    b.status = 'confirmed'; b.paymentId = dto.paymentId;
    if (dto.paymentGatewayOrderId) b.paymentGatewayOrderId = dto.paymentGatewayOrderId;
    await this.bookingRepository.save(b);
    return this._dto(b);
  }

  async payAtProperty(userId: string, bookingId: string) {
    const b = await this.bookingRepository.findOne({ where: { bookingId } });
    if (!b) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (b.userId !== userId) throw new ForbiddenException('Access denied');
    b.status = 'confirmed'; b.paymentMethod = 'pay_at_property';
    await this.bookingRepository.save(b); return this._dto(b);
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const b = await this.bookingRepository.findOne({ where: { bookingId } });
    if (!b) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (b.userId !== userId) throw new ForbiddenException('Access denied');
    b.status = 'cancelled'; b.cancellationReason = reason || '';
    await this.bookingRepository.save(b); return this._dto(b);
  }

  private _dto(b: Booking) {
    return {
      bookingId: b.bookingId, status: b.status, hotelId: b.hotelId,
      roomTypeId: b.roomTypeId, checkInDate: b.checkInDate, checkOutDate: b.checkOutDate,
      rooms: b.rooms, adults: b.adults, children: b.children, childAges: b.childAges,
      isHourly: b.isHourly, hourlyCheckInTime: b.hourlyCheckInTime,
      hourlyDurationHours: b.hourlyDurationHours,
      guests: b.guests ? JSON.parse(b.guests) : [],
      contactPhone: b.contactPhone, contactEmail: b.contactEmail,
      paymentMethod: b.paymentMethod, totalAmount: b.totalAmount,
      currency: b.currency, paymentGatewayOrderId: b.paymentGatewayOrderId,
      paymentId: b.paymentId, cancellationReason: b.cancellationReason,
      createdAt: b.createdAt, updatedAt: b.updatedAt,
    };
  }
}
