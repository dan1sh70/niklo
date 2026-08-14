# Niklo — Experiences & Adventure Booking Module Production Backend Specification & API Blueprint

> **Target Microservice**: `adventure-service` (`niklo-main/adventure-service`, Port `3010`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/experience_booking` ([experience_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/experience_booking/data/models/experience_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Experiences & Adventure Booking Module** ([experience_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/experience_booking/data/models/experience_model.dart)) expects a rich dataset including image galleries, categories (Water Sports, Air Sports, Trekking, Wildlife), activity highlights, inclusions, prerequisites (what to bring), meeting points with geo-coordinates, ratings, and real-time slot availability.

Currently, `niklo-main/adventure-service` only has 8-9 basic scalar columns in the `travel_adventures` table (`id, title, description, price, duration_hours, location, requirements, is_active, created_at/updated_at`). As a result, the Flutter app has to derive categories using regex matching and render fallback local assets (`exp_1.jpg`).

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter App Model Property | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `category` | ❌ Missing | `category VARCHAR(100)` ('Water Sports', 'Air Sports', 'Trekking', 'Wildlife', 'Adventure') | Add column & implement `GET /api/v1/adventures/categories` |
| `imagePath` / `galleryImages` | ❌ Missing | `image_url TEXT`, `gallery_images JSONB` (`["https://cdn..."]`) | Add columns & store Cloud Storage URLs |
| `highlights` | ❌ Missing | `highlights JSONB` (`["Expert Guide", "Safety Equipment"]`) | Add JSONB column |
| `whatsIncluded` | ❌ Missing | `whats_included JSONB` (`["Snacks", "Photos", "Permit"]`) | Add JSONB column |
| `whatToBring` | 🟡 Partial | `requirements` string mapped to `what_to_bring JSONB` | Convert to JSONB array |
| `difficulty` | ❌ Missing | `difficulty VARCHAR(50)` ('Easy', 'Moderate', 'Challenging', 'Extreme') | Add column |
| `groupSize` | ❌ Missing | `group_size VARCHAR(100)` ('Up to 10 People') | Add column |
| `ratingValue` & `reviewsCount` | ❌ Missing | `rating NUMERIC(3,2)`, `reviews_count INT` | Add columns |
| `meetingPoint` & Coordinates | ❌ Missing | `meeting_point TEXT`, `latitude NUMERIC(10,6)`, `longitude NUMERIC(10,6)` | Add columns |
| Date Slot Capacity | ❌ Missing | Date slot availability API (`POST /adventures/:id/availability`) | Implement availability check endpoint |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_adventure`):

```sql
-- PostgreSQL Migration DDL for Experience Module (adventure-service DB)

ALTER TABLE IF EXISTS travel_adventures 
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Adventure',
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Goa',
  ADD COLUMN IF NOT EXISTS meeting_point TEXT DEFAULT 'Activity Headquarters',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6) DEFAULT 15.4989,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6) DEFAULT 73.8278,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.8,
  ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 120,
  ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'Moderate',
  ADD COLUMN IF NOT EXISTS group_size VARCHAR(100) DEFAULT 'Up to 10 People',
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT 'https://cdn.niklo.com/experiences/scuba_goa.jpg',
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '["https://cdn.niklo.com/experiences/scuba_1.jpg", "https://cdn.niklo.com/experiences/scuba_2.jpg"]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '["PADI Certified Instructors", "Underwater Photography Included", "Scuba Gear Provided"]'::jsonb,
  ADD COLUMN IF NOT EXISTS whats_included JSONB DEFAULT '["Scuba Equipment", "Life Jacket", "Light Snacks & Drinks", "Digital Photos & Videos"]'::jsonb,
  ADD COLUMN IF NOT EXISTS what_to_bring JSONB DEFAULT '["Swimwear", "Towel", "Change of Clothes", "Government Photo ID"]'::jsonb;

-- Create Indexes for fast filtering by category and location
CREATE INDEX IF NOT EXISTS idx_adventures_category ON travel_adventures(category);
CREATE INDEX IF NOT EXISTS idx_adventures_location ON travel_adventures(location);
CREATE INDEX IF NOT EXISTS idx_adventures_price ON travel_adventures(price);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Fetch All Experiences / Search by Category & Location
- **Method**: `GET`
- **Route**: `/api/v1/adventures` (or `/api/v1/adventure`)
- **Query Parameters**: `category`, `location`, `search`, `min_price`, `max_price`, `page`, `limit`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "exp_scuba_goa_01",
      "title": "Grand Island Scuba Diving & Water Sports",
      "category": "Water Sports",
      "location": "Grand Island, Goa",
      "city": "Goa",
      "price": 3500,
      "original_price": 4500,
      "discount_percent": 22,
      "rating": 4.9,
      "reviews_count": 284,
      "duration_hours": 6,
      "duration": "6 Hours",
      "difficulty": "Easy",
      "group_size": "Up to 15 People",
      "image_url": "https://cdn.niklo.com/experiences/scuba_goa.jpg",
      "gallery_images": [
        "https://cdn.niklo.com/experiences/scuba_1.jpg",
        "https://cdn.niklo.com/experiences/scuba_2.jpg"
      ],
      "description": "Experience deep sea diving in pristine waters with certified PADI divers.",
      "highlights": ["Underwater Photos Included", "PADI Instructor", "Boat Ride"],
      "whats_included": ["Equipment", "Snacks", "Photos"],
      "what_to_bring": ["Swimwear", "Valid ID Proof"],
      "meeting_point": "Malim Jetty, Panaji, Goa",
      "latitude": 15.5011,
      "longitude": 73.8244
    }
  ]
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X GET "http://localhost/api/v1/adventures?category=Water%20Sports&location=Goa"
```

---

### 3.2. Check Date Slot Availability
- **Method**: `POST`
- **Route**: `/api/v1/adventures/:id/availability`

#### Request Body Schema:
```json
{
  "date": "2026-08-25",
  "participants": 2
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "adventure_id": "exp_scuba_goa_01",
    "date": "2026-08-25",
    "available": true,
    "remaining_slots": 8,
    "price_per_person": 3500,
    "total_price": 7000,
    "time_slots": ["07:30 AM", "10:30 AM", "01:30 PM"]
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/adventures/exp_scuba_goa_01/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-08-25", "participants": 2}'
```

---

## 4. NestJS Controller Blueprint for `adventure-service`

Update `niklo-main/adventure-service/src/adventures/adventures.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdventuresService } from './adventures.service';

@Controller(['adventure', 'adventures'])
export class AdventuresController {
  constructor(private readonly adventuresService: AdventuresService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.adventuresService.findAll(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('categories')
  async getCategories() {
    const data = [
      { id: 'cat_water', title: 'Water Sports', icon: 'water', count: 12 },
      { id: 'cat_air', title: 'Air Sports', icon: 'flight', count: 8 },
      { id: 'cat_trek', title: 'Trekking', icon: 'hiking', count: 15 },
      { id: 'cat_safari', title: 'Wildlife', icon: 'nature', count: 6 },
    ];
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adventuresService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Param('id') id: string, @Body() dto: any) {
    const data = await this.adventuresService.checkAvailability(id, dto);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `ExperienceModel` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | UUID string |
| `title` | `title` | `title` | Activity title |
| `imagePath` | `image_url` | `image_url` | HTTP CDN image URL |
| `galleryImages` | `gallery_images` | `gallery_images` | JSONB string array |
| `category` | `category` | `category` | 'Water Sports', 'Air Sports', etc. |
| `price` | `price` | `price` | PostgreSQL numeric string or int |
| `ratingValue` | `rating` | `rating` | Numeric e.g., 4.8 |
| `reviewsCount` | `reviews_count` | `reviews_count` | Integer review count |
| `highlights` | `highlights` | `highlights` | JSONB string array |
| `whatsIncluded` | `whats_included` | `whats_included` | JSONB string array |
| `whatToBring` | `what_to_bring` | `what_to_bring` | JSONB string array |
| `meetingPoint` | `meeting_point` | `meeting_point` | Textual location |

---

## 6. Definition of Done Checklist
- [ ] DDL migration run on `postgres-db` adding `category`, `image_url`, `gallery_images`, `highlights`, `whats_included`, `what_to_bring`.
- [ ] `GET /api/v1/adventures?category=Water%20Sports` returns filtered activities with full JSONB arrays.
- [ ] `POST /api/v1/adventures/:id/availability` validates date slot capacity.
