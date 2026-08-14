# Niklo — Bus Booking Module Production Backend Specification & API Blueprint

> **Target Microservice**: `bus-service` (`niklo-main/bus-service`, Port `3003`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/bus_booking` ([bus_schedule_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/data/models/bus_schedule_model.dart), [bus_detail_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/data/models/bus_detail_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Bus Booking Module** manages intercity bus search, schedule discovery, 2D seat map grid rendering (Upper/Lower deck, Seater/Sleeper), Redis-backed 5-minute seat locking, boarding & dropping point selection, and passenger details validation.

In `niklo-main/bus-service`, basic CRUD endpoints exist for buses and schedules, but the seat grid API lacks 2D deck position mappings (`row`, `column`, `is_upper_deck`), Redis 300-second TTL locking logic is un-enforced, and city location autocomplete is missing.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter App Model Property | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| City Autocomplete | ❌ Missing | `GET /api/v1/bus/locations/autocomplete?query=...` | Implement fuzzy search API |
| Schedule Search Filters | 🟡 Basic search | `GET /api/v1/bus/schedules/search` (`from`, `to`, `date`, `bus_type`, `sort_by`) | Implement multi-criteria sorting |
| 2D Seat Layout Matrix | 🟡 Count only | `GET /api/v1/bus/schedules/:id/seat-map` returning `seats[]` (`seat_number`, `row`, `column`, `is_upper_deck`, `seat_type`, `price`, `is_available`) | Expand seat layout schema |
| Boarding & Dropping Points | ❌ Missing | `GET /api/v1/bus/schedules/:id/boarding-points` (`id`, `location_name`, `address`, `time`, `lat`, `lng`) | Implement points API |
| Redis 5-Min Seat Locks | 🟡 Partial stub | Redis distributed lock (`lock:bus:{schedule_id}:{seat_no}`) with 300s TTL | Enforce TTL and WS event broadcast |
| Operator Details | 🟡 Basic string | `operator` object (`id`, `name`, `rating`, `cancellation_policy`, `contact_phone`) | Return nested operator object |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_bus`):

```sql
-- PostgreSQL Migration DDL for Bus Booking Module (bus-service DB)

CREATE TYPE bus_type_enum AS ENUM ('SEATER', 'SLEEPER', 'AC_SLEEPER', 'VOLVO_AC_MULTI_AXLE', 'LUXURY_NON_AC');

CREATE TABLE IF NOT EXISTS bus_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    contact_phone VARCHAR(20) NOT NULL,
    cancellation_policy TEXT DEFAULT '100% refund prior to 24 hrs, 50% prior to 12 hrs',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES bus_operators(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) NOT NULL,
    bus_type bus_type_enum DEFAULT 'AC_SLEEPER',
    total_seats INT DEFAULT 36,
    amenities JSONB DEFAULT '{"wifi": true, "water_bottle": true, "charging_point": true, "blanket": true}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    base_fare NUMERIC(10, 2) NOT NULL,
    available_seats INT DEFAULT 36,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    row_num INT NOT NULL,
    col_num INT NOT NULL,
    is_upper_deck BOOLEAN DEFAULT FALSE,
    seat_type VARCHAR(50) DEFAULT 'SLEEPER',
    price_offset NUMERIC(10, 2) DEFAULT 0.00
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bus_schedules_search ON bus_schedules(origin_city, destination_city, departure_date);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Bus City Search Autocomplete
- **Method**: `GET`
- **Route**: `/api/v1/bus/locations/autocomplete?query=Kolkata`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {"city": "Kolkata", "state": "West Bengal", "code": "CCU"},
    {"city": "Siliguri", "state": "West Bengal", "code": "IXB"}
  ]
}
```

---

### 3.2. Fetch 2D Seat Map Grid
- **Method**: `GET`
- **Route**: `/api/v1/bus/schedules/:id/seat-map`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "schedule_id": "sch_bus_801",
    "total_seats": 36,
    "available_seats": 18,
    "lower_deck": [
      {
        "seat_number": "L1",
        "row": 1,
        "column": 1,
        "is_upper_deck": false,
        "seat_type": "SLEEPER",
        "price": 1200,
        "is_available": true
      }
    ],
    "upper_deck": [
      {
        "seat_number": "U1",
        "row": 1,
        "column": 1,
        "is_upper_deck": true,
        "seat_type": "SLEEPER",
        "price": 1100,
        "is_available": true
      }
    ]
  }
}
```

---

### 3.3. Lock Seats (5-Minute TTL)
- **Method**: `POST`
- **Route**: `/api/v1/bus/schedules/:id/lock-seat`

#### Request Body Schema:
```json
{
  "seat_numbers": ["L1", "L2"],
  "user_id": "usr_991"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "schedule_id": "sch_bus_801",
    "locked_seats": ["L1", "L2"],
    "expires_in_seconds": 300,
    "lock_id": "lck_bus_99120"
  }
}
```

---

## 4. NestJS Controller Blueprint for `bus-service`

Update `niklo-main/bus-service/src/buses/buses.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BusesService } from './buses.service';

@Controller('api/v1/bus')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Get('locations/autocomplete')
  async autocomplete(@Query('query') query: string) {
    const data = await this.busesService.autocomplete(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('schedules/search')
  async searchSchedules(@Query() query: any) {
    const data = await this.busesService.searchSchedules(query);
    return { success: true, statusCode: 200, data };
  }

  @Get('schedules/:id/seat-map')
  async getSeatMap(@Param('id') id: string) {
    const data = await this.busesService.getSeatMap(id);
    return { success: true, statusCode: 200, data };
  }

  @Post('schedules/:id/lock-seat')
  @HttpCode(HttpStatus.OK)
  async lockSeat(@Param('id') id: string, @Body() dto: any) {
    const data = await this.busesService.lockSeat(id, dto);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `BusScheduleModel` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | Schedule UUID |
| `route` | `route` | `origin_city`, `destination_city` | Origin & destination pair |
| `bus` | `bus` | `buses` table join | Registration & total seats |
| `operator` | `operator` | `bus_operators` table join | Name & rating |
| `departureTime` | `departure_time` | `departure_time` | Format "HH:mm" |
| `arrivalTime` | `arrival_time` | `arrival_time` | Format "HH:mm" |
| `baseFare` | `base_fare` / `baseFare` | `base_fare` | Standard numeric fare |
| `availableSeats` | `available_seats` | `available_seats` | Count |

---

## 6. Definition of Done Checklist
- [ ] PostgreSQL tables `bus_operators`, `buses`, `bus_schedules`, `bus_seats` created.
- [ ] `GET /api/v1/bus/schedules/:id/seat-map` returns 2D deck arrays matching `BusDetailsModel`.
- [ ] `POST /api/v1/bus/schedules/:id/lock-seat` enforces 300s Redis TTL locking.
