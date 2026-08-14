# Niklo — Home Screen Module Production Backend Specification & API Blueprint

> **Target Microservices**: Aggregates `booking-service` (Port 3014), `package-service` (Port 3009), `ride-service` (Port 3005), `hotel-service` (Port 3004)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/home` ([home_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/home/presentation/screens/home_screen.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The **Home Screen Module** (`lib/features/home/presentation/screens/home_screen.dart`) acts as Niklo's main user dashboard. It renders:
1. **"Your Trips" Active Ticker Card**: Displays the user's next upcoming trip across ALL 5 travel verticals (Bus, Cab, Hotel, Package, Experience).
2. **"Smart Suggestions"**: Spatial location-aware recommendations (nearest departure holiday packages, day trips & trending activities using PostGIS).
3. **Hero Marketing Banners**: Dynamic marketing campaigns and deep links.
4. **Global Multi-Modal Search Bar**: Search autocomplete across all travel services.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter Component / Provider | `niklo-main` Backend Status | Required Production Backend Field & Endpoint | Backend Action Needed |
|---|---|---|---|
| Active Trip Ticker | 🔴 Omits Hotels & Cabs | `GET /api/v1/user/active-trip` querying ALL 5 travel verticals | Implement unified active trip aggregator |
| Smart Suggestions | 🔴 Static fallback list | `GET /api/v1/recommendations/smart-suggestions?lat=..&lng=..` using PostGIS | Implement spatial recommendation engine |
| Hero Marketing Banners | ❌ Missing | `GET /api/v1/promotions/banners` | Implement promo banner API |
| Search Autocomplete | 🔴 Local filtering | `GET /api/v1/search/multimodal-suggestions?query=..` | Implement global search API |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for promotions):

```sql
-- PostgreSQL Migration DDL for Home Promotions & Banners

CREATE TABLE IF NOT EXISTS marketing_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NULL,
    image_url TEXT NOT NULL,
    deep_link TEXT NOT NULL,
    discount_text VARCHAR(50) NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Unified Active Trip Ticker Endpoint
- **Method**: `GET`
- **Route**: `/api/v1/user/active-trip`
- **Auth**: Bearer JWT Token

#### Response Body Schema (HTTP 200 OK):
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
      "subtitle": "Kolkata to Siliguri",
      "travelDate": "2026-08-28",
      "departureTime": "20:00",
      "status": "CONFIRMED",
      "start_urgency_hours": 14
    }
  }
}
```

---

### 3.2. Spatial Smart Suggestions
- **Method**: `GET`
- **Route**: `/api/v1/recommendations/smart-suggestions?latitude=15.4989&longitude=73.8278`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "pkg_goa_01",
      "title": "Goa Beach & Heritage Experience",
      "type": "PACKAGE",
      "distance_km": 1.2,
      "rating": 4.9,
      "price": 14999,
      "imagePath": "https://cdn.niklo.com/packages/goa_hero.jpg"
    }
  ]
}
```

---

## 4. NestJS Controller Blueprint for Home Aggregator

Implement `niklo-main/booking-service/src/home/home.controller.ts`:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('api/v1')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('user/active-trip')
  async getActiveTrip() {
    const data = await this.homeService.getActiveTrip();
    return { success: true, statusCode: 200, data };
  }

  @Get('recommendations/smart-suggestions')
  async getSmartSuggestions(@Query() query: any) {
    const data = await this.homeService.getSmartSuggestions(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('promotions/banners')
  async getBanners() {
    const data = await this.homeService.getBanners();
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Definition of Done Checklist
- [ ] `GET /api/v1/user/active-trip` queries all 5 verticals and returns the single next upcoming trip.
- [ ] `GET /api/v1/recommendations/smart-suggestions` calculates spatial proximity using PostGIS.
- [ ] `GET /api/v1/promotions/banners` returns promo graphics with deep-link URIs.
