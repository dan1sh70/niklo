import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  /**
   * Fetches the latest booked trip ticket
   */
  async getActiveTrip(userId?: string) {
    const targetUserId = userId || this.MOCK_USER_ID;
    const today = new Date().toISOString().split('T')[0];

    // Find the closest upcoming confirmed/upcoming booking
    const upcomingBooking = await this.bookingRepo.findOne({
      where: {
        user_id: targetUserId,
        status: BookingStatus.CONFIRMED,
        travel_date: MoreThanOrEqual(today as any),
      },
      order: {
        travel_date: 'ASC',
      },
    });

    if (!upcomingBooking) {
      return { has_active_trip: false, trip: null };
    }

    return {
      has_active_trip: true,
      trip: {
        id: upcomingBooking.id,
        bookingType: upcomingBooking.booking_type || 'BUS',
        title: upcomingBooking.title || 'Confirmed Booking',
        subtitle: upcomingBooking.subtitle || `${upcomingBooking.from_location || ''} to ${upcomingBooking.to_location || ''}`.trim(),
        travelDate: upcomingBooking.travel_date,
        departureTime: upcomingBooking.departure_time || '20:00',
        status: upcomingBooking.status,
        confirmationLabel: 'Confirmed',
        qrCodeData: `NIKLO-${upcomingBooking.booking_type || 'BKG'}-${upcomingBooking.id}`,
      },
    };
  }

  /**
   * Fetches location-wise smart package suggestions
   */
  async getSmartSuggestions(query: { city?: string; latitude?: number; longitude?: number; limit?: number }) {
    const limit = query.limit || 6;
    const userCity = (query.city || '').toLowerCase().trim();

    const allPackages = [
      {
        id: 'pkg_kol_01',
        title: 'Darjeeling & Gangtok Himalayan Tour',
        category: 'Mountain Escapes',
        startCity: 'Kolkata',
        destination: 'Darjeeling',
        price: 12499,
        rating: 4.9,
        duration: '4 Days / 3 Nights',
        imagePath: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600',
        locationText: 'Darjeeling, West Bengal',
      },
      {
        id: 'pkg_kol_02',
        title: 'Sundarbans Tiger Safari & Cruise',
        category: 'Wildlife & Adventure',
        startCity: 'Kolkata',
        destination: 'Sundarbans',
        price: 7999,
        rating: 4.8,
        duration: '3 Days / 2 Nights',
        imagePath: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=600',
        locationText: 'Sundarbans, West Bengal',
      },
      {
        id: 'pkg_goa_01',
        title: 'Goa Beach & Heritage Experience',
        category: 'Beach Escapes',
        startCity: 'Goa',
        destination: 'Goa',
        price: 14999,
        rating: 4.9,
        duration: '4 Days / 3 Nights',
        imagePath: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
        locationText: 'North Goa',
      },
      {
        id: 'pkg_manali_02',
        title: 'Manali Snow & Solang Adventure',
        category: 'Mountain Escapes',
        startCity: 'Delhi',
        destination: 'Manali',
        price: 18499,
        rating: 4.8,
        duration: '5 Days / 4 Nights',
        imagePath: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600',
        locationText: 'Manali, Himachal Pradesh',
      },
      {
        id: 'pkg_kashmir_03',
        title: 'Kashmir Paradise Valley Tour',
        category: 'Mountain Escapes',
        startCity: 'Delhi',
        destination: 'Srinagar',
        price: 24999,
        rating: 4.9,
        duration: '6 Days / 5 Nights',
        imagePath: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600',
        locationText: 'Srinagar, Kashmir',
      },
    ];

    if (!userCity) {
      return allPackages.slice(0, limit);
    }

    // Sort matching user city to top
    const nearby = allPackages.filter(
      p =>
        p.startCity.toLowerCase().includes(userCity) ||
        p.destination.toLowerCase().includes(userCity) ||
        p.locationText.toLowerCase().includes(userCity),
    );
    const others = allPackages.filter(p => !nearby.includes(p));

    return [...nearby, ...others].slice(0, limit);
  }

  /**
   * Fetches promotional hero marketing banners
   */
  async getBanners() {
    return [
      {
        id: 'ban_01',
        title: 'Plan your journey, we\'ll take care of the rest.',
        subtitle: 'Explore top destinations with AI itinerary planning.',
        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000',
        deepLink: '/ai-journey-planner',
        discountText: 'FLAT 20% OFF',
        displayOrder: 1,
      },
      {
        id: 'ban_02',
        title: 'Monsoon Getaways in the Hills',
        subtitle: 'Special discounts on Darjeeling & Manali packages.',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000',
        deepLink: '/packages',
        discountText: 'SAVE ₹2,000',
        displayOrder: 2,
      },
    ];
  }
}
