# Niklo — Car Rides Module Production Backend Specification & API Blueprint

> **Target Microservices**: `ride-service` (`niklo-main/ride-service`, Port `3005`) & `driver-service` (`niklo-main/driver-service`, Port `3006`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/car_rides` ([ride_models.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/car_rides/data/models/ride_models.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Car Rides Module** ([ride_models.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/car_rides/data/models/ride_models.dart)) handles dynamic fare estimates, surge pricing multipliers, on-demand cab dispatch, driver matching, OTP verification, live WebSocket driver tracking, and trip cancellation.

In `niklo-main`, Nginx strips WebSocket headers, forcing the Flutter client to fall back on polling every 3 seconds. Furthermore, driver dispatch lacks Redis Geo spatial radial queries (`GEORADIUS`), and route geometry polyline calculations are missing.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter App Enum / Model | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `RideType` | 🟢 Matches | `MINI`, `SEDAN`, `SUV`, `PREMIUM`, `OUTSTATION`, `HOURLY` | Maintain enum compatibility |
| `RideStatus` | 🟡 `SEARCHING` unhandled | `REQUESTED`, `ACCEPTED`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | Support `SEARCHING` wire response string |
| `RideEstimate` | 🟡 Basic distance | `fareEstimate NUMERIC`, `surgeMultiplier NUMERIC`, `distanceKm NUMERIC`, `estimatedTimeMins INT` | Integrate OSRM / Google Directions API |
| `RideRequestResult` | 🟢 Basic match | `rideId UUID`, `status STRING`, `message STRING`, `scheduledAt TIMESTAMPTZ` | Standardize wire format |
| Driver Matching | ❌ Database scan | Redis Geo 3km radial query (`GEOSEARCH driver_locations BYLONLAT ...`) | Implement Redis Geo dispatch |
| Live GPS WebSockets | ❌ Nginx header strip | Socket.IO server on `ride-service` + Nginx `Upgrade: websocket` | Upgrade Nginx reverse proxy |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_ride`):

```sql
-- PostgreSQL Migration DDL for Car Rides Module (ride-service & driver-service DB)

CREATE TYPE ride_type_enum AS ENUM ('MINI', 'SEDAN', 'SUV', 'PREMIUM', 'OUTSTATION', 'HOURLY');
CREATE TYPE ride_status_enum AS ENUM ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    photo_url TEXT NULL,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    ride_type ride_type_enum DEFAULT 'SEDAN',
    current_latitude NUMERIC(10, 6) NULL,
    current_longitude NUMERIC(10, 6) NULL,
    is_online BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    driver_id UUID NULL REFERENCES drivers(id) ON DELETE SET NULL,
    ride_type ride_type_enum DEFAULT 'SEDAN',
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_latitude NUMERIC(10, 6) NOT NULL,
    pickup_longitude NUMERIC(10, 6) NOT NULL,
    dropoff_latitude NUMERIC(10, 6) NOT NULL,
    dropoff_longitude NUMERIC(10, 6) NOT NULL,
    otp VARCHAR(6) DEFAULT '1234',
    distance_km NUMERIC(6, 2) NOT NULL,
    estimated_time_mins INT NOT NULL,
    fare_amount NUMERIC(10, 2) NOT NULL,
    surge_multiplier NUMERIC(3, 2) DEFAULT 1.0,
    status ride_status_enum DEFAULT 'REQUESTED',
    scheduled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rides_user ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
```

---

## 3. Production Infrastructure & WebSockets Setup

### Nginx Reverse Proxy Upgrade Block (`nginx.conf`):
```nginx
location /api/v1/ride {
  proxy_pass http://ride-service:3005;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "Upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 4. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 4.1. Estimate Fare
- **Method**: `POST`
- **Route**: `/api/v1/ride/estimate`

#### Request Body Schema:
```json
{
  "pickupLatitude": 15.4989,
  "pickupLongitude": 73.8278,
  "dropoffLatitude": 15.2531,
  "dropoffLongitude": 73.9214,
  "rideType": "SEDAN"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "fareEstimate": 450.00,
    "surgeMultiplier": 1.0,
    "distanceKm": 18.5,
    "estimatedTimeMins": 32,
    "polyline": "a1b2c3d4e5..."
  }
}
```

---

### 4.2. Request Ride
- **Method**: `POST`
- **Route**: `/api/v1/ride/request`

#### Request Body Schema:
```json
{
  "rideType": "SEDAN",
  "pickupAddress": "Panaji Jetty, Goa",
  "dropoffAddress": "Calangute Beach, Goa",
  "pickupLatitude": 15.4989,
  "pickupLongitude": 73.8278,
  "dropoffLatitude": 15.5439,
  "dropoffLongitude": 73.7553
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "rideId": "rd_cab_9910",
    "status": "SEARCHING",
    "message": "Searching for nearby drivers"
  }
}
```

---

## 5. NestJS Controller Blueprint for `ride-service`

Update `niklo-main/ride-service/src/rides/rides.controller.ts`:

```typescript
import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RidesService } from './rides.service';

@Controller('api/v1/ride')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  async estimateFare(@Body() dto: any) {
    const data = await this.ridesService.estimateFare(dto);
    return { success: true, statusCode: 200, data };
  }

  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestRide(@Body() dto: any) {
    const data = await this.ridesService.requestRide(dto);
    return { success: true, statusCode: 200, data };
  }

  @Get(':id/status')
  async getRideStatus(@Param('id') id: string) {
    const data = await this.ridesService.getRideStatus(id);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 6. Flutter Dart Model to Backend Field Mapping

| Flutter `RideEstimate` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `fareEstimate` | `fareEstimate` | `fare_amount` | Calculated numeric fare |
| `surgeMultiplier` | `surgeMultiplier` | `surge_multiplier` | Multiplier e.g., 1.2 |
| `distanceKm` | `distanceKm` | `distance_km` | Distance in KM |
| `estimatedTimeMins` | `estimatedTimeMins` | `estimated_time_mins` | Duration in minutes |
| `rideId` | `rideId` | `id` | Ride UUID |
| `status` | `status` | `status` | `SEARCHING`, `REQUESTED`, etc. |

---

## 7. Definition of Done Checklist
- [ ] Nginx gateway updated with `Upgrade: websocket` headers for live Socket.IO connection.
- [ ] Redis Geo radial query (`GEOSEARCH`) implemented for 3km driver dispatch.
- [ ] `POST /api/v1/ride/estimate` returns `RideEstimate` JSON matching Flutter `ride_models.dart`.
