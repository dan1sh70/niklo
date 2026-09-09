# ⚙️ Backend Production Audit Report: Car Ride Service

**Target Audience:** Backend Engineers (`ride-service`)  
**Date:** September 2026  
**Audited Service:** `niklo-main/ride-service` (NestJS, TypeORM, PostgreSQL, Redis, Socket.IO)  
**Architecture Type:** Uber-like real-time ride matching (REST + WebSocket + Redis Pub/Sub)

---

## Executive Summary

The `ride-service` has a solid structural foundation — Redis GEO matching, Socket.IO gateways, OTP verification, and fare estimation are all architecturally correct. However, **6 critical bugs in the real-time layer, DB schema, and matching logic currently prevent the Uber-like live ride experience from working in production.**

### High-Priority Defects:
1. **`PassengerGateway` emits to wrong socket room** — driver location never reaches the user
2. **`broadcastDriverAssigned()` never called** — user gets no real-time push when driver accepts
3. **Non-nullable DB columns crash on insert** — `distance_km`, `fare_amount`, `estimated_time_mins` have no default and no `nullable: true`
4. **`rejectRide()` is a no-op** — rejected rides are never retried; user is auto-cancelled
5. **Offline drivers never removed from Redis GEO pool** — ghost drivers permanently in matching queue
6. **`driver-service` unavailability** causes all driver details to be saved as `null` silently

---

## 1. Critical Bugs — Real-time WebSocket Layer

---

### 1.1 PassengerGateway Emits Location to Wrong Socket Room

**File:** [passenger.gateway.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/gateways/passenger.gateway.ts#L26-L36)

**Broken Code:**
```typescript
// onModuleInit() — subscribes to driver_locations Redis channel
await this.redisService.subscribe('driver_locations', (msg) => {
  const payload = JSON.parse(msg);
  // ❌ Emits to a room named after the DRIVER's ID
  this.server.to(payload.driverId).emit('ride:location_update', payload);
});
```

**How the passenger joins a room:**
```typescript
// passenger listens to join:ride event
@SubscribeMessage('join:ride')
handleJoinRide(@MessageBody() data: { rideId: string }, @ConnectedSocket() client: Socket) {
  client.join(data.rideId); // ✅ joins room named after RIDE ID
}
```

**The mismatch:** The passenger joined `rideId` room. The gateway emits to `driverId` room. **They never match.** The live map on the passenger's screen shows a static/stale position for the entire trip.

**Fix:**
```typescript
// 1. In driver.gateway.ts — include rideId in the driver_locations publish:
await this.redisService.publish('driver_locations', JSON.stringify({
  ...data,
  rideId: activeRideId, // ← must look up current rideId for this driver
}));

// 2. In passenger.gateway.ts — emit to rideId room:
this.server.to(payload.rideId).emit('ride:location_update', payload);
```

---

### 1.2 `broadcastDriverAssigned()` is Never Called — No Real-time Push on Accept

**File:** [rides.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/rides.service.ts#L286-L314) and [passenger.gateway.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/gateways/passenger.gateway.ts#L64-L66)

**The method exists but is never invoked:**
```typescript
// passenger.gateway.ts — method defined:
broadcastDriverAssigned(rideId: string, payload: any) {
  this.server.to(rideId).emit('ride:driver_assigned', payload); // ✅ Correct
}
```

**But in `rides.service.ts acceptRide()`:**
```typescript
ride.status = RideStatus.ACCEPTED;
await this.rideRepository.save(ride);
await this.redisService.publish('ride:status_update', JSON.stringify({ rideId, status: RideStatus.ACCEPTED, driverId }));
// ❌ passengerGateway.broadcastDriverAssigned() is NEVER CALLED
```

`PassengerGateway` also never subscribes to `ride:status_update`. No socket message ever reaches the user. They only find out via HTTP polling (every 3 seconds).

**Fix:**
```typescript
// In RidesModule — inject PassengerGateway into RidesService:
// rides.module.ts
providers: [RidesService, PassengerGateway, DriverGateway],

// rides.service.ts constructor:
constructor(
  @InjectRepository(Ride) private readonly rideRepository: Repository<Ride>,
  @InjectRepository(RideRating) private readonly ratingRepository: Repository<RideRating>,
  private readonly redisService: RedisService,
  private readonly passengerGateway: PassengerGateway, // ← ADD
) {}

// In acceptRide() — call after saving:
await this.rideRepository.save(ride);
this.passengerGateway.broadcastDriverAssigned(rideId, {
  driverId,
  driverName:    ride.driver_name,
  driverPhone:   ride.driver_phone,
  driverPhoto:   ride.driver_photo_url,
  vehicleNumber: ride.vehicle_number,
  vehicleModel:  ride.vehicle_model,
  vehicleColor:  ride.vehicle_color,
  vehicleType:   ride.ride_type,
});
```

---

### 1.3 `ride:status_update` Published But Never Consumed by PassengerGateway

**Files:** `rides.service.ts` (multiple locations), `passenger.gateway.ts`

`cancelRide()`, `acceptRide()`, `completeRide()`, `updateRideStatus()` all call:
```typescript
await this.redisService.publish('ride:status_update', JSON.stringify({ rideId, status }));
```

But `PassengerGateway.onModuleInit()` only subscribes to `driver_locations`. **No one reads `ride:status_update`.**

Real-time cancellation, completion, and arrival notifications are never pushed to the passenger.

**Fix — Add subscription in `passenger.gateway.ts`:**
```typescript
async onModuleInit() {
  // Existing: driver locations
  await this.redisService.subscribe('driver_locations', (msg) => { ... });

  // ADD: ride status changes
  await this.redisService.subscribe('ride:status_update', (msg) => {
    const payload = JSON.parse(msg);
    this.broadcastStatusChange(payload.rideId, { status: payload.status });
  });
}
```

---

## 2. Critical Bugs — Database Schema

---

### 2.1 Non-Nullable Columns Cause 500 on Ride Request

**File:** [ride.entity.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/entities/ride.entity.ts#L62-L69)

**Problematic columns:**
```typescript
@Column({ type: 'numeric', precision: 6, scale: 2 })
distance_km: number;        // ❌ No nullable, no default

@Column({ type: 'int' })
estimated_time_mins: number; // ❌ No nullable, no default

@Column({ type: 'numeric', precision: 10, scale: 2 })
fare_amount: number;         // ❌ No nullable, no default
```

**What `mapDtoToRide()` sets:**
```typescript
distance_km:         dto.distanceKm || dto.distance_km || null,      // can be null
fare_amount:         dto.fareEstimate || dto.fare_amount || null,     // can be null
estimated_time_mins: dto.estimatedTimeMins || null,                   // can be null
```

If a user skips the estimate step and calls `POST /ride/request` directly, TypeORM inserts `null` into a `NOT NULL` column → **PostgreSQL constraint violation → 500 Internal Server Error.**

**Fix:**
```typescript
@Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, default: null })
distance_km: number | null;

@Column({ type: 'int', nullable: true, default: null })
estimated_time_mins: number | null;

@Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, default: null })
fare_amount: number | null;
```

---

### 2.2 `fare_final` Never Written in `completeRide()`

**File:** [rides.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/rides.service.ts#L344-L354)

```typescript
async completeRide(rideId: string, finalLat: number, finalLng: number) {
  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (ride) {
    ride.status = RideStatus.COMPLETED;
    // ❌ ride.fare_final is never set
    // ❌ ride.ended_at is never set
    await this.rideRepository.save(ride);
  }
}
```

`getRideStatus()` returns:
```typescript
fareFinal: ride.status === RideStatus.COMPLETED ? (ride.fare_final ?? ride.fare_amount) : null,
```

`fare_final` is always `null` on the entity, so it falls back to `fare_amount`. But the fare might have changed (surge pricing, detour). Ride history on the user app always shows the estimated fare, never the actual charged amount.

**Fix:**
```typescript
async completeRide(rideId: string, finalLat: number, finalLng: number) {
  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (ride) {
    ride.status    = RideStatus.COMPLETED;
    ride.fare_final = ride.fare_amount;  // or recalculate based on actual distance
    ride.ended_at  = new Date();
    await this.rideRepository.save(ride);
    // Notify passenger
    this.passengerGateway.broadcastStatusChange(rideId, { status: RideStatus.COMPLETED });
  }
}
```

---

## 3. Critical Bugs — Driver Matching Logic

---

### 3.1 `rejectRide()` is a Complete No-Op

**File:** [rides.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/rides.service.ts#L317-L319)

```typescript
async rejectRide(rideId: string, driverId: string) {
  this.logger.log(`Ride ${rideId} rejected by driver ${driverId}`);
  // ❌ Absolutely nothing else happens
}
```

When a driver rejects via socket (`ride:rejected`):
- Ride remains `REQUESTED` in DB
- No next driver is tried
- `matchDriver()` already finished its 3 radius attempts and returned
- User is stuck in "Searching…" until no-driver timeout cancels it

**Fix — Implement cascading rejection:**
```typescript
async rejectRide(rideId: string, driverId: string) {
  this.logger.log(`Ride ${rideId} rejected by driver ${driverId}`);

  // Mark this driver as "tried" so we don't offer them again
  await this.redisService.getClient().sadd(`ride:tried:${rideId}`, driverId);

  // Look up ride coordinates
  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (!ride || ride.status !== RideStatus.REQUESTED) return;

  // Re-run matching, excluding tried drivers
  await this.matchDriverExcluding(rideId, ride.pickup_latitude, ride.pickup_longitude, rideId);
}

private async matchDriverExcluding(rideId: string, lat: number, lng: number, rideKey: string) {
  const tried = await this.redisService.getClient().smembers(`ride:tried:${rideKey}`);
  const drivers = await this.redisService.getNearbyDrivers(lat, lng, 10);
  const candidates = drivers.filter(d => !tried.includes(d));

  if (candidates.length === 0) {
    await this.updateRideStatus(rideId, RideStatus.CANCELLED);
    // Notify passenger: no drivers available
    return;
  }

  // Offer to next candidate
  const nextDriver = candidates[0];
  await this.redisService.publish('ride:new_request_queue', JSON.stringify({
    rideId, driverId: nextDriver, timeout: 30,
    pickupAddress: ride.pickup_address, ...
  }));
}
```

---

### 3.2 Offline Drivers Never Removed from Redis GEO Set — Ghost Drivers

**File:** [redis.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/redis/redis.service.ts#L42-L51) and [rides.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/rides.service.ts#L361-L364)

**On go-online:**
```typescript
await this.client.setex(`driver:loc:${driverId}`, 30, ...); // expires in 30s ✅
await this.client.geoadd('drivers:online', lng, lat, driverId); // ❌ NEVER expires
```

**On go-offline:**
```typescript
async setDriverOffline(driverId: string) {
  this.logger.log(...);
  await this.redisService.publish('driver:online_status', ...);
  // ❌ MISSING: zrem('drivers:online', driverId)
}
```

**Also in `DriverGateway`:**
```typescript
handleDisconnect(client: Socket) {
  this.logger.log(`Driver disconnected: ${client.id}`);
  // ❌ MISSING: remove driver from GEO set
}
```

**Consequence:** Crashed or force-quit drivers stay in the GEO matching pool forever. `matchDriver()` finds them, publishes the ride offer, gets no response, eventually cancels the ride. **Passengers experience frequent "No drivers available" even when real drivers are online.**

**Fix:**
```typescript
// In redis.service.ts — add method:
async removeDriverFromPool(driverId: string) {
  await this.client.zrem('drivers:online', driverId);
  await this.client.del(`driver:loc:${driverId}`);
}

// In rides.service.ts setDriverOffline():
async setDriverOffline(driverId: string) {
  await this.redisService.removeDriverFromPool(driverId); // ← ADD
  await this.redisService.publish('driver:online_status', ...);
}

// In driver.gateway.ts handleDisconnect():
handleDisconnect(client: Socket) {
  const driverId = this.socketToDriver.get(client.id); // need a Map<socketId, driverId>
  if (driverId) {
    this.redisService.removeDriverFromPool(driverId);
  }
}
```

> **Note:** `DriverGateway` currently has no `socketId → driverId` mapping. Add a `Map<string, string>` and populate it in `handleGoOnline`.

---

### 3.3 Race Condition — Two Drivers Can Accept the Same Ride

**File:** [rides.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/ride-service/src/rides/rides.service.ts#L286-L288)

```typescript
async acceptRide(rideId: string, driverId: string) {
  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (!ride || ride.status !== RideStatus.REQUESTED) return;
  // ← Between these two lines, another driver could also pass this check
  ride.status = RideStatus.ACCEPTED;
  await this.rideRepository.save(ride);
}
```

In a real system with multiple concurrent socket events, two drivers can simultaneously read `status === REQUESTED`, both pass the check, and both save `ACCEPTED` — with different driver IDs. Last write wins. Both drivers' apps show "ride accepted" but only one actually has the ride.

**Fix — Use a DB-level atomic update:**
```typescript
async acceptRide(rideId: string, driverId: string) {
  // Atomic conditional update: only succeeds if status is still REQUESTED
  const result = await this.rideRepository.createQueryBuilder()
    .update(Ride)
    .set({ status: RideStatus.ACCEPTED, driver_id: driverId })
    .where('id = :rideId AND status = :status', { rideId, status: RideStatus.REQUESTED })
    .execute();

  if (result.affected === 0) {
    // Ride was already taken — return 409
    throw new ConflictException('Ride already accepted by another driver');
  }

  // Continue with driver profile fetch and notifications...
}
```

---

## 4. Missing Endpoints

---

### 4.1 `ARRIVED` Status Has No Endpoint

**Entity has it:**
```typescript
export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED  = 'ACCEPTED',
  ARRIVED   = 'ARRIVED',      // ✅ In enum
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

**Controller doesn't expose it:**
```typescript
// rides.controller.ts — ARRIVED is never reachable via any endpoint
```

The driver app shows an "Arrived at pickup" button — it has no backend call to make. The OTP is currently shown from `ACCEPTED` state, but Uber-style should be: `ACCEPTED` → driver arrives → `ARRIVED` → OTP → `IN_PROGRESS`.

**Fix:**
```typescript
@Post(':id/arrived')
@HttpCode(HttpStatus.OK)
async markArrived(@Param('id') id: string) {
  await this.ridesService.updateRideStatus(id, RideStatus.ARRIVED);
  return { success: true, statusCode: 200, data: { status: 'ARRIVED' } };
}
```

---

### 4.2 No Driver-Side Ride History Endpoint

The driver app's `trips_repository.dart` calls `GET /ride/driver/my-trips` or similar. Only `GET /ride/my-rides` exists and is keyed by `req.user.id` as a passenger — not as a driver.

**Fix:**
```typescript
@Get('driver/my-trips')
async getDriverTrips(
  @Req() req: any,
  @Query('limit') limit = '20',
  @Query('offset') offset = '0',
) {
  const data = await this.ridesService.getDriverTrips(req.user.id, +limit, +offset);
  return { success: true, statusCode: 200, data };
}
```

Add `getDriverTrips()` in `rides.service.ts` filtering by `driver_id`.

---

## 5. nginx WebSocket Routing — Critical Gateway Fix

**File:** [nginx.conf](file:///d:/Users/anish/Project/niklo_project/niklo-main/nginx.conf#L96-L107)

The Socket.IO namespaces `/driver` and `/passenger` are unreachable through nginx. The current config only has:
```nginx
location /api/v1/ride {
  proxy_pass http://ride-service:3005;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

Socket.IO connects to `ws://host/driver` — this does NOT match `/api/v1/ride`.

**Required Addition to nginx.conf:**
```nginx
location /driver {
  proxy_pass http://ride-service:3005;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header X-Real-IP $remote_addr;
  proxy_read_timeout 3600s;
  proxy_send_timeout 3600s;
}

location /passenger {
  proxy_pass http://ride-service:3005;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header X-Real-IP $remote_addr;
  proxy_read_timeout 3600s;
  proxy_send_timeout 3600s;
}
```

> Without this, passenger sockets are dead. The user app already falls back to HTTP polling as a workaround.

---

## 6. Hardcoded Values to Remove Before Production

| Location | Hardcoded Value | Fix |
|----------|----------------|-----|
| `rides.controller.ts:56` | `driverId = 'd1111111-1111-1111-1111-111111111111'` | Require `driverId` in body, return 400 if missing |
| `rides.service.ts:162` | `passengerName: 'Passenger Name'` | Query user-service for real name |
| `rides.service.ts:163` | `passengerPhone: '+919999999999'` | Query user-service for real phone |
| `rides.service.ts:27` | `distanceKm = 18.5` fallback | Keep as fallback but log warning |

---

## 7. Backend Action Checklist

### P0 — Must Fix Before Any Testing
- [ ] Call `passengerGateway.broadcastDriverAssigned()` inside `acceptRide()`
- [ ] Subscribe `PassengerGateway` to `ride:status_update` Redis channel
- [ ] Fix `passenger.gateway.ts` — emit `ride:location_update` to `rideId` room (not `driverId`)
- [ ] Add `nullable: true` to `distance_km`, `estimated_time_mins`, `fare_amount` in entity
- [ ] Add `/driver` and `/passenger` WebSocket locations in `nginx.conf`

### P1 — Must Fix Before Driver Launch
- [ ] Implement real `rejectRide()` — find next driver, excluding tried ones
- [ ] `setDriverOffline()` must call `zrem('drivers:online', driverId)` + `del driver:loc`
- [ ] `handleDisconnect()` in DriverGateway must remove driver from GEO pool
- [ ] Make `acceptRide()` atomic — conditional UPDATE to prevent double-accept (409 on conflict)
- [ ] Write `fare_final` and `ended_at` in `completeRide()`
- [ ] Remove hardcoded `MOCK_DRIVER_ID` fallback in HTTP `acceptRide` endpoint

### P2 — Polish & Complete
- [ ] Add `POST /ride/:id/arrived` endpoint
- [ ] Add `GET /ride/driver/my-trips` endpoint (keyed by `driver_id`)
- [ ] Include `rideId` in `driver_locations` Redis publish so passenger gateway can route correctly
- [ ] Replace hardcoded `passengerName`/`passengerPhone` — query user-service
- [ ] Add `socketId → driverId` map in DriverGateway for disconnect handling
- [ ] Add cleanup TTL to `ride:tried:{rideId}` key in Redis (e.g., 10 min)
