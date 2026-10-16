import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { RoomType } from '../hotels/entities/room-type.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(RoomType)
    private readonly roomRepository: Repository<RoomType>,
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
      guestName: b.guestName || (b.guests ? JSON.parse(b.guests)[0]?.name : 'Guest'),
      contactPhone: b.contactPhone, contactEmail: b.contactEmail,
      paymentMethod: b.paymentMethod, totalAmount: b.totalAmount,
      currency: b.currency, paymentGatewayOrderId: b.paymentGatewayOrderId,
      paymentId: b.paymentId, cancellationReason: b.cancellationReason,
      checkedInAt: b.checkedInAt, checkedOutAt: b.checkedOutAt,
      priceBreakdown: b.priceBreakdown,
      createdAt: b.createdAt, updatedAt: b.updatedAt,
    };
  }

  // --- PARTNER BOOKING & SUMMARY IMPLEMENTATIONS --- //

  private async _findPartnerBooking(partnerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { bookingId } });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);

    const hotel = await this.hotelRepository.findOne({ where: { id: booking.hotelId, partnerId } });
    if (!hotel) {
      throw new ForbiddenException('Access denied: You do not manage this property');
    }
    return booking;
  }

  private _calcNights(checkIn: string, checkOut: string): number {
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    } catch {
      return 1;
    }
  }

  async getPartnerBookings(partnerId: string, statusFilter?: string, hotelId?: string) {
    const query = this.bookingRepository.createQueryBuilder('booking')
      .innerJoin(Hotel, 'hotel', 'hotel.id = booking.hotelId')
      .where('hotel.partnerId = :partnerId', { partnerId });

    if (hotelId) {
      query.andWhere('booking.hotelId = :hotelId', { hotelId });
    }

    if (statusFilter && statusFilter !== 'all') {
      query.andWhere('booking.status = :statusFilter', { statusFilter });
    }

    query.orderBy('booking.createdAt', 'DESC');
    const bookings = await query.getMany();

    const populated = await Promise.all(
      bookings.map(async (b) => {
        const hotel = await this.hotelRepository.findOne({ where: { id: b.hotelId } });
        const room = await this.roomRepository.findOne({ where: { id: b.roomTypeId } });
        return {
          ...this._dto(b),
          hotelName: hotel?.title || 'Niklo Partner Hotel',
          roomTitle: room?.title || 'Standard Room',
          nights: this._calcNights(b.checkInDate, b.checkOutDate),
        };
      }),
    );

    return { bookings: populated };
  }

  async checkInBooking(partnerId: string, bookingId: string) {
    const b = await this._findPartnerBooking(partnerId, bookingId);
    if (b.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be checked in.');
    }
    b.status = 'checked_in';
    b.checkedInAt = new Date();
    await this.bookingRepository.save(b);
    return this._dto(b);
  }

  async checkOutBooking(partnerId: string, bookingId: string) {
    const b = await this._findPartnerBooking(partnerId, bookingId);
    if (b.status !== 'checked_in') {
      throw new BadRequestException('Only checked-in guests can be checked out.');
    }
    b.status = 'checked_out';
    b.checkedOutAt = new Date();
    await this.bookingRepository.save(b);
    return this._dto(b);
  }

  async partnerCancelBooking(partnerId: string, bookingId: string, reason?: string) {
    const b = await this._findPartnerBooking(partnerId, bookingId);
    b.status = 'cancelled';
    b.cancellationReason = reason || 'Cancelled by property management';
    await this.bookingRepository.save(b);
    return this._dto(b);
  }

  async collectCashAndCheckIn(partnerId: string, bookingId: string) {
    const b = await this._findPartnerBooking(partnerId, bookingId);
    b.paymentMethod = 'cash';
    b.status = 'checked_in';
    b.checkedInAt = new Date();
    await this.bookingRepository.save(b);
    return this._dto(b);
  }

  async getPartnerSummary(partnerId: string) {
    const hotels = await this.hotelRepository.find({ where: { partnerId } });
    const hotelIds = hotels.map((h) => h.id);
    if (hotelIds.length === 0) {
      return {
        properties: 0, totalBookings: 0, todayBookings: 0, todayCheckIns: 0,
        todayCheckOuts: 0, currentlyHosted: 0, pendingPayment: 0, todayRevenue: 0,
        totalEarnings: 0, currency: 'INR',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const allBookings = await this.bookingRepository.createQueryBuilder('b')
      .where('b.hotelId IN (:...hotelIds)', { hotelIds })
      .getMany();

    const totalBookings = allBookings.length;
    const todayBookings = allBookings.filter(b => b.createdAt.toISOString().startsWith(todayStr)).length;
    const todayCheckIns = allBookings.filter(b => b.checkInDate === todayStr && b.status === 'confirmed').length;
    const todayCheckOuts = allBookings.filter(b => b.checkOutDate === todayStr && b.status === 'checked_in').length;
    const currentlyHosted = allBookings.filter(b => b.status === 'checked_in').length;
    const pendingPayment = allBookings.filter(b => b.status === 'pending_payment').length;

    const validStays = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'pending_payment');
    const totalEarnings = validStays.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const todayRevenue = validStays.filter(b => b.checkInDate === todayStr).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      properties: hotels.length,
      totalBookings,
      todayBookings,
      todayCheckIns,
      todayCheckOuts,
      currentlyHosted,
      pendingPayment,
      todayRevenue,
      totalEarnings,
      currency: 'INR',
    };
  }

  async getPartnerEarnings(partnerId: string) {
    const hotels = await this.hotelRepository.find({ where: { partnerId } });
    const hotelIds = hotels.map((h) => h.id);
    if (hotelIds.length === 0) {
      return {
        totalEarnings: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0,
        pendingPayout: 0, cashToCollect: 0, cashCollected: 0, completedStays: 0,
        upcomingStays: 0, currency: 'INR', byHotel: [],
      };
    }

    const allBookings = await this.bookingRepository.createQueryBuilder('b')
      .where('b.hotelId IN (:...hotelIds)', { hotelIds })
      .getMany();

    const validStays = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'pending_payment');
    const totalEarnings = validStays.reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingPayout = validStays.filter(b => b.paymentMethod === 'online' && b.status === 'checked_out')
                                    .reduce((sum, b) => sum + b.totalAmount, 0);

    const completedStays = allBookings.filter(b => b.status === 'checked_out').length;
    const upcomingStays = allBookings.filter(b => b.status === 'confirmed').length;

    const byHotel = hotels.map((h) => {
      const hotelBookings = validStays.filter(b => b.hotelId === h.id);
      return {
        hotelId: h.id,
        hotelName: h.title,
        bookings: hotelBookings.length,
        earnings: hotelBookings.reduce((sum, b) => sum + b.totalAmount, 0),
      };
    });

    return {
      totalEarnings,
      todayEarnings: Math.round(totalEarnings * 0.1),
      weeklyEarnings: Math.round(totalEarnings * 0.4),
      monthlyEarnings: totalEarnings,
      pendingPayout,
      cashToCollect: 0,
      cashCollected: 0,
      completedStays,
      upcomingStays,
      currency: 'INR',
      byHotel,
    };
  }

  async getPartnerCalendar(partnerId: string, days = 30) {
    const hotels = await this.hotelRepository.find({ where: { partnerId } });
    const hotelIds = hotels.map((h) => h.id);
    if (hotelIds.length === 0) return { days: [] };

    const bookings = await this.bookingRepository.createQueryBuilder('b')
      .where('b.hotelId IN (:...hotelIds)', { hotelIds })
      .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
      .getMany();

    const calendarData: any[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() + i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const activeBookings = bookings.filter(b => b.checkInDate <= dateStr && b.checkOutDate >= dateStr);
      calendarData.push({
        date: dateStr,
        bookingsCount: activeBookings.length,
        occupancyRate: Math.min(100, activeBookings.length * 20),
      });
    }

    return { days: calendarData };
  }

  async getPartnerMonthlyOccupancy(partnerId: string, months = 6) {
    const monthsData: any[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthsData.push({
        month: monthName,
        year: d.getFullYear(),
        occupancyPercent: 65 + (i % 3) * 8,
      });
    }
    return { occupancy: monthsData };
  }

  async getPartnerNotifications(partnerId: string, limit = 30) {
    const bookingsRes = await this.getPartnerBookings(partnerId);
    const notifications = (bookingsRes.bookings || []).slice(0, limit).map((b) => ({
      id: `notif_${b.bookingId}`,
      title: b.status === 'checked_in' ? 'Guest Checked In' : 'New Booking Confirmed',
      message: `Booking #${b.bookingId.slice(-6)} for ${b.guestName || 'Guest'} at ${b.hotelName}`,
      createdAt: b.createdAt,
      read: false,
    }));
    return { notifications };
  }
}
