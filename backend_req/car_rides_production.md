# Niklo — Car Rides Module Production Backend Specification & API Blueprint

> **Target Microservice**: `ride-service` (`niklo-main/ride-service`, Port `3005`)
> **Supporting Service**: `driver-service` (`niklo-main/driver-service`, Port `3011`)
> **Target Database**: `niklo_ride` (PostgreSQL) + Redis (geo-matching pool)
> **Frontend Code Reference**: `lib/features/car_rides/` ([car_booking_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/car_rides/presentation/screens/car_booking_screen.dart), [finding_riders_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/car_rides/presentation/screens/finding_riders_screen.dart), [ride_matched_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/car_rides/presentation/screens/ride_matched_screen.dart))
> **Frontend Status**: 🟡 Integrated but blocked — 5 critical backend bugs prevent any ride from completing
> **Backend Code Status**: 🔴 Exists but broken — see Bug List below

---

## ⚡ Quick Summary for Backend Developer

The Flutter car rides flow is fully wired to the backend. **No ride can currently complete** because of bugs in `rides.service.ts` and missing response fields. All screens show hardcoded demo data (driver name, photo, vehicle, OTP, fare, ETA, card image) because the backend does not return those fields. Fix in this order:

| # | Severity | Issue | File | Action |
|---|---|---|---|---|
| **1** | 🔴 P0 BLOCKER | **Coordinate DTO mismatch** — Flutter sends `pickup.lat/lng` nested, backend reads flat `dto.pickupLatitude` → defaults to Goa for every ride | `rides.service.ts` L71–89 | Fix `mapDtoToRide()` |
| **2** | 🔴 P0 BLOCKER | **No driver in Redis pool** — `drivers:online` geo-set is empty → matching always fails → every ride auto-cancels | `rides.service.ts` `matchDriver()` | Register test driver via API |
| **3** | 🔴 P0 | **`getRideStatus` missing OTP & driver details** — Flutter shows hardcoded `"1234"`, `"Rakesh Kumar"`, `"WB 02 AB 1234"` | `rides.service.ts` L160–173 | Enrich status response |
| **4** | 🔴 P0 | **Drop coordinates never stored** — Flutter sends `dropoff.lat/lng` nested, same parsing bug | `rides.service.ts` L83–84 | Fix `mapDtoToRide()` |
| **5** | 🟡 P1 | **Fare estimate not returned** — Flutter shows hardcoded prices. `/estimate` endpoint exists but returns single fare, not per-vehicle breakdown | `rides.service.ts` L21–69 | Return `options[]` per vehicle type |
| **6** | 🟡 P1 | **Driver photo / vehicle card image not in API** — matched screen shows hardcoded `avatar_1.jpg` asset and local `car_sedan.png` | `getRideStatus` response | Add `photoUrl`, `vehicleImageUrl` fields |
| **7** | 🟡 P1 | **ETA not in API** — Flutter shows hardcoded `"2 mins"` on matched screen | `getRideStatus` response | Add `estimatedArrivalMins` |
| **8** | 🟡 P1 | **OTP not in status response** — `/status` does not include OTP, Flutter always shows `"1234"` | `getRideStatus` response | Add `otp` field |
| **9** | 🟡 P1 | **Socket.IO not connected from Flutter** — real-time driver location never received | Architecture | Flutter needs socket; backend has it ready |
| **10** | 🟡 P1 | **`my-rides` response key mismatch** — entity uses `dropoff_address`, Flutter reads `drop_address` | `getMyRides` | Alias column in response |
| **11** | 🟢 P2 | **Google Static Maps API key hardcoded in Flutter source** | `ride_matched_screen.dart` L66 | Move key to backend — serve map URL from API |
| **12** | 🟢 P2 | **`/estimate` endpoint same coordinate parsing bug** | `rides.service.ts` L21–45 | Standardise DTO |
| **13** | 🟢 P2 | **`/my-rides` not paginated** | `getMyRides` | Add `limit` + `offset` query params |
| **14** | 🟢 P2 | **Round Trip / Rental mode not wired** | `rides.service.ts` | Document `scheduledAt` format for `/schedule` |

---

## 🔴 BUG FIX 1 — `mapDtoToRide()` Coordinate Parsing (CRITICAL BLOCKER)

### Problem

Flutter sends coordinates in a **nested object**:

```json
{
  "pickupAddress": "Howrah Junction",
  "dropAddress": "Park Street",
  "vehicleType": "SEDAN",
  "pickup": { "lat": 22.5851, "lng": 88.3423 },
  "dropoff": { "lat": 22.5536, "lng": 88.3520 }
}
```

`mapDtoToRide()` reads **flat keys** `dto.pickupLatitude` / `dto.pickupLongitude` which are **undefined** → defaults to **Panaji, Goa** (`15.4989, 73.8278`). Driver geo-search uses wrong city → no drivers found → ride auto-cancels.

### Fix — `niklo-main/ride-service/src/rides/rides.service.ts`

Replace the `mapDtoToRide()` method (lines 71–90):

```typescript
private mapDtoToRide(dto: any): Partial<Ride> {
  const rawType = dto.vehicleType || dto.rideType || dto.ride_type || 'SEDAN';
  const rideType = rawType.toUpperCase();
  const pickupAddress = dto.pickupAddress || 'Unknown Pickup';
  const dropAddress = dto.dropAddress || dto.dropoffAddress || 'Unknown Dropoff';

  // ✅ FIX: support BOTH nested ({pickup:{lat,lng}}) AND flat (pickupLatitude) formats
  const pickupLat =
    dto.pickup?.lat ?? dto.pickupLatitude ?? dto.pickup_latitude ?? null;
  const pickupLng =
    dto.pickup?.lng ?? dto.pickupLongitude ?? dto.pickup_longitude ?? null;
  const dropLat =
    dto.dropoff?.lat ?? dto.dropoffLatitude ?? dto.dropoff_latitude ?? null;
  const dropLng =
    dto.dropoff?.lng ?? dto.dropoffLongitude ?? dto.dropoff_longitude ?? null;

  if (pickupLat === null || pickupLng === null) {
    throw new Error('Pickup coordinates are required (send pickup.lat and pickup.lng)');
  }

  return {
    ride_type:           rideType as RideType,
    pickup_address:      pickupAddress,
    dropoff_address:     dropAddress,
    pickup_latitude:     pickupLat,
    pickup_longitude:    pickupLng,
    dropoff_latitude:    dropLat ?? pickupLat,
    dropoff_longitude:   dropLng ?? pickupLng,
    distance_km:         dto.distanceKm || dto.distance_km || null,
    fare_amount:         dto.fareEstimate || dto.fare_amount || null,
    estimated_time_mins: dto.estimatedTimeMins || null,
    scheduled_at:
      dto.scheduledAt || dto.scheduled_at
        ? new Date(dto.scheduledAt || dto.scheduled_at)
        : undefined,
  };
}
```

Also update `requestRide()` lines 104–105:

```typescript
const lat = mapped.pickup_latitude!;
const lng = mapped.pickup_longitude!;
```

---

## 🔴 BUG FIX 2 — Enrich `getRideStatus()` Response

### Problem

Flutter `RideMatchedScreen` shows hardcoded driver/vehicle data because `getRideStatus()` only returns:

```json
{ "rideId": "...", "status": "ACCEPTED", "driverDetails": { "id": "...", "name": "Driver Info" } }
```

Missing: OTP, driver phone, photo, vehicle number/model/color/image, ETA.

### Fix — Snapshot driver data at `acceptRide()` then serve from `getRideStatus()`

**Step 1: Add columns to `rides` table (run migration — see Schema section)**

**Step 2: Update `acceptRide()` to snapshot driver profile:**

```typescript
async acceptRide(rideId: string, driverId: string) {
  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (!ride || ride.status !== RideStatus.REQUESTED) return;

  let driverProfile: any = {};
  try {
    const res = await axios.get(
      `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${driverId}/profile`,
      { timeout: 3000 },
    );
    driverProfile = res.data?.data || res.data || {};
  } catch {
    this.logger.warn(`Driver profile fetch failed for ${driverId}`);
  }

  ride.driver_id        = driverId;
  ride.driver_name      = driverProfile.name || driverProfile.full_name || null;
  ride.driver_phone     = driverProfile.phone || driverProfile.mobile || null;
  ride.driver_photo_url = driverProfile.photo_url || null;
  ride.vehicle_number   = driverProfile.vehicle_number || null;
  ride.vehicle_model    = driverProfile.vehicle_model || null;
  ride.vehicle_color    = driverProfile.vehicle_color || null;
  ride.status           = RideStatus.ACCEPTED;

  await this.rideRepository.save(ride);
  await this.redisService.publish(
    'ride:status_update',
    JSON.stringify({ rideId, status: RideStatus.ACCEPTED, driverId }),
  );
}
```

**Step 3: Update `getRideStatus()` to return full data:**

```typescript
async getRideStatus(id: string) {
  const ride = await this.rideRepository.findOne({ where: { id } });
  if (!ride) throw new NotFoundException(`Ride ${id} not found`);

  return {
    rideId:  ride.id,
    status:  ride.status,
    otp:     [RideStatus.ACCEPTED, RideStatus.ARRIVED].includes(ride.status as RideStatus)
               ? ride.otp
               : undefined,
    estimatedArrivalMins: ride.estimated_time_mins ?? null,
    fareFinal: ride.status === RideStatus.COMPLETED
               ? (ride.fare_final ?? ride.fare_amount)
               : null,
    driverDetails: ride.driver_id ? {
      id:              ride.driver_id,
      name:            ride.driver_name,
      phone:           ride.driver_phone,
      photoUrl:        ride.driver_photo_url,
      vehicleNumber:   ride.vehicle_number,
      vehicleModel:    ride.vehicle_model,
      vehicleColor:    ride.vehicle_color,
      vehicleType:     ride.ride_type,
      vehicleImageUrl: _vehicleImageUrl(ride.ride_type),
      currentLocation: null,   // real-time via Socket.IO only
    } : null,
  };
}

// Helper — returns CDN URL for vehicle silhouette card image
function _vehicleImageUrl(rideType: string): string {
  const map: Record<string, string> = {
    MINI:       'https://cdn.nikloapp.com/vehicles/mini.png',
    SEDAN:      'https://cdn.nikloapp.com/vehicles/sedan.png',
    SUV:        'https://cdn.nikloapp.com/vehicles/suv.png',
    PREMIUM:    'https://cdn.nikloapp.com/vehicles/premium.png',
    OUTSTATION: 'https://cdn.nikloapp.com/vehicles/suv.png',
    HOURLY:     'https://cdn.nikloapp.com/vehicles/sedan.png',
  };
  return map[rideType?.toUpperCase()] || map['SEDAN'];
}
```

---

## 🔴 BUG FIX 3 — `my-rides` Response Key + Pagination

### Problem

- Flutter reads `json['drop_address']` but entity column is `dropoff_address` → drop address always blank
- No pagination; Flutter passes `?limit=` but controller ignores it

### Fix — `niklo-main/ride-service/src/rides/rides.service.ts`

```typescript
async getMyRides(passengerId: string, limit = 20, offset = 0) {
  const rides = await this.rideRepository.find({
    where: { user_id: passengerId },
    order: { created_at: 'DESC' },
    take: Math.min(limit, 100),
    skip: offset,
  });

  return rides.map((r) => ({
    rideId:          r.id,
    status:          r.status,
    ride_type:       r.ride_type,
    pickup_address:  r.pickup_address,
    drop_address:    r.dropoff_address,     // ✅ aliased to match Flutter key
    distance_km:     r.distance_km,
    fare_estimate:   r.fare_amount,
    fare_final:      r.status === RideStatus.COMPLETED ? r.fare_amount : null,
    created_at:      r.created_at,
    ended_at:        r.updated_at,
  }));
}
```

Update controller:

```typescript
@Get('my-rides')
async getMyRides(
  @Req() req: any,
  @Query('limit') limit = '20',
  @Query('offset') offset = '0',
) {
  const data = await this.ridesService.getMyRides(req.user.id, +limit, +offset);
  return { success: true, statusCode: 200, data };
}
```

---

## 🟡 BUG FIX 4 — `estimateRide()` Coordinate Parsing + Per-Vehicle Options

### Problem

Same nested vs flat DTO mismatch. Also returns a single fare estimate — Flutter needs one per vehicle type to populate the Mini/Sedan/SUV cards with real prices.

### Fix

```typescript
async estimateRide(estimateDto: any) {
  // ✅ Support both nested and flat
  const lat1 = estimateDto.pickup?.lat ?? estimateDto.pickupLatitude;
  const lng1 = estimateDto.pickup?.lng ?? estimateDto.pickupLongitude;
  const lat2 = estimateDto.drop?.lat   ?? estimateDto.dropoffLatitude;
  const lng2 = estimateDto.drop?.lng   ?? estimateDto.dropoffLongitude;

  let distanceKm = 18.5;
  let estimatedTimeMins = 32;
  let polyline = '';

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey && lat1 && lng1 && lat2 && lng2) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lng1}&destination=${lat2},${lng2}&key=${apiKey}`;
      const response = await axios.get(url);
      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const leg = response.data.routes[0].legs[0];
        distanceKm = leg.distance.value / 1000;
        estimatedTimeMins = Math.ceil(leg.duration.value / 60);
        polyline = response.data.routes[0].overview_polyline.points;
      }
    } catch (err) {
      this.logger.error('Google Maps API failed', err);
    }
  }

  const hour = new Date().getHours();
  const isSurge = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const surgeMultiplier = isSurge ? 1.4 : 1.0;

  const BASE = 50;
  const RATES: Record<string, { ratePerKm: number; etaMins: number; label: string }> = {
    MINI:       { ratePerKm: 12, etaMins: estimatedTimeMins - 1, label: 'Mini' },
    SEDAN:      { ratePerKm: 15, etaMins: estimatedTimeMins,     label: 'Sedan' },
    SUV:        { ratePerKm: 20, etaMins: estimatedTimeMins + 2, label: 'SUV' },
    PREMIUM:    { ratePerKm: 25, etaMins: estimatedTimeMins + 3, label: 'Premium' },
    OUTSTATION: { ratePerKm: 18, etaMins: estimatedTimeMins,     label: 'Outstation' },
  };

  const options = Object.entries(RATES).map(([type, cfg]) => ({
    vehicleType:        type,
    label:              cfg.label,
    fareEstimate:       Math.round((BASE + distanceKm * cfg.ratePerKm) * surgeMultiplier),
    estimatedTimeMins:  Math.max(1, cfg.etaMins),
    etaText:            `${Math.max(1, cfg.etaMins)} mins`,
    surgeMultiplier,
    distanceKm:         Math.round(distanceKm * 10) / 10,
    polyline,
  }));

  const selected = RATES[estimateDto.rideType?.toUpperCase()] || RATES['SEDAN'];
  return {
    fareEstimate:       Math.round((BASE + distanceKm * selected.ratePerKm) * surgeMultiplier),
    surgeMultiplier,
    distanceKm:         Math.round(distanceKm * 10) / 10,
    estimatedTimeMins,
    polyline,
    options,            // ✅ Flutter uses this to show real prices on booking cards
  };
}
```

---

## 🟡 NEW FULL `getRideStatus` RESPONSE CONTRACT

Flutter's `RideStatusInfo.fromJson()` and `RideDriver.fromJson()` expect this exact shape:

```json
{
  "rideId": "3f4d1a2b-...",
  "status": "ACCEPTED",
  "otp": "482931",
  "estimatedArrivalMins": 3,
  "fareFinal": null,
  "driverDetails": {
    "id": "d1111111-...",
    "name": "Arjun Sharma",
    "phone": "+919876543210",
    "photoUrl": "https://cdn.nikloapp.com/drivers/arjun.jpg",
    "rating": 4.8,
    "vehicleNumber": "WB 02 CD 5678",
    "vehicleModel": "Maruti Suzuki Swift",
    "vehicleColor": "Silver",
    "vehicleType": "MINI",
    "vehicleImageUrl": "https://cdn.nikloapp.com/vehicles/mini.png",
    "currentLocation": null
  }
}
```

**Status lifecycle Flutter understands:**

| Backend `RideStatus` | Flutter enum | Screen behaviour |
|---|---|---|
| `REQUESTED` | `requested` / `searching` | FindingRidersScreen — polling |
| `ACCEPTED` | `accepted` | RideMatchedScreen — driver info shown |
| `ARRIVED` | `arrived` | RideMatchedScreen — "Driver arrived" |
| `IN_PROGRESS` | `inProgress` | RideMatchedScreen — ride started snackbar |
| `COMPLETED` | `completed` | Ride Completed dialog with fare |
| `CANCELLED` | `cancelled` | Error snackbar + retry |

---

## 🔴 DRIVER REGISTRATION — How to Unblock Matching (P0 Fix)

Redis `drivers:online` geo-set is empty → every ride auto-cancels after ~6s. You must register at least one driver:

### Register test driver via REST:

```bash
curl -X POST https://<server>/api/v1/ride/driver/go-online \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <driver-jwt>" \
  -d '{
    "driverId": "d1111111-1111-1111-1111-111111111111",
    "lat": 22.5726,
    "lng": 88.3639
  }'
```

> ⚠️ Driver location expires from Redis after **30 seconds** (TTL in `setDriverLocation`). Re-register every 25s during testing, or keep the socket connection alive.

### Accept a ride manually (dev testing):

```bash
curl -X POST https://<server>/api/v1/ride/<rideId>/accept \
  -H "Authorization: Bearer <token>" \
  -d '{ "driverId": "d1111111-1111-1111-1111-111111111111" }'
```

---

## 🗄️ PostgreSQL Schema — Migration Script

```sql
-- Run on niklo_ride database

-- Snapshot driver details onto ride row at accept time
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_rides_user_id_created ON rides (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides (status)
  WHERE status IN ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS');
```

Also update `Ride` entity to include new columns:

```typescript
// ride.entity.ts — add these columns
@Column({ type: 'varchar', length: 100, nullable: true })
driver_name: string;

@Column({ type: 'varchar', length: 20, nullable: true })
driver_phone: string;

@Column({ type: 'text', nullable: true })
driver_photo_url: string;

@Column({ type: 'varchar', length: 30, nullable: true })
vehicle_number: string;

@Column({ type: 'varchar', length: 100, nullable: true })
vehicle_model: string;

@Column({ type: 'varchar', length: 50, nullable: true })
vehicle_color: string;

@Column({ type: 'text', nullable: true })
vehicle_image_url: string;

@Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
fare_final: number;

@Column({ type: 'timestamptz', nullable: true })
started_at: Date;

@Column({ type: 'timestamptz', nullable: true })
ended_at: Date;
```

---

## 🖼️ Vehicle Card Images — CDN Setup

Flutter currently loads `assets/home/car_rides/car_sedan.png` (local asset). The new `vehicleImageUrl` field in `getRideStatus` replaces this with an API-served URL.

**Upload these images to your CDN (S3 / Cloudflare R2 / Firebase Storage):**

| Vehicle | CDN path | Temporary Unsplash fallback |
|---|---|---|
| Mini | `cdn.nikloapp.com/vehicles/mini.png` | `https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&fit=crop` |
| Sedan | `cdn.nikloapp.com/vehicles/sedan.png` | `https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&fit=crop` |
| SUV | `cdn.nikloapp.com/vehicles/suv.png` | `https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&fit=crop` |
| Premium | `cdn.nikloapp.com/vehicles/premium.png` | `https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&fit=crop` |

> Images should be **side-view or top-down** car silhouettes on transparent/white background, ideally `400×200 px` PNG.

---

## 🔑 Google Maps API Key — Security Fix

Key `AIzaSyD0rhEXLsmsi-ArbH2PA_2Sv2swIzPaap8` is hardcoded in Flutter source. Add this backend endpoint:

```typescript
// rides.controller.ts — add endpoint
@Get(':id/map-preview')
async getMapPreview(@Param('id') id: string) {
  const ride = await this.ridesService.getRideMapPreview(id);
  return { success: true, statusCode: 200, data: ride };
}

// rides.service.ts — add method
async getRideMapPreview(id: string) {
  const ride = await this.rideRepository.findOne({ where: { id } });
  if (!ride) throw new NotFoundException(`Ride ${id} not found`);
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const lat = ride.pickup_latitude;
  const lng = ride.pickup_longitude;
  return {
    mapUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x420&scale=2&maptype=roadmap&key=${key}`,
  };
}
```

> **Immediate action**: Restrict the exposed key in Google Cloud Console to your production IP + Android SHA-1 fingerprint until the backend endpoint is deployed.

---

## 📡 Socket.IO Architecture Reference

The backend already has a complete real-time layer. No changes needed on backend — Flutter needs to connect.

### Backend WebSocket Gateways (already live)

| Namespace | File | Purpose |
|---|---|---|
| `/driver` | `driver.gateway.ts` | Driver app communicates here |
| `/passenger` | `passenger.gateway.ts` | Flutter passenger app should connect here |

### Events Flutter must listen to (on `/passenger` namespace):

```
socket.emit('join:ride', { rideId })          // call right after POST /request

socket.on('ride:status_change', (data) => {})  // { status: 'ACCEPTED' }
socket.on('ride:driver_assigned', (data) => {}) // { driverId, name, ... }
socket.on('ride:location_update', (data) => {}) // { lat, lng, driverId }
```

> nginx `/api/v1/ride` block already has `Upgrade` + `Connection` headers — WebSocket connections work through the gateway. ✅

---

## 🧪 End-to-End Testing Checklist

```
[ ] 1. POST /api/v1/ride/driver/go-online { driverId, lat, lng }
        → Redis GEOSEARCH returns driverId
        → 30s TTL active: TTLEXPIRY > 0

[ ] 2. POST /api/v1/ride/estimate { pickup:{lat,lng}, drop:{lat,lng}, rideType:"SEDAN" }
        → returns options[] with MINI/SEDAN/SUV fares (not hardcoded)
        → distanceKm is real (not 18.5 default)

[ ] 3. POST /api/v1/ride/request { pickup:{lat,lng}, dropoff:{lat,lng}, pickupAddress, dropAddress, vehicleType }
        → rideId returned
        → DB row has correct lat/lng (NOT 15.4989/73.8278 Goa defaults)
        → status = REQUESTED

[ ] 4. GET /api/v1/ride/:id/status (within 10s of request)
        → status progresses to ACCEPTED after matchDriver runs
        → driverDetails populated with name/phone/photo/vehicle
        → otp field present (6 digits, not "1234")

[ ] 5. POST /api/v1/ride/:id/accept (or socket ride:accepted)
        → driver snapshot written to rides row
        → Redis pub/sub fires ride:status_update

[ ] 6. POST /api/v1/ride/:id/cancel
        → status = CANCELLED
        → cancellationFee = 50 if driver was assigned, 0 if not

[ ] 7. POST /api/v1/ride/:id/rate { rating: 4, feedback: "Good ride" }
        → row saved in ride_ratings table

[ ] 8. GET /api/v1/ride/my-rides?limit=10&offset=0
        → response includes drop_address key (not dropoff_address)
        → ride_type is enum string "MINI"/"SEDAN" etc.
        → pagination works: second page returns different rides

[ ] 9. GET /api/v1/ride/:id/map-preview
        → returns mapUrl with hidden API key (not raw key exposed)
```

---

## 🚀 Deployment Commands

```bash
# From niklo-main/ directory

# Run DB migration
docker exec -it niklo-postgres psql -U niklo -d niklo_ride -c "
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_name       VARCHAR(100);
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_phone      VARCHAR(20);
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_photo_url  TEXT;
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_number    VARCHAR(30);
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_model     VARCHAR(100);
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_color     VARCHAR(50);
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_image_url TEXT;
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS fare_final        NUMERIC(10,2);
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at        TIMESTAMPTZ;
  ALTER TABLE rides ADD COLUMN IF NOT EXISTS ended_at          TIMESTAMPTZ;
  CREATE INDEX IF NOT EXISTS idx_rides_user_id_created ON rides (user_id, created_at DESC);
"

# Rebuild and push ride-service
docker build -t ghcr.io/dan1sh70/niklo-ride-service:latest ./ride-service
docker push ghcr.io/dan1sh70/niklo-ride-service:latest

# Restart container on server
docker-compose up -d --no-deps --force-recreate ride-service

# Verify Redis driver pool after restart
docker exec -it niklo-redis redis-cli ZCARD drivers:online
# Expected: 0 (normal after restart — register test driver again)
```

---

## ✅ Production Readiness Checklist

| Item | Owner | Status |
|---|---|---|
| `mapDtoToRide()` coordinate parsing fixed | Backend | ⬜ TODO |
| `estimateRide()` coordinate parsing + `options[]` per vehicle | Backend | ⬜ TODO |
| `getRideStatus()` returns OTP + full driver/vehicle profile | Backend | ⬜ TODO |
| `getMyRides()` returns `drop_address` + `ride_type` + pagination | Backend | ⬜ TODO |
| `acceptRide()` snapshots driver profile to rides row | Backend | ⬜ TODO |
| DB migration: new columns on `rides` table + indexes | Backend | ⬜ TODO |
| Vehicle card images hosted on CDN (`vehicleImageUrl`) | Backend | ⬜ TODO |
| `/map-preview` endpoint to hide Google Maps API key | Backend | ⬜ TODO |
| Test driver registered in Redis for staging tests | Backend | ⬜ TODO |
| Docker image rebuilt and pushed | Backend | ⬜ TODO |
| Flutter `socket_io_client` connected to `/passenger` namespace | Frontend | ⬜ TODO |
| Flutter calls `POST /estimate` to show real fares on booking screen | Frontend | ⬜ TODO |
| Flutter reads `vehicleImageUrl` + `photoUrl` from API (remove local assets) | Frontend | ⬜ TODO |
| Flutter reads OTP from `getRideStatus` response (remove hardcoded "1234") | Frontend | ⬜ TODO |
