import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { MarketingBanner } from './entities/marketing-banner.entity';

@Injectable()
export class HomeService implements OnApplicationBootstrap {
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(MarketingBanner)
    private readonly bannerRepo: Repository<MarketingBanner>,
  ) {}

  async onApplicationBootstrap() {
    const bannerCount = await this.bannerRepo.count();
    if (bannerCount === 0) {
      await this.bannerRepo.save([
        {
          title: 'Summer Getaways',
          subtitle: 'Up to 30% off on all beach packages',
          image_url: 'https://cdn.niklo.com/banners/summer.jpg',
          deep_link: 'niklo://packages/summer',
          discount_text: '30% OFF',
          display_order: 1,
        },
        {
          title: 'Premium Rides',
          subtitle: 'Book an AC ride for your next journey',
          image_url: 'https://cdn.niklo.com/banners/rides.jpg',
          deep_link: 'niklo://rides',
          discount_text: 'FLAT ₹150 OFF',
          display_order: 2,
        }
      ]);
      console.log('Seeded mock marketing banners successfully.');
    }
  }

  async getActiveTrip() {
    const nextTrip = await this.bookingRepo.findOne({
      where: { 
        user_id: this.MOCK_USER_ID,
        status: BookingStatus.CONFIRMED,
      },
      order: {
        travel_date: 'ASC',
        departure_time: 'ASC',
      }
    });

    if (!nextTrip) {
      return { has_active_trip: false, trip: null };
    }

    // Mock calculation for start_urgency_hours
    const tripDate = new Date(`${nextTrip.travel_date.toISOString().split('T')[0]}T${nextTrip.departure_time}:00Z`);
    const now = new Date();
    const diffTime = Math.abs(tripDate.getTime() - now.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    return {
      has_active_trip: true,
      trip: {
        id: nextTrip.id,
        bookingType: nextTrip.booking_type,
        title: nextTrip.title,
        subtitle: nextTrip.subtitle,
        travelDate: nextTrip.travel_date.toISOString().split('T')[0],
        departureTime: nextTrip.departure_time,
        status: nextTrip.status,
        start_urgency_hours: diffHours,
      }
    };
  }

  async getSmartSuggestions(query: any) {
    // In a real implementation this would use PostGIS ST_Distance.
    // For now, we return a high-quality mock response representing local recommendations.
    return [
      {
        id: 'pkg_goa_01',
        title: 'Goa Beach & Heritage Experience',
        type: 'PACKAGE',
        distance_km: 1.2,
        rating: 4.9,
        price: 14999,
        imagePath: 'https://cdn.niklo.com/packages/goa_hero.jpg'
      },
      {
        id: 'exp_scuba_02',
        title: 'Scuba Diving at Grand Island',
        type: 'ADVENTURE',
        distance_km: 3.5,
        rating: 4.8,
        price: 2500,
        imagePath: 'https://cdn.niklo.com/experiences/scuba.jpg'
      }
    ];
  }

  async getBanners() {
    return this.bannerRepo.find({
      where: { is_active: true },
      order: { display_order: 'ASC' }
    });
  }
}
