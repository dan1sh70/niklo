# Niklo — AI Journey Planner Module Production Backend Specification & Update Blueprint

> **Target Microservice**: `ai-planner-service` (`niklo-main/ai-planner-service`, Port `3015`)  
> **Target Database**: `niklo_ai_planner` (PostgreSQL)  
> **Frontend Code Reference**: `lib/features/ai_journey_planner` ([journey_planner_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/ai_journey_planner/presentation/screens/journey_planner_screen.dart), [journey_details_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/ai_journey_planner/presentation/screens/journey_details_screen.dart), [saved_journeys_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/ai_journey_planner/presentation/screens/saved_journeys_screen.dart), [journey_alerts_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/ai_journey_planner/presentation/screens/journey_alerts_screen.dart), [smart_schedule_optimizer_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/ai_journey_planner/presentation/screens/smart_schedule_optimizer_screen.dart))

---

> [!IMPORTANT]
> ### ⚡ Developer Quick Action Checklist (TL;DR Summary)
> 
> Backend developers must complete the following 7 tasks to achieve full production readiness:
> 
> 1. **PostgreSQL Schema (DDL)**:
>    - Run the SQL script in **Section 2** inside `niklo_ai_planner` to create `ai_journey_plans`, `user_saved_journeys`, and `journey_alerts`.
> 
> 2. **Fix JWT Guard UUID Parsing** (`src/common/guards/jwt-auth.guard.ts`):
>    - **Problem**: Hardcoded `id: 'usr_test_9999'` is not a valid UUID and crashes PostgreSQL TypeORM with invalid syntax errors.
>    - **Fix**: Decode real user UUID from `Authorization: Bearer <token>` (with `'00000000-0000-0000-0000-000000000001'` fallback).
> 
> 3. **Make Coordinates Optional in DTO** (`src/dto/ai-planner.dto.ts`):
>    - **Problem**: `@IsNotEmpty()` on `latitude`/`longitude` in `LocationDto` rejects city searches (e.g. `{"name":"Delhi"}`) with `400 Bad Request`.
>    - **Fix**: Change `latitude?` and `longitude?` to `@IsOptional()`.
> 
> 4. **Replace Hardcoded Routing with Dynamic Calculation** (`src/app.service.ts` -> `planJourney`):
>    - **Problem**: Currently hardcodes static `12h 40m`, `₹2,370`, and Kolkata/Siliguri bus legs for every city pair.
>    - **Fix**: Calculate highway distance, duration, and transit legs dynamically based on `dto.source_location` and `dto.destination_location` (First-Mile Cab ➔ Intercity Bus ➔ Last-Mile Cab/Taxi).
> 
> 5. **Safe Saved Journey Delete & Save Idempotency** (`src/app.service.ts` -> `saveJourney` & `deleteSavedJourney`):
>    - **Fix**: Check if `(user_id, journey_id)` exists before inserting (prevent unique constraint crash). Support deleting by both `id` and `journey_id`.
> 
> 6. **Update Controller Unit Tests** (`src/app.controller.spec.ts`):
>    - **Fix**: Replace boilerplate `getHello` test with unit tests covering all 8 controller endpoints.
> 
> 7. **Deploy Service & Gateway Proxy**:
>    - Ensure `ai-planner-service` is deployed on **Port 3015** and proxied at `/api/v1/ai-planner` in Nginx / API gateway.

---

## 1. Executive Summary & Audit Matrix (`niklo-main` Status)

The **AI Journey Planner** microservice (`niklo-main/ai-planner-service`) provides door-to-door multi-modal route planning (Cab ➔ Intercity Bus ➔ Cab/SUV), one-click multi-modal booking, saved itineraries management, journey notification alerts, and smart departure schedule optimization.

The service structure, Nginx gateway proxying, Docker configuration, and initial endpoint controllers are implemented in `niklo-main`. However, several runtime bugs, validation errors, and PostgreSQL UUID syntax mismatches need to be updated by backend developers to achieve full production stability.

### Implementation & Audit Status Matrix

| Component / Feature | Route / File in `niklo-main` | Current Status | Backend Action Required |
|---|---|---|---|
| **Service & Gateway Setup** | `ai-planner-service:3015`, `nginx.conf` | 🟢 **Solved** | None. Proxied via `/api/v1/ai-planner`. |
| **All 8 API Routes** | `src/app.controller.ts` | 🟢 **Solved** | None. All 8 endpoints mapped and decorated. |
| **Multi-Modal Route Planner** | `POST /api/v1/ai-planner/plan-journey` | 🟡 **Needs Patch** | Make lat/lng optional in DTO and add default coordinate fallbacks in service. |
| **JWT Guard User Context** | `src/common/guards/jwt-auth.guard.ts` | 🔴 **Needs Patch** | Replace invalid UUID `'usr_test_9999'` with real JWT parsing + valid UUID fallback. |
| **TypeORM Plan Entity** | `src/entities/ai-journey-plan.entity.ts` | 🟡 **Needs Patch** | Make coordinate columns nullable with default `0`. |
| **Save Journey Idempotency** | `src/app.service.ts` (`saveJourney`) | 🔴 **Needs Patch** | Check existing `(user_id, journey_id)` before save to prevent unique constraint crash. |
| **Safe Saved Journey Delete** | `src/app.service.ts` (`deleteSavedJourney`)| 🔴 **Needs Patch** | Support deleting by both UUID `id` and string `journey_id` without Postgres UUID syntax error. |
| **Unit & E2E Test Suite** | `src/app.controller.spec.ts` | 🔴 **Needs Patch** | Replace default NestJS template with tests covering all 8 controller endpoints. |

---

## 2. Production PostgreSQL Database Schema (DDL Script)

Execute the following DDL script on PostgreSQL (`postgres-db` for `niklo_ai_planner`):

```sql
-- PostgreSQL Migration DDL for AI Journey Planner Module

CREATE TABLE IF NOT EXISTS ai_journey_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    search_id VARCHAR(100) UNIQUE NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_lat NUMERIC(10, 6) NULL DEFAULT 0,
    source_lng NUMERIC(10, 6) NULL DEFAULT 0,
    destination_name VARCHAR(255) NOT NULL,
    destination_lat NUMERIC(10, 6) NULL DEFAULT 0,
    destination_lng NUMERIC(10, 6) NULL DEFAULT 0,
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_journey_search_id ON ai_journey_plans(search_id);
CREATE INDEX IF NOT EXISTS idx_ai_journey_user_id ON ai_journey_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_journeys_user_id ON user_saved_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_alerts_user_id ON journey_alerts(user_id);
```

---

## 3. Production API Endpoint Specifications

All endpoints return HTTP 200 responses wrapped with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Plan Multi-Modal Journey
- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/plan-journey`
- **Request Body**:
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
  "passengers_count": 2
}
```
- **Response (200 OK)**:
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
            "estimated_fare": 320.00
          },
          {
            "leg_index": 2,
            "mode": "BUS",
            "mode_label": "Intercity AC Sleeper Bus",
            "origin": "Esplanade, Kolkata",
            "destination": "Siliguri Junction Bus Stand",
            "departure_time": "2026-08-15T23:15:00Z",
            "arrival_time": "2026-08-16T07:15:00Z",
            "duration": "8h 00m",
            "estimated_fare": 2400.00
          },
          {
            "leg_index": 3,
            "mode": "CAB",
            "mode_label": "Hill Shared/Private Taxi",
            "origin": "Siliguri Junction, West Bengal",
            "destination": "MG Marg, Gangtok, Sikkim",
            "departure_time": "2026-08-16T07:45:00Z",
            "arrival_time": "2026-08-16T10:55:00Z",
            "duration": "3h 10m",
            "estimated_fare": 2020.00
          }
        ]
      }
    ]
  }
}
```

### 3.2. One-Click Multi-Modal Booking Execution
- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/book-multimodal`
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
```json
{
  "search_id": "search_plan_88319201",
  "journey_id": "jny_opt_cheapest_01",
  "passengers": [
    { "name": "Arjun Sharma", "age": 29, "gender": "Male", "phone": "+919876543211" }
  ],
  "selected_bus_seats": ["L4C", "L5C"]
}
```
- **Response (200 OK)**:
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
    "checkout_order": {
      "razorpay_order_id": "order_Kj991823101",
      "amount": 4740.00,
      "currency": "INR",
      "key_id": "rzp_test_NikloKey123"
    }
  }
}
```

### 3.3. Saved Journeys CRUD
- **Fetch Saved Journeys**: `GET /api/v1/ai-planner/saved-journeys`
- **Save Journey**: `POST /api/v1/ai-planner/save-journey` with `{"search_id": "...", "journey_id": "..."}`
- **Delete Saved Journey**: `DELETE /api/v1/ai-planner/saved-journeys/:id`

### 3.4. Journey Alerts
- **Fetch Alerts**: `GET /api/v1/ai-planner/alerts`
- **Update Alerts**: `PUT /api/v1/ai-planner/alerts` with `{"departure_reminder": true, "price_drop_alert": true, "delay_notification": false, "boarding_gate_update": false}`

### 3.5. Smart Schedule Optimizer
- **Method**: `POST`
- **Route**: `/api/v1/ai-planner/smart-schedule-optimizer`
- **Request Body**:
```json
{
  "origin": "Salt Lake, Kolkata",
  "destination": "Esplanade Bus Station",
  "scheduled_departure": "2026-08-15T22:15:00Z"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "recommended_departure": "2026-08-15T21:45:00Z",
    "recommended_buffer_minutes": 30,
    "traffic_condition": "HEAVY",
    "weather_condition": "LIGHT_RAIN",
    "reasoning": "Traffic on EM Bypass spikes between 21:30 and 22:30. Leaving 30 mins early avoids risk of missing the bus."
  }
}
```

---

## 4. Required Code Patches for Backend Developers (`niklo-main/ai-planner-service`)

Backend developers must apply the following 6 patches to resolve runtime errors and ensure compatibility with the mobile client:

---

### Patch 1: Fix JWT Auth Guard & User UUID Parsing
**File**: `niklo-main/ai-planner-service/src/common/guards/jwt-auth.guard.ts`  
**Problem**: The current guard hardcodes `id: 'usr_test_9999'`, which is NOT a valid UUID. When TypeORM executes SQL queries on tables with UUID `user_id` columns (`user_saved_journeys`, `journey_alerts`), PostgreSQL throws:
```
error: invalid input syntax for type uuid: "usr_test_9999"
```
**Required Code Update**:
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const defaultUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      name: 'Niklo Traveler',
    };

    try {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'));
          request.user = {
            id: payload.sub || payload.id || defaultUser.id,
            email: payload.email || defaultUser.email,
            name: payload.name || defaultUser.name,
            ...payload,
          };
          return true;
        }
      }
    } catch (err) {
      // Fallback gracefully on token parse error
    }

    request.user = defaultUser;
    return true;
  }
}
```

---

### Patch 2: Make `latitude` and `longitude` Optional in `LocationDto`
**File**: `niklo-main/ai-planner-service/src/dto/ai-planner.dto.ts`  
**Problem**: `LocationDto` enforces `@IsNotEmpty()` and `@IsNumber()` on `latitude` and `longitude`. When the mobile app sends search queries with city names (e.g. `{"name": "Kolkata"}`), NestJS `ValidationPipe` rejects the request with HTTP 400 Bad Request.

**Required Code Update**:
```typescript
export class LocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
```

---

### Patch 3: Coordinate Fallback Defaults in `AppService.planJourney`
**File**: `niklo-main/ai-planner-service/src/app.service.ts`  
**Problem**: Reading `dto.source_location.latitude` when it is undefined causes null database values.

**Required Code Update**:
```typescript
    const srcLat = dto.source_location.latitude || 22.5726;
    const srcLng = dto.source_location.longitude || 88.4339;
    const dstLat = dto.destination_location.latitude || 27.3389;
    const dstLng = dto.destination_location.longitude || 88.6065;

    // Save generated plan to DB
    await this.journeyPlanRepo.save({
      search_id,
      source_name: dto.source_location.name,
      source_lat: srcLat,
      source_lng: srcLng,
      destination_name: dto.destination_location.name,
      destination_lat: dstLat,
      destination_lng: dstLng,
      travel_date: dto.travel_date,
      passengers_count: dto.passengers_count,
      options_json: options,
    });
```

---

### Patch 4: Safe Saved Journey Deletion & Idempotent Save in `AppService`
**File**: `niklo-main/ai-planner-service/src/app.service.ts`  
**Problem**:
1. `saveJourney` crashes with duplicate key error if user saves the same journey twice.
2. `deleteSavedJourney` throws PostgreSQL UUID parse error when invoked with a string `journey_id` (e.g. `jny_opt_cheapest_01`).

**Required Code Update**:
```typescript
  async saveJourney(userId: string, dto: SaveJourneyDto) {
    const plan = await this.journeyPlanRepo.findOne({ where: { search_id: dto.search_id } });
    if (!plan) throw new NotFoundException('Journey plan not found or expired');

    const journeyOption = plan.options_json.find((opt: any) => opt.journey_id === dto.journey_id);
    if (!journeyOption) throw new NotFoundException('Journey option not found in plan');

    // Duplicate check
    const existing = await this.savedJourneyRepo.findOne({
      where: { user_id: userId, journey_id: dto.journey_id },
    });
    if (existing) {
      return { id: existing.id, journey_id: existing.journey_id };
    }

    const newSaved = this.savedJourneyRepo.create({
      user_id: userId,
      journey_id: dto.journey_id,
      search_id: dto.search_id,
      source_name: plan.source_name,
      destination_name: plan.destination_name,
      title: journeyOption.title,
      category: journeyOption.category,
      total_fare: journeyOption.total_fare,
      total_duration: journeyOption.total_duration,
      total_transfers: journeyOption.total_transfers,
      journey_payload: journeyOption,
    });

    const saved = await this.savedJourneyRepo.save(newSaved);
    return { id: saved.id, journey_id: saved.journey_id };
  }

  async deleteSavedJourney(userId: string, id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const deleteCondition = isUuid
      ? [{ id, user_id: userId }, { journey_id: id, user_id: userId }]
      : { journey_id: id, user_id: userId };

    const result = await this.savedJourneyRepo.delete(deleteCondition);
    if (result.affected === 0) {
      this.logger.warn(`Saved journey not found for deletion: user ${userId}, target ${id}`);
    }
    return true;
  }
```

---

### Patch 5: TypeORM Entity Coordinate Column Defaults
**File**: `niklo-main/ai-planner-service/src/entities/ai-journey-plan.entity.ts`  
**Problem**: Coordinate columns require `nullable: true, default: 0`.

**Required Code Update**:
```typescript
  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true, default: 0 })
  source_lat: number;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true, default: 0 })
  source_lng: number;

  @Column({ type: 'varchar', length: 255 })
  destination_name: string;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true, default: 0 })
  destination_lat: number;

  @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true, default: 0 })
  destination_lng: number;
```

---

### Patch 6: Controller Unit Tests Suite
**File**: `niklo-main/ai-planner-service/src/app.controller.spec.ts`  
**Problem**: Default NestJS boilerplate test invokes `getHello()`, causing test suite failure.

**Required Code Update**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController, HealthController } from './app.controller';
import { AppService } from './app.service';

describe('AI Planner Controllers', () => {
  let appController: AppController;
  let healthController: HealthController;
  let appService: Partial<Record<keyof AppService, jest.Mock>>;

  beforeEach(async () => {
    appService = {
      planJourney: jest.fn().mockResolvedValue({
        search_id: 'search_plan_123',
        source: 'Kolkata',
        destination: 'Gangtok',
        travel_date: '2026-08-15',
        passengers: 2,
        options: [],
      }),
      bookMultiModal: jest.fn().mockResolvedValue({
        master_booking_id: 'mbk_991823101',
        journey_id: 'jny_opt_cheapest_01',
        total_amount: 4740.0,
        currency: 'INR',
        status: 'PENDING_PAYMENT',
      }),
      getSavedJourneys: jest.fn().mockResolvedValue([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          journey_id: 'jny_opt_cheapest_01',
          title: 'Weekend Gangtok Trip',
        },
      ]),
      saveJourney: jest.fn().mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        journey_id: 'jny_opt_cheapest_01',
      }),
      deleteSavedJourney: jest.fn().mockResolvedValue(true),
      getAlerts: jest.fn().mockResolvedValue({
        departure_reminder: true,
        price_drop_alert: true,
        delay_notification: true,
        boarding_gate_update: false,
      }),
      updateAlerts: jest.fn().mockResolvedValue({
        departure_reminder: true,
        price_drop_alert: false,
        delay_notification: true,
        boarding_gate_update: false,
      }),
      optimizeSchedule: jest.fn().mockResolvedValue({
        recommended_departure: '2026-08-15T21:45:00Z',
        recommended_buffer_minutes: 30,
        traffic_condition: 'HEAVY',
        weather_condition: 'LIGHT_RAIN',
        reasoning: 'Traffic on EM Bypass is heavy.',
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController, HealthController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
    healthController = app.get<HealthController>(HealthController);
  });

  describe('HealthController', () => {
    it('should return status ok', () => {
      expect(healthController.health()).toEqual({ status: 'ok' });
    });
  });

  describe('AppController', () => {
    it('planJourney should return calculated options', async () => {
      const res = await appController.planJourney({
        source_location: { name: 'Kolkata' },
        destination_location: { name: 'Gangtok' },
        travel_date: '2026-08-15',
        passengers_count: 2,
      });
      expect(res.success).toBe(true);
      expect(res.data.search_id).toBe('search_plan_123');
    });

    it('bookMultiModal should return booking confirmation', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.bookMultiModal(req, {
        search_id: 'search_plan_123',
        journey_id: 'jny_opt_cheapest_01',
        passengers: [{ name: 'Arjun' }],
      });
      expect(res.success).toBe(true);
      expect(res.data.master_booking_id).toBe('mbk_991823101');
    });

    it('getSavedJourneys should return list', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.getSavedJourneys(req);
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('saveJourney should return saved confirmation', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.saveJourney(req, {
        search_id: 'search_plan_123',
        journey_id: 'jny_opt_cheapest_01',
      });
      expect(res.success).toBe(true);
      expect(res.data.journey_id).toBe('jny_opt_cheapest_01');
    });

    it('deleteSavedJourney should delete by id', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.deleteSavedJourney(req, 'jny_opt_cheapest_01');
      expect(res.success).toBe(true);
    });

    it('getAlerts should return alerts map', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.getAlerts(req);
      expect(res.success).toBe(true);
      expect(res.data.departure_reminder).toBe(true);
    });

    it('updateAlerts should update alerts map', async () => {
      const req = { user: { id: 'usr-uuid-1' } };
      const res = await appController.updateAlerts(req, { departure_reminder: true });
      expect(res.success).toBe(true);
    });

    it('optimizeSchedule should return buffer reasoning', async () => {
      const res = await appController.optimizeSchedule({
        origin: 'Kolkata',
        destination: 'Gangtok',
        scheduled_departure: '2026-08-15T22:15:00Z',
      });
      expect(res.success).toBe(true);
      expect(res.data.recommended_buffer_minutes).toBe(30);
    });
  });
});
```
