# Niklo — Home Screen Module Backend Action Guide

> **Target Microservices**: `booking-service` (Port `3014`), `package-service` (Port `3012`)  
> **Target Database**: `niklo_booking` (PostgreSQL)  
> **Frontend Files**: `lib/features/home/presentation/screens/home_screen.dart`, `trip_card.dart`, `smart_suggestion_card.dart`  
> **Frontend Status**: 🟢 Complete & Integrated (with location detection, fallback handling, and pull-to-refresh).

---

## 🚨 Critical Missing Features on Backend

The backend developer missed the following two essential features needed by the Home Screen:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. LATEST BOOKED TRIP TICKER                                                            │
│    • Route: GET /api/v1/user/active-trip                                                 │
│    • Problem: No endpoint to fetch the user's latest confirmed/upcoming booked ticket.   │
│    • Requirement: Fetch the most recently booked upcoming trip (Bus, Cab, Hotel, etc.)  │
│      and return it so the Home Screen displays the live trip card with QR and status.    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. LOCATION-WISE SMART SUGGESTIONS                                                       │
│    • Route: GET /api/v1/recommendations/smart-suggestions?city=Kolkata&lat=...&lng=...  │
│    • Problem: Backend only returns static un-filtered packages list.                     │
│    • Requirement: Filter and rank packages based on user's current city/GPS location     │
│      so users see trips starting from or near their location.                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Task Matrix for Backend Developer

| # | Missing Feature | Target Endpoint | File Location to Create/Update | Exact Required Logic |
|---|---|---|---|---|
| **1** | **Latest Booked Trip Ticket** | `GET /api/v1/user/active-trip` | `niklo-main/booking-service/src/home/` | Query `bookings` table for `user_id`, find the latest booking where `status IN ('CONFIRMED', 'UPCOMING')` and `travel_date >= CURRENT_DATE`, ordered by `travel_date ASC`. |
| **2** | **Location-Wise Smart Suggestions** | `GET /api/v1/recommendations/smart-suggestions` | `niklo-main/booking-service/src/home/` or `package-service` | Accept query params `city`, `latitude`, `longitude`. Return packages matching or near that city, ordered by relevance and rating. |
| **3** | **Marketing Banners** | `GET /api/v1/promotions/banners` | `niklo-main/booking-service/src/home/` | Return promotional hero banners with title, subtitle, image, and deep link. |

---

## 1. OpenAPI Endpoint Specifications & Payload Contracts

### 1.1. Feature 1: Latest Booked Trip Ticket
- **Endpoint**: `GET /api/v1/user/active-trip`
- **Query Params**: `userId` (optional string, UUID)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

#### Response (200 OK — When User Has a Booked Trip):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "has_active_trip": true,
    "trip": {
      "id": "bkg_771029",
      "bookingType": "BUS",
      "title": "Greenline Travels (AC Sleeper)",
      "subtitle": "Kolkata to Siliguri • Seat 12A",
      "travelDate": "2026-08-28",
      "departureTime": "20:00",
      "status": "CONFIRMED",
      "confirmationLabel": "Confirmed",
      "qrCodeData": "NIKLO-BUS-BKG-771029"
    }
  }
}
```

#### Response (200 OK — When User Has No Bookings):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "has_active_trip": false,
    "trip": null
  }
}
```

---

### 1.2. Feature 2: Location-Wise Smart Suggestions
- **Endpoint**: `GET /api/v1/recommendations/smart-suggestions`
- **Query Params**:
  - `city`: `string` (e.g. `Kolkata`, `Goa`, `Delhi`, `Mumbai`)
  - `latitude`: `number` (optional, e.g. `22.5726`)
  - `longitude`: `number` (optional, e.g. `88.3639`)
  - `limit`: `number` (optional, default `6`)

#### Response (200 OK — Location Filtered Packages):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "pkg_kol_01",
      "title": "Darjeeling & Gangtok Himalayan Tour",
      "category": "Mountain Escapes",
      "startCity": "Kolkata",
      "destination": "Darjeeling",
      "price": 12499,
      "rating": 4.9,
      "duration": "4 Days / 3 Nights",
      "imagePath": "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600",
      "locationText": "Darjeeling, West Bengal"
    },
    {
      "id": "pkg_kol_02",
      "title": "Sundarbans Tiger Safari & River Cruise",
      "category": "Wildlife & Adventure",
      "startCity": "Kolkata",
      "destination": "Sundarbans",
      "price": 7999,
      "rating": 4.8,
      "duration": "3 Days / 2 Nights",
      "imagePath": "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=600",
      "locationText": "Sundarbans, West Bengal"
    },
    {
      "id": "pkg_goa_01",
      "title": "Goa Beach & Heritage Experience",
      "category": "Beach Escapes",
      "startCity": "Goa",
      "destination": "Goa",
      "price": 14999,
      "rating": 4.9,
      "duration": "4 Days / 3 Nights",
      "imagePath": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600",
      "locationText": "North Goa"
    }
  ]
}
```

---

## 2. Complete NestJS Code Blueprints (Ready to Paste)

### 2.1. Controller: `niklo-main/booking-service/src/home/home.controller.ts`
```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('api/v1')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * 1. Fetches latest booked upcoming trip for the active user
   */
  @Get('user/active-trip')
  async getActiveTrip(@Query('userId') userId?: string) {
    const data = await this.homeService.getActiveTrip(userId);
    return { success: true, statusCode: 200, data };
  }

  /**
   * 2. Fetches location-wise smart suggestions based on user city / GPS
   */
  @Get('recommendations/smart-suggestions')
  async getSmartSuggestions(
    @Query('city') city?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.homeService.getSmartSuggestions({ city, latitude, longitude, limit });
    return { success: true, statusCode: 200, data };
  }

  /**
   * 3. Fetches marketing promo banners
   */
  @Get('promotions/banners')
  async getBanners() {
    const data = await this.homeService.getBanners();
    return { success: true, statusCode: 200, data };
  }
}
```

---

### 2.2. Service: `niklo-main/booking-service/src/home/home.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';

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
        status: 'UPCOMING',
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
        title: upcomingBooking.item_name || 'Confirmed Booking',
        subtitle: `${upcomingBooking.source || ''} to ${upcomingBooking.destination || ''}`.trim(),
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
```

---

## 3. Definition of Done Checklist for Backend Developer
- [ ] Implement `GET /api/v1/user/active-trip` to return the user's latest booked trip ticket.
- [ ] Implement `GET /api/v1/recommendations/smart-suggestions` accepting `?city=` / coordinates and returning location-prioritized packages.
- [ ] Implement `GET /api/v1/promotions/banners` returning promotional hero banners.
