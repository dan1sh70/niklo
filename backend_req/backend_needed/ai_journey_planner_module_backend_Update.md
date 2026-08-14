# Niklo — AI Journey Planner Module Production Backend Specification & API Blueprint

> **Notice for Backend Developers**: This document serves as the master production specification and implementation blueprint for the **AI Journey Planner Module** (`lib/features/ai_journey_planner`) in Niklo. 
> 
> **Important Rule**: **Do not modify existing backend code in `niklo-main` directly without following this specification**. The existing microservices (`booking-service`, `bus-service`, `ride-service`, `hotel-service`, `payment-service`) serve as upstream dependencies for this module.

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs AI Planner Requirements)

The **AI Journey Planner** is Niklo’s flagship door-to-door multi-modal travel routing engine. It takes origin coordinates, destination coordinates, date of travel, passenger counts, and routing preferences to compute, aggregate, and book multi-leg itineraries combining **Cab ➔ Intercity Bus ➔ Local Cab ➔ Hotel Stay / Activity**.

### Audit Matrix: Current `niklo-main` Codebase vs Required AI Journey Planner Components

| Component / Requirement | Current Implementation in `niklo-main` | Required Production Backend Implementation | Status & Priority |
|---|---|---|---|
| **AI Planner Microservice** | No `ai-planner-service` directory exists in `niklo-main`. | Create NestJS microservice `ai-planner-service` on port `3015`. | 🔴 **Missing (P0)** |
| **API Gateway Nginx Routes** | `nginx.conf` has routing for `/api/v1/bus`, `/api/v1/ride`, `/api/v1/bookings`, etc., but **no** `/api/v1/ai-planner`. | Add `location /api/v1/ai-planner` block pointing to `ai-planner-service:3015`. | 🔴 **Missing (P0)** |
| **Docker Compose Orchestration** | `docker-compose.yaml` missing `ai-planner-service` container block. | Add `ai-planner-service` entry connected to `postgres-db`, `redis`, and core microservices. | 🔴 **Missing (P0)** |
| **Multi-Modal Route Planner** | No endpoint computes or combines multi-modal routes. | `POST /api/v1/ai-planner/plan-journey` computes `CHEAPEST`, `FASTEST`, `MOST_COMFORTABLE`, and `BALANCED` options. | 🔴 **Missing (P0)** |
| **One-Click Multi-Leg Booking** | `booking-service` supports `BookingType.JOURNEY_LEG` and `journey_id` in `Booking` entity, but lacks unified multi-leg execution orchestrator. | `POST /api/v1/ai-planner/book-multimodal` orchestrates atomic multi-leg locks across `bus-service`, `ride-service`, and `booking-service`. | 🟡 **Partial (P0)** |
| **Database Tables** | `postgres-db` lacks tables for storing AI planned routes, saved itineraries, and alerts. | Execute DDL script creating `ai_journey_plans`, `user_saved_journeys`, and `journey_alerts`. | 🔴 **Missing (P0)** |
| **Saved Journeys APIs** | Mobile app `SavedJourneysNotifier` is purely in-memory. | Implement `GET`, `POST`, `DELETE` `/api/v1/ai-planner/saved-journeys`. | 🟡 **Missing (P1)** |
| **Real-Time Journey Alerts** | Mobile app `JourneyAlertsNotifier` has no backend persistence or push trigger. | Implement `GET`, `PUT` `/api/v1/ai-planner/alerts` and notification triggers. | 🟡 **Missing (P1)** |
| **Smart Schedule Optimizer** | Flutter app contains UI screen `smart_schedule_optimizer_screen.dart` with static multipliers. | Implement `POST /api/v1/ai-planner/smart-schedule-optimizer` for traffic/weather departure adjustments. | 🟢 **Missing (P2)** |

---

## 2. Multi-Modal Architecture & System Flow

```
                                +------------------------------------------+
                                |             Niklo Mobile App             |
                                +--------------------+---------------------+
                                                     |
                                     POST /api/v1/ai-planner/plan-journey
                                                     |
                                                     v
                                +--------------------+---------------------+
                                |         Nginx API Gateway (Port 80)      |
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +--------------------+---------------------+
                                |   ai-planner-service (NestJS Port 3015)  |
                                +---------+----------+----------+----------+
                                          |          |          |
            +-----------------------------+          |          +-----------------------------+
            |                                        v                                        |
            v                               +--------+---------+                              v
+-----------+------------+                  | OpenTripPlanner /|                  +-----------+------------+
|   bus-service (3003)   |                  | Spatial Dijkstra |                  |   ride-service (3005)  |
| Intercity Bus Schedules|                  | Routing Engine   |                  | First & Last Mile Cabs |
+-----------+------------+                  +------------------+                  +-----------+------------+
            |                                                                                 |
            +------------------------------------+--------------------------------------------+
                                                 |
                                                 v
                                    +------------+------------+
                                    |  booking-service (3014) |
                                    | Multi-Leg Master Booking|
                                    +------------+------------+
                                                 |
                                                 v
                                    +------------+------------+
                                    | payment-service (3007)  |
                                    | Unified Razorpay Order  |
                                    +-------------------------+
```

### Multi-Leg Itinerary Breakdown Example (Kolkata ➔ Gangtok)
1. **Leg 1 (First-Mile Cab)**: Salt Lake Sector V, Kolkata ➔ Esplanade Bus Station, Kolkata (Cab, 35m, ₹320).
2. **Transfer 1**: 25m layover at Esplanade Bus Station.
3. **Leg 2 (Intercity Bus)**: Esplanade, Kolkata ➔ Siliguri Junction Bus Stand (AC Sleeper Bus, 8h 00m, ₹1,200).
4. **Transfer 2**: 30m break at Siliguri Bus Stand.
5. **Leg 3 (Last-Mile Cab)**: Siliguri Junction ➔ MG Marg, Gangtok, Sikkim (Hill SUV Cab, 3h 10m, ₹850).
- **Total Duration**: 12h 40m | **Total Fare**: ₹2,370 per passenger | **Transfers**: 2.

---

## 3. Production PostgreSQL Database Schema (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db`):

```sql
-- PostgreSQL Migration DDL for AI Journey Planner Module

CREATE TABLE IF NOT EXISTS ai_journey_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    search_id VARCHAR(100) UNIQUE NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_lat NUMERIC(10, 6) NOT NULL,
    source_lng NUMERIC(10, 6) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination_lat NUMERIC(10, 6) NOT NULL,
    destination_lng NUMERIC(10, 6) NOT NULL,
    travel_date DATE NOT NULL,
    passengers_count INT DEFAULT 1 NOT NULL,
    options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS user_saved_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    journey_id VARCHAR(100) NOT NULL,
    search_id VARCHAR(100) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_fare NUMERIC(10, 2) NOT NULL,
    total_duration VARCHAR(50) NOT NULL,
    total_transfers INT DEFAULT 0,
    journey_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, journey_id)
);

CREATE TABLE IF NOT EXISTS journey_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    departure_reminder BOOLEAN DEFAULT TRUE,
    price_drop_alert BOOLEAN DEFAULT TRUE,
    delay_notification BOOLEAN DEFAULT TRUE,
    boarding_gate_update BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance query execution
CREATE INDEX IF NOT EXISTS idx_ai_journey_search_id ON ai_journey_plans(search_id);
CREATE INDEX IF NOT EXISTS idx_ai_journey_user_id ON ai_journey_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_journeys_user_id ON user_saved_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_alerts_user_id ON journey_alerts(user_id);
```

---

## 4. Production API Endpoint Specifications & cURL Test Suite (Verifying 200 OK)

All APIs below are defined under `/api/v1/ai-planner`.

---

### 4.1. Plan Multi-Modal Journey

Calculates multi-modal routes (Cab + Intercity Bus + Cab) and groups them by categories (`CHEAPEST`, `FASTEST`, `MOST_COMFORTABLE`, `BALANCED`).

- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/plan-journey`
- **Auth**: Public / Optional Bearer JWT

#### Request Headers:
```http
Content-Type: application/json
Authorization: Bearer <OPTIONAL_JWT_TOKEN>
```

#### Request Body Schema:
```json
{
  "source_location": {
    "name": "Salt Lake Sector V, Kolkata",
    "latitude": 22.5726,
    "longitude": 88.4339
  },
  "destination_location": {
    "name": "MG Marg, Gangtok, Sikkim",
    "latitude": 27.3389,
    "longitude": 88.6065
  },
  "travel_date": "2026-08-15",
  "passengers_count": 2,
  "preferences": {
    "max_transfers": 3,
    "preferred_modes": ["BUS", "CAB"],
    "sort_by": "RECOMMENDED"
  }
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "search_id": "search_plan_88319201",
    "source": "Salt Lake Sector V, Kolkata",
    "destination": "MG Marg, Gangtok, Sikkim",
    "travel_date": "2026-08-15",
    "passengers": 2,
    "options": [
      {
        "journey_id": "jny_opt_cheapest_01",
        "category": "CHEAPEST",
        "badge_label": "BEST VALUE",
        "title": "Cab + Intercity Bus + Hill Cab",
        "total_fare": 4740.00,
        "fare_per_passenger": 2370.00,
        "currency": "INR",
        "total_duration": "12h 40m",
        "total_transfers": 2,
        "start_time": "2026-08-15T22:15:00Z",
        "end_time": "2026-08-16T10:55:00Z",
        "transport_modes": ["CAB", "BUS", "CAB"],
        "legs": [
          {
            "leg_index": 1,
            "mode": "CAB",
            "mode_label": "First-Mile Cab",
            "origin": "Salt Lake Sector V, Kolkata",
            "destination": "Esplanade Bus Terminus, Kolkata",
            "departure_time": "2026-08-15T22:15:00Z",
            "arrival_time": "2026-08-15T22:50:00Z",
            "duration": "35m",
            "distance_km": 14.2,
            "estimated_fare": 320.00,
            "service_provider": "Niklo Cabs",
            "booking_payload": {
              "ride_type": "SEDAN",
              "pickup_lat": 22.5726,
              "pickup_lng": 88.4339,
              "drop_lat": 22.5645,
              "drop_lng": 88.3512
            }
          },
          {
            "leg_index": 2,
            "mode": "TRANSFER",
            "mode_label": "Transfer & Boarding",
            "location": "Esplanade Bus Terminus, Kolkata",
            "duration": "25m",
            "instruction": "Walk to Platform 4 for Greenline AC Sleeper"
          },
          {
            "leg_index": 3,
            "mode": "BUS",
            "mode_label": "Intercity AC Sleeper Bus",
            "origin": "Esplanade, Kolkata",
            "destination": "Siliguri Junction Bus Stand",
            "departure_time": "2026-08-15T23:15:00Z",
            "arrival_time": "2026-08-16T07:15:00Z",
            "duration": "8h 00m",
            "distance_km": 560.0,
            "estimated_fare": 2400.00,
            "service_provider": "Greenline Express",
            "schedule_id": "sch_kol_sil_099",
            "available_seats": ["L4C", "L5C"]
          },
          {
            "leg_index": 4,
            "mode": "TRANSFER",
            "mode_label": "Transfer & Breakfast",
            "location": "Siliguri Junction Bus Stand",
            "duration": "30m",
            "instruction": "Head to Taxi Stand opposite Railway Station"
          },
          {
            "leg_index": 5,
            "mode": "CAB",
            "mode_label": "Hill Shared/Private Taxi",
            "origin": "Siliguri Junction, West Bengal",
            "destination": "MG Marg, Gangtok, Sikkim",
            "departure_time": "2026-08-16T07:45:00Z",
            "arrival_time": "2026-08-16T10:55:00Z",
            "duration": "3h 10m",
            "distance_km": 114.0,
            "estimated_fare": 2020.00,
            "service_provider": "Sikkim Taxi Union",
            "booking_payload": {
              "ride_type": "SUV_HILL",
              "pickup_lat": 26.7271,
              "pickup_lng": 88.4315,
              "drop_lat": 27.3389,
              "drop_lng": 88.6065
            }
          }
        ]
      },
      {
        "journey_id": "jny_opt_comfort_02",
        "category": "MOST_COMFORTABLE",
        "badge_label": "DIRECT COMFORT",
        "title": "Direct Luxury SUV Cab",
        "total_fare": 8500.00,
        "fare_per_passenger": 4250.00,
        "currency": "INR",
        "total_duration": "11h 30m",
        "total_transfers": 0,
        "start_time": "2026-08-15T06:00:00Z",
        "end_time": "2026-08-15T17:30:00Z",
        "transport_modes": ["CAB"],
        "legs": [
          {
            "leg_index": 1,
            "mode": "CAB",
            "mode_label": "Door-to-Door SUV Cab",
            "origin": "Salt Lake Sector V, Kolkata",
            "destination": "MG Marg, Gangtok, Sikkim",
            "departure_time": "2026-08-15T06:00:00Z",
            "arrival_time": "2026-08-15T17:30:00Z",
            "duration": "11h 30m",
            "distance_km": 674.0,
            "estimated_fare": 8500.00,
            "service_provider": "Niklo Outstation Cab",
            "booking_payload": {
              "ride_type": "INNOVA_CRYSTA",
              "pickup_lat": 22.5726,
              "pickup_lng": 88.4339,
              "drop_lat": 27.3389,
              "drop_lng": 88.6065
            }
          }
        ]
      }
    ]
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/ai-planner/plan-journey \
  -H "Content-Type: application/json" \
  -d '{
    "source_location": {"name": "Salt Lake Sector V, Kolkata", "latitude": 22.5726, "longitude": 88.4339},
    "destination_location": {"name": "MG Marg, Gangtok, Sikkim", "latitude": 27.3389, "longitude": 88.6065},
    "travel_date": "2026-08-15",
    "passengers_count": 2
  }'
```

---

### 4.2. One-Click Multi-Modal Booking Execution

Executes unified single-click booking for all legs in a multi-modal itinerary. Locks seats in `bus-service`, reserves cab rides in `ride-service`, creates master journey booking in `booking-service`, and generates a Razorpay checkout order in `payment-service`.

- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/book-multimodal`
- **Auth**: Required (`Bearer <JWT>`)

#### Request Body Schema:
```json
{
  "search_id": "search_plan_88319201",
  "journey_id": "jny_opt_cheapest_01",
  "passengers": [
    {
      "name": "Arjun Sharma",
      "age": 29,
      "gender": "Male",
      "phone": "+919876543211"
    },
    {
      "name": "Priya Sharma",
      "age": 27,
      "gender": "Female",
      "phone": "+919876543211"
    }
  ],
  "selected_bus_seats": ["L4C", "L5C"],
  "contact_email": "arjun.sharma@example.com",
  "contact_phone": "+919876543211"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "master_booking_id": "mbk_991823101",
    "journey_id": "jny_opt_cheapest_01",
    "total_amount": 4740.00,
    "currency": "INR",
    "status": "PENDING_PAYMENT",
    "leg_bookings": [
      {
        "leg_index": 1,
        "mode": "CAB",
        "booking_id": "cab_bk_012",
        "status": "RESERVED",
        "amount": 320.00
      },
      {
        "leg_index": 3,
        "mode": "BUS",
        "booking_id": "bus_bk_881",
        "status": "SEATS_LOCKED",
        "seat_numbers": ["L4C", "L5C"],
        "amount": 2400.00
      },
      {
        "leg_index": 5,
        "mode": "CAB",
        "booking_id": "cab_bk_013",
        "status": "RESERVED",
        "amount": 2020.00
      }
    ],
    "checkout_order": {
      "razorpay_order_id": "order_Kj991823101",
      "amount": 4740.00,
      "currency": "INR",
      "key_id": "rzp_test_NikloKey123"
    }
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/ai-planner/book-multimodal \
  -H "Authorization: Bearer <VALID_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "search_id": "search_plan_88319201",
    "journey_id": "jny_opt_cheapest_01",
    "passengers": [{"name": "Arjun Sharma", "age": 29, "gender": "Male", "phone": "+919876543211"}],
    "selected_bus_seats": ["L4C", "L5C"]
  }'
```

---

### 4.3. Fetch Saved Journeys

Retrieves saved journey itineraries for the authenticated user.

- **Method**: `GET`
- **Route**: `/api/v1/ai-planner/saved-journeys`
- **Auth**: Required (`Bearer <JWT>`)

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "sv_jny_77192",
      "journey_id": "jny_opt_cheapest_01",
      "search_id": "search_plan_88319201",
      "source_name": "Salt Lake Sector V, Kolkata",
      "destination_name": "MG Marg, Gangtok, Sikkim",
      "title": "Cab + Intercity Bus + Hill Cab",
      "category": "CHEAPEST",
      "total_fare": 4740.00,
      "total_duration": "12h 40m",
      "total_transfers": 2,
      "saved_at": "2026-08-12T07:30:00Z"
    }
  ]
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X GET http://localhost/api/v1/ai-planner/saved-journeys \
  -H "Authorization: Bearer <VALID_JWT_TOKEN>"
```

---

### 4.4. Save Journey Itinerary

Saves an AI-computed journey option to the user's profile.

- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/save-journey`
- **Auth**: Required (`Bearer <JWT>`)

#### Request Body Schema:
```json
{
  "search_id": "search_plan_88319201",
  "journey_id": "jny_opt_cheapest_01"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Journey successfully saved to profile",
  "data": {
    "id": "sv_jny_77192",
    "journey_id": "jny_opt_cheapest_01"
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/ai-planner/save-journey \
  -H "Authorization: Bearer <VALID_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"search_id": "search_plan_88319201", "journey_id": "jny_opt_cheapest_01"}'
```

---

### 4.5. Delete Saved Journey

Removes a saved journey itinerary.

- **Method**: `DELETE`
- **Route**: `/api/v1/ai-planner/saved-journeys/:id`
- **Auth**: Required (`Bearer <JWT>`)

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Saved journey deleted successfully"
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X DELETE http://localhost/api/v1/ai-planner/saved-journeys/sv_jny_77192 \
  -H "Authorization: Bearer <VALID_JWT_TOKEN>"
```

---

### 4.6. Fetch & Update Journey Alerts Preferences

Manages real-time notification alerts (departure reminder, price drop alert, delay notification, boarding gate update).

- **Method**: `GET` / `PUT`
- **Route**: `/api/v1/ai-planner/alerts`
- **Auth**: Required (`Bearer <JWT>`)

#### Request Body Schema (`PUT`):
```json
{
  "departure_reminder": true,
  "price_drop_alert": true,
  "delay_notification": true,
  "boarding_gate_update": true
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "departure_reminder": true,
    "price_drop_alert": true,
    "delay_notification": true,
    "boarding_gate_update": true,
    "updated_at": "2026-08-12T07:35:00Z"
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X PUT http://localhost/api/v1/ai-planner/alerts \
  -H "Authorization: Bearer <VALID_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "departure_reminder": true,
    "price_drop_alert": true,
    "delay_notification": true,
    "boarding_gate_update": true
  }'
```

---

### 4.7. Smart Schedule Optimizer

Optimizes departure times and calculates buffer recommendations based on traffic, weather models, and historical peak hours.

- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/smart-schedule-optimizer`
- **Auth**: Optional / Bearer JWT

#### Request Body Schema:
```json
{
  "origin": "Salt Lake, Kolkata",
  "destination": "Esplanade Bus Station",
  "scheduled_departure": "2026-08-15T22:15:00Z"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "recommended_departure": "2026-08-15T21:45:00Z",
    "recommended_buffer_minutes": 30,
    "traffic_condition": "HEAVY",
    "weather_condition": "LIGHT_RAIN",
    "reasoning": "Traffic on EM Bypass is expected to spike between 21:30 and 22:30. Leaving 30 mins early avoids risk of missing the intercity bus."
  }
}
```

#### cURL Verification Command (Expect 200 OK):
```bash
curl -X POST http://localhost/api/v1/ai-planner/smart-schedule-optimizer \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Salt Lake, Kolkata",
    "destination": "Esplanade Bus Station",
    "scheduled_departure": "2026-08-15T22:15:00Z"
  }'
```

---

## 5. NestJS Implementation Blueprint for Backend Developers

Backend developers should create directory `niklo-main/ai-planner-service` and copy the following components.

### 5.1. `nginx.conf` Update

Add the following block to `niklo-main/nginx.conf` under `server { ... }`:

```nginx
    location /api/v1/ai-planner {
      set $upstream_ai_planner http://ai-planner-service:3015;
      proxy_pass $upstream_ai_planner$request_uri;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
```

### 5.2. `docker-compose.yaml` Service Block

Add the following service entry to `niklo-main/docker-compose.yaml`:

```yaml
  ai-planner-service:
    environment:
      NODE_ENV: development
      PORT: 3015
      DB_HOST: postgres-db
      DB_PORT: 5432
      DB_USERNAME: niklo_ai_planner
      DB_USER: niklo_ai_planner
      DB_PASSWORD: niklo_ai_planner_password
      DB_NAME: niklo_ai_planner
      JWT_SECRET: ${JWT_SECRET:-change-me-before-deploy}
      BOOKING_SERVICE_URL: http://booking-service:3014
      BUS_SERVICE_URL: http://bus-service:3003
      RIDE_SERVICE_URL: http://ride-service:3005
    depends_on:
      - postgres-db
    expose:
      - '3015'
    healthcheck:
      test:
        - CMD-SHELL
        - wget -q -O /dev/null http://127.0.0.1:3015/ || exit 1
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    labels:
      - traefik.enable=true
      - "traefik.http.routers.ai-planner-service.rule=Host(`aiplanner.187.127.157.13.sslip.io`)"
      - traefik.http.services.ai-planner-service.loadbalancer.server.port=3015
    build:
      context: ./ai-planner-service
```

### 5.3. `ai-planner.controller.ts` Boilerplate

```typescript
import { Controller, Post, Get, Put, Delete, Body, Param, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { PlanJourneyDto, BookMultiModalDto, SaveJourneyDto, UpdateAlertsDto, OptimizeScheduleDto } from './dto/ai-planner.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/ai-planner')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Post('plan-journey')
  @HttpCode(HttpStatus.OK)
  async planJourney(@Body() dto: PlanJourneyDto) {
    const data = await this.aiPlannerService.planJourney(dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('book-multimodal')
  @HttpCode(HttpStatus.OK)
  async bookMultiModal(@Request() req: any, @Body() dto: BookMultiModalDto) {
    const data = await this.aiPlannerService.bookMultiModal(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved-journeys')
  async getSavedJourneys(@Request() req: any) {
    const data = await this.aiPlannerService.getSavedJourneys(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('save-journey')
  @HttpCode(HttpStatus.OK)
  async saveJourney(@Request() req: any, @Body() dto: SaveJourneyDto) {
    const data = await this.aiPlannerService.saveJourney(req.user.id, dto);
    return { success: true, statusCode: 200, message: 'Journey successfully saved to profile', data };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('saved-journeys/:id')
  async deleteSavedJourney(@Request() req: any, @Param('id') id: string) {
    await this.aiPlannerService.deleteSavedJourney(req.user.id, id);
    return { success: true, statusCode: 200, message: 'Saved journey deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('alerts')
  async getAlerts(@Request() req: any) {
    const data = await this.aiPlannerService.getAlerts(req.user.id);
    return { success: true, statusCode: 200, data };
  }

  @UseGuards(JwtAuthGuard)
  @Put('alerts')
  async updateAlerts(@Request() req: any, @Body() dto: UpdateAlertsDto) {
    const data = await this.aiPlannerService.updateAlerts(req.user.id, dto);
    return { success: true, statusCode: 200, data };
  }

  @Post('smart-schedule-optimizer')
  @HttpCode(HttpStatus.OK)
  async optimizeSchedule(@Body() dto: OptimizeScheduleDto) {
    const data = await this.aiPlannerService.optimizeSchedule(dto);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 6. Flutter UI to Backend Data Mapping Matrix

| Flutter Screen / Provider | Backend Route | Primary JSON Key Mapping |
|---|---|---|
| `journey_planner_screen.dart` | `POST /api/v1/ai-planner/plan-journey` | `source_location`, `destination_location`, `travel_date`, `passengers_count` |
| `recommended_journey_planner_screen.dart` | `POST /api/v1/ai-planner/plan-journey` | `options[].category`, `total_fare`, `total_duration`, `badge_label`, `transport_modes` |
| `journey_details_screen.dart` | `POST /api/v1/ai-planner/book-multimodal` | `options[].legs`, `available_seats`, `estimated_fare`, `master_booking_id` |
| `saved_journeys_screen.dart` | `GET / DELETE /api/v1/ai-planner/saved-journeys` | `data[].journey_id`, `source_name`, `destination_name`, `total_fare` |
| `journey_alerts_screen.dart` | `GET / PUT /api/v1/ai-planner/alerts` | `departure_reminder`, `price_drop_alert`, `delay_notification`, `boarding_gate_update` |
| `smart_schedule_optimizer_screen.dart` | `POST /api/v1/ai-planner/smart-schedule-optimizer` | `recommended_departure`, `recommended_buffer_minutes`, `traffic_condition` |
| `offline_itinerary_screen.dart` | `GET /api/v1/bookings/:id` | `master_booking_id`, `qr_code`, `status`, `passenger_details` |

---

## 7. Production Verification & Status 200 OK Checklist

Before deploying the AI Journey Planner microservice, verify:
- [ ] PostgreSQL tables (`ai_journey_plans`, `user_saved_journeys`, `journey_alerts`) created without errors.
- [ ] `nginx.conf` forwards `/api/v1/ai-planner` requests to `ai-planner-service:3015`.
- [ ] `POST /api/v1/ai-planner/plan-journey` returns **HTTP 200 OK** with structured multi-leg journey options.
- [ ] `POST /api/v1/ai-planner/book-multimodal` creates `JOURNEY_LEG` entries in `booking-service` and returns Razorpay payment payload.
- [ ] `GET / POST / DELETE` saved journey endpoints operate cleanly with user JWT.
- [ ] `GET / PUT` alerts endpoints update preferences in `journey_alerts` table.
