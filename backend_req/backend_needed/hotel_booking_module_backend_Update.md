# Niklo — Hotel Booking Module Production Backend Specification & API Blueprint

> **Target Microservice**: `hotel-service` (`niklo-main/hotel-service`, Port `3004`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/hotel_booking` ([hotel_item.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/hotel_booking/data/models/hotel_item.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Hotel Booking Module** ([hotel_item.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/hotel_booking/data/models/hotel_item.dart)) is built around a comprehensive `HotelItem` model containing detailed hotel data, popular amenities, nearby landmark places, room type matrices, cancellation policies, property rules, rating breakdowns (Cleanliness, Location, Service, Value), and hourly booking options.

In `niklo-main/hotel-service`, the database schema currently lacks JSONB columns for detailed property amenities, room options, and review rating breakdowns. Furthermore, string vs numeric Postgres types caused parsing issues when the client expected clean double/int conversions.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter `HotelItem` Property | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `hotelName` / `title` | 🟢 Present | `title VARCHAR(255)` | Standard string field |
| `imagePath` / `galleryImages` | 🟡 Basic string | `image_url TEXT`, `gallery_images JSONB` | Support full image URL arrays |
| `latitude` / `longitude` | 🟡 Basic numeric | `latitude NUMERIC(10,6)`, `longitude NUMERIC(10,6)` | Allow `null` when coordinate is unknown |
| `badgeText` & `distanceText` | ❌ Missing | `badge_text VARCHAR(100)`, `distance_text VARCHAR(100)` | Add fields to DB schema |
| `freeBreakfast` / `freeWifi` | ❌ Missing | `free_breakfast BOOLEAN`, `free_wifi BOOLEAN`, `free_cancellation BOOLEAN` | Add boolean flag columns |
| `popularAmenities` | 🟡 Bare strings | `amenities JSONB` (`[{"name": "Free WiFi", "icon": "wifi"}]`) | Support both string arrays and icon object arrays |
| `nearbyPlaces` | ❌ Missing | `nearby_places JSONB` (`[{"title": "Beach", "distance": "200m"}]`) | Add JSONB column |
| `features` | ❌ Missing | `features JSONB` (`[{"title": "Sea View", "icon": "waves"}]`) | Add JSONB column |
| `roomTypes` | 🟡 Partial table | `room_types` table (`id`, `hotel_id`, `title`, `price_per_night`, `max_guests`, `bed_type`, `available_rooms_count`) | Add foreign key relation and availability check |
| `ratingBreakdown` | ❌ Missing | `rating_breakdown JSONB` (`{"cleanliness": 4.9, "location": 4.8, "service": 4.7}`) | Add JSONB column |
| `rules` | ❌ Missing | `house_rules JSONB` (`["Check-in: 2PM", "Govt ID required"]`) | Add JSONB column |
| Room Availability Matrix | ❌ Missing | Endpoint `POST /api/v1/hotels/:hotelId/check-availability` | Implement date range capacity check |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_hotel`):

```sql
-- PostgreSQL Migration DDL for Hotel Booking Module (hotel-service DB)

CREATE TYPE stay_type_enum AS ENUM ('HOTEL', 'RESORT', 'VILLA', 'HOMESTAY', 'APARTMENT');

CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    stay_type stay_type_enum DEFAULT 'HOTEL',
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 6) NULL,
    longitude NUMERIC(10, 6) NULL,
    star_rating INT DEFAULT 4,
    user_rating NUMERIC(3, 2) DEFAULT 4.5,
    rating_text VARCHAR(50) DEFAULT 'Very Good',
    reviews_count INT DEFAULT 0,
    price_per_night NUMERIC(10, 2) NOT NULL,
    original_price_per_night NUMERIC(10, 2) NULL,
    discount_percent INT DEFAULT 0,
    badge_text VARCHAR(100) DEFAULT 'Popular Choice',
    distance_text VARCHAR(100) DEFAULT '1.2 km from city center',
    free_breakfast BOOLEAN DEFAULT TRUE,
    free_wifi BOOLEAN DEFAULT TRUE,
    free_cancellation BOOLEAN DEFAULT TRUE,
    image_url TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[{"name":"Free WiFi","icon":"wifi"},{"name":"Swimming Pool","icon":"pool"}]'::jsonb,
    nearby_places JSONB DEFAULT '[{"title":"Benaulim Beach","distance":"500m"},{"title":"Airport","distance":"22km"}]'::jsonb,
    features JSONB DEFAULT '[{"title":"Beachfront Access","icon":"waves"}]'::jsonb,
    house_rules JSONB DEFAULT '["Check-in: 2:00 PM", "Check-out: 11:00 AM", "Govt ID Required"]'::jsonb,
    rating_breakdown JSONB DEFAULT '{"cleanliness":4.8, "location":4.9, "service":4.7, "value":4.6}'::jsonb,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    price_per_night NUMERIC(10, 2) NOT NULL,
    max_guests INT DEFAULT 2,
    max_adults INT DEFAULT 2,
    max_children INT DEFAULT 1,
    available_rooms_count INT DEFAULT 5,
    room_size_sqft INT DEFAULT 250,
    bed_type VARCHAR(50) DEFAULT 'King Bed',
    amenities JSONB DEFAULT '["Air Conditioning", "Flat Screen TV", "Private Bathroom"]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT NULL,
    rating NUMERIC(3, 2) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels(price_per_night);
CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON room_types(hotel_id);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Search Hotels (Filtered & Paginated)
- **Method**: `POST`
- **Route**: `/api/v1/hotels/search`

#### Request Body Schema:
```json
{
  "city": "Goa",
  "checkIn": "2026-08-20",
  "checkOut": "2026-08-23",
  "guests": 2,
  "rooms": 1,
  "minPrice": 2000,
  "maxPrice": 15000,
  "starRating": 4,
  "page": 1,
  "limit": 20
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "hotels": [
      {
        "id": "htl_goa_091",
        "hotelName": "Taj Exotica Resort & Spa, Goa",
        "title": "Taj Exotica Resort & Spa, Goa",
        "stay_type": "RESORT",
        "city": "Goa",
        "address": "Benaulim Beach, South Goa",
        "star_rating": 5,
        "ratingValue": 4.8,
        "ratingText": "Exceptional",
        "reviewsCount": 312,
        "priceInt": 8500,
        "price_per_night": 8500.00,
        "priceText": "₹8,500/night",
        "badgeText": "Top Rated",
        "distanceText": "500m from Benaulim Beach",
        "freeBreakfast": true,
        "freeWifi": true,
        "freeCancellation": true,
        "imagePath": "https://cdn.niklo.com/hotels/taj_goa_hero.jpg",
        "galleryImages": [
          "https://cdn.niklo.com/hotels/taj_goa_1.jpg",
          "https://cdn.niklo.com/hotels/taj_goa_2.jpg"
        ],
        "popularAmenities": [
          {"name": "Free WiFi", "icon": "wifi"},
          {"name": "Swimming Pool", "icon": "pool"}
        ]
      }
    ]
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/hotels/search \
  -H "Content-Type: application/json" \
  -d '{"city": "Goa", "checkIn": "2026-08-20", "checkOut": "2026-08-23", "guests": 2}'
```

---

### 3.2. Check Room Availability & Price Matrix
- **Method**: `POST`
- **Route**: `/api/v1/hotels/:hotelId/check-availability`

#### Request Body Schema:
```json
{
  "check_in": "2026-08-20",
  "check_out": "2026-08-23",
  "room_type_id": "rm_deluxe_01",
  "rooms_count": 1,
  "guests_count": 2
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "hotel_id": "htl_goa_091",
    "room_type_id": "rm_deluxe_01",
    "room_title": "Deluxe Ocean View Room",
    "available": true,
    "remaining_rooms": 4,
    "nights_count": 3,
    "price_per_night": 8500,
    "total_room_price": 25500,
    "taxes_and_fees": 3060,
    "grand_total": 28560
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/hotels/htl_goa_091/check-availability \
  -H "Content-Type: application/json" \
  -d '{"check_in": "2026-08-20", "check_out": "2026-08-23", "rooms_count": 1, "guests_count": 2}'
```

---

## 4. NestJS Controller Blueprint for `hotel-service`

Update `niklo-main/hotel-service/src/hotels/hotels.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { HotelsService } from './hotels.service';

@Controller('api/v1/hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async searchHotels(@Body() dto: any) {
    const data = await this.hotelsService.searchHotels(dto);
    return { success: true, statusCode: 200, data };
  }

  @Get(':hotelId')
  async getHotelDetails(@Param('hotelId') hotelId: string) {
    const data = await this.hotelsService.getHotelDetails(hotelId);
    return { success: true, statusCode: 200, data };
  }

  @Post(':hotelId/check-availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Param('hotelId') hotelId: string, @Body() dto: any) {
    const data = await this.hotelsService.checkAvailability(hotelId, dto);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `HotelItem` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | UUID string |
| `hotelName` | `hotelName` / `title` | `title` | Property title |
| `ratingValue` | `ratingValue` / `user_rating` | `user_rating` | Numeric e.g., 4.8 |
| `reviewsCount` | `reviewsCount` / `reviews_count` | `reviews_count` | Integer count |
| `priceInt` | `priceInt` / `price_per_night` | `price_per_night` | Integer fare |
| `freeBreakfast` | `freeBreakfast` | `free_breakfast` | Boolean flag |
| `freeWifi` | `freeWifi` | `free_wifi` | Boolean flag |
| `popularAmenities` | `popularAmenities` / `amenities` | `amenities` | JSONB list of strings or objects |
| `nearbyPlaces` | `nearbyPlaces` / `nearby_places` | `nearby_places` | JSONB list of objects |
| `rules` | `rules` / `house_rules` | `house_rules` | JSONB list of rule strings |

---

## 6. Definition of Done Checklist
- [ ] DDL migration run on `postgres-db` creating `hotels`, `room_types`, `hotel_reviews`.
- [ ] `POST /api/v1/hotels/search` returns `HotelItem` JSON fields matching Flutter client parser (`_mapEntries`, `_asInt`).
- [ ] `POST /api/v1/hotels/:hotelId/check-availability` validates date range room count.
