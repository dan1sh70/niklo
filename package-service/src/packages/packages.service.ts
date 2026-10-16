import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayPackage } from './entities/holiday-package.entity';

import { PackageBooking } from '../partner/bookings/entities/package-booking.entity';
import { PackageBookingTraveler } from '../partner/bookings/entities/package-booking-traveler.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(HolidayPackage)
    private readonly packageRepo: Repository<HolidayPackage>,
    @InjectRepository(PackageBooking)
    private readonly packageBookingRepo: Repository<PackageBooking>,
    @InjectRepository(PackageBookingTraveler)
    private readonly travelerRepo: Repository<PackageBookingTraveler>,
  ) {}

  async createPartnerBookingFromCustomerOrder(data: any) {
    const holidayPkg = await this.packageRepo.findOne({ where: { id: data.package_id } });
    if (!holidayPkg) {
      throw new NotFoundException(`Holiday package ${data.package_id} not found`);
    }

    const grossAmount = Number(data.total_amount) || 0;
    const platformFeeRate = 10.0;
    const platformFeeAmount = Number((grossAmount * (platformFeeRate / 100)).toFixed(2));
    const partnerPayoutAmount = Number((grossAmount - platformFeeAmount).toFixed(2));

    const partnerBooking = this.packageBookingRepo.create({
      booking_ref: data.booking_reference || `NKL-PKG-${Date.now().toString().slice(-6)}`,
      package_id: data.package_id,
      partner_id: holidayPkg.partner_id,
      departure_id: data.departure_id || 'OPEN_SCHEDULE',
      traveler_user_id: data.user_id,
      start_date: data.travel_date,
      end_date: data.end_date || data.travel_date,
      adults_count: data.adults_count || 1,
      children_count: data.children_count || 0,
      gross_amount: grossAmount,
      discount_amount: 0,
      gst_amount: Number((grossAmount * 0.05).toFixed(2)),
      net_total: grossAmount,
      platform_fee_percent: platformFeeRate,
      platform_fee_amount: platformFeeAmount,
      partner_payout_amount: partnerPayoutAmount,
      status: 'PENDING_ACCEPTANCE',
      payment_status: 'PAID_ADVANCE',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const savedBooking = await this.packageBookingRepo.save(partnerBooking);

    await this.travelerRepo.save(this.travelerRepo.create({
      booking_id: savedBooking.id,
      full_name: data.contact_name || 'Primary Traveler',
      phone: data.contact_phone || '',
      email: data.contact_email || '',
      age: 30,
      gender: 'MALE',
      is_primary: true,
    }));

    return { success: true, partnerBookingId: savedBooking.id };
  }

  async findAll(query: any) {
    const { destination, category, limit = 20, page = 1 } = query;
    const qb = this.packageRepo.createQueryBuilder('pkg')
      .where('pkg.status = :status', { status: 'ACTIVE' });

    if (destination) {
      qb.andWhere('pkg.destination_city ILIKE :dest OR pkg.destination_state ILIKE :dest', { dest: `%${destination}%` });
    }
    if (category && category !== 'All') {
      qb.andWhere('pkg.category = :category', { category });
    }

    const packages = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return packages;
  }

  async findOne(id: string) {
    const travelPackage = await this.packageRepo.findOne({ 
      where: { id, status: 'ACTIVE' },
      relations: { gallery_media: true, itinerary_days: true }
    });
    if (!travelPackage) {
      throw new NotFoundException(`Travel package with ID ${id} not found`);
    }
    return travelPackage;
  }

  async getPopularDestinations() {
    return [];
  }

  async getCategories() {
    return [];
  }

  async getTrendingPackages(limit = 6) {
    return this.packageRepo.find({
      where: { status: 'ACTIVE' },
      order: { average_rating: 'DESC' },
      take: limit,
    });
  }

  async getOffers() {
    return this.packageRepo.find({
      where: { status: 'ACTIVE', has_discount: true },
      order: { discount_value: 'DESC' },
      take: 5,
    });
  }

  async getCities() {
    return { startingCities: [], destinationCities: [] };
  }

  async searchPackages(query: any) {
    return this.findAll(query);
  }

  async getPackagesByDestination(name: string) {
    return this.packageRepo.find({
      where: { destination_city: name, status: 'ACTIVE' },
      order: { average_rating: 'DESC' },
    });
  }

  async getPackagesByCategory(category: string) {
    return this.packageRepo.find({
      where: { category, status: 'ACTIVE' },
      order: { average_rating: 'DESC' },
    });
  }

  async checkAvailability(id: string, checkParams: any) {
    return { available: true };
  }
}
