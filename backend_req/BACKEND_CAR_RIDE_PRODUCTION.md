# 🚗 Senior Architect & Product Design Production Audit: Car Ride Dispatch & Driver Lifecycle

**Document Version:** 3.0 (Full-Stack Cross-Audit Edition)  
**Audited By:** Senior Principal System Architect & Lead Product Designer  
**Target Audience:** Backend Engineering Team, DevOps, & Mobile Leads  
**Date:** September 2026 — Updated after full frontend + backend cross-verification  
**Audited Core Services:**
1. **Ride Service:** `niklo-main/ride-service` (Port 3005)
2. **Driver Service:** `niklo-main/driver-service` (Port 3011)
3. **Inter-Service Dependencies:** `niklo-main/user-service` (Port 3002), `niklo-main/payment-service` (Port 3007), `niklo-main/nginx.conf`, `niklo-main/docker-compose.yaml`
4. **Client Applications:** `Niklo-Travel-Booking-App/lib/features/car_rides` (Passenger) & `niklo-partner/lib/features/car_driver` (Driver)

---

## 1. Executive Summary & Readiness Assessment

An exhaustive architectural, security, and product experience review was conducted across the backend microservices governing the Car Ride module. The goal of this audit is to verify that the system can handle real-world scale, network volatility, concurrent driver requests, accurate fare settlements, and seamless UX transitions without crashes, deadlocks, or financial discrepancies.

### Overall Production Readiness: 🔴 **NOT PRODUCTION READY (Score: 38 / 100)**
A full cross-system audit (backend + both Flutter apps) confirmed the original backend gaps and uncovered **9 additional critical blockers** in the frontend↔backend integration layer. The system now has a combined total of **23 gaps** — 9 critical, 9 high, and 5 medium — that will cause incorrect fare settlements, rides that can never start, and passengers with no live driver tracking.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     READINESS SCORE BREAKDOWN (v3.0)                   │
├────────────────────────┬─────────┬─────────────────────────────────────┤
│ Dimension              │ Score   │ Status                              │
├────────────────────────┼─────────┼─────────────────────────────────────┤
│ Architecture & Scale   │ 40/100  │ 🔴 Deadlocks in Matching            │
│ Real-Time / WebSockets │ 35/100  │ 🔴 Passenger never joins socket room │
│ Data & Financial Flow  │ 25/100  │ 🔴 fare_final NEVER recalculated    │
│ UX State Integrity     │ 45/100  │ 🔴 Ride can never start (OTP bug)   │
│ Security & Privacy     │ 35/100  │ 🔴 API key in source + no auth      │
│ Code Quality & Typing  │ 60/100  │ 🟡 Missing Global Validation Pipes  │
└────────────────────────┴─────────┴─────────────────────────────────────┘
```

---

## 2. Senior Designer & Architect Defect Matrix

| ID | Domain | Severity | Issue Summary | Production Impact | Verdict |
|---|---|---|---|---|---|
| **GAP-01** | **Gateway** | 🔴 Critical | `nginx.conf` lacks `/socket.io/` upstream proxy | WebSockets fail behind gateway; clients forced to poll | **Must Fix before staging deploy** |
| **GAP-02** | **Dispatch** | 🔴 Critical | No 30s timeout or queue consumer in `matchDriver()` | If driver ignores request, ride hangs in `REQUESTED` forever | **Must Implement distributed timer** |
| **GAP-03** | **Redis Pool** | 🔴 Critical | `drivers:online` ZSET lacks TTL; ghost drivers persist | Offline/disconnected drivers are continuously dispatched | **Must Prune stale entries on search** |
| **GAP-04** | **Routing** | 🔴 Critical | Double prefix bug in `driver-service` (`/api/v1/driver/api/v1/driver/...`) | All driver profile, bank detail & KYC API calls 404 | **Must Remove `@Controller('api/v1/driver')`** |
| **GAP-05** | **Inter-Service** | 🔴 Critical | Missing `GET /api/v1/driver/:id/profile` in `driver-service` | `ride-service` gets 404; passenger sees `null` driver details | **Must Add composite profile endpoint** |
| **GAP-06** | **Inter-Service** | 🟠 High | Missing internal `GET /api/v1/user/:id/profile` in `user-service` | Driver receives dummy name `"Passenger Name"` & `+919999999999` | **Must Add internal user lookup** |
| **GAP-07** | **Database** | 🔴 Critical | `DriverBankDetail` & `DriverSession` missing from `database.config.ts` | TypeORM skips table creation; runtime SQL crash on bank/session | **Must Add entities to TypeORM config** |
| **GAP-08** | **Financial** | 🔴 Critical | `completeRide` does not trigger driver earning or wallet credit | Drivers complete trips but their earnings stay ₹0 | **Must Call `driver-service` earnings API** |
| **GAP-09** | **UX / Tracking** | 🟠 High | `GET /api/v1/ride/:id/status` returns `currentLocation: null` | Passenger map cannot render live car location on polling fallback | **Must Read `driver:loc:{id}` from Redis** |
| **GAP-10** | **UX / State** | 🟠 High | Missing `GET /api/v1/ride/active` and `/ride/driver/active` | App restart mid-trip strands users on the home screen | **Must Provide active trip recovery** |
| **GAP-11** | **Security** | 🔴 Critical | `JwtAuthGuard` does not verify signatures; falls back to `defaultUser` | Unauthenticated callers can view, book, or cancel any ride | **Must Verify JWT cryptographic signature** |
| **GAP-12** | **Security** | 🔴 Critical | `driver-service` controllers have zero guards or auth checks | Public callers can manipulate driver bank accounts and payouts | **Must Apply `JwtAuthGuard` across all routes** |
| **GAP-13** | **Anti-Fraud** | 🟠 High | No rate-limiting or lockout on `verify-otp` | Rogue drivers can brute-force 4/6-digit OTP to steal trips | **Must Lock after 3 failed OTP attempts** |
| **GAP-14** | **Schema** | 🟡 Medium | Rating payload field mismatch (`comment` vs `feedback`) | Passenger review feedback is discarded and saved as `null` | **Must Accept both `feedback` and `comment`** |
| **GAP-15** | **Socket Handlers** | 🟠 High | `DriverGateway` lacks `driver:go_offline` and `ride:arrived` handlers | Offline toggles and arrival events over socket are silently dropped | **Must Wire socket handlers in gateway** |
| **GAP-16** | **Financial** | 🔴 Critical | `completeRide` ignores `finalLat`/`finalLng` — sets `fare_final = fare_amount` | Every completed ride shows booking estimate, not actual distance fare | **Must Implement Haversine recalculation** |
| **GAP-17** | **Financial** | 🔴 Critical | `getMyRides` maps `fare_final: r.fare_amount` not `r.fare_final` | Passenger history always shows booking estimate; never actual fare | **Must Fix mapping: `r.fare_final ?? r.fare_amount`** |
| **GAP-18** | **Defaults** | 🔴 Critical | `controller.completeRide` fallback: `finalLat ?? 12.9716` (Bengaluru) | Trip completed in any city uses Bengaluru GPS — wrong fare calculated | **Must pass null, not a city coordinate** |
| **GAP-19** | **Defaults** | 🔴 Critical | `goOnline`/`goOffline` controller defaults to hardcoded ghost driverId | Any malformed request registers a permanent ghost in the driver pool | **Must reject missing driverId with 400** |
| **GAP-20** | **Dispatch** | 🔴 Critical | `matchDriver` initial path doesn't check `ride:tried` set — same driver offered twice | Race window: rejected driver can re-enter pool and get the same ride again | **Must check tried-set in both dispatch paths** |
| **GAP-21** | **OTP** | 🔴 Critical | Backend generates 6-digit OTP; driver Flutter app enforces exactly 4 digits | OTP entry always fails; ride can never start | **Must unify to 4-digit OTP on backend** |
| **GAP-22** | **Socket / Passenger** | 🔴 Critical | Passenger Flutter app has no WebSocket connection to `/passenger` namespace | Driver's live location never reaches passenger; status changes delayed 3s | **Must add Socket.IO connect + `join:ride` in `ride_matched_screen.dart`** |
| **GAP-23** | **Security** | 🔴 Critical | Google Maps API key hardcoded in Flutter source (`ride_matched_screen.dart:66`) | Key extracted from APK and abused for billing within hours | **Must move to `--dart-define`; restrict in Google Cloud Console** |

---

## 3. End-to-End System State Machine & Sequence Architecture

### 3.1 State Machine Specification

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: Passenger books ride
    REQUESTED --> CANCELLED: Passenger cancels (No Fee) OR 3 Driver Timeouts (No Drivers)
    REQUESTED --> ACCEPTED: Driver accepts ride
    
    ACCEPTED --> CANCELLED: Passenger cancels (Fee ₹50) OR Driver cancels with reason
    ACCEPTED --> ARRIVED: Driver taps "Arrived at Pickup"
    
    ARRIVED --> CANCELLED: Passenger cancels (Fee ₹50)
    ARRIVED --> IN_PROGRESS: Driver enters valid OTP
    
    IN_PROGRESS --> COMPLETED: Driver taps "Complete Ride" (Re-quote fare + Credit wallet)
    
    COMPLETED --> [*]: Passenger rates trip
    CANCELLED --> [*]: Trip aborted
```

### 3.2 Sequence Flow Diagram (Passenger UX ↔ Backend ↔ Driver UX)

```mermaid
sequenceDiagram
    autonumber
    actor Passenger as Passenger App
    participant Nginx as Nginx Gateway (:80)
    participant RideSvc as Ride Service (:3005)
    participant Redis as Redis (:6379)
    participant DriverSvc as Driver Service (:3011)
    participant UserSvc as User Service (:3002)
    actor Driver as Driver App

    Note over Driver, Redis: Phase 1: Driver Availability & Geopool
    Driver->>Nginx: POST /api/v1/ride/driver/go-online { driverId, lat, lng }
    Nginx->>RideSvc: Proxy /go-online
    RideSvc->>Redis: GEOADD drivers:online lng lat driverId
    RideSvc->>Redis: SETEX driver:loc:{id} 30s { lat, lng, bearing, speed }
    Driver->>Nginx: WS /socket.io/?nsp=/driver (driver:go_online)
    Nginx-->>RideSvc: WS Connection Upgraded

    Note over Passenger, RideSvc: Phase 2: Fare Quote & Ride Request
    Passenger->>Nginx: POST /api/v1/ride/estimate { pickup, drop, rideType }
    Nginx->>RideSvc: Proxy /estimate
    RideSvc-->>Passenger: Fare options (Mini, Sedan, SUV) + Polyline + ETA
    Passenger->>Nginx: POST /api/v1/ride/request { pickup, drop, rideType }
    Nginx->>RideSvc: Create Ride (Status: REQUESTED, OTP: 4/6-digit)
    RideSvc-->>Passenger: { rideId, status: "SEARCHING", message: "Finding drivers" }

    Note over RideSvc, Driver: Phase 3: Driver Matching with 30s Timeout
    RideSvc->>Redis: GEOSEARCH drivers:online (radius 3km -> 8km -> 13km)
    Redis-->>RideSvc: [candidateDriverId]
    RideSvc->>UserSvc: GET /api/v1/user/:userId/profile (Internal)
    UserSvc-->>RideSvc: { name, phone, rating }
    RideSvc->>Redis: PUBLISH ride:new_request_queue
    Redis->>RideSvc: DriverGateway receives message
    RideSvc->>Driver: WS emit('ride:new_request', { rideId, passengerName, fare, pickupAddress, timeout: 30 })
    
    alt Driver Accepts within 30s
        Driver->>Nginx: POST /api/v1/ride/:id/accept { driverId }
        Nginx->>RideSvc: Atomic UPDATE rides SET status='ACCEPTED', driver_id=:driverId WHERE status='REQUESTED'
        RideSvc->>DriverSvc: GET /api/v1/driver/:driverId/profile
        DriverSvc-->>RideSvc: { name, phone, vehicle_number, model, color, rating }
        RideSvc->>Redis: ZREM drivers:online driverId (Remove from pool)
        RideSvc->>Redis: PUBLISH ride:status_update { status: ACCEPTED }
        RideSvc-->>Driver: { success: true, message: "Ride accepted" }
    else Driver Ignores / Times Out (30s)
        RideSvc->>RideSvc: Distributed Timer triggers timeout
        RideSvc->>Redis: SADD ride:tried:{rideId} driverId
        RideSvc->>RideSvc: Re-dispatch to next candidate (matchDriverExcluding)
    end

    Note over Passenger, Driver: Phase 4: Live Tracking & Trip Execution
    loop Every 3 Seconds (Polling Fallback) or Socket Stream
        Passenger->>RideSvc: GET /api/v1/ride/:id/status
        RideSvc->>Redis: GET driver:loc:{driverId}
        RideSvc-->>Passenger: { status, otp, driverDetails: { name, phone, vehicle, currentLocation } }
    end

    Driver->>Nginx: POST /api/v1/ride/:id/arrived
    RideSvc-->>Passenger: Status -> ARRIVED (Show OTP prompt)
    Driver->>Nginx: POST /api/v1/ride/:id/verify-otp { otp }
    RideSvc-->>Driver: Status -> IN_PROGRESS
    Driver->>Nginx: POST /api/v1/ride/:id/complete { finalLat, finalLng }
    RideSvc->>DriverSvc: POST /api/v1/driver/earnings/record { driverId, rideId, amount }
    RideSvc->>Redis: PUBLISH ride:status_update { status: COMPLETED }
    RideSvc-->>Driver: { success: true, status: "COMPLETED" }
    Passenger->>Nginx: POST /api/v1/ride/:id/rate { rating: 5, comment: "Great trip!" }
    RideSvc-->>Passenger: { success: true, message: "Rating submitted" }
```

---

## 4. Complete Production API Specification & Envelope Standards

All responses across `ride-service` and `driver-service` **must adhere to the unified envelope contract**:

```json
// Success Envelope
{
  "success": true,
  "statusCode": 200,
  "data": { ... }
}

// Error Envelope
{
  "success": false,
  "statusCode": 400 | 401 | 403 | 404 | 409 | 500,
  "error": "ErrorCategory",
  "message": "Human-readable description"
}
```

### 4.1 Ride Service Endpoints (`/api/v1/ride`)

#### 1. Estimate Ride (`POST /api/v1/ride/estimate`)
- **Headers:** `Authorization: Bearer <JWT>`
- **Request Body:**
  ```json
  {
    "pickup": { "lat": 12.9716, "lng": 77.5946 },
    "drop": { "lat": 13.0827, "lng": 80.2707 },
    "rideType": "SEDAN"
  }
  ```
- **Response `data`:**
  ```json
  {
    "fareEstimate": 350,
    "surgeMultiplier": 1.0,
    "distanceKm": 18.5,
    "estimatedTimeMins": 32,
    "polyline": "a~l~FjkzbO...",
    "options": [
      {
        "vehicleType": "MINI",
        "label": "Mini",
        "fareEstimate": 280,
        "estimatedTimeMins": 31,
        "etaText": "31 mins",
        "surgeMultiplier": 1.0,
        "distanceKm": 18.5
      },
      {
        "vehicleType": "SEDAN",
        "label": "Sedan",
        "fareEstimate": 350,
        "estimatedTimeMins": 32,
        "etaText": "32 mins",
        "surgeMultiplier": 1.0,
        "distanceKm": 18.5
      },
      {
        "vehicleType": "SUV",
        "label": "SUV",
        "fareEstimate": 450,
        "estimatedTimeMins": 34,
        "etaText": "34 mins",
        "surgeMultiplier": 1.0,
        "distanceKm": 18.5
      }
    ]
  }
  ```

#### 2. Request Ride (`POST /api/v1/ride/request`)
- **Request Body:**
  ```json
  {
    "pickupAddress": "Koramangala 4th Block, Bengaluru",
    "dropAddress": "Indiranagar 100ft Road, Bengaluru",
    "vehicleType": "SEDAN",
    "pickup": { "lat": 12.9352, "lng": 77.6245 },
    "dropoff": { "lat": 12.9716, "lng": 77.6412 },
    "distanceKm": 6.8,
    "fareEstimate": 185
  }
  ```
- **Response `data`:**
  ```json
  {
    "rideId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "SEARCHING",
    "message": "Searching for nearby drivers"
  }
  ```

#### 3. Get Ride Status (`GET /api/v1/ride/:id/status`)
- **Response `data`:**
  ```json
  {
    "rideId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "ACCEPTED",
    "otp": "4821",
    "estimatedArrivalMins": 7,
    "fareFinal": null,
    "driverDetails": {
      "id": "d1111111-1111-1111-1111-111111111111",
      "name": "Rajesh Kumar",
      "phone": "+919876543210",
      "photoUrl": "https://cdn.niklo.com/drivers/rajesh.jpg",
      "rating": 4.85,
      "vehicleNumber": "KA-01-MJ-1234",
      "vehicleModel": "Maruti Suzuki Dzire",
      "vehicleColor": "Silver",
      "vehicleType": "SEDAN",
      "vehicleImageUrl": "https://cdn.nikloapp.com/vehicles/sedan.png",
      "currentLocation": {
        "lat": 12.9380,
        "lng": 77.6210,
        "bearing": 145.2,
        "speed": 28.5
      }
    }
  }
  ```

#### 4. Active Ride State Recovery (`GET /api/v1/ride/active` & `GET /api/v1/ride/driver/active`)
- **Purpose:** Restores ongoing ride state when user or driver reopens the app after force-close/crash.
- **Response `data` (Passenger):**
  ```json
  {
    "hasActiveRide": true,
    "rideId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "IN_PROGRESS"
  }
  ```

#### 5. Verify Ride OTP (`POST /api/v1/ride/:id/verify-otp`)
- **Request Body:**
  ```json
  { "otp": "4821" }
  ```
- **Response `data`:**
  ```json
  {
    "status": "IN_PROGRESS",
    "started_at": "2026-09-19T18:55:00.000Z"
  }
  ```

#### 6. Complete Ride (`POST /api/v1/ride/:id/complete`)
- **Request Body:**
  ```json
  {
    "finalLat": 12.9716,
    "finalLng": 77.6412
  }
  ```
- **Response `data`:**
  ```json
  {
    "status": "COMPLETED",
    "fareFinal": 185,
    "ended_at": "2026-09-19T19:25:00.000Z",
    "message": "Ride completed successfully"
  }
  ```

---

### 4.2 Driver Service Endpoints (`/api/v1/driver`)

#### 1. Get Driver Profile (`GET /api/v1/driver/:id/profile`)
- **Query / Param:** `:id` can be either `driver.id` or `driver.user_id`.
- **Response `data`:**
  ```json
  {
    "id": "d1111111-1111-1111-1111-111111111111",
    "userId": "33333333-3333-3333-3333-333333333333",
    "name": "Rajesh Kumar",
    "phone": "+919876543210",
    "photoUrl": "https://cdn.niklo.com/drivers/rajesh.jpg",
    "vehicle_number": "KA-01-MJ-1234",
    "vehicle_model": "Maruti Suzuki Dzire",
    "vehicle_color": "Silver",
    "vehicle_type": "SEDAN",
    "rating": 4.85,
    "status": "approved",
    "is_online": true
  }
  ```

#### 2. Record Earning (`POST /api/v1/driver/earnings/record`)
- **Request Body:**
  ```json
  {
    "driverId": "d1111111-1111-1111-1111-111111111111",
    "rideId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 148.00,
    "type": "ride_fare"
  }
  ```
- **Response `data`:**
  ```json
  {
    "id": "e1111111-1111-1111-1111-111111111111",
    "amount": 148.00,
    "created_at": "2026-09-19T19:25:01.000Z"
  }
  ```

---

## 5. Real-Time WebSockets & Redis Pub/Sub Protocol

### 5.1 Namespaces & Connection Handshake

| Namespace | Intended Client | Auth Handshake | Heartbeat Interval |
|---|---|---|---|
| `/driver` | Partner App (`niklo-partner`) | `auth: { token: "<JWT>", driverId: "<ID>" }` | Ping/Pong 25s |
| `/passenger` | User App (`Niklo-Travel-Booking-App`) | `auth: { token: "<JWT>" }` | Ping/Pong 25s |

### 5.2 Event Dictionary

#### Driver Inbound Events (`/driver` namespace):
1. `driver:go_online`: `{ driverId: string, lat: number, lng: number }`
2. `driver:go_offline`: `{ driverId: string }`
3. `driver:location`: `{ driverId: string, lat: number, lng: number, bearing: number, speed: number, rideId?: string }`
4. `ride:accepted`: `{ rideId: string, driverId: string }`
5. `ride:rejected`: `{ rideId: string, driverId: string }`
6. `ride:arrived`: `{ rideId: string }`
7. `ride:start`: `{ rideId: string, otp: string }`
8. `ride:end`: `{ rideId: string, finalLat: number, finalLng: number }`

#### Driver Outbound Events (`/driver` namespace):
1. `ride:new_request`:
   ```json
   {
     "rideId": "550e8400-e29b-41d4-a716-446655440000",
     "driverId": "d1111111-1111-1111-1111-111111111111",
     "timeout": 30,
     "pickupAddress": "Koramangala 4th Block",
     "dropAddress": "Indiranagar 100ft Road",
     "fareEstimate": 185,
     "distanceKm": 6.8,
     "passengerName": "Ananya S.",
     "passengerPhone": "+919876543210",
     "otp": "4821"
   }
   ```

#### Passenger Inbound Events (`/passenger` namespace):
1. `join:ride`: `{ rideId: string }`

#### Passenger Outbound Events (`/passenger` namespace):
1. `ride:driver_assigned`: Emitted when driver accepts.
2. `ride:location_update`: Emitted on driver GPS update (`lat`, `lng`, `bearing`, `speed`).
3. `ride:status_change`: Emitted on state changes (`ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

---

## 6. Concurrency, Race Conditions & Edge Cases

### 6.1 Concurrent Driver Acceptance
- **Scenario:** Two drivers receive the same ride broadcast (or sequentially near the timeout boundary) and tap "Accept" simultaneously.
- **Architectural Solution:**
  Use an atomic SQL update query:
  ```typescript
  const result = await this.rideRepository.createQueryBuilder()
    .update(Ride)
    .set({ status: RideStatus.ACCEPTED, driver_id: driverId })
    .where('id = :rideId AND status = :status', { rideId, status: RideStatus.REQUESTED })
    .execute();

  if (result.affected === 0) {
    throw new ConflictException('Ride has already been accepted by another driver or cancelled.');
  }
  ```
  Only the first driver's transaction succeeds; the second receives an HTTP 409 Conflict with a toast message: *"This ride was just taken by another driver."*

### 6.2 Driver Already on Active Ride
- **Scenario:** A driver receives a dispatch while finishing another trip.
- **Architectural Solution:** Before allowing `acceptRide()`, verify that the driver does not have an active trip:
  ```typescript
  const activeTrip = await this.rideRepository.findOne({
    where: {
      driver_id: driverId,
      status: In([RideStatus.ACCEPTED, RideStatus.ARRIVED, RideStatus.IN_PROGRESS]),
    },
  });
  if (activeTrip) {
    throw new BadRequestException('Driver already has an active trip in progress.');
  }
  ```

### 6.3 Passenger Cancellation Rules & Fees
- **Scenario:** Passenger cancels the ride at different stages.
- **Rules:**
  1. If status is `REQUESTED`: Cancellation is **Free** (₹0 fee).
  2. If status is `ACCEPTED` or `ARRIVED`: Cancellation fee of **₹50** is charged to passenger and credited as an incentive to the assigned driver.
  3. If status is `IN_PROGRESS` or `COMPLETED`: Cancellation is **Blocked**. The API returns HTTP 400: *"Cannot cancel a ride that is already in progress."*

---

## 7. Security, Fraud Prevention & PII Compliance

### 7.1 Cryptographic JWT Verification
Replace the base64-split implementation in [jwt-auth.guard.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/jwt-auth.guard.ts) with standard `jsonwebtoken`:

```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'change-me-before-deploy';

    try {
      const decoded = jwt.verify(token, secret) as any;
      request.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        ...decoded,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed or expired');
    }
  }
}
```

### 7.2 OTP Anti-Brute-Force Lockout
In `rides.service.ts`:
```typescript
  async verifyRideOtp(rideId: string, otp: string) {
    const redisClient = this.redisService.getClient();
    const attemptsKey = `ride:otp_attempts:${rideId}`;
    const attempts = await redisClient.incr(attemptsKey);
    
    if (attempts === 1) {
      await redisClient.expire(attemptsKey, 300); // 5 min TTL
    }
    if (attempts > 3) {
      throw new BadRequestException('Too many incorrect OTP attempts. Ride is temporarily locked.');
    }

    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    if (ride.otp !== otp) {
      throw new BadRequestException(`Invalid OTP. ${3 - attempts} attempt(s) remaining.`);
    }

    await redisClient.del(attemptsKey);
    await this.updateRideStatus(rideId, RideStatus.IN_PROGRESS);
  }
```

---

## 8. Step-by-Step Code Fixes & Implementation Plan

### 8.1 Nginx WebSocket Configuration (`niklo-main/nginx.conf`)
Add the following upstream configuration:

```nginx
    # WebSocket support for Ride & Driver Services
    location /socket.io/ {
      proxy_pass http://ride-service:3005;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_read_timeout 3600s;
      proxy_send_timeout 3600s;
    }
```

---

### 8.2 Redis Service: Ghost Driver Pruning (`niklo-main/ride-service/src/redis/redis.service.ts`)

```typescript
  async getNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<string[]> {
    const rawResults = await this.client.geosearch(
      'drivers:online',
      'FROMLONLAT',
      lng,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
    );
    
    if (!rawResults || rawResults.length === 0) return [];

    const validDrivers: string[] = [];
    for (const driverId of rawResults as string[]) {
      const exists = await this.client.exists(`driver:loc:${driverId}`);
      if (exists) {
        validDrivers.push(driverId);
      } else {
        // Prune ghost driver from ZSET
        this.client.zrem('drivers:online', driverId).catch(() => {});
      }
    }

    return validDrivers;
  }
```

---

### 8.3 Driver Service: Fix Route Prefix & Add Profile (`niklo-main/driver-service`)

#### 1. In `drivers.controller.ts`:
Change `@Controller('api/v1/driver')` to `@Controller()` and add `:id/profile` and `earnings/record`:

```typescript
import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { OnboardDriverDto, UploadKycDto } from './dto/create-driver.dto';
import { BankDetailsDto } from './dto/bank-details.dto';

@Controller() // Fixed: avoids /api/v1/driver/api/v1/driver/...
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get(':id/profile')
  async getDriverProfile(@Param('id') driverId: string) {
    const data = await this.driversService.getDriverProfile(driverId);
    return { success: true, statusCode: 200, data };
  }

  @Post('earnings/record')
  async recordEarning(@Body() body: { driverId: string; rideId: string; amount: number }) {
    const data = await this.driversService.recordEarning(body.driverId, body.rideId, body.amount);
    return { success: true, statusCode: 200, data };
  }

  // Existing onboard, kyc, bank-details routes remain unchanged...
}
```

#### 2. In `drivers.service.ts`:
Add implementation for `getDriverProfile` and `recordEarning`:

```typescript
  async getDriverProfile(driverId: string) {
    const driver = await this.driverRepo.findOne({
      where: [{ id: driverId }, { user_id: driverId }],
    });
    if (!driver) throw new NotFoundException(`Driver ${driverId} not found`);

    let name = 'Driver Partner';
    let phone = '';
    let photoUrl = null;

    try {
      const userRes = await axios.get(
        `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${driver.user_id}/profile`,
        { timeout: 3000 }
      );
      if (userRes.data?.data) {
        name = userRes.data.data.name || name;
        phone = userRes.data.data.phone || phone;
        photoUrl = userRes.data.data.avatar_url || null;
      }
    } catch {}

    return {
      id: driver.id,
      userId: driver.user_id,
      name,
      phone,
      photoUrl,
      vehicle_number: driver.vehicle_number,
      vehicle_model: driver.vehicle_type,
      vehicle_color: 'White',
      vehicle_type: driver.vehicle_type,
      rating: 4.85,
      status: driver.status,
      is_online: driver.is_online,
    };
  }

  async recordEarning(driverId: string, rideId: string, amount: number) {
    const earning = this.earningRepo.create({
      driver_id: driverId,
      ride_id: rideId,
      amount,
      type: EarningType.RIDE_FARE,
    });
    return await this.earningRepo.save(earning);
  }
```

---

### 8.4 User Service: Add Internal Profile Lookup (`niklo-main/user-service/src/users/users.controller.ts`)

```typescript
  @Get(':id/profile')
  async getProfileById(@Param('id') userId: string) {
    const data = await this.usersService.findById(userId);
    if (!data) throw new NotFoundException(`User ${userId} not found`);
    return { success: true, statusCode: 200, data };
  }
```

---

## 9. Database Migration SQL (`schema.sql`)

Execute on PostgreSQL instances:

```sql
-- ==========================================================
-- 1. RIDE SERVICE (niklo_ride)
-- ==========================================================
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS driver_name       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS driver_phone      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS driver_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_number    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS vehicle_model     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS vehicle_color     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vehicle_image_url TEXT,
  ADD COLUMN IF NOT EXISTS fare_final        NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS started_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at          TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_rides_user_id_created ON rides (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id_created ON rides (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_active_status ON rides (status)
  WHERE status IN ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS');

-- ==========================================================
-- 2. DRIVER SERVICE (niklo_driver)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON driver_earnings (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_payouts_driver_id ON driver_payouts (driver_id, scheduled_for DESC);
CREATE INDEX IF NOT EXISTS idx_driver_kyc_driver_id ON driver_kyc (driver_id);
```

---

## 10. Senior QA & Release Verification Plan

Before promoting to Staging / Production, both QA and Engineering must verify all 8 acceptance criteria:

1. **Driver Online & Heartbeat:**
   - [ ] Driver goes online. Verify `GEOPOS drivers:online <driverId>` in Redis.
   - [ ] Kill driver app. After 30s, verify driver is excluded from `getNearbyDrivers()`.
2. **Passenger Search & Dispatch:**
   - [ ] Passenger requests ride. Driver receives `ride:new_request` on socket with passenger name & pickup details.
3. **30-Second Timeout Fallback:**
   - [ ] Driver ignores incoming request for 30s. Verify ride is reassigned to next nearby driver.
4. **Acceptance & Data Enrichment:**
   - [ ] Driver accepts. Verify `ride-service` queries `driver-service` and populates driver name, car number, and model on the ride row.
   - [ ] Verify driver is removed from `drivers:online` matching pool while trip is active.
5. **Live Polling Tracking:**
   - [ ] Passenger polls `GET /api/v1/ride/:id/status`. Verify `currentLocation` returns real `{ lat, lng, bearing, speed }` from Redis.
6. **Active Ride Recovery:**
   - [ ] Force close passenger app while `IN_PROGRESS`. Reopen app. Verify app queries `GET /api/v1/ride/active` and restores active ride screen.
7. **OTP & Trip Completion:**
   - [ ] Enter wrong OTP 3 times. Verify lockout.
   - [ ] Enter correct OTP. Trip begins. Driver taps Complete Ride.
   - [ ] Verify `driver_earnings` row is created in `driver-service`.
8. **Rating & Feedback:**
   - [ ] Passenger submits 5-star rating with comment. Verify comment is saved in `ride_ratings` table without field loss.

---

## 11. New Issues Found — Full-Stack Cross-Audit (v3.0)

> The following issues were discovered during a cross-verification of both Flutter apps against the NestJS backend. They are separate from the original GAP-01–GAP-15 findings and must be fixed in **Phase 1** before any production deployment.

---

### GAP-16 · `completeRide` Ignores GPS Coordinates — fare_final Always Wrong

**File:** `ride-service/src/rides/rides.service.ts:444-456`

Despite the driver app correctly sending `finalLat` and `finalLng`, the backend `completeRide()` ignores them entirely:

```typescript
// ❌ CURRENT — always copies the booking estimate
ride.fare_final = ride.fare_amount;
```

**Required Fix — Haversine recalculation from actual end point:**
```typescript
async completeRide(rideId: string, finalLat: number | null, finalLng: number | null) {
  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (!ride) return;

  const endLat = finalLat ?? ride.dropoff_latitude;
  const endLng = finalLng ?? ride.dropoff_longitude;

  // Recalculate actual distance & fare
  const distKm = this._haversine(ride.pickup_latitude, ride.pickup_longitude, endLat, endLng);
  const BASE = 50;
  const RATE: Record<string, number> = { MINI: 12, SEDAN: 15, SUV: 20, PREMIUM: 25, OUTSTATION: 18 };
  const rate = RATE[ride.ride_type?.toUpperCase()] ?? 15;

  ride.fare_final = Math.round((BASE + distKm * rate) * (ride.surge_multiplier || 1.0));
  ride.distance_km = Math.round(distKm * 10) / 10;
  ride.status = RideStatus.COMPLETED;
  ride.started_at = ride.started_at ?? new Date();  // backfill if missing
  ride.ended_at = new Date();

  await this.rideRepository.save(ride);
  await this.redisService.publish(
    'ride:status_update',
    JSON.stringify({ rideId, status: RideStatus.COMPLETED, fareFinal: ride.fare_final }),
  );

  // Trigger driver earnings credit (GAP-08)
  try {
    await axios.post(
      `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/earnings/record`,
      { driverId: ride.driver_id, rideId, amount: ride.fare_final, type: 'ride_fare' },
      { timeout: 5000 },
    );
  } catch (err) {
    this.logger.error(`Failed to record earning for driver ${ride.driver_id}`, err);
  }
}

private _haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

---

### GAP-17 · `getMyRides` Returns Wrong fare_final for Completed Rides

**File:** `ride-service/src/rides/rides.service.ts:485`

```typescript
// ❌ CURRENT — ignores the fare_final column that was just calculated
fare_final: r.status === RideStatus.COMPLETED ? r.fare_amount : null,

// ✅ FIXED
fare_final: r.status === RideStatus.COMPLETED ? (r.fare_final ?? r.fare_amount) : null,
```

---

### GAP-18 · Controller `completeRide` Defaults to Bengaluru Coordinates

**File:** `ride-service/src/rides/rides.controller.ts:74-75`

```typescript
// ❌ CURRENT — Bengaluru hardcoded as fallback for the entire country
const finalLat = body?.finalLat ?? 12.9716;
const finalLng = body?.finalLng ?? 77.5946;

// ✅ FIXED — let the service use booked drop location as fallback
const finalLat = body?.finalLat ?? null;
const finalLng = body?.finalLng ?? null;
```

---

### GAP-19 · `goOnline`/`goOffline` Controller Uses Hardcoded Fake driverId

**File:** `ride-service/src/rides/rides.controller.ts:96, 104`

Any malformed POST request without a `driverId` registers a ghost driver `d1111111-1111-1111-1111-111111111111` permanently in the Redis GeoSET — it can never accept a ride, silently burning dispatch slots.

```typescript
// ❌ CURRENT
const driverId = body.driverId || 'd1111111-1111-1111-1111-111111111111';

// ✅ FIXED
if (!body.driverId) {
  throw new BadRequestException('driverId is required');
}
const driverId = body.driverId;
```

---

### GAP-20 · `matchDriver` (Initial Path) Has No `ride:tried` Deduplication

**File:** `ride-service/src/rides/rides.service.ts:143-200`

The initial `matchDriver()` function does not check `ride:tried:{rideId}` before dispatching. The `matchDriverExcluding()` path (on rejection) correctly uses the tried-set, but the first dispatch does not — meaning if the same driver rejects and re-enters the pool within the 6s window, they can receive the same offer twice.

**Fix — add to `matchDriver()` before publishing:**
```typescript
const redisClient = this.redisService.getClient();
const tried = await redisClient.smembers(`ride:tried:${rideId}`);
const candidates = drivers.filter((d: string) => !tried.includes(d));

if (candidates.length === 0) {
  await this.updateRideStatus(rideId, RideStatus.CANCELLED);
  return;
}

const driverId = candidates[0];
await redisClient.sadd(`ride:tried:${rideId}`, driverId);
await redisClient.expire(`ride:tried:${rideId}`, 600); // 10-min TTL
```

---

### GAP-21 · OTP Length Mismatch — 6-Digit Backend vs. 4-Digit Driver App

**Backend:** `rides.service.ts:124`
```typescript
// Current — generates 6-digit
otp: Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6),
```

**Driver App:** `active_ride_screen.dart:149`
```dart
// Current — rejects anything that isn't 4 digits
if (_otpController.text.length != 4) { /* show error, return */ }
```

**Result:** The driver cannot ever enter the OTP successfully. The ride can never transition from `ARRIVED` → `IN_PROGRESS`.

**Recommended Fix (change both together):**

1. Backend (`rides.service.ts`) — change to 4-digit:
```typescript
otp: Math.floor(1000 + Math.random() * 9000).toString(),
```

2. Backend entity (`ride.entity.ts`) — update column:
```typescript
@Column({ type: 'varchar', length: 4, default: '1234' })
otp: string;
```

3. Driver app (`active_ride_screen.dart`) — no change needed (already 4-digit).

4. Update API spec example (`Section 4.5`) OTP from `"4821"` → 4 digits ✅ already matches.

---

### GAP-22 · Passenger Flutter App Never Connects to Socket — No Live Driver Location

**App File:** `Niklo-Travel-Booking-App/lib/features/car_rides/presentation/screens/ride_matched_screen.dart`

The `PassengerGateway` has a fully working `join:ride` event handler at `passenger.gateway.ts:62-68` and broadcasts `ride:location_update`, `ride:driver_assigned`, `ride:status_change`. However, the passenger Flutter app has **zero WebSocket code** and relies entirely on HTTP polling every ~3 seconds.

**Consequences:**
- Driver's live GPS position never reaches the passenger map
- `ride:driver_assigned` real-time event never received — passenger learns of driver via next poll
- Ride status changes (ARRIVED, IN_PROGRESS, COMPLETED) arrive up to 3 seconds late

**Required Flutter fix — add to `ride_matched_screen.dart`:**
```dart
import 'package:socket_io_client/socket_io_client.dart' as io;

// In state class:
io.Socket? _passengerSocket;

void _connectPassengerSocket() {
  // Resolve base origin (strip /api/v1 path)
  final origin = ApiConstants.rideBaseUrl
      .replaceAll(RegExp(r'/api/v1.*'), '');
  _passengerSocket = io.io(
    '$origin/passenger',
    io.OptionBuilder().setTransports(['websocket']).disableAutoConnect().build(),
  );
  _passengerSocket!.onConnect((_) {
    if (widget.rideId != null) {
      _passengerSocket!.emit('join:ride', {'rideId': widget.rideId});
    }
  });
  _passengerSocket!.on('ride:location_update', (data) {
    // Update driver marker position on map
    final d = Map<String, dynamic>.from(data as Map);
    _updateDriverLocation(d['lat'], d['lng'], d['bearing']);
  });
  _passengerSocket!.on('ride:driver_assigned', (data) {
    // Refresh driver card immediately without waiting for poll
    ref.invalidate(rideStatusProvider(widget.rideId ?? ''));
  });
  _passengerSocket!.on('ride:status_change', (data) {
    final statusStr = (data as Map)['status'] as String?;
    if (statusStr != null) {
      final info = RideStatusInfo.fromSocketEvent(statusStr, widget.rideId ?? '');
      _onStatusChanged(info);
    }
  });
  _passengerSocket!.connect();
}

@override
void initState() {
  super.initState();
  _connectPassengerSocket(); // add this
  // ... existing initState code ...
}

@override
void dispose() {
  _passengerSocket?.disconnect();
  _passengerSocket = null;
  super.dispose();
}
```

---

### GAP-23 · Google Maps API Key Hardcoded in Flutter Source

**File:** `Niklo-Travel-Booking-App/lib/features/car_rides/presentation/screens/ride_matched_screen.dart:66`

```
'&key=AIzaSyD0rhEXLsmsi-ArbH2PA_2Sv2swIzPaap8'
```

This key is baked into the release APK/IPA and can be extracted in seconds using `strings` on the binary. Any attacker can use it for unlimited Maps API calls billed to the Niklo account.

**Required Actions:**
1. Immediately restrict the key in Google Cloud Console:
   - Add Application restrictions → Android: `com.niklo.travel` + SHA-1
   - Add Application restrictions → iOS: `com.niklo.travel`
   - Enable only the APIs actually needed (Static Maps, Directions)
2. Move the key out of source:
   ```bash
   flutter run --dart-define=GOOGLE_MAPS_KEY=AIzaSy...
   ```
   ```dart
   // In code:
   const _mapsKey = String.fromEnvironment('GOOGLE_MAPS_KEY');
   ```
3. Add the key pattern to `.gitignore` and rotate immediately if it has been committed to a public/shared repo.

---

## 12. Updated Priority Fix Sequence (v3.0)

### 🔴 Phase 1 — Launch Blockers (All 9 must be done together)

| Order | Gap | File | Action |
|-------|-----|------|--------|
| 1 | GAP-16 | `rides.service.ts` | Implement Haversine `fare_final` recalculation in `completeRide` |
| 2 | GAP-17 | `rides.service.ts` | Fix `getMyRides` to return `fare_final ?? fare_amount` |
| 3 | GAP-18 | `rides.controller.ts` | Remove Bengaluru fallback coordinates — pass `null` |
| 4 | GAP-19 | `rides.controller.ts` | Throw 400 on missing `driverId` in go-online/offline |
| 5 | GAP-20 | `rides.service.ts` | Add `ride:tried` check to initial `matchDriver` path |
| 6 | GAP-21 | `rides.service.ts` + `ride.entity.ts` + driver app | Unify OTP to 4-digit (change backend; driver app already correct) |
| 7 | GAP-15 | `driver.gateway.ts` | Add `ride:arrived` socket handler |
| 8 | GAP-23 | Flutter + Google Console | Remove hardcoded API key; apply app restrictions |
| 9 | GAP-22 | Flutter `ride_matched_screen.dart` | Add Socket.IO passenger connection + `join:ride` |

### 🟡 Phase 2 — Soft Launch (within 2 weeks of Phase 1)

| Gap | Action |
|-----|--------|
| GAP-02 | Add 30s acceptance timeout to `matchDriver` |
| GAP-03 | Add 90s TTL heartbeat on Redis driver GeoSET |
| GAP-01 | Fix `/socket.io/` proxy in Nginx |
| GAP-05 | Add composite profile endpoint in `driver-service` |
| GAP-08 | Integrated into GAP-16 fix (earnings record in `completeRide`) |
| GAP-11 | Fix `JwtAuthGuard` to verify JWT signature |
| GAP-12 | Apply guards to all `driver-service` routes |

### 🟠 Phase 3 — Before Scale

| Gap | Action |
|-----|--------|
| GAP-04 | Fix double-prefix route bug in `driver-service` controller |
| GAP-06 | Add internal user profile lookup to `user-service` |
| GAP-07 | Add missing entities to TypeORM `database.config.ts` |
| GAP-09 | Return live driver location in `getRideStatus` from Redis |
| GAP-10 | Implement `/ride/active` and `/ride/driver/active` endpoints |
| GAP-13 | Add OTP brute-force lockout |
| GAP-14 | Accept both `comment` and `feedback` in rating payload |

---

## 13. Updated QA Acceptance Criteria (v3.0)

All items from Section 10 remain required. Add these new test cases:

9. **Fare Recalculation (GAP-16):**
   - [ ] Complete a ride. Verify `fare_final` in the database differs from `fare_amount` by actual distance.
   - [ ] Complete a ride where driver stopped 2km short of booked drop. Verify `fare_final` reflects shorter distance.

10. **Passenger History Fare (GAP-17):**
    - [ ] Call `GET /api/v1/ride/my-rides`. Verify completed rides return `fare_final` not `fare_amount`.

11. **Completion Coordinates (GAP-18):**
    - [ ] Call `POST /ride/:id/complete` without `finalLat`/`finalLng`. Verify fallback uses booked dropoff, not Bengaluru.

12. **Go-Online Validation (GAP-19):**
    - [ ] Call `POST /ride/driver/go-online` without `driverId`. Verify HTTP 400 returned.
    - [ ] Check Redis: `KEYS driver:*` — verify no ghost entries.

13. **OTP End-to-End (GAP-21):**
    - [ ] Open driver app. Receive a ride. Navigate to OTP screen. Verify OTP field accepts 4 digits.
    - [ ] Enter the backend-generated OTP from the passenger's screen. Verify ride transitions to `IN_PROGRESS`.

14. **Passenger Socket Live Tracking (GAP-22):**
    - [ ] Accept a ride. On passenger app, verify driver car icon moves on the map in real time without a page reload.
    - [ ] Use browser DevTools / Flutter DevTools to confirm WebSocket connection to `/passenger` namespace.

15. **API Key Security (GAP-23):**
    - [ ] Run `strings app-release.apk | grep AIzaSy`. Verify the key no longer appears in binary.
    - [ ] Verify key has application restrictions enabled in Google Cloud Console.
