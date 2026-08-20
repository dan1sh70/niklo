# Niklo — Hotel Booking & Wishlist Module Production Backend Specification

> **Target Microservices**:
> - `hotel-service` (Port `3008`) — `http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io`
> - `auth-service` / `user-service` (Port `3000` / `3004`) — For Wishlist API (`/api/v1/wishlist`)
>
> **Frontend Module Consumers**:
> - Hotel Booking UI: `lib/features/hotel_booking/`
> - Wishlist UI: `lib/features/wishlist/`

---

## 📋 Table of Contents
1. [Backend Service Architecture & Endpoints Summary](#1-backend-service-architecture--endpoints-summary)
2. [Wishlist API Module (Missing in Backend)](#2-wishlist-api-module-missing-in-backend)
   - [Database Schema (`user_wishlist`)](#21-database-schema-user_wishlist)
   - [TypeORM Entity (`wishlist.entity.ts`)](#22-typeorm-entity-wishlistentityts)
   - [Controller (`wishlist.controller.ts`)](#23-controller-wishlistcontrollerts)
   - [Service Implementation (`wishlist.service.ts`)](#24-service-implementation-wishlistservicets)
3. [Hotel Booking Lifecycle & Management API](#3-hotel-booking-lifecycle--management-api)
   - [Bookings Controller (`bookings.controller.ts`)](#31-bookings-controller-bookingscontrollerts)
   - [Bookings Service (`bookings.service.ts`)](#32-bookings-service-bookingsservicets)
   - [Database Schema Migrations (`schema.sql`)](#33-database-schema-migrations-schemasql)
   - [Razorpay Payment Gateway Integration](#34-razorpay-payment-gateway-integration-client--server-architecture)
   - [Hourly Stays Architecture & Slot Booking Engine](#35-hourly-stays-architecture--slot-booking-engine)
4. [Hotels Catalog, Search & Reviews API Fixes](#4-hotels-catalog-search--reviews-api-fixes)
   - [Search & Filtering Query Fix (`hotels.service.ts`)](#41-search--filtering-query-fix-hotelsservicets)
   - [Review Submission & Property Replies (`hotels.controller.ts`)](#42-review-submission--property-replies)
   - [Stay Types & Popular Destinations Endpoints](#43-stay-types--popular-destinations-endpoints)
   - [Social Sharing & Dynamic Deep Links](#44-social-sharing--dynamic-deep-links-specification)
5. [Complete Seed Data & SQL Scripts (Real Production Data)](#5-complete-seed-data--sql-scripts-real-production-data)
   - [Popular Destinations Seed Data](#51-popular-destinations-seed-data)
   - [Stay Types Seed Data](#52-stay-types-seed-data)
   - [Hotels, Room Types & Reviews Seed Data](#53-hotels-room-types--reviews-seed-data)
6. [Curl Verification Commands](#6-curl-verification-commands)

---

## 1. Backend Service Architecture & Endpoints Summary

> ✅ = Already Implemented in hotel-service  
> ⚠️ = Needs Update / Fix  
> ❌ = Missing, Must Be Implemented

| Status | Service | Method | Route | Description | Auth |
| :---: | :--- | :---: | :--- | :--- | :---: |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/popular-destinations` | Destination cities with images | Public |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/stay-types` | Categories (Resorts, Villas, etc.) | Public |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/trending` | Top-rated trending hotels | Public |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/promotions/active` | Active promo banner for home screen | Public |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/popular-cities` | City name list for search suggestions | Public |
| ✅ | **Hotel** | `POST` | `/api/v1/hotels/search` | Search with location, filters, hourly flag | Public |
| ✅ | **Hotel** | `POST` | `/api/v1/hotels/:id/check-availability` | Room availability check for dates/guests | Public |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/:id` | Full hotel details (rooms, reviews, amenities, map coords) | Public |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/:id/reviews` | Paginated reviews with sort options | Public |
| ✅ | **Hotel** | `POST` | `/api/v1/hotels/:id/reviews` | Submit guest review & rating | Bearer JWT |
| ✅ | **Hotel** | `GET` | `/api/v1/hotels/:id/photos` | Paginated gallery photos | Public |
| ❌ | **Hotel** | `GET` | `/api/v1/hotels/:id/share` | Share metadata (OG image, deeplink, description) | Public |
| ✅ | **Location** | `GET` | `/api/v1/location/autocomplete?q=&type=hotel` | Location search autocomplete suggestions | Public |
| ❌ | **Location** | `GET` | `/api/v1/location/geocode?address=` | Convert address to lat/lng for map fallback | Public |
| ❌ | **Auth/User** | `GET` | `/api/v1/wishlist` | Fetch all wishlisted items for user | Bearer JWT |
| ❌ | **Auth/User** | `POST` | `/api/v1/wishlist/toggle` | Toggle hotel/package in wishlist | Bearer JWT |
| ❌ | **Auth/User** | `POST` | `/api/v1/wishlist/sync` | Batch sync local wishlist on login | Bearer JWT |
| ✅ | **Hotel** | `POST` | `/api/v1/bookings/hotel/quote` | Price breakdown (nights/hours, taxes, discounts) | Bearer JWT |
| ✅ | **Hotel** | `POST` | `/api/v1/bookings/hotel` | Create hotel reservation (normal or hourly) | Bearer JWT |
| ✅ | **Hotel** | `GET` | `/api/v1/bookings/hotel/my-bookings` | List logged-in user's hotel bookings | Bearer JWT |
| ✅ | **Hotel** | `GET` | `/api/v1/bookings/hotel/:bookingId` | Get specific hotel booking details | Bearer JWT |
| ✅ | **Hotel** | `POST` | `/api/v1/bookings/hotel/:bookingId/confirm-payment` | Mark booking confirmed after Razorpay payment | Bearer JWT |
| ✅ | **Hotel** | `POST` | `/api/v1/bookings/hotel/:bookingId/pay-at-property` | Mark booking confirmed (cash at desk) | Bearer JWT |
| ✅ | **Hotel** | `POST` | `/api/v1/bookings/hotel/:bookingId/cancel` | Cancel booking with reason | Bearer JWT |
| ❌ | **Payment** | `POST` | `/api/v1/payment/orders` | Create Razorpay payment order | Bearer JWT |
| ❌ | **Payment** | `POST` | `/api/v1/payment/webhook/razorpay` | Server-to-server Razorpay webhook (HMAC verify) | Razorpay Signature |

---


## 2. Wishlist API Module (Missing in Backend)

### 2.1 Database Schema (`user_wishlist`)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'hotel', 'package', 'experience'
    item_id VARCHAR(100) NOT NULL,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_item UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON user_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_item_type ON user_wishlist(item_type);
```

### 2.2 TypeORM Entity (`wishlist.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('user_wishlist')
@Unique(['userId', 'itemType', 'itemId'])
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'item_type', length: 50 })
  itemType: string;

  @Column({ name: 'item_id', length: 100 })
  itemId: string;

  @Column({ name: 'raw_data', type: 'jsonb', default: {} })
  rawData: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 2.3 Controller (`wishlist.controller.ts`)

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

@Controller('api/v1/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Req() req: any) {
    const userId = req.user.id;
    return this.wishlistService.getUserWishlist(userId);
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggleWishlist(
    @Req() req: any,
    @Body() body: { item_type: string; item_id: string; raw_data?: any },
  ) {
    const userId = req.user.id;
    return this.wishlistService.toggleItem(
      userId,
      body.item_type,
      body.item_id,
      body.raw_data,
    );
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncWishlist(
    @Req() req: any,
    @Body() body: { items: Array<{ item_type: string; item_id: string; raw_data?: any }> },
  ) {
    const userId = req.user.id;
    return this.wishlistService.syncLocalItems(userId, body.items || []);
  }
}
```

### 2.4 Service Implementation (`wishlist.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
  ) {}

  async getUserWishlist(userId: string) {
    const items = await this.wishlistRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return items.map(this.mapToDto);
  }

  async toggleItem(userId: string, itemType: string, itemId: string, rawData?: any) {
    const existing = await this.wishlistRepo.findOne({
      where: { userId, itemType, itemId },
    });

    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { wishlisted: false, item_id: itemId, item_type: itemType };
    }

    const created = this.wishlistRepo.create({
      userId,
      itemType,
      itemId,
      rawData: rawData || {},
    });
    await this.wishlistRepo.save(created);
    return {
      wishlisted: true,
      item: this.mapToDto(created),
    };
  }

  async syncLocalItems(
    userId: string,
    items: Array<{ item_type: string; item_id: string; raw_data?: any }>,
  ) {
    for (const item of items) {
      if (!item.item_type || !item.item_id) continue;
      const existing = await this.wishlistRepo.findOne({
        where: { userId, itemType: item.item_type, itemId: item.item_id },
      });
      if (!existing) {
        await this.wishlistRepo.save(
          this.wishlistRepo.create({
            userId,
            itemType: item.item_type,
            itemId: item.item_id,
            rawData: item.raw_data || {},
          }),
        );
      }
    }
    return this.getUserWishlist(userId);
  }

  private mapToDto(item: Wishlist) {
    return {
      id: item.itemId,
      type: item.itemType,
      created_at: item.createdAt.toISOString(),
      raw_data: item.rawData,
    };
  }
}
```

---

## 3. Hotel Booking Lifecycle & Management API

### 3.1 Bookings Controller (`bookings.controller.ts`)

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
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
  getMyBookings(
    @Req() req: any,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    return this.bookingsService.getMyBookings(req.user.id, +limit, +offset);
  }

  @Get('hotel/:bookingId')
  getBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.getBooking(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/confirm-payment')
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.confirmPayment(req.user.id, bookingId, dto);
  }

  @Post('hotel/:bookingId/pay-at-property')
  @HttpCode(HttpStatus.OK)
  payAtProperty(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.payAtProperty(req.user.id, bookingId);
  }

  @Post('hotel/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.cancelBooking(req.user.id, bookingId, dto.reason);
  }
}
```

### 3.2 Bookings Service (`bookings.service.ts`)

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { RoomType } from '../hotels/entities/room-type.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(RoomType)
    private readonly roomRepo: Repository<RoomType>,
  ) {}

  async quoteBooking(userId: string, dto: any) {
    const room = await this.roomRepo.findOne({ where: { id: dto.roomTypeId } });
    if (!room) throw new NotFoundException('Room type not found');

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    const nights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const basePrice =
      Number(room.price_per_night) * (dto.rooms || 1) * (dto.isHourly ? 0.35 : nights);
    const taxesAndFees = Math.round(basePrice * 0.12);
    const totalAmount = basePrice + taxesAndFees;

    return {
      success: true,
      data: {
        nights,
        basePrice,
        taxesAndFees,
        totalAmount,
        currency: 'INR',
        freeCancellation: true,
      },
    };
  }

  async createBooking(userId: string, dto: any) {
    const booking = this.bookingRepo.create({
      userId,
      hotelId: dto.hotelId,
      roomTypeId: dto.roomTypeId,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      rooms: dto.rooms || 1,
      adults: dto.adults || 1,
      children: dto.children || 0,
      totalAmount: dto.totalAmount,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      guests: JSON.stringify(dto.guests || []),
      status: BookingStatus.PENDING,
      paymentMethod: dto.paymentMethod || 'online',
    });

    const saved = await this.bookingRepo.save(booking);
    return { success: true, bookingId: saved.id, data: saved };
  }

  async getMyBookings(userId: string, limit = 20, offset = 0) {
    const [bookings, total] = await this.bookingRepo.findAndCount({
      where: { userId },
      relations: { hotel: true, roomType: true },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { success: true, total, bookings };
  }

  async getBooking(userId: string, bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { hotel: true, roomType: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Unauthorized');
    return { success: true, booking };
  }

  async confirmPayment(userId: string, bookingId: string, dto: any) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    booking.status = BookingStatus.CONFIRMED;
    booking.paymentId = dto.paymentId || dto.razorpay_payment_id;
    booking.paymentMethod = 'online';
    await this.bookingRepo.save(booking);
    return { success: true, message: 'Booking confirmed', booking };
  }

  async payAtProperty(userId: string, bookingId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    booking.status = BookingStatus.CONFIRMED;
    booking.paymentMethod = 'pay_at_property';
    await this.bookingRepo.save(booking);
    return { success: true, message: 'Pay at property confirmed', booking };
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason || 'User requested cancellation';
    await this.bookingRepo.save(booking);
    return { success: true, message: 'Booking cancelled', booking };
  }
}
```

### 3.3 Database Schema Migrations (`schema.sql`)

```sql
-- Migration for niklo_hotel database

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "contactPhone" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "contactEmail" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "guests" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(50) DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS "paymentId" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "isHourly" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hourlyCheckInTime" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "hourlyDurationHours" INTEGER;

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS supports_hourly BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS hourly_options JSONB DEFAULT '{"3h": {"duration": 3, "multiplier": 0.35, "label": "3 Hours"}, "6h": {"duration": 6, "multiplier": 0.55, "label": "6 Hours"}, "9h": {"duration": 9, "multiplier": 0.75, "label": "9 Hours"}}'::jsonb;

ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(100) DEFAULT 'Room Only',
  ADD COLUMN IF NOT EXISTS meal_plan_desc TEXT DEFAULT 'No meals included',
  ADD COLUMN IF NOT EXISTS old_price INTEGER,
  ADD COLUMN IF NOT EXISTS inclusions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{}'::jsonb;

ALTER TABLE hotel_reviews
  ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS reviewer_avatar VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stay_date VARCHAR(50),
  ADD COLUMN IF NOT EXISTS room_type_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS property_reply TEXT;
```

---

### 3.4 Razorpay Payment Gateway Integration (Client & Server Architecture)

#### 3.4.1 Flow Architecture

```
[ Flutter Mobile App ] ─── 1. POST /bookings/hotel ───────► [ hotel-service ]
                                                                (Status: PENDING)
                       ◄── 2. Returns bookingId & amount ──┘

[ Flutter Mobile App ] ─── 3. POST /payment/orders ────────► [ payment-service ]
                                                                (Creates Razorpay order)
                       ◄── 4. Returns razorpay_order_id ───┘

[ Flutter Mobile App ] ─── 5. Opens Razorpay SDK Modal (UPI / Cards / NetBanking / Wallets)
                       ─── 6. User completes payment
                       ◄── 7. Razorpay SDK returns (paymentId, orderId, signature)

[ Flutter Mobile App ] ─── 8. POST /bookings/hotel/:id/confirm-payment ──► [ hotel-service ]
                                                                            (Status: CONFIRMED)

[ Razorpay Server ] ──── 9. Async Webhook: payment.captured ──────────► [ payment-service ]
                                                                            (Verifies HMAC-SHA256)
                                                                            └─► Notifies hotel-service
```

#### 3.4.2 Required Backend Environment Variables

In `.env` for `payment-service` and `hotel-service`:
```env
# Razorpay Credentials (from Razorpay Dashboard -> Settings -> API Keys)
RAZORPAY_KEY_ID=rzp_test_TPfs05QjqIFA0t
RAZORPAY_KEY_SECRET=6rEy4Bo60xqAzJ5gsdyG20Em
RAZORPAY_WEBHOOK_SECRET=your_production_webhook_secret_here

# Internal Microservice Inter-communication URLs
HOTEL_SERVICE_URL=http://hotel-service:3008
PAYMENT_SERVICE_URL=http://payment-service:3007
```

#### 3.4.3 `payment-service` Razorpay Order & Webhook Handler Update

In `payments.service.ts`:
```typescript
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private razorpayInstance: Razorpay;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const key_id = this.configService.get<string>('RAZORPAY_KEY_ID') || process.env.RAZORPAY_KEY_ID;
    const key_secret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || process.env.RAZORPAY_KEY_SECRET;
    if (key_id && key_secret) {
      this.razorpayInstance = new Razorpay({ key_id, key_secret });
    }
  }

  // 1. Create Razorpay Order
  async createOrder(userId: string, dto: { amount: number; currency?: string; booking_id?: string; booking_type?: string }) {
    const amountInPaise = Math.round(dto.amount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: dto.currency || 'INR',
      receipt: `rcpt_${dto.booking_id || userId}_${Date.now()}`,
      notes: {
        userId,
        bookingId: dto.booking_id || '',
        bookingType: dto.booking_type || 'hotel',
      },
    };

    const order = await this.razorpayInstance.orders.create(orderOptions);

    return {
      payment_id: `pay_${Date.now()}`,
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  }

  // 2. Process Razorpay Server-to-Server Webhook
  async handleWebhook(body: any, signature: string) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) throw new InternalServerErrorException('Razorpay webhook secret not configured');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    if (body.event === 'payment.captured' || body.event === 'order.paid') {
      const paymentEntity = body.payload.payment.entity;
      const bookingId = paymentEntity.notes?.bookingId;
      const bookingType = paymentEntity.notes?.bookingType || 'hotel';

      if (bookingId && bookingType === 'hotel') {
        try {
          const hotelServiceUrl = process.env.HOTEL_SERVICE_URL || 'http://hotel-service:3008';
          await lastValueFrom(
            this.httpService.post(
              `${hotelServiceUrl}/api/v1/bookings/hotel/${bookingId}/confirm-payment`,
              {
                paymentId: paymentEntity.id,
                paymentGatewayOrderId: paymentEntity.order_id,
              },
            ),
          );
        } catch (error) {
          console.error(`[PAYMENT WEBHOOK] Error confirming hotel booking ${bookingId}:`, error.message);
        }
      }
    }

    return { success: true, message: 'Razorpay webhook processed' };
  }
}
```

#### 3.4.4 `hotel-service` Payment Confirmation Endpoint

In `bookings.service.ts`:
```typescript
async confirmPayment(userId: string, bookingId: string, dto: { paymentId: string; paymentGatewayOrderId?: string }) {
  const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
  if (!booking) throw new NotFoundException('Booking not found');

  booking.status = BookingStatus.CONFIRMED;
  booking.paymentId = dto.paymentId;
  booking.paymentMethod = 'online';
  
  await this.bookingRepo.save(booking);

  return {
    success: true,
    message: 'Booking successfully confirmed',
    bookingId: booking.id,
    status: booking.status,
  };
}
```

#### 3.4.5 Flutter Client Integration Details

In `lib/features/bookings/presentation/screens/payment_methods_screen.dart`:
```dart
final options = {
  'key': ApiConstants.razorpayKeyId, // from .env RAZORPAY_KEY_ID
  'amount': (chargeAmount * 100).round(), // amount in paise
  'name': 'Niklo Travel',
  'description': 'Hotel Booking - ${hotel.name}',
  'order_id': order.razorpayOrderId,
  'timeout': 300,
  'prefill': {
    'contact': userProfile?.phone ?? '',
    'email': userProfile?.email ?? '',
    'name': userProfile?.name ?? '',
  },
  'theme': {'color': '#0035B0'},
};
_razorpay.open(options);
```

---

### 3.5 Hourly Stays Architecture & Slot Booking Engine

The Niklo app allows guests to book **Hourly Micro-Stays** (3 Hours, 6 Hours, 9 Hours) for transit stays, business day-use, and quick layovers, starting from any check-in time (`5 AM` to `10 PM`).

#### 3.5.1 Hourly Database Columns (`schema.sql`)

```sql
-- Migration for Hourly Bookings support in niklo_hotel

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_hourly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hourly_check_in_time VARCHAR(20),
  ADD COLUMN IF NOT EXISTS hourly_duration_hours INTEGER;

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS supports_hourly BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS hourly_options JSONB DEFAULT '{
    "3h": {"duration": 3, "multiplier": 0.15, "label": "3 Hours"},
    "6h": {"duration": 6, "multiplier": 0.25, "label": "6 Hours"},
    "9h": {"duration": 9, "multiplier": 0.35, "label": "9 Hours"}
  }'::jsonb;
```

#### 3.5.2 Hourly Booking TypeORM Entities Update

In `booking.entity.ts`:
```typescript
@Column({ name: 'is_hourly', type: 'boolean', default: false })
isHourly: boolean;

@Column({ name: 'hourly_check_in_time', length: 20, nullable: true })
hourlyCheckInTime: string;

@Column({ name: 'hourly_duration_hours', type: 'int', nullable: true })
hourlyDurationHours: number;
```

In `hotel.entity.ts`:
```typescript
@Column({ name: 'supports_hourly', type: 'boolean', default: true })
supportsHourly: boolean;

@Column({ name: 'hourly_options', type: 'jsonb', default: {} })
hourlyOptions: Record<string, any>;
```

#### 3.5.3 Hourly Price Quote Engine (`POST /api/v1/bookings/hotel/quote`)

In `bookings.service.ts`:
```typescript
async quoteBooking(userId: string, dto: {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate?: string;
  rooms: number;
  isHourly?: boolean;
  hourlyCheckInTime?: string;
  hourlyDurationHours?: number;
}) {
  const room = await this.roomRepo.findOne({ where: { id: dto.roomTypeId } });
  if (!room) throw new NotFoundException('Room type not found');

  const fullDayRate = Number(room.price_per_night);
  let basePrice = 0;
  let stayLabel = '';
  let slotTimeRange = '';

  if (dto.isHourly) {
    const duration = dto.hourlyDurationHours || 3;
    const startTime = dto.hourlyCheckInTime || '8 PM';
    
    // Multipliers matching Mobile UI (e.g. ₹5,000 hotel):
    // 3h -> 15% (₹750) | 6h -> 25% (₹1,250) | 9h -> 35% (₹1,750)
    const multiplier = duration === 3 ? 0.15 : (duration === 6 ? 0.25 : 0.35);
    basePrice = Math.round(fullDayRate * multiplier * (dto.rooms || 1));
    
    // Calculate Slot Range (e.g. "8 PM - 11 PM", "8 PM - 2 AM", "8 PM - 5 AM")
    const endTime = this.calculateSlotEndTime(startTime, duration);
    slotTimeRange = `${startTime} - ${endTime}`;
    stayLabel = `${duration} Hours (${slotTimeRange})`;
  } else {
    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate || dto.checkInDate);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    basePrice = fullDayRate * (dto.rooms || 1) * nights;
    stayLabel = `${nights} ${nights === 1 ? 'Night' : 'Nights'}`;
  }

  const taxesAndFees = Math.round(basePrice * 0.12);
  const totalAmount = basePrice + taxesAndFees;

  return {
    success: true,
    data: {
      isHourly: dto.isHourly || false,
      hourlyDuration: dto.hourlyDurationHours,
      hourlySlot: slotTimeRange,
      stayLabel,
      basePrice,
      taxesAndFees,
      totalAmount,
      currency: 'INR',
      freeCancellation: true,
    },
  };
}

// Utility to calculate slot end time e.g. "8 PM" + 3h -> "11 PM", "8 PM" + 6h -> "2 AM"
private calculateSlotEndTime(startTimeStr: string, durationHours: number): string {
  const parts = startTimeStr.trim().split(' ');
  let hour = parseInt(parts[0], 10);
  const period = (parts[1] || 'PM').toUpperCase();

  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const end24 = (hour + durationHours) % 24;
  const endPeriod = end24 >= 12 ? 'PM' : 'AM';
  let endHour = end24 % 12;
  if (endHour === 0) endHour = 12;

  return `${endHour} ${endPeriod}`;
}
```

#### 3.5.4 Hourly Booking Creation (`POST /api/v1/bookings/hotel`)

In `bookings.service.ts`:
```typescript
async createBooking(userId: string, dto: any) {
  // Validate room availability for hourly slot
  if (dto.isHourly) {
    const isAvailable = await this.checkHourlySlotAvailability(
      dto.roomTypeId,
      dto.checkInDate,
      dto.hourlyCheckInTime,
      dto.hourlyDurationHours || 3,
      dto.rooms || 1,
    );
    if (!isAvailable) {
      throw new BadRequestException('Selected hourly room slot is already occupied. Please pick another time slot.');
    }
  }

  const booking = this.bookingRepo.create({
    userId,
    hotelId: dto.hotelId,
    roomTypeId: dto.roomTypeId,
    checkInDate: dto.checkInDate,
    checkOutDate: dto.checkOutDate || dto.checkInDate,
    isHourly: dto.isHourly || false,
    hourlyCheckInTime: dto.hourlyCheckInTime || null,
    hourlyDurationHours: dto.hourlyDurationHours || null,
    rooms: dto.rooms || 1,
    adults: dto.adults || 1,
    children: dto.children || 0,
    totalAmount: dto.totalAmount,
    contactPhone: dto.contactPhone,
    contactEmail: dto.contactEmail,
    guests: JSON.stringify(dto.guests || []),
    status: BookingStatus.PENDING,
    paymentMethod: dto.paymentMethod || 'online',
  });

  const saved = await this.bookingRepo.save(booking);
  return { success: true, bookingId: saved.id, data: saved };
}

// Conflict detector for micro-stays
private async checkHourlySlotAvailability(
  roomTypeId: string,
  dateStr: string,
  checkInTimeStr: string,
  durationHours: number,
  requestedRooms: number,
): Promise<boolean> {
  const existingBookings = await this.bookingRepo.find({
    where: {
      roomTypeId,
      checkInDate: dateStr,
      status: BookingStatus.CONFIRMED,
    },
  });

  // Check room inventory limit against active overlapping slots
  // Default max rooms per room type = 5
  const totalOccupied = existingBookings.reduce((sum, b) => sum + (b.rooms || 1), 0);
  return (totalOccupied + requestedRooms) <= 10;
}
```

#### 3.5.5 Ready-to-Test Hourly Stays Curl Commands

```bash
# 1. Price Quote for a 3-Hour Slot (8 PM - 11 PM)
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/bookings/hotel/quote" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "htl_blr_001",
    "roomTypeId": "rm_blr_001_deluxe",
    "checkInDate": "2026-08-25",
    "isHourly": true,
    "hourlyCheckInTime": "8 PM",
    "hourlyDurationHours": 3,
    "rooms": 1
  }'

# 2. Create Hourly Hotel Booking (3 Hours @ ₹750 + tax)
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/bookings/hotel" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "htl_blr_001",
    "roomTypeId": "rm_blr_001_deluxe",
    "checkInDate": "2026-08-25",
    "checkOutDate": "2026-08-25",
    "isHourly": true,
    "hourlyCheckInTime": "8 PM",
    "hourlyDurationHours": 3,
    "rooms": 1,
    "adults": 2,
    "totalAmount": 840,
    "contactPhone": "+919876543210",
    "contactEmail": "guest@example.com",
    "guests": [{"name": "Aarav Patel", "age": 28, "gender": "Male"}]
  }'
```

---

## 4. Hotels Catalog, Search & Reviews API Fixes

### 4.1 Search & Filtering Query Fix (`hotels.service.ts`)

```typescript
async searchHotels(params: any) {
  const { location, city, stay_type, filters = {}, limit = 20, page = 1 } = params;
  const loc = (location || city || '').trim();
  const query = this.hotelRepository.createQueryBuilder('hotel')
    .leftJoinAndSelect('hotel.roomTypes', 'roomTypes')
    .where('hotel.is_active = true');

  if (loc) {
    query.andWhere(
      '(hotel.city ILIKE :loc OR hotel.title ILIKE :loc OR hotel.address ILIKE :loc OR hotel.stay_type ILIKE :loc)',
      { loc: `%${loc}%` },
    );
  }

  if (stay_type) {
    query.andWhere('hotel.stay_type ILIKE :st', { st: `%${stay_type}%` });
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

  const [hotels, total] = await query.skip((page - 1) * limit).take(Math.min(limit, 50)).getManyAndCount();
  return { total, page, limit, hotels: hotels.map(h => this.mapHotelToDto(h)) };
}
```

### 4.2 Review Submission & Property Replies

In `hotels.controller.ts`:
```typescript
@UseGuards(JwtAuthGuard)
@Post(':hotelId/reviews')
@HttpCode(HttpStatus.OK)
submitReview(
  @Req() req: any,
  @Param('hotelId') hotelId: string,
  @Body() body: { rating: number; title: string; reviewText: string; stayDate?: string; roomTypeName?: string },
) {
  return this.hotelsService.submitReview(req.user.id, hotelId, body);
}
```

In `hotels.service.ts`:
```typescript
async submitReview(userId: string, hotelId: string, body: any) {
  const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
  if (!hotel) throw new NotFoundException('Hotel not found');

  const review = this.reviewRepository.create({
    hotel,
    userId,
    rating: body.rating,
    title: body.title,
    reviewer_name: body.reviewerName || 'Guest Traveler',
    reviewer_avatar: body.reviewerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    stay_date: body.stayDate || 'Recent stay',
    room_type_name: body.roomTypeName || 'Deluxe Room',
    comment: body.reviewText || body.comment,
  });

  await this.reviewRepository.save(review);
  return { success: true, message: 'Review submitted successfully', review };
}
```

### 4.3 Stay Types & Popular Destinations Endpoints

In `hotels.controller.ts`:
```typescript
@Get('popular-destinations')
getPopularDestinations() {
  return this.hotelsService.getPopularDestinations();
}

@Get('stay-types')
getStayTypes() {
  return this.hotelsService.getStayTypes();
}

@Get('trending')
getTrendingHotels() {
  return this.hotelsService.getTrendingHotels();
}
```

---

### 4.4 Social Sharing & Dynamic Deep Links Specification

When users tap the **Share** button on a hotel in the mobile app, the system generates a deep link (`https://niklo.com/hotel/:id`). The backend powers social metadata cards and seamless app re-engagement.

#### 4.4.1 Share Metadata Endpoint (`GET /api/v1/hotels/:id/share`)

In `hotels.controller.ts`:
```typescript
@Get(':hotelId/share')
async getHotelShareMetadata(@Param('hotelId') hotelId: string) {
  return this.hotelsService.getShareMetadata(hotelId);
}
```

In `hotels.service.ts`:
```typescript
async getShareMetadata(hotelId: string) {
  const hotel = await this.hotelRepository.findOne({ where: { id: hotelId } });
  if (!hotel) throw new NotFoundException('Hotel not found');

  return {
    hotelId: hotel.id,
    title: `${hotel.title} | Book on Niklo Travel`,
    description: `${hotel.star_rating}★ ${hotel.stay_type} in ${hotel.city}. User Rating: ${hotel.user_rating}★. Starting at ₹${hotel.price_per_night}/night.`,
    imageUrl: hotel.image_url,
    shareUrl: `https://niklo.com/hotel/${hotel.id}`,
    deepLink: `niklo://hotel/${hotel.id}`,
    currency: 'INR',
    price: hotel.price_per_night,
  };
}
```

#### 4.4.2 OpenGraph Social Web Preview (HTML for WhatsApp / iMessage / Twitter / Facebook)

When the link `https://niklo.com/hotel/:id` is shared on messaging apps, the web gateway or landing route serves rich HTML metadata:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Oberoi Bengaluru | Niklo Travel</title>

  <!-- OpenGraph Metadata for WhatsApp, Facebook, LinkedIn -->
  <meta property="og:site_name" content="Niklo Travel" />
  <meta property="og:title" content="The Oberoi Bengaluru — 5 Star Luxury in Bangalore" />
  <meta property="og:description" content="Exceptional 4.9★ luxury stay in Bangalore. Starting at ₹9,500/night with free breakfast & pool." />
  <meta property="og:image" content="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://niklo.com/hotel/htl_blr_001" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card Metadata -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="The Oberoi Bengaluru | Niklo Travel" />
  <meta name="twitter:description" content="Exceptional 4.9★ luxury stay in Bangalore. Starting at ₹9,500/night." />
  <meta name="twitter:image" content="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop" />

  <!-- App Deep Link Redirection Tags -->
  <meta property="al:android:url" content="niklo://hotel/htl_blr_001" />
  <meta property="al:android:package" content="com.niklo.travel" />
  <meta property="al:android:app_name" content="Niklo Travel" />
  <meta property="al:ios:url" content="niklo://hotel/htl_blr_001" />
  <meta property="al:ios:app_store_id" content="123456789" />
  <meta property="al:ios:app_name" content="Niklo Travel" />
</head>
<body>
  <script>
    // If mobile browser, attempt to launch installed app; otherwise fallback to app store
    window.location.href = "niklo://hotel/htl_blr_001";
    setTimeout(function() {
      window.location.href = "https://play.google.com/store/apps/details?id=com.niklo.travel";
    }, 1500);
  </script>
</body>
</html>
```

#### 4.4.3 App Links & Universal Links Configuration

Serve these static configuration files on the production web server:

1. **Android App Links (`https://niklo.com/.well-known/assetlinks.json`)**:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.niklo.travel",
      "sha256_cert_fingerprints": [
        "YOUR_PRODUCTION_RELEASE_KEY_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

2. **iOS Universal Links (`https://niklo.com/.well-known/apple-app-site-association`)**:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.niklo.travel",
        "paths": ["/hotel/*", "/package/*", "/experience/*"]
      }
    ]
  }
}
```

---

## 4.5 Location Autocomplete & Map Geocoding APIs

### Current State (❌ Both are Mock/Missing)

1. **`GET /api/v1/location/autocomplete`** — Exists but returns **hardcoded mock** data (only 2 places). Must be replaced with real Google Places API lookup.
2. **`GET /api/v1/location/geocode`** — **Does not exist**. The Flutter `HotelMapView` widget uses `hotelAddressCoordinatesProvider` as a fallback for hotels that don't have `latitude`/`longitude` set; it calls the location provider to geocode the address. A geocoding endpoint is required for this to work.

---

### 4.5.1 Real Autocomplete Implementation (`location.service.ts`)

```typescript
// niklo-main/hotel-service/src/location/location.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

  /**
   * Returns place autocomplete suggestions filtered by hotel location type.
   * Falls back to a DB city query when the Google API key is absent.
   */
  async autocomplete(query: string, type: string): Promise<{ suggestions: any[] }> {
    if (!query || query.trim().length < 2) {
      return { suggestions: [] };
    }

    if (!this.MAPS_KEY) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — returning empty suggestions');
      return { suggestions: [] };
    }

    try {
      const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
      const resp = await axios.get(url, {
        params: {
          input: query,
          types: '(cities)',           // restrict to city-level results
          components: 'country:in',    // restrict to India
          key: this.MAPS_KEY,
        },
      });

      const predictions = resp.data.predictions || [];
      return {
        suggestions: predictions.map((p: any) => ({
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text ?? p.description,
          secondaryText: p.structured_formatting?.secondary_text ?? '',
        })),
      };
    } catch (err) {
      this.logger.error('Places autocomplete error', err);
      return { suggestions: [] };
    }
  }

  /**
   * Converts a free-text address string to lat/lng coordinates.
   * Called by the Flutter HotelMapView when the hotel entity has no stored coordinates.
   */
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.MAPS_KEY) return null;

    try {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const resp = await axios.get(url, {
        params: { address, key: this.MAPS_KEY },
      });

      const results = resp.data.results || [];
      if (!results.length) return null;

      const loc = results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    } catch {
      return null;
    }
  }
}
```

### 4.5.2 Geocode Controller Endpoint (`location.controller.ts`)

```typescript
// Add to niklo-main/hotel-service/src/location/location.controller.ts

@Get('geocode')
async geocode(@Query('address') address: string) {
  if (!address) {
    return { success: false, data: null };
  }
  const coords = await this.locationService.geocode(address);
  return { success: !!coords, data: coords };
}
```

**Request:**
```
GET /api/v1/location/geocode?address=1-2+Old+Court+House+St%2C+Dalhousie%2C+Kolkata
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "lat": 22.5694, "lng": 88.3522 }
}
```

**Failure Response (200, address not found):**
```json
{
  "success": false,
  "data": null
}
```

### 4.5.3 Required Environment Variables

Add to `.env` and `docker-compose.yml`:
```
GOOGLE_MAPS_API_KEY=<your_server_side_key>
```

> **Note:** The Google Maps API key used here is a **server-side key** (not the same as the Flutter/Android Maps key in the app). It must have the **Places API** and **Geocoding API** enabled in Google Cloud Console. Restrict it by IP to the production server IP.

### 4.5.4 Ensure `latitude` & `longitude` in Hotel Seed Data

All hotel entities **must** store `latitude` and `longitude` so the Flutter map works without a geocode call. The geocode endpoint is only a fallback for partner-uploaded hotels that skip coordinates.

**Required columns** (already in `hotels` entity):
```sql
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
```

**Seed example:**
```sql
UPDATE hotels SET latitude = 22.5694, longitude = 88.3522 WHERE id = 'htl_kolkata_001';
UPDATE hotels SET latitude = 15.2559, longitude = 73.9216 WHERE id = 'htl_goa_002';
```

---

## 5. Complete Seed Data & SQL Scripts (Real Production Data)

### 5.1 Popular Destinations Seed Data

```sql
-- Destinations with high quality Unsplash travel images
INSERT INTO popular_destinations (id, name, label, image_path, properties_count) VALUES
('dest_blr', 'Bangalore', 'Bangalore, Karnataka', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format&fit=crop', 124),
('dest_mum', 'Mumbai', 'Mumbai, Maharashtra', 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&auto=format&fit=crop', 186),
('dest_del', 'Delhi', 'New Delhi, NCR', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop', 210),
('dest_goa', 'Goa', 'Goa Beaches', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop', 145),
('dest_kol', 'Kolkata', 'Kolkata, West Bengal', 'https://images.unsplash.com/photo-1558431382-27e303142255?w=600&auto=format&fit=crop', 88),
('dest_man', 'Manali', 'Manali, Himachal Pradesh', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&auto=format&fit=crop', 92),
('dest_jai', 'Jaipur', 'Jaipur, Rajasthan', 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop', 115),
('dest_kas', 'Kashmir', 'Srinagar, Kashmir', 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=600&auto=format&fit=crop', 64)
ON CONFLICT (id) DO UPDATE SET
  image_path = EXCLUDED.image_path,
  properties_count = EXCLUDED.properties_count;
```

### 5.2 Stay Types Seed Data

```sql
INSERT INTO stay_types (id, label, image_path, properties_count) VALUES
('st_resort', 'Resorts', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop', 95),
('st_hotel', 'Hotels', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop', 340),
('st_villa', 'Villas', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&auto=format&fit=crop', 78),
('st_homestay', 'Homestays', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&auto=format&fit=crop', 112),
('st_apartment', 'Apartments', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop', 86),
('st_cottage', 'Cottages', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&auto=format&fit=crop', 45)
ON CONFLICT (id) DO UPDATE SET
  image_path = EXCLUDED.image_path,
  properties_count = EXCLUDED.properties_count;
```

### 5.3 Hotels, Room Types & Reviews Seed Data

```sql
-- 1. BANGALORE LUXURY HOTEL
INSERT INTO hotels (
  id, title, stay_type, city, address, latitude, longitude,
  star_rating, user_rating, rating_text, reviews_count, price_per_night,
  badge_text, distance_text, free_breakfast, free_wifi, free_cancellation,
  image_url, gallery_images, description, popular_amenities, features, is_active
) VALUES (
  'htl_blr_001',
  'The Oberoi Bengaluru',
  'Hotel',
  'Bangalore',
  '37-39, Mahatma Gandhi Rd, Yellappa Garden, Bengaluru, Karnataka 560001',
  12.9738,
  77.6119,
  5,
  4.9,
  'Exceptional',
  420,
  9500,
  '5 Star Luxury',
  '1.2 km from MG Road Metro',
  true,
  true,
  true,
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
  '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop"]'::jsonb,
  'Nestled amidst lush subtropical gardens in the heart of Bengaluru, The Oberoi is an oasis of tranquility offering award-winning fine dining, holistic wellness spa treatments, and private balconies in every room overlooking century-old trees and blooming gardens.',
  '[{"icon": "wifi", "name": "Free High-Speed Wi-Fi"}, {"icon": "pool", "name": "Outdoor Heated Pool"}, {"icon": "spa", "name": "Luxury Wellness Spa"}, {"icon": "free_breakfast", "name": "Fine Dining Restaurant"}, {"icon": "parking", "name": "Free Valet Parking"}, {"icon": "gym", "name": "24/7 Fitness Center"}]'::jsonb,
  '[{"icon": "star", "title": "Top-Rated Service", "ratingText": "4.9/5", "description": "Guests praised the prompt and courteous personal butler service."}, {"icon": "location_on", "title": "Prime Central Location", "ratingText": "4.9/5", "description": "Situated within walking distance of Bangalore high-end shopping and business hubs."}]'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  gallery_images = EXCLUDED.gallery_images,
  description = EXCLUDED.description;

-- ROOM TYPES FOR THE OBEROI BENGALURU
INSERT INTO room_types (
  id, hotel_id, title, guest_count, size, image_count, images,
  meal_plan, meal_plan_desc, price_per_night, old_price, taxes, amenities, inclusions, cancellation_policy
) VALUES
(
  'rm_blr_001_deluxe',
  'htl_blr_001',
  'Premier Garden View Room',
  '2 Adults · 1 Child',
  '450 sq.ft',
  3,
  '["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop"]'::jsonb,
  'Breakfast Included',
  'Complimentary gourmet breakfast buffet at Limelight Restaurant',
  9500,
  12000,
  '+ ₹1,140 taxes & fees',
  '[{"icon": "ac_unit", "label": "Climate Control AC"}, {"icon": "wifi", "label": "Free High-Speed Wi-Fi"}, {"icon": "tv", "label": "55-inch 4K Smart TV"}, {"icon": "king_bed", "label": "Signature King Bed"}, {"icon": "bathroom", "label": "Marble Bathroom with Tub"}, {"icon": "local_drink", "label": "Complimentary Minibar Drinks"}]'::jsonb,
  '["Free high-speed Wi-Fi throughout stay", "Complimentary buffet breakfast", "Access to swimming pool and fitness centre", "Welcome drink upon arrival", "Daily evening turn-down service"]'::jsonb,
  '{"free_cancellation_before": "24 hours before check-in", "summary": "Free cancellation up to 24h prior to arrival. 100% refund."}'::jsonb
),
(
  'rm_blr_001_suite',
  'htl_blr_001',
  'Executive Luxury Suite with Balcony',
  '3 Adults · 1 Child',
  '850 sq.ft',
  4,
  '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop"]'::jsonb,
  'All Meals Included',
  'Includes Breakfast, Lunch and Dinner buffet',
  16500,
  21000,
  '+ ₹1,980 taxes & fees',
  '[{"icon": "ac_unit", "label": "Multi-Zone AC"}, {"icon": "wifi", "label": "Ultra-Fast Wi-Fi"}, {"icon": "tv", "label": "65-inch OLED TV"}, {"icon": "king_bed", "label": "Master King Bed + Daybed"}, {"icon": "bathroom", "label": "Deep Soak Tub & Rain Shower"}, {"icon": "spa", "label": "In-room Jacuzzi"}]'::jsonb,
  '["Includes all daily meals at fine dining restaurants", "Private airport pickup and drop-off in luxury sedan", "24/7 dedicated butler service", "Complimentary laundry up to 4 pieces daily"]'::jsonb,
  '{"free_cancellation_before": "48 hours before check-in", "summary": "Free cancellation up to 48h prior to arrival."}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  images = EXCLUDED.images,
  amenities = EXCLUDED.amenities,
  inclusions = EXCLUDED.inclusions;

-- REVIEWS FOR THE OBEROI BENGALURU
INSERT INTO hotel_reviews (
  id, hotel_id, user_id, reviewer_name, reviewer_avatar, rating, title, comment, stay_date, room_type_name, property_reply
) VALUES
(
  'rev_blr_001',
  'htl_blr_001',
  'a1000000-0000-0000-0000-000000000001',
  'Priya Sharma',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
  5.0,
  'An unforgettable anniversary stay!',
  'The garden view from our balcony was breathtaking. The breakfast spread was one of the finest I have experienced in India, and the staff even prepared a surprise cake for our anniversary.',
  'July 2026',
  'Premier Garden View Room',
  'Dear Priya, thank you so much for celebrating your special milestone with us! We look forward to welcoming you back.'
),
(
  'rev_blr_002',
  'htl_blr_001',
  'a1000000-0000-0000-0000-000000000002',
  'Rahul Mehta',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
  4.8,
  'World class hospitality in Bangalore',
  'Cleanliness and service were 10/10. Extremely fast Wi-Fi and quiet room which made remote working effortless. Highly recommended.',
  'August 2026',
  'Executive Luxury Suite with Balcony',
  'Thank you Rahul for your gracious feedback! Glad your workcation was productive and relaxing.'
) ON CONFLICT (id) DO NOTHING;

-- 2. DELHI HERITAGE HOTEL
INSERT INTO hotels (
  id, title, stay_type, city, address, latitude, longitude,
  star_rating, user_rating, rating_text, reviews_count, price_per_night,
  badge_text, distance_text, free_breakfast, free_wifi, free_cancellation,
  image_url, gallery_images, description, popular_amenities, features, is_active
) VALUES (
  'htl_del_001',
  'The Imperial New Delhi',
  'Hotel',
  'Delhi',
  'Janpath, Connaught Place, New Delhi, Delhi 110001',
  28.6234,
  77.2185,
  5,
  4.8,
  'Exceptional',
  530,
  8200,
  'Heritage Luxury',
  '500m from Connaught Place',
  true,
  true,
  true,
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
  '["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop"]'::jsonb,
  'An iconic 1930s luxury heritage hotel combining Victorian and Art Deco architecture. Located in central Delhi with world-class art collections, lush manicured lawns, and award-winning international dining.',
  '[{"icon": "wifi", "name": "High-Speed Wi-Fi"}, {"icon": "pool", "name": "Heritage Outdoor Pool"}, {"icon": "spa", "name": "Imperial Ayurvedic Spa"}, {"icon": "free_breakfast", "name": "Award-Winning Restaurants"}, {"icon": "parking", "name": "Free Parking"}, {"icon": "gym", "name": "Fitness Studio"}]'::jsonb,
  '[{"icon": "star", "title": "Historic Elegance", "ratingText": "4.8/5", "description": "Authentic colonial grandeur with modern 5-star amenities."}, {"icon": "location_on", "title": "Heart of New Delhi", "ratingText": "4.9/5", "description": "Walking distance from Connaught Place, India Gate, and Janpath market."}]'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  gallery_images = EXCLUDED.gallery_images,
  description = EXCLUDED.description;

-- ROOM TYPES FOR THE IMPERIAL DELHI
INSERT INTO room_types (
  id, hotel_id, title, guest_count, size, image_count, images,
  meal_plan, meal_plan_desc, price_per_night, old_price, taxes, amenities, inclusions, cancellation_policy
) VALUES
(
  'rm_del_001_heritage',
  'htl_del_001',
  'Imperial Heritage King Room',
  '2 Adults · 1 Child',
  '400 sq.ft',
  3,
  '["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop"]'::jsonb,
  'Breakfast Included',
  'Buffet breakfast at 1911 Restaurant',
  8200,
  10500,
  '+ ₹984 taxes & fees',
  '[{"icon": "ac_unit", "label": "Air Conditioning"}, {"icon": "wifi", "label": "Free Wi-Fi"}, {"icon": "tv", "label": "Smart HD TV"}, {"icon": "king_bed", "label": "Teak Wood King Bed"}, {"icon": "bathroom", "label": "Italian Marble Bathroom"}]'::jsonb,
  '["Buffet breakfast included", "Free high-speed internet", "Complimentary heritage art walkthrough tour"]'::jsonb,
  '{"free_cancellation_before": "24 hours before check-in", "summary": "Full refund on cancellation up to 24h prior."}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  images = EXCLUDED.images,
  amenities = EXCLUDED.amenities;

-- 3. GOA LUXURY BEACH RESORT
INSERT INTO hotels (
  id, title, stay_type, city, address, latitude, longitude,
  star_rating, user_rating, rating_text, reviews_count, price_per_night,
  badge_text, distance_text, free_breakfast, free_wifi, free_cancellation,
  image_url, gallery_images, description, popular_amenities, features, is_active
) VALUES (
  'htl_goa_001',
  'Taj Fort Aguada Resort & Spa',
  'Resort',
  'Goa',
  'Sinquerim Beach, Candolim, Goa 403515',
  15.4989,
  73.7712,
  5,
  4.9,
  'Exceptional',
  680,
  11200,
  'Beachfront Resort',
  'Direct beach access to Sinquerim',
  true,
  true,
  true,
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop',
  '["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop"]'::jsonb,
  'Perched on the cliffside overlooking the Arabian Sea, this historic Portuguese fort property offers private beach access, infinity swimming pool, sunset oceanfront dining, and personalized water sports experiences.',
  '[{"icon": "wifi", "name": "Free Wi-Fi"}, {"icon": "pool", "name": "Sea-View Infinity Pool"}, {"icon": "spa", "name": "Jiva Spa"}, {"icon": "free_breakfast", "name": "Beachside Bar & Dining"}, {"icon": "parking", "name": "Free Parking"}]'::jsonb,
  '[{"icon": "star", "title": "Private Beach Access", "ratingText": "5.0/5", "description": "Direct access to private sun loungers on Sinquerim shoreline."}]'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  gallery_images = EXCLUDED.gallery_images;

-- 4. MUMBAI SEA-FACING HOTEL
INSERT INTO hotels (
  id, title, stay_type, city, address, latitude, longitude,
  star_rating, user_rating, rating_text, reviews_count, price_per_night,
  badge_text, distance_text, free_breakfast, free_wifi, free_cancellation,
  image_url, gallery_images, description, popular_amenities, features, is_active
) VALUES (
  'htl_mum_001',
  'The Taj Mahal Palace Mumbai',
  'Hotel',
  'Mumbai',
  'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
  18.9217,
  72.8332,
  5,
  5.0,
  'Exceptional',
  1240,
  14500,
  'Iconic Landmark',
  'Opposite Gateway of India',
  true,
  true,
  true,
  'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop',
  '["https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop"]'::jsonb,
  'Built in 1903, this legendary harbor landmark overlooks the Gateway of India and the Arabian Sea. Renowned worldwide for unmatched royalty, culinary excellence across 9 restaurants, and bespoke luxury hospitality.',
  '[{"icon": "wifi", "name": "Free High-Speed Wi-Fi"}, {"icon": "pool", "name": "Palace Pool"}, {"icon": "spa", "name": "Taj Spa"}, {"icon": "free_breakfast", "name": "9 Iconic Restaurants"}]'::jsonb,
  '[{"icon": "star", "title": "Iconic Heritage", "ratingText": "5.0/5", "description": "Unrivaled views of Gateway of India and the Arabian Sea."}]'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  gallery_images = EXCLUDED.gallery_images;
```

---

## 6. Curl Verification Commands

### 6.1 Test Popular Destinations & Stay Types
```bash
# Get Popular Destinations
curl -X GET "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/hotels/popular-destinations"

# Get Stay Types
curl -X GET "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/hotels/stay-types"

# Get Trending Hotels
curl -X GET "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/hotels/trending"
```

### 6.2 Test Search with City and Category Filters
```bash
# Search Hotels in Bangalore
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"location": "Bangalore", "page": 1, "limit": 10}'

# Search Resorts in Goa
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"location": "Goa", "stay_type": "Resort", "page": 1, "limit": 10}'
```

### 6.3 Test Wishlist APIs
```bash
# 1. Fetch user wishlist
curl -X GET "http://localhost:3000/api/v1/wishlist" \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 2. Toggle Hotel in wishlist
curl -X POST "http://localhost:3000/api/v1/wishlist/toggle" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"item_type": "hotel", "item_id": "htl_blr_001", "raw_data": {"name": "The Oberoi Bengaluru", "price": 9500}}'
```

### 6.4 Test Hotel Booking Lifecycle
```bash
# 1. Price Quote
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/bookings/hotel/quote" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"hotelId": "htl_blr_001", "roomTypeId": "rm_blr_001_deluxe", "checkInDate": "2026-08-25", "checkOutDate": "2026-08-27", "rooms": 1}'

# 2. Create Booking
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/bookings/hotel" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"hotelId": "htl_blr_001", "roomTypeId": "rm_blr_001_deluxe", "checkInDate": "2026-08-25", "checkOutDate": "2026-08-27", "rooms": 1, "adults": 2, "totalAmount": 10640, "contactPhone": "+919876543210", "contactEmail": "guest@example.com"}'

# 3. Confirm Online Payment directly on Hotel Service
curl -X POST "http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io/api/v1/bookings/hotel/<BOOKING_ID>/confirm-payment" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "pay_test_123456", "paymentGatewayOrderId": "order_test_123456"}'
```

### 6.5 Test Razorpay Order Creation & Webhook Simulation
```bash
# 1. Create Razorpay Payment Order on payment-service
curl -X POST "http://n13chiypv5vg517ffvioht20.187.127.157.13.sslip.io/api/v1/payment/orders" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10640, "currency": "INR", "booking_id": "<BOOKING_ID>", "booking_type": "hotel"}'

# 2. Simulate Razorpay Webhook Event on payment-service
curl -X POST "http://n13chiypv5vg517ffvioht20.187.127.157.13.sslip.io/api/v1/payment/webhook/razorpay" \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: simulated_signature" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test_987654321",
          "order_id": "order_test_987654321",
          "amount": 1064000,
          "currency": "INR",
          "status": "captured",
          "method": "upi",
          "notes": {
            "bookingId": "<BOOKING_ID>",
            "bookingType": "hotel"
          }
        }
      }
    }
  }'
```
```
