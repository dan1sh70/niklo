import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayPackage } from '../../packages/entities/holiday-package.entity';
import { PackageDeparture } from './entities/package-departure.entity';
import { PackageItineraryActivity } from './entities/package-itinerary-activity.entity';
import { PackageInclusion } from './entities/package-inclusion.entity';
import { PackageGalleryMedia } from '../../packages/entities/package-gallery-media.entity';
import { PackageItineraryDay } from '../../packages/entities/package-itinerary-day.entity';

@Injectable()
export class PackagesPartnerService {
  constructor(
    @InjectRepository(HolidayPackage)
    private readonly packageRepository: Repository<HolidayPackage>,
    @InjectRepository(PackageDeparture)
    private readonly departureRepository: Repository<PackageDeparture>,
    @InjectRepository(PackageItineraryActivity)
    private readonly activityRepository: Repository<PackageItineraryActivity>,
    @InjectRepository(PackageInclusion)
    private readonly inclusionRepository: Repository<PackageInclusion>,
    @InjectRepository(PackageGalleryMedia)
    private readonly mediaRepository: Repository<PackageGalleryMedia>,
    @InjectRepository(PackageItineraryDay)
    private readonly dayRepository: Repository<PackageItineraryDay>,
  ) {}

  async listPackages(partnerId: string, status?: string) {
    const query = { partner_id: partnerId };
    if (status) query['status'] = status;
    return await this.packageRepository.find({ where: query, order: { created_at: 'DESC' } });
  }

  async getPackages(partnerId: string, query?: any) {
    const where: any = { partner_id: partnerId };
    if (query?.status) where.status = query.status;
    const packages = await this.packageRepository.find({ where, order: { created_at: 'DESC' } });
    return { data: packages, total: packages.length };
  }

  async getPackage(partnerId: string, packageId: string) {
    return await this.packageRepository.findOne({
      where: { id: packageId, partner_id: partnerId },
      relations: {
        gallery_media: true,
        itinerary_days: true
      }
    });
  }
  async initializeDraft(partnerId: string) {
    const pkg = this.packageRepository.create({
      partner_id: partnerId,
      title: 'New Package',
      description: '',
      category: 'Other',
      duration_days: 1,
      duration_nights: 0,
      destination_city: '',
      destination_state: '',
      starting_location: '',
      base_price: 1000,
      final_price: 1000,
      status: 'DRAFT',
      current_creation_step: 1
    });
    return this.packageRepository.save(pkg);
  }

  async saveBasicInfo(partnerId: string, packageId: string, body: any) {
    await this.packageRepository.update(
      { id: packageId, partner_id: partnerId },
      {
        title: body.title,
        description: body.description,
        category: body.category,
        duration_days: body.durationDays,
        duration_nights: body.durationNights,
        destination_city: body.destinationCity,
        destination_state: body.destinationState,
        starting_location: body.startingLocation,
        min_travelers: body.minTravelers || 1,
        max_travelers: body.maxTravelers || 30,
        tagline: body.tagline,
        current_creation_step: 2
      }
    );
    return this.packageRepository.findOne({ where: { id: packageId } });
  }

  async uploadMediaBatch(partnerId: string, packageId: string, files: Express.Multer.File[], body: any) {
    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = 'https://mock.url/' + file.originalname;
        const isCover = file.originalname === body.coverImageName;
        
        if (isCover) {
          await this.packageRepository.update({ id: packageId, partner_id: partnerId }, { cover_image_url: fileUrl, current_creation_step: 3 });
        } else {
          await this.mediaRepository.save(this.mediaRepository.create({
            package_id: packageId,
            media_url: fileUrl,
            media_type: 'IMAGE',
            sort_order: 0
          }));
        }
      }
      await this.packageRepository.update({ id: packageId, partner_id: partnerId }, { current_creation_step: 3 });
    }
    return { success: true };
  }

  async saveItinerary(partnerId: string, packageId: string, days: any[]) {
    if (days) {
      for (const day of days) {
        const savedDay = await this.dayRepository.save(this.dayRepository.create({
          package_id: packageId,
          day_number: day.dayNumber,
          title: day.title,
          summary: day.summary
        }));
        
        if (day.activities && day.activities.length > 0) {
          for (const act of day.activities) {
            await this.activityRepository.save(this.activityRepository.create({
              day_id: savedDay.id,
              time_slot: act.timeSlot || 'Morning',
              title: act.title,
              description: act.description,
              activity_icon: act.icon || 'explore',
              sort_order: act.sortOrder || 0
            }));
          }
        }
      }
    }
    await this.packageRepository.update({ id: packageId, partner_id: partnerId }, { current_creation_step: 4 });
    return this.packageRepository.findOne({ where: { id: packageId } });
  }

  async saveInclusions(partnerId: string, packageId: string, body: { included: string[]; excluded: string[] }) {
    if (body.included) {
      for (const item of body.included) {
        await this.inclusionRepository.save(this.inclusionRepository.create({
          package_id: packageId,
          item_title: item,
          is_included: true
        }));
      }
    }
    if (body.excluded) {
      for (const item of body.excluded) {
        await this.inclusionRepository.save(this.inclusionRepository.create({
          package_id: packageId,
          item_title: item,
          is_included: false
        }));
      }
    }
    await this.packageRepository.update({ id: packageId, partner_id: partnerId }, { current_creation_step: 5 });
    return { success: true };
  }

  async savePricing(partnerId: string, packageId: string, body: any) {
    await this.packageRepository.update(
      { id: packageId, partner_id: partnerId },
      {
        pricing_mode: body.pricingMode,
        base_price: body.basePrice,
        has_discount: body.hasDiscount,
        discount_type: body.discountType,
        discount_value: body.discountValue,
        final_price: body.finalPrice,
        is_gst_included: body.isGstIncluded,
        current_creation_step: 6
      }
    );
    return this.packageRepository.findOne({ where: { id: packageId } });
  }

  async saveAvailability(partnerId: string, packageId: string, body: { seatsPerDeparture: number; departureDates: any[] }) {
    if (body.departureDates) {
      for (const depDate of body.departureDates) {
        await this.departureRepository.save(this.departureRepository.create({
          package_id: packageId,
          departure_date: depDate,
          return_date: depDate, // Mocking
          total_seats: body.seatsPerDeparture,
          price_override: 0
        }));
      }
    }
    await this.packageRepository.update({ id: packageId, partner_id: partnerId }, { current_creation_step: 7 });
    return { success: true };
  }

  async getAvailabilityCalendar(partnerId: string, packageId: string, month: string, year: string) {
    const departures = await this.departureRepository.find({ where: { package_id: packageId } });
    return { calendar: departures };
  }

  async updateAvailabilitySlots(partnerId: string, packageId: string, body: any) {
    // Mock slot update
    return { success: true };
  }

  async publishPackage(partnerId: string, packageId: string) {
    await this.packageRepository.update(
      { id: packageId, partner_id: partnerId },
      { status: 'ACTIVE' }
    );
    return this.packageRepository.findOne({ where: { id: packageId } });
  }

  async deletePackage(partnerId: string, packageId: string) {
    await this.packageRepository.delete({ id: packageId, partner_id: partnerId });
    return { success: true };
  }

  async toggleStatus(partnerId: string, packageId: string, body: any) {
    const status = body.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    await this.packageRepository.update(
      { id: packageId, partner_id: partnerId },
      { status: status }
    );
    return this.packageRepository.findOne({ where: { id: packageId } });
  }
}
