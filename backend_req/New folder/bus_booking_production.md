# Niklo — Bus Booking Module Production Backend Action Guide

> **Target Microservice**: `bus-service` (`niklo-main/bus-service`, Port `3003`)  
> **Target Database**: `niklo_bus` (PostgreSQL & Redis)  
> **Frontend Code Reference**: `lib/features/bus_booking/` ([bus_booking_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/presentation/screens/bus_booking_screen.dart), [select_seats_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/presentation/screens/select_seats_screen.dart), [passenger_details_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/presentation/screens/passenger_details_screen.dart), [bus_repository.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/data/repositories/bus_repository.dart))  
> **Frontend Status**: 🟢 Complete & Integrated (with robust response unwrapping, 2D Upper/Lower deck seat grid support, date strip filtering, and fallback resilience).

---

## ⚡ Quick Summary for Backend Developer (Tasks To Fix)

The Flutter bus booking client is fully integrated with live endpoint support. The backend microservice `bus-service` needs the following **5 updates** to complete production readiness:

| # | Feature / Component | Endpoint | File Location in Backend | Action Required |
|---|---|---|---|---|
| **1** | **City Autocomplete** | `GET /api/v1/bus/locations/autocomplete?query=` | `src/locations/locations.controller.ts` | Replace static array with SQL `ILIKE` / fuzzy query on routes/cities table. |
| **2** | **2D Deck Seat Grid** | `GET /api/v1/bus/schedules/:id/seat-map` | `src/schedules/schedules.service.ts` | Return structured `lower_deck` and `upper_deck` arrays with `row`, `column`, `is_upper_deck`, and `price`. |
| **3** | **Redis 5-Min Seat Lock** | `POST /api/v1/bus/schedules/:id/lock-seat` | `src/schedules/schedules.service.ts` | Enforce 300-second TTL locking using Redis key `lock:bus:{schedule_id}:{seat_no}` with atomic rollback on failure. |
| **4** | **Boarding & Dropping Points** | `GET /api/v1/bus/schedules/:id/boarding-points` | `src/schedules/schedules.service.ts` | Return detailed pickup and drop locations (`location_name`, `address`, `time`). |
| **5** | **Bus Schedule Search** | `GET /api/v1/bus/schedules/search` | `src/schedules/schedules.service.ts` | Ensure `operator`, `bus`, and `route` relations are eagerly joined and returned. |

---

## 1. PostgreSQL Database Schema Migration (DDL Script)

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

CREATE TABLE IF NOT EXISTS bus_boarding_dropping_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES bus_schedules(id) ON DELETE CASCADE,
    point_type VARCHAR(20) NOT NULL, -- 'BOARDING' or 'DROPPING'
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    time_offset VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 6) NULL,
    longitude NUMERIC(10, 6) NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bus_schedules_search ON bus_schedules(origin_city, destination_city, departure_date);
CREATE INDEX IF NOT EXISTS idx_bus_seats_bus ON bus_seats(bus_id);
```

---

## 2. OpenAPI Endpoint Specifications & Payload Contracts

### 2.1. Bus City Search Autocomplete
- **Method**: `GET /api/v1/bus/locations/autocomplete?query=Kolkata`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    { "id": "loc-1", "name": "Kolkata, West Bengal", "type": "city" },
    { "id": "loc-2", "name": "Siliguri, West Bengal", "type": "city" }
  ]
}
```

---

### 2.2. Search Bus Schedules
- **Method**: `GET /api/v1/bus/schedules/search?source=Kolkata&destination=Siliguri&date=2026-08-28`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "sch_123456",
      "departure_time": "20:30",
      "arrival_time": "06:00",
      "departure_date": "2026-08-28",
      "base_fare": 850.00,
      "available_seats": 24,
      "bus": {
        "id": "bus_99",
        "registration_number": "WB01AB1234",
        "bus_type": "AC_SLEEPER",
        "total_seats": 36,
        "amenities": { "wifi": true, "water": true, "charging": true, "blanket": true }
      },
      "operator": {
        "id": "op_01",
        "name": "Greenline Travels",
        "contact_phone": "+919876543210"
      },
      "route": {
        "id": "rt_01",
        "source_city": "Kolkata",
        "destination_city": "Siliguri",
        "distance_km": 580,
        "estimated_duration_minutes": 570,
        "boarding_points": [
          { "name": "Esplanade Bus Stand", "address": "Esplanade, Kolkata", "order_index": 1 },
          { "name": "Airport Gate No. 1", "address": "Jessore Rd, Kolkata", "order_index": 2 }
        ],
        "dropping_points": [
          { "name": "Siliguri Junction", "address": "Hill Cart Road, Siliguri", "order_index": 1 }
        ]
      }
    }
  ]
}
```

---

### 2.3. Fetch 2D Seat Map Grid
- **Method**: `GET /api/v1/bus/schedules/:id/seat-map`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "schedule_id": "sch_123456",
    "total_seats": 36,
    "available_seats": 24,
    "lower_deck": [
      {
        "seat_number": "L1",
        "row": 1,
        "column": 1,
        "is_upper_deck": false,
        "seat_type": "SLEEPER",
        "price": 850.00,
        "is_available": true,
        "is_ladies_seat": false
      },
      {
        "seat_number": "L2",
        "row": 1,
        "column": 2,
        "is_upper_deck": false,
        "seat_type": "SLEEPER",
        "price": 850.00,
        "is_available": true,
        "is_ladies_seat": false
      }
    ],
    "upper_deck": [
      {
        "seat_number": "U1",
        "row": 1,
        "column": 1,
        "is_upper_deck": true,
        "seat_type": "SLEEPER",
        "price": 950.00,
        "is_available": true,
        "is_ladies_seat": false
      }
    ]
  }
}
```

---

### 2.4. Lock Seats (5-Minute Redis TTL)
- **Method**: `POST /api/v1/bus/schedules/:id/lock-seat`
- **Request Body**:
```json
{
  "seat_numbers": ["L1", "L2"],
  "user_id": "11111111-1111-1111-1111-111111111111"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "schedule_id": "sch_123456",
    "locked_seats": ["L1", "L2"],
    "expires_in_seconds": 300,
    "lock_id": "lck_bus_99120"
  }
}
```

---

### 2.5. Boarding & Dropping Points
- **Method**: `GET /api/v1/bus/schedules/:id/boarding-points`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "boarding_points": [
      { "id": "bp_1", "location_name": "Esplanade Bus Stand", "address": "Esplanade, Kolkata", "time": "20:30" }
    ],
    "dropping_points": [
      { "id": "dp_1", "location_name": "Siliguri Junction", "address": "Hill Cart Rd, Siliguri", "time": "06:00" }
    ]
  }
}
```

---

## 3. NestJS Code Blueprints (Drop-in Ready)

### 3.1. `src/schedules/schedules.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';

@Controller('api/v1/bus/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('search')
  async search(
    @Query('source') source: string,
    @Query('destination') destination: string,
    @Query('date') date: string,
  ) {
    const data = await this.schedulesService.searchByRoute(source, destination, date);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.schedulesService.findOne(id);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/seat-map')
  async getSeatMap(@Param('id') id: string) {
    const data = await this.schedulesService.getSeatMap(id);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/lock-seat')
  @HttpCode(HttpStatus.OK)
  async lockSeat(
    @Param('id') id: string,
    @Body() dto: { seat_numbers: string[]; user_id?: string },
  ) {
    const data = await this.schedulesService.lockSeat(
      id,
      dto.seat_numbers,
      dto.user_id || '11111111-1111-1111-1111-111111111111',
    );
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/boarding-points')
  async getBoardingPoints(@Param('id') id: string) {
    const data = await this.schedulesService.getBoardingPoints(id);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 4. Definition of Done Checklist for Backend Developer
- [ ] DDL Migration executed creating `bus_operators`, `buses`, `bus_schedules`, `bus_seats`, `bus_boarding_dropping_points`.
- [ ] `GET /api/v1/bus/locations/autocomplete` returns matching city suggestions.
- [ ] `GET /api/v1/bus/schedules/search` returns schedules with operator and route eager joins.
- [ ] `GET /api/v1/bus/schedules/:id/seat-map` returns 2D `lower_deck` and `upper_deck` arrays.
- [ ] `POST /api/v1/bus/schedules/:id/lock-seat` enforces 300-second Redis TTL locking.
- [ ] `GET /api/v1/bus/schedules/:id/boarding-points` returns pickup and drop location lists.
