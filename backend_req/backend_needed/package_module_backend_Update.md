# Niklo — Tour Packages Module Production Backend Specification & API Blueprint

> **Target Microservice**: `package-service` (`niklo-main/package-service`, Port `3009`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/packages` ([package_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/packages/data/models/package_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Tour Packages Module** ([package_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/packages/data/models/package_model.dart)) requires holiday package discovery, itinerary browsing, destination filtering, date slot availability checks, custom lead inquiries, and checkout integration.

In `niklo-main/package-service`, the `travel_packages` table lacks JSONB columns for multi-day structured itineraries, inclusions/exclusions lists, and photo galleries, causing the app to fall back on static mock data (`mock_packages.dart`).

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter `PackageModel` Property | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `title` / `destination` | 🟢 Present | `title VARCHAR(255)`, `destination VARCHAR(100)` | Standard columns |
| `startCity` | ❌ Missing | `start_city VARCHAR(100)` DEFAULT 'Kolkata' | Add column to DB |
| `locationText` & `snippet` | ❌ Missing | `location_text VARCHAR(255)`, `snippet TEXT` | Add columns to DB |
| `rating` | 🟡 Basic numeric | `rating NUMERIC(3,2)` DEFAULT 4.8 | Add column to DB |
| `duration` & `groupSize` | ❌ Missing | `duration VARCHAR(50)`, `group_size VARCHAR(50)` | Add columns to DB |
| `imagePath` / `galleryImages` | ❌ Missing | `image_url TEXT`, `gallery_images JSONB` | Add JSONB columns |
| `itinerary` | ❌ Missing | `itinerary JSONB` (`["Day 1: Arrival in Goa", "Day 2: Beach Tour"]`) | Add JSONB array column |
| `inclusions` & `exclusions` | ❌ Missing | `inclusions JSONB`, `exclusions JSONB` | Add JSONB array columns |
| Popular Destinations API | ❌ Missing | `GET /api/v1/packages/destinations/popular` | Implement destination aggregator |
| Batch Slot Availability | ❌ Missing | `POST /api/v1/packages/:id/availability` | Implement date slot capacity check |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_package`):

```sql
-- PostgreSQL Migration DDL for Package Module (package-service DB)

CREATE TABLE IF NOT EXISTS travel_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    start_city VARCHAR(100) DEFAULT 'Kolkata',
    rating NUMERIC(3, 2) DEFAULT 4.8,
    reviews_count INT DEFAULT 85,
    location_text VARCHAR(255) NOT NULL,
    snippet TEXT NOT NULL,
    description TEXT NOT NULL,
    duration VARCHAR(50) NOT NULL,
    group_size VARCHAR(50) DEFAULT '2-6 People',
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) NULL,
    discount_percent INT DEFAULT 0,
    image_url TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    itinerary JSONB DEFAULT '[]'::jsonb,
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    is_trending BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_packages_destination ON travel_packages(destination);
CREATE INDEX IF NOT EXISTS idx_packages_category ON travel_packages(category);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Search & Filter Tour Packages
- **Method**: `GET`
- **Route**: `/api/v1/packages?destination=Goa&category=Beach%20Escapes`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "pkg_goa_01",
      "title": "Goa Beach & Heritage Experience",
      "destination": "Goa",
      "startCity": "Kolkata",
      "rating": 4.9,
      "locationText": "North & South Goa",
      "snippet": "4 Days 3 Nights Luxury Beach Escape",
      "description": "Explore pristine beaches, colonial heritage, and vibrant nightlife in Goa.",
      "duration": "4 Days 3 Nights",
      "groupSize": "2-6 People",
      "price": 14999,
      "imagePath": "https://cdn.niklo.com/packages/goa_hero.jpg",
      "galleryImages": [
        "https://cdn.niklo.com/packages/goa_1.jpg",
        "https://cdn.niklo.com/packages/goa_2.jpg"
      ],
      "category": "Beach Escapes",
      "itinerary": [
        "Day 1: Arrival & Calangute Beach Sunset",
        "Day 2: North Goa Fort & Beach Tour",
        "Day 3: South Goa Heritage & Cruise",
        "Day 4: Departure"
      ],
      "inclusions": ["3-Star Hotel Stay", "Daily Breakfast", "Airport Transfers"],
      "exclusions": ["Airfare", "Personal Expenses"]
    }
  ]
}
```

---

### 3.2. Fetch Popular Destinations
- **Method**: `GET`
- **Route**: `/api/v1/packages/destinations/popular`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {"name": "Goa", "package_count": 14, "image_url": "https://cdn.niklo.com/dest/goa.jpg"},
    {"name": "Manali", "package_count": 10, "image_url": "https://cdn.niklo.com/dest/manali.jpg"},
    {"name": "Kashmir", "package_count": 8, "image_url": "https://cdn.niklo.com/dest/kashmir.jpg"}
  ]
}
```

---

## 4. NestJS Controller Blueprint for `package-service`

Update `niklo-main/package-service/src/packages/packages.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PackagesService } from './packages.service';

@Controller('api/v1/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.packagesService.findAll(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('destinations/popular')
  async getPopularDestinations() {
    const data = await this.packagesService.getPopularDestinations();
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.packagesService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/availability')
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Param('id') id: string, @Body() dto: any) {
    const data = await this.packagesService.checkAvailability(id, dto);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `PackageModel` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | UUID string |
| `title` | `title` | `title` | Package title |
| `destination` | `destination` | `destination` | Destination name |
| `startCity` | `startCity` / `start_city` | `start_city` | Origin city |
| `rating` | `rating` | `rating` | Numeric score |
| `duration` | `duration` | `duration` | Duration text |
| `imagePath` | `imagePath` / `image_url` | `image_url` | HTTP CDN image |
| `itinerary` | `itinerary` | `itinerary` | JSONB string array |
| `inclusions` | `inclusions` | `inclusions` | JSONB string array |
| `exclusions` | `exclusions` | `exclusions` | JSONB string array |

---

## 6. Definition of Done Checklist
- [ ] DDL migration script executed creating `travel_packages` table with JSONB array fields.
- [ ] `GET /api/v1/packages` returns `PackageModel` JSON payload matching Flutter client.
- [ ] `GET /api/v1/packages/destinations/popular` returns active destination counts.
