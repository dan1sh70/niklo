# Niklo — Hotel Booking Module Production Backend Specification

> **Target Microservice**: `hotel-service` (Port `3008`)
> **Base URL (Live)**: `http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io`
> **Frontend Code**: `lib/features/hotel_booking/` | `data/repositories/hotel_repository.dart`
> **Backend Code**: `niklo-main/hotel-service/src/`

---

## ⚡ Quick Summary — 14 Issues to Fix

| # | Severity | Issue | File | Action |
|---|---|---|---|---|
| **1** | 🔴 P0 | **`bookings.controller.ts` is a stub** — only `POST /hotel` exists. 7 booking endpoints return 404 | `bookings.controller.ts` | Implement all 7 routes |
| **2** | 🔴 P0 | **`bookings.service.ts` is a skeleton** — only `createBooking()` implemented | `bookings.service.ts` | Implement full service |
| **3** | 🔴 P0 | **Booking entity missing critical fields** — no `guests`, `contactPhone`, `paymentMethod`, `paymentId`, `cancellationReason` | `booking.entity.ts` | Add columns + migration |
| **4** | 🔴 P0 | **Hotel card images 404** — seed uses `cdn.niklo.com` URLs that don't exist; app falls back to local assets | `hotels.service.ts` L28–94 | Re-seed with Unsplash URLs |
| **5** | 🟡 P1 | **Location autocomplete is a hardcoded 2-item stub** — ignores query param | `location.service.ts` | Connect to Google Places API |
| **6** | 🟡 P1 | **`searchHotels()` ignores all filters** — Flutter sends category/rating/price/amenity filters, backend only reads `city` | `hotels.service.ts` L200–222 | Add filter SQL |
| **7** | 🟡 P1 | **Room type DTO incomplete** — missing `mealPlan`, `inclusions`, `cancellationPolicy`, `guestCount`, `size`, `oldPrice` | `getHotelDetails()` L289 | Enrich DTO |
| **8** | 🟡 P1 | **Popular Destinations returns 2 cities with broken images** — Flutter expects 4+ with working `imagePath` | `hotels.service.ts` L132 | DB-driven or seeded with Unsplash |
| **9** | 🟡 P1 | **Stay Types labels wrong** — returns Beach/Hill/Business; Flutter expects Hotels/Resorts/Villas/Apartments/Homestays | `hotels.service.ts` L151 | Fix labels |
| **10** | 🟡 P1 | **Active Promotions is hardcoded expired stub** (`expiresAt: 2025-12-31`) | `hotels.service.ts` L181 | Create promotions table |
| **11** | 🟡 P1 | **`checkAvailability()` ignores existing bookings** — always returns available if room count >= requested | `hotels.service.ts` L224 | Add date-range booking conflict query |
| **12** | 🟢 P2 | **`getHotelReviews()` returns raw entity** — Flutter expects `reviewerName`, `date` string, `hasPropertyReply` keys | `hotels.service.ts` L305 | Map entity to DTO |
| **13** | 🟢 P2 | **`POST /hotels/:id/reviews` route missing** — Flutter calls `submitReview()` but gets 404 | `hotels.controller.ts` | Add route + service method |
| **14** | 🟢 P2 | **Review entity missing `reviewer_name`, `title`, `property_reply` columns** | `review.entity.ts` | Add columns |

---

## 🔴 FIX 1 — Complete `bookings.controller.ts`

Flutter calls 7 booking endpoints. Only `POST /hotel` exists.

```typescript
import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';

@Controller('api/v1/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('hotel/quote')
  @HttpCode(HttpStatus.OK)
  quoteHotel(@Req() req: any, @Body() dto: any) {
    return this.bookingsService.quoteBooking(req.user.id, dto);
  }

  @Post('hotel')
  @HttpCode(HttpStatus.OK)
  createHotelBooking(@Req() req: any, @Body() dto: any) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @Get('hotel/my-bookings')
  getMyBookings(@Req() req: any, @Query('limit') limit = '20', @Query('offset') offset = '0') {
    return this.bookingsService.getMyBookings(req.user.id, +limit, +offset);
  }

  @Get('hotel/:bookingId')
  getBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.getBooking(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/confirm-payment')
  @HttpCode(HttpStatus.OK)
  confirmPayment(@Req() req: any, @Param('bookingId') bookingId: string, @Body() dto: any) {
    return this.bookingsService.confirmPayment(req.user.id, bookingId, dto);
  }

  @Post('hotel/:bookingId/pay-at-property')
  @HttpCode(HttpStatus.OK)
  payAtProperty(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.payAtProperty(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(@Req() req: any, @Param('bookingId') bookingId: string, @Body() dto: any) {
    return this.bookingsService.cancelBooking(req.user.id, bookingId, dto.reason);
  }
}
```

---

## 🔴 FIX 2 — Complete `bookings.service.ts`

```typescript
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
      paymentGatewayOrderId: `order_${Math.random().toString(36).substr(2,9)}`,
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
    b.status = 'cancelled'; b.cancellationReason = reason || null;
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
```

---

## 🔴 FIX 3 — `booking.entity.ts` Missing Columns

```typescript
// Add these to booking.entity.ts
@Column({ type: 'text', nullable: true })
guests: string;

@Column({ nullable: true })
contactPhone: string;

@Column({ nullable: true })
contactEmail: string;

@Column({ default: 'online' })
paymentMethod: string;

@Column({ nullable: true })
paymentId: string;

@Column({ nullable: true })
cancellationReason: string;
```

---

## 🔴 FIX 4 — Hotel Seed Data with Working Image URLs

Replace `onApplicationBootstrap` seed in `hotels.service.ts`. Use these **verified Unsplash URLs**:

```typescript
const seedHotels = [
  {
    id: 'htl_kolkata_001', title: 'The Lalit Great Eastern Kolkata',
    city: 'Kolkata', address: '1-2 Old Court House St, Dalhousie, Kolkata',
    latitude: 22.5694, longitude: 88.3522, star_rating: 5, user_rating: 4.6,
    rating_text: 'Excellent', reviews_count: 1234,
    price_per_night: 6500, original_price_per_night: 8000, discount_percent: 18,
    badge_text: 'Bestseller', distance_text: '1.2 km from city center',
    free_breakfast: true, free_wifi: true, free_cancellation: true,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
    gallery_images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop',
    ],
    amenities: [
      { name: 'Free Wi-Fi', icon: 'wifi' }, { name: 'Free Breakfast', icon: 'free_breakfast' },
      { name: 'Swimming Pool', icon: 'pool' }, { name: 'Spa', icon: 'spa' },
      { name: 'Parking', icon: 'local_parking' }, { name: 'Gym', icon: 'fitness_center' },
    ],
    nearby_places: [
      { title: 'Victoria Memorial', distance: '1.8 km' },
      { title: 'Park Street', distance: '2.2 km' },
    ],
    features: [{ title: 'Excellent Location', ratingText: 'Guests rated 4.7/5', description: '1.2 km from city center', icon: 'location_on' }],
    house_rules: ['Check-in: 2:00 PM', 'Check-out: 11:00 AM', 'Govt ID Required'],
    rating_breakdown: { cleanliness: 4.7, location: 4.8, service: 4.6, value: 4.5 },
    description: 'The Lalit Great Eastern Kolkata blends heritage charm with modern luxury...',
    is_active: true,
  },
  {
    id: 'htl_goa_002', title: 'Taj Exotica Resort & Spa, Goa',
    city: 'Goa', address: 'Benaulim Beach, South Goa',
    latitude: 15.2559, longitude: 73.9216, star_rating: 5, user_rating: 4.8,
    rating_text: 'Exceptional', reviews_count: 312,
    price_per_night: 8500, original_price_per_night: 10000, discount_percent: 15,
    badge_text: 'Top Rated', distance_text: '500m from Benaulim Beach',
    free_breakfast: true, free_wifi: true, free_cancellation: false,
    image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop',
    gallery_images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&auto=format&fit=crop',
    ],
    amenities: [{ name: 'Free Wi-Fi', icon: 'wifi' }, { name: 'Pool', icon: 'pool' }],
    nearby_places: [{ title: 'Benaulim Beach', distance: '500m' }],
    features: [], house_rules: ['Check-in: 3:00 PM', 'No pets'],
    rating_breakdown: { cleanliness: 4.9, location: 4.9, service: 4.8, value: 4.5 },
    description: 'Luxury five-star resort on the shores of Goa.',
    is_active: true,
  },
  {
    id: 'htl_manali_003', title: 'The Himalayan Boutique Hotel',
    city: 'Manali', address: 'Old Manali Road, Himachal Pradesh',
    latitude: 32.2396, longitude: 77.1887, star_rating: 4, user_rating: 4.4,
    rating_text: 'Very Good', reviews_count: 567,
    price_per_night: 3200, original_price_per_night: 4000, discount_percent: 20,
    badge_text: 'Mountain View', distance_text: '2 km from Mall Road',
    free_breakfast: true, free_wifi: true, free_cancellation: true,
    image_url: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=600&auto=format&fit=crop',
    gallery_images: [
      'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=600&auto=format&fit=crop',
    ],
    amenities: [{ name: 'Free Wi-Fi', icon: 'wifi' }, { name: 'Mountain View', icon: 'landscape' }],
    nearby_places: [{ title: 'Rohtang Pass', distance: '51 km' }],
    features: [], house_rules: ['Check-in: 12:00 PM'],
    rating_breakdown: { cleanliness: 4.4, location: 4.7, service: 4.3, value: 4.5 },
    description: 'A cozy boutique hotel with stunning mountain views in Manali.',
    is_active: true,
  },
  // Add more: Delhi, Mumbai, Andaman, Kashmir, Jaipur (minimum 8 total)
];
```

---

## 🟡 FIX 5 — Location Autocomplete: Google Places API

```typescript
// location.service.ts
import axios from 'axios';

@Injectable()
export class LocationService {
  async autocomplete(query: string, type: string) {
    if (!query || query.length < 2) return { suggestions: [] };
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return { suggestions: _staticFallback(query) };
    try {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        { params: { input: query, types: '(cities)', components: 'country:in', language: 'en', key: apiKey }, timeout: 4000 },
      );
      return {
        suggestions: (res.data.predictions || []).slice(0, 8).map((p: any) => ({
          placeId:       p.place_id,
          mainText:      p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
        })),
      };
    } catch { return { suggestions: _staticFallback(query) }; }
  }
}

function _staticFallback(q: string) {
  return [
    { placeId: 'ind_delhi',   mainText: 'New Delhi', secondaryText: 'Delhi, India' },
    { placeId: 'ind_mumbai',  mainText: 'Mumbai',    secondaryText: 'Maharashtra, India' },
    { placeId: 'ind_goa',     mainText: 'Goa',       secondaryText: 'Goa, India' },
    { placeId: 'ind_manali',  mainText: 'Manali',    secondaryText: 'Himachal Pradesh, India' },
    { placeId: 'ind_jaipur',  mainText: 'Jaipur',    secondaryText: 'Rajasthan, India' },
    { placeId: 'ind_kolkata', mainText: 'Kolkata',   secondaryText: 'West Bengal, India' },
  ].filter(s => s.mainText.toLowerCase().includes(q.toLowerCase()));
}
```

---

## 🟡 FIX 6 — `searchHotels()` with All Filters

```typescript
async searchHotels(params: any) {
  const { location, city, filters = {}, limit = 20, page = 1 } = params;
  const loc = location || city || '';
  const query = this.hotelRepository.createQueryBuilder('hotel')
    .where('hotel.is_active = true');

  if (loc) {
    query.andWhere('(hotel.city ILIKE :loc OR hotel.title ILIKE :loc OR hotel.address ILIKE :loc)', { loc: `%${loc}%` });
  }

  const category = filters.selectedCategory;
  if (category === 'Budget')    query.andWhere('hotel.price_per_night < :max', { max: 5000 });
  if (category === 'Luxury')    query.andWhere('hotel.price_per_night >= :min', { min: 7000 });
  if (category === 'Mid-Range') query.andWhere('hotel.price_per_night BETWEEN :a AND :b', { a: 3000, b: 7000 });

  const ratingF = filters.ratingFilter;
  if (ratingF === '5 Star')         query.andWhere('hotel.user_rating >= :r', { r: 4.7 });
  if (ratingF === '4 Star & above') query.andWhere('hotel.user_rating >= :r', { r: 4.0 });
  if (ratingF === '3 Star & above') query.andWhere('hotel.user_rating >= :r', { r: 3.0 });

  const amenityF = filters.amenityFilter;
  if (amenityF === 'Free WiFi')           query.andWhere('hotel.free_wifi = true');
  if (amenityF === 'Breakfast Included')  query.andWhere('hotel.free_breakfast = true');
  if (amenityF === 'Free Cancellation')   query.andWhere('hotel.free_cancellation = true');

  const priceF = filters.priceFilter;
  if (priceF === 'Low to High')  query.orderBy('hotel.price_per_night', 'ASC');
  else if (priceF === 'High to Low') query.orderBy('hotel.price_per_night', 'DESC');
  else query.orderBy('hotel.user_rating', 'DESC');

  const [hotels, total] = await query.skip((page-1)*limit).take(Math.min(limit,50)).getManyAndCount();
  return { total, page, limit, hotels: hotels.map(h => this.mapHotelToDto(h)) };
}
```

---

## 🟡 FIX 7 — Popular Destinations (DB-driven + working images)

```typescript
async getPopularDestinations() {
  const imageMap: Record<string, string> = {
    'Goa':     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop',
    'Manali':  'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=500&auto=format&fit=crop',
    'Andaman': 'https://images.unsplash.com/photo-1586359716568-3e1907e4cf9f?w=500&auto=format&fit=crop',
    'Kashmir': 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=500&auto=format&fit=crop',
    'Kolkata': 'https://images.unsplash.com/photo-1558431382-27e303142255?w=500&auto=format&fit=crop',
    'Jaipur':  'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&auto=format&fit=crop',
    'Delhi':   'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&auto=format&fit=crop',
    'Mumbai':  'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=500&auto=format&fit=crop',
  };
  const cities = await this.hotelRepository.createQueryBuilder('hotel')
    .select('DISTINCT hotel.city', 'city').where('hotel.is_active = true')
    .limit(8).getRawMany();
  return {
    destinations: cities.map((c, i) => ({
      id: `dest_${i+1}`, name: c.city, label: 'Explore',
      imagePath: imageMap[c.city] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=500&auto=format&fit=crop',
    })),
  };
}
```

## 🟡 FIX 8 — Stay Types (correct labels + images)

```typescript
async getStayTypes() {
  return {
    stayTypes: [
      { id: 'type_001', label: 'Hotels',     imagePath: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&auto=format&fit=crop' },
      { id: 'type_002', label: 'Resorts',    imagePath: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&auto=format&fit=crop' },
      { id: 'type_003', label: 'Villas',     imagePath: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&auto=format&fit=crop' },
      { id: 'type_004', label: 'Apartments', imagePath: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&auto=format&fit=crop' },
      { id: 'type_005', label: 'Homestays',  imagePath: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=300&auto=format&fit=crop' },
    ],
  };
}
```

---

## 🟡 FIX 9 — Room Type DTO Enrichment

In `getHotelDetails()` room mapper, add missing fields Flutter expects:

```typescript
roomTypes: hotel.roomTypes.map(rt => ({
  id: rt.id, title: rt.title,
  price_per_night: Number(rt.price_per_night),
  priceInt:        Number(rt.price_per_night),
  oldPrice:        Math.round(Number(rt.price_per_night) * 2.0),
  taxes:           `+₹${Math.round(Number(rt.price_per_night) * 0.12)} taxes & service fees`,
  max_guests: rt.max_guests, max_adults: rt.max_adults, max_children: rt.max_children,
  guestCount:  `${rt.max_guests} guests`,
  room_size_sqft: rt.room_size_sqft,
  size:        rt.room_size_sqft ? `${rt.room_size_sqft} sq.ft` : null,
  bed_type: rt.bed_type, amenities: rt.amenities, images: rt.images,
  imageCount: (rt.images || []).length,
  mealPlan:     rt.meal_plan      || 'Room Only',
  mealPlanDesc: rt.meal_plan_desc || 'No meals included',
  inclusions:   rt.inclusions     || [],
  cancellationPolicy: rt.cancellation_policy || {
    type: 'non_refundable', description: 'Non-refundable booking', table: [],
  },
}))
```

---

## 🟡 FIX 10 — `checkAvailability()` Date-Range Conflict Check

```typescript
// Add after fetching roomType:
const existingBookings = await this.bookingRepository
  .createQueryBuilder('b')
  .where('b.hotelId = :hotelId', { hotelId })
  .andWhere('b.roomTypeId = :rtId', { rtId: roomType.id })
  .andWhere('b.status NOT IN (:...statuses)', { statuses: ['cancelled', 'pending_payment'] })
  .andWhere('b.checkInDate < :checkOut', { checkOut: checkParams.check_out })
  .andWhere('b.checkOutDate > :checkIn',  { checkIn:  checkParams.check_in })
  .getCount();

const availableCount = Math.max(0, roomType.available_rooms_count - existingBookings);
const available = availableCount >= (checkParams.rooms_count || 1);
```

---

## 🟢 FIX 11 — `getHotelReviews()` Response Shape

```typescript
const reviews = rawReviews.map(r => ({
  id:               r.id,
  title:            r.title          || '',
  reviewerName:     r.reviewer_name  || 'Guest',
  date:             r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })
                    : '',
  rating:           Number(r.rating),
  comment:          r.comment        || '',
  hasPropertyReply: !!r.property_reply,
  propertyReply:    r.property_reply || null,
}));
```

---

## 🟢 FIX 12 — Add `POST :hotelId/reviews` Route

```typescript
// hotels.controller.ts
@UseGuards(JwtAuthGuard)
@Post(':hotelId/reviews')
submitReview(@Req() req: any, @Param('hotelId') hotelId: string, @Body() body: any) {
  return this.hotelsService.submitReview(hotelId, req.user.id, body);
}

// hotels.service.ts
async submitReview(hotelId: string, userId: string, body: any) {
  const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
  if (!hotel) throw new NotFoundException(`Hotel ${hotelId} not found`);
  const review = this.reviewRepository.create({
    hotel, reviewer_name: body.reviewerName || null,
    title: body.title || '', rating: body.rating, comment: body.comment || '',
  });
  const saved = await this.reviewRepository.save(review);
  // Update aggregate rating
  const { avg } = await this.reviewRepository
    .createQueryBuilder('r').select('AVG(r.rating)', 'avg')
    .where('r.hotel.id = :id', { id: hotelId }).getRawOne();
  hotel.user_rating = parseFloat(Number(avg).toFixed(2));
  hotel.reviews_count += 1;
  await this.hotelRepository.save(hotel);
  return {
    id: saved.id, reviewerName: saved.reviewer_name, title: saved.title,
    rating: Number(saved.rating), comment: saved.comment,
    hasPropertyReply: false, propertyReply: null,
    date: new Date().toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' }),
  };
}
```

---

## 📡 Complete API Endpoint Status Table

| Endpoint | Flutter | Backend | Status | Fix |
|---|---|---|---|---|
| `GET /hotels/popular-destinations` | ✅ | ✅ | ⚠️ Broken images | FIX 7 |
| `GET /hotels/stay-types` | ✅ | ✅ | ⚠️ Wrong labels | FIX 8 |
| `GET /hotels/trending` | ✅ | ✅ | ⚠️ 1 hotel, broken image | FIX 4 |
| `GET /hotels/promotions/active` | ✅ | ✅ | ⚠️ Hardcoded expired | Create promotions table |
| `GET /location/autocomplete` | ✅ | ✅ | 🔴 Static 2-item stub | FIX 5 |
| `POST /hotels/search` | ✅ | ✅ | ⚠️ Ignores all filters | FIX 6 |
| `GET /hotels/:id` | ✅ | ✅ | ⚠️ Room DTO incomplete | FIX 9 |
| `POST /hotels/:id/check-availability` | ✅ | ✅ | ⚠️ No conflict check | FIX 10 |
| `GET /hotels/:id/reviews` | ✅ | ✅ | ⚠️ Shape mismatch | FIX 11 |
| `POST /hotels/:id/reviews` | ✅ | 🔴 Missing | 🔴 404 | FIX 12 |
| `GET /hotels/:id/photos` | ✅ | ✅ | ✅ Works | — |
| `POST /bookings/hotel/quote` | ✅ | 🔴 Missing | 🔴 404 | **FIX 1+2** |
| `POST /bookings/hotel` | ✅ | ✅ | ⚠️ Missing columns | FIX 1+2+3 |
| `GET /bookings/hotel/my-bookings` | ✅ | 🔴 Missing | 🔴 404 | **FIX 1+2** |
| `GET /bookings/hotel/:id` | ✅ | 🔴 Missing | 🔴 404 | **FIX 1+2** |
| `POST /bookings/hotel/:id/confirm-payment` | ✅ | 🔴 Missing | 🔴 404 | **FIX 1+2** |
| `POST /bookings/hotel/:id/pay-at-property` | ✅ | 🔴 Missing | 🔴 404 | **FIX 1+2** |
| `POST /bookings/hotel/:id/cancel` | ✅ | 🔴 Missing | 🔴 404 | **FIX 1+2** |

---

## 🗄️ DB Migration Script

```sql
-- niklo_hotel database

-- bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guests              TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_email       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_method      VARCHAR(50) DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS payment_id          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- room_types table
ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS meal_plan            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS meal_plan_desc       TEXT,
  ADD COLUMN IF NOT EXISTS inclusions           JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cancellation_policy  JSONB;

-- reviews table
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS reviewer_name  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS title          VARCHAR(200),
  ADD COLUMN IF NOT EXISTS property_reply TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id  ON bookings ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings ("hotelId");
CREATE INDEX IF NOT EXISTS idx_hotels_city       ON hotels (city);
CREATE INDEX IF NOT EXISTS idx_hotels_rating     ON hotels (user_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel     ON reviews ("hotelId");
```

---

## 🚀 Deployment Commands

```bash
# Run migrations
docker exec -it niklo-postgres psql -U niklo -d niklo_hotel -c "
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests TEXT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'online';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
  ALTER TABLE room_types ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(100);
  ALTER TABLE room_types ADD COLUMN IF NOT EXISTS meal_plan_desc TEXT;
  ALTER TABLE room_types ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '[]';
  ALTER TABLE room_types ADD COLUMN IF NOT EXISTS cancellation_policy JSONB;
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100);
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title VARCHAR(200);
  ALTER TABLE reviews ADD COLUMN IF NOT EXISTS property_reply TEXT;
"

# Rebuild & deploy
docker build -t ghcr.io/dan1sh70/niklo-hotel-service:latest ./hotel-service
docker push ghcr.io/dan1sh70/niklo-hotel-service:latest
docker-compose up -d --no-deps --force-recreate hotel-service

# Verify
curl http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/hotels/trending?limit=5
# Expected: 3+ hotels with imagePath = Unsplash URLs (not cdn.niklo.com)
```

---

## ✅ Production Readiness Checklist

| Item | Owner | Status |
|---|---|---|
| Full `bookings.controller.ts` — 7 routes | Backend | ⬜ TODO |
| Full `bookings.service.ts` — quote/confirm/cancel/my-bookings | Backend | ⬜ TODO |
| `booking.entity.ts` — guests/contactPhone/paymentMethod/paymentId/cancellationReason | Backend | ⬜ TODO |
| DB migration: bookings + room_types + reviews columns | Backend | ⬜ TODO |
| Hotel seed: 8+ hotels with Unsplash image URLs | Backend | ⬜ TODO |
| Location autocomplete: Google Places API | Backend | ⬜ TODO |
| `searchHotels()` — category/rating/price/amenity filters | Backend | ⬜ TODO |
| Room type DTO — mealPlan/inclusions/cancellationPolicy | Backend | ⬜ TODO |
| Popular Destinations — DB-driven with working images | Backend | ⬜ TODO |
| Stay Types — Hotels/Resorts/Villas/Apartments/Homestays labels | Backend | ⬜ TODO |
| Reviews response shape — reviewerName/date/hasPropertyReply | Backend | ⬜ TODO |
| `POST /hotels/:id/reviews` route added | Backend | ⬜ TODO |
| `checkAvailability()` — date-range conflict query | Backend | ⬜ TODO |
| Docker image rebuilt and pushed | Backend | ⬜ TODO |
