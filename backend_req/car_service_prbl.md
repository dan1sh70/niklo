# Car Ride Service (`ride-service`) — Comprehensive Problem & Production Gap Report

**Target Services:** `niklo/ride-service`, `Niklo-Travel-Booking-App/lib/features/car_rides`, `niklo-partner`  
**Report Date:** October 2026  
**Status:** Backend Developer Action Required (Mobile Fixes Applied, Backend Specs Documented Below)

---

## 1. Executive Summary

A complete audit of the Car Rides flow — from mobile screens (`CarRidesScreen`, `FindingRidersScreen`, `RideMatchedScreen`, and `niklo-partner`'s `HomeScreen` and `TripsScreen`) to the NestJS backend (`ride-service`) and its PostgreSQL/Redis datastores — identified the exact root causes behind the **"Driver is online and Upcoming trips show rides, but passenger app shows 'No drivers available'"** bug:

1. **Redis 30-Second Location TTL Expiry:** The backend Redis key `driver:loc:{id}` has a 30s TTL. When a driver is stationary (waiting for a ride, sitting at a desk, or testing on an emulator), the partner app's GPS distance filter does not fire. After 30 seconds, Redis prunes the driver from `drivers:online` as a ghost driver.
2. **Android Emulator GPS Coordinates (12,000 km Distance):** Android emulators default to Mountain View, California (`37.421998, -122.084000`). If a passenger books a ride in West Bengal, India, the matching engine's maximum radius (13 km) can never reach the driver.
3. **Stuck Ride in Driver's "Upcoming" Trips:** An earlier test ride was stuck in `status: ARRIVED`. The partner app's "Upcoming" tab displays all rides where `status == 'ACCEPTED' || status == 'ARRIVED' || status == 'IN_PROGRESS'`, giving the false appearance of an active pending request.
4. **Socket.IO Event Type Cast Crash:** In `niklo-partner`, `socket_client.dart` cast `data as Map<String, dynamic>`. Flutter's `socket_io_client` parses objects as `Map<dynamic, dynamic>`, causing a runtime `_TypeError` when `ride:new_request` arrived.
5. **Backend Socket Payload Missing Coordinates:** `ride:new_request_queue` omitted `pickupLat`, `pickupLng`, `dropLat`, and `dropLng`, preventing the driver app from rendering route previews or calculating distances directly from the event.

> [!NOTE]
> All mobile frontend fixes have already been implemented, committed, and deployed.
> **No backend code was modified in the repository per user request.**
> The exact backend changes required are detailed below for the backend developer.

---

## 2. Required Backend Changes for `ride-service`

The backend developer must update the following files in `niklo/ride-service`:

### 2.1 API Request Contract Normalization (`dto.drop` vs `dto.dropoff`, `dto.pickupLat`)
* **File:** `ride-service/src/rides/rides.service.ts` (`mapDtoToRide`, ~Line 86)
* **Problem:**  
  `mapDtoToRide` only parses `dto.dropoff?.lat` and `dto.pickup?.lat`. Payloads sending `{ drop: { lat, lng } }` or flat `{ pickupLat, dropLat }` cause dropoff coordinates to fall back to pickup coordinates or throw `Error: Pickup coordinates are required`.
* **Action Required:**  
  Update `mapDtoToRide` to accept all common frontend parameter formats:
  ```typescript
  private mapDtoToRide(dto: any): Partial<Ride> {
    const rawType = dto.vehicleType || dto.rideType || dto.ride_type || 'SEDAN';
    const rideType = rawType.toUpperCase();
    const pickupAddress = dto.pickupAddress || 'Unknown Pickup';
    const dropAddress = dto.dropAddress || dto.dropoffAddress || 'Unknown Dropoff';

    const pickupLat = dto.pickup?.lat ?? dto.pickupLatitude ?? dto.pickup_latitude ?? dto.pickupLat ?? null;
    const pickupLng = dto.pickup?.lng ?? dto.pickupLongitude ?? dto.pickup_longitude ?? dto.pickupLng ?? null;
    const dropLat = dto.drop?.lat ?? dto.dropoff?.lat ?? dto.dropoffLatitude ?? dto.dropoff_latitude ?? dto.dropLat ?? null;
    const dropLng = dto.drop?.lng ?? dto.dropoff?.lng ?? dto.dropoffLongitude ?? dto.dropoff_longitude ?? dto.dropLng ?? null;

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
      scheduled_at:        dto.scheduledAt || dto.scheduled_at
                             ? new Date(dto.scheduledAt || dto.scheduled_at)
                             : undefined,
    };
  }
  ```

---

### 2.2 Extend Driver Matching Attempts & Radius Expansion
* **File:** `ride-service/src/rides/rides.service.ts` (`matchDriver`, ~Line 143)
* **Problem:**  
  `matchDriver()` loops only 3 times with a 2-second sleep (total 6 seconds). If no driver partner is within 13 km within that 6-second window, the ride self-cancels (`CANCELLED`). 6 seconds is far too short for real-world dispatch.
* **Action Required:**  
  Expand matching to 5 sweeps with a 3-second delay (15 seconds total window), progressively expanding radius: **3 km → 7 km → 11 km → 15 km → 19 km**:
  ```typescript
  private async matchDriver(rideId: string, lat: number, lng: number) {
    let radius = 3;
    let matched = false;

    for (let attempts = 0; attempts < 5 && !matched; attempts++) {
      const redisClient = this.redisService.getClient();
      const tried = await redisClient.smembers(`ride:tried:${rideId}`);
      const drivers = await this.redisService.getNearbyDrivers(lat, lng, radius);
      const candidates = drivers.filter(d => !tried.includes(d));

      if (candidates && candidates.length > 0) {
        const driverId = candidates[0];
        // ... publish to ride:new_request_queue ...
      } else {
        radius += 4; // Expand radius: 3km -> 7km -> 11km -> 15km -> 19km
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    if (!matched) {
      this.logger.warn(`No drivers found for ride ${rideId}`);
      await this.updateRideStatus(rideId, RideStatus.CANCELLED);
    }
  }
  ```

---

### 2.3 Extend Redis Location TTL from 30s to 60s
* **File:** `ride-service/src/redis/redis.service.ts` (`setDriverLocation`, ~Line 42)
* **Problem:**  
  `driver:loc:{driverId}` currently expires after 30 seconds. If a driver phone pauses updates for 30s, Redis drops them as a ghost driver from `drivers:online`.
* **Action Required:**  
  Increase the TTL from 30 to 60 seconds:
  ```typescript
  async setDriverLocation(driverId: string, lat: number, lng: number) {
    await this.client.setex(
      `driver:loc:${driverId}`,
      60, // Extended from 30s to 60s
      JSON.stringify({ lat, lng }),
    );
    await this.client.geoadd('drivers:online', lng, lat, driverId);
  }
  ```

---

### 2.4 Add Coordinates to `ride:new_request_queue` Socket Broadcast
* **File:** `ride-service/src/rides/rides.service.ts` (Lines 174–188 and 437–451)
* **Problem:**  
  When publishing to `ride:new_request_queue`, the message contains addresses and fare estimates, but completely omits latitude and longitude:
  `pickupLat`, `pickupLng`, `dropLat`, and `dropLng`.
  As a result, the driver partner app cannot calculate driver-to-pickup distance or show a map preview without an extra REST round-trip.
* **Action Required:**  
  Include coordinate properties in the published JSON payload:
  ```typescript
  await this.redisService.publish(
    'ride:new_request_queue',
    JSON.stringify({
      rideId,
      driverId,
      timeout: 30,
      pickupAddress: ride?.pickup_address,
      dropAddress: ride?.dropoff_address,
      pickupLat: ride?.pickup_latitude,
      pickupLng: ride?.pickup_longitude,
      dropLat: ride?.dropoff_latitude,
      dropLng: ride?.dropoff_longitude,
      fareEstimate: ride?.fare_amount,
      distanceKm: ride?.distance_km,
      otp: ride?.otp,
      passengerName,
      passengerPhone,
    }),
  );
  ```
  *(Apply the same update in `matchDriverExcluding` at ~Line 437).*

---

### 2.5 Google Maps Directions API Fallback
* **File:** `ride-service/src/rides/rides.service.ts` (`estimateRide`, ~Line 46)
* **Problem:**  
  When `GOOGLE_MAPS_API_KEY` is not set or quota is exhausted, `estimateRide()` falls back to a hardcoded `18.5 km` and `32 mins` for all rides.
* **Action Required:**  
  Use the Haversine formula to compute geodesic distance multiplied by road winding factor (1.3) as the fallback:
  ```typescript
  const directDistance = this.calculateHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);
  const distanceKm = Math.round(directDistance * 1.3 * 10) / 10;
  const estimatedTimeMins = Math.max(5, Math.round((distanceKm / 25) * 60)); // ~25 km/h city average
  ```

---

### 2.6 Nginx Reverse Proxy WebSocket Headers
* **File:** `niklo/nginx.conf`
* **Problem:**  
  The upstream location for `/api/v1/ride` lacks WebSocket upgrade headers. Socket.IO connections fall back to HTTP polling.
* **Action Required:**  
  Add the following inside the `/api/v1/ride` or socket location block:
  ```nginx
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```

---

## 3. Frontend & Mobile UI Issues Already Resolved

The following fixes have already been implemented and verified on the mobile apps:

### 3.1 Passenger App (`Niklo-Travel-Booking-App`)
* **Hardcoded Prices & Assets:** Replaced static ₹189/₹249/₹399 and generic car images with dynamic fare calculation, real rate cards (Mini: ₹12/km, Sedan: ₹15/km, SUV: ₹20/km), and dedicated vehicle assets (`car_mini.png`, `car_sedan.png`, `car_suv.png`).
* **Omitted Drop Coordinates:** Updated `car_booking_screen.dart` `_confirmPickup()` to resolve both pickup and drop coordinates and pass distanceKm and fare estimate to `requestRide()`.
* **Default Ride Selection:** Initialized `selectedRideProvider` to `'Sedan'`.
* **Live Vehicle Tracking Map:** Integrated `GmapsVehicleTracker` 3D navigation map with heading-up camera follow, smooth vehicle rotation, and full driver arrival route overview.

### 3.2 Partner App (`niklo-partner`)
* **10-Second Location Heartbeat:** Added `_heartbeatTimer` in `HomeScreen` to emit `SocketClient().emitLocation` and call `rideRepository.goOnline()` every 10 seconds. Driver never drops from Redis while online.
* **Safe Socket Event Deserialization:** Updated `SocketClient.on('ride:new_request')` to safely parse `Map<String, dynamic>.from(data as Map)`.
* **Android Emulator Coordinates Override:** Added automatic detection in `HomeScreen` for Mountain View, California emulator defaults (`lat: 35–39, lng: -124–-120`) and normalized to operational coordinates (`23.284446, 87.150759`) so test bookings match instantly.
* **Cleared Stuck Ride:** Completed stale ride `b1827c29-7716-4d0e-ac6e-7b34510f4673` via REST API so it no longer clutters the "Upcoming" trips tab.

---

## 4. Action Checklist & Resolution Summary

| Component | Issue | Action Required / Taken | Status |
|---|---|---|---|
| **Backend** | `drop` vs `dropoff` and `pickupLat` DTO mismatch | Update `mapDtoToRide` in `rides.service.ts` (see Section 2.1) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | 6s matching timeout & self-cancellation | Extend matching loop to 5 sweeps / 15s in `rides.service.ts` (see Section 2.2) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | 30s Redis TTL drops stationary drivers | Extend TTL to 60s in `redis.service.ts` (see Section 2.3) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | `ride:new_request_queue` missing coordinates | Add `pickupLat`, `pickupLng`, `dropLat`, `dropLng` in `rides.service.ts` (see Section 2.4) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | Google Maps API fallback hardcoded to 18.5 km | Implement Haversine * 1.3 fallback in `estimateRide` (see Section 2.5) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | Nginx WebSocket upgrade headers | Add `Upgrade` and `Connection` headers to `/api/v1/ride` block (see Section 2.6) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | Missing driver personal identity resolution (`null` name/phone) | Join `driver-service` with `user-service` in `acceptRide` (see Section 5.1 & 6) | ⚠️ **Action Required by Backend Dev** |
| **Backend** | In-ride chat & masked telephony absence | Add WebSocket chat event and masked phone proxy (see Section 5.1) | ⚠️ **Action Required by Backend Dev** |
| **Partner App** | 30s Redis TTL drop while stationary | Added 10s periodic heartbeat (`_heartbeatTimer`) in `HomeScreen` | ✅ **Fixed on Mobile** |
| **Partner App** | Socket `ride:new_request` type cast crash | Changed to `Map<String, dynamic>.from(data as Map)` | ✅ **Fixed on Mobile** |
| **Partner App** | Emulator defaults to California (12,000 km away) | Auto-override emulator coords to test region (`23.284446, 87.150759`) | ✅ **Fixed on Mobile** |
| **Partner App** | Stuck ride in "Upcoming" trips tab | Marked stale ride `b1827c29` completed via backend REST API | ✅ **Fixed on Mobile** |
| **Partner App** | Hardcoded 1.5 mi & imperial units | Replaced with dynamic `$distance km` in `active_ride_screen.dart` | ✅ **Fixed on Mobile** |
| **Partner App** | Empty "Contact passenger" button callback | Wired `url_launcher` to dial passenger's real phone (`tel:$phone`) | ✅ **Fixed on Mobile** |
| **Passenger App** | Hardcoded ride prices & generic image | Updated with dynamic estimation and dedicated Mini/Sedan/SUV assets | ✅ **Fixed on Mobile** |
| **Passenger App** | Omitted drop coordinates in `requestRide` | Added full drop coordinate & fare payload in `_confirmPickup()` | ✅ **Fixed on Mobile** |
| **Passenger App** | Default vehicle selection empty | Initialized to `'Sedan'` | ✅ **Fixed on Mobile** |
| **Passenger App** | Live vehicle tracking map | Integrated `GmapsVehicleTracker` with 3D camera & route animation | ✅ **Fixed on Mobile** |
| **Passenger App** | Missing driver phone number in matched screen | Added `driverPhone` fallback & OS dialer integration | ✅ **Fixed on Mobile** |

---

## 5. Comprehensive Audit of Hardcoded Values, Placeholders & Mock Gaps

A comprehensive codebase audit was conducted across the Passenger App (`Niklo-Travel-Booking-App`), Partner App (`niklo-partner`), and Backend services (`niklo/ride-service`, `niklo/driver-service`, `niklo/user-service`) to catalog all static strings, numbers, dummy identities, mock fallbacks, and placeholder logic.

### 5.1 Backend Services (`ride-service` & `driver-service`)

| File & Location | Hardcoded Value / Gap | Root Cause & Problem | Required Production Fix |
|---|---|---|---|
| `rides.service.ts` (~L31-32) in `ride-service` | `distanceKm = 18.5`<br>`estimatedTimeMins = 32` | Triggered when `GOOGLE_MAPS_API_KEY` is missing, quota is exhausted, or directions request fails. All rides receive 18.5 km and 32 mins. | Implement Haversine geodesic distance * 1.3 road curvature fallback (see Section 2.5). |
| `rides.service.ts` (~L159-160, ~L422-423) in `ride-service` | `passengerName = 'Passenger Name'`<br>`passengerPhone = '+919999999999'` | Triggered if request to `user-service:3002/api/v1/user/:id/profile` fails. Driver app displays dummy passenger details. | Ensure `USER_SERVICE_URL` is healthy and profile response returns the user's registered phone and name. |
| `rides.service.ts` (~L354-373) in `ride-service` | `ride.driver_name = null`<br>`ride.driver_phone = null`<br>`ride.vehicle_number = null` | **Critical Driver Identity Gap:** `acceptRide()` calls `driver-service:3011/api/v1/driver/${driverId}/profile`. However:<br>1. `driver-service`'s `Driver` entity does NOT have `name` or `phone` columns (they reside in `user-service`).<br>2. `driver-service` expects the driver UUID, while the app sends the auth `userId`.<br>3. `driverProfile.name` and `driverProfile.phone` are always `undefined`, persisting `null` to PostgreSQL! | In `acceptRide()`, resolve the driver record, query `user-service` (`GET /api/v1/user/:userId/profile`) using `driver.user_id`, and populate `ride.driver_name`, `ride.driver_phone`, and `ride.driver_photo_url` before database commit and gateway broadcast (see Section 6). |
| `rides.service.ts` (~L265-273) in `ride-service` | `https://cdn.nikloapp.com/vehicles/mini.png`<br>`sedan.png`, `suv.png`, `premium.png` | Vehicle thumbnail URLs are hardcoded to a static CDN domain. | Configure CDN base URL via `CDN_BASE_URL` environment variable or verify CDN assets are deployed. |
| `rides.service.ts` (~L55-62, ~L292) in `ride-service` | Base fare: `₹50`<br>Surge: `1.4x` (8-10h, 17-20h)<br>Per-km rates: Mini ₹12, Sedan ₹15, SUV ₹20, Premium ₹25<br>Cancel fee: `₹50` | Fares, surge rules, and cancellation penalties are statically hardcoded in code. | Move pricing configuration to a dynamic database table or Redis cache for admin adjustability. |
| `drivers.service.ts` (~L186-198) in `driver-service` | `[MOCK PAYOUT]` log & simulate success | When Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are missing, driver payouts are mocked as COMPLETED without transferring funds. | Configure live Razorpay X / Fund Account credentials in production. |
| `passenger.gateway.ts` in `ride-service` | Absence of In-Ride Chat Gateway | No WebSocket room or event (`ride:chat_message`) exists for real-time driver <-> passenger in-ride messaging. | Implement chat gateway event forwarding and database message persistence. |
| `ride-service` | Absence of Masked Telephony / VoIP Calling | Mobile apps currently simulate calls or launch the system dialer (`tel:$phone`). No masked call proxy (e.g. Exotel / Twilio / Agora) exists. | Integrate a masked calling gateway so driver and rider phone numbers remain private. |

---

### 5.2 Passenger Mobile App (`Niklo-Travel-Booking-App`)

| File & Location | Hardcoded Value / Fallback | Reason / Behavior | Status / Note |
|---|---|---|---|
| `ride_matched_screen.dart` (~L855-866) | `driverName`: `'Suresh Kumar (Partner)'`<br>`driverRating`: `4.8`<br>`vehicleLabel`: `'$currentRideType • White'`<br>`vehicleNumber`: `'DL 01 AB 7892'`<br>`otpCode`: `'4281'`<br>`etaMins`: `4` mins | Displayed when backend returns `null` for `driverDetails.name`, `driverDetails.phone`, and `driverDetails.vehicleNumber` from `GET /api/v1/ride/:id`. | ⚠️ Requires Backend Fix (Section 5.1 #3 & Section 6) to eliminate dummy fallbacks. |
| `ride_matched_screen.dart` (~L351) | `driverPhone`: `'+91 98765 43210'` | Fallback in `_showCallDriverDialog` when backend returns `driverDetails.phone == null`. | ⚠️ Requires Backend Fix (Section 5.1 #3). |
| `ride_matched_screen.dart` (~L414-417) | `fare`: `₹189.0`<br>`distKm`: `6.5 km` | Fallback in Trip Details bottom sheet if both `fareFinal` and `fareEstimate` are null. | Fallback safety guard. |
| `ride_matched_screen.dart` (~L1951-2001) | Initial message: `"Hello! I am on my way to your location."`<br>Bot auto-replies for ETA, AC, gate | Mock chat bot simulates driver replies with fixed delays because no backend chat service exists. | Documented gap until chat gateway is deployed. |
| `ride_matched_screen.dart` (~L2257-2262) | 4 Quick-share contacts (`Contact 1` through `4`) | Uses local asset avatars `assets/avator/avatar_*.jpg` instead of device contacts API. | Cosmetic mockup UI. |
| `finding_riders_screen.dart` (~L81-89, ~L288, ~L390) | 7 fly-in offset pairs<br>`_driversFound`: random 3 to 6 | Radar screen renders cosmetic cars and random driver count during search sweep. | Visual searching animation. |
| `finding_riders_screen.dart` (~L456) | Extra ID: `'mock-ride-demo-${timestamp}'` | Used when tester taps "Test Ride Flow" button in the No Drivers dialog. | Testing flow bypass. |
| `car_location_search_screen.dart` (~L40-66) | 5 popular locations: Howrah Junction, Park Street, Science City, Eco Park, Airport | Static popular search chips displayed before user starts typing. | Static seed suggestions. |
| `car_booking_screen.dart` (~L50) | `_fallbackCenter`: `LatLng(22.5726, 88.3639)` | Initial camera position before device GPS fix resolves (Kolkata coordinates). | Viewport fallback. |

---

### 5.3 Partner Mobile App (`niklo-partner`)

| File & Location | Hardcoded Value / Fallback | Reason / Behavior | Status / Note |
|---|---|---|---|
| `home_screen.dart` (~L63) | Driver UUID: `'45a0eae1-c987-49d3-b052-ae7be72f9aa4'` | Used as `_effectiveDriverId` if both `_driverId` and cached userId are null. | Fallback test driver UUID. |
| `home_screen.dart` (~L194-207) | California GPS override: `23.284446, 87.150759`<br>Default location: `22.5726, 88.3639` | Android emulator defaults to Mountain View, CA (12,000 km away). Remaps to active dispatch test region. | Necessary for emulator development. |
| `active_ride_screen.dart` (~L722) | Fallback driver name: `'Marcus'` | Displayed if `profile?['name']` is null. | Fallback name. |
| `trips_screen.dart`, `activity_screen.dart`, `wallet_screen.dart` | Fallback driver name: `'Nikko Driver'` | Displayed if driver profile name is null or still loading. | Fallback name. |
| `active_ride_screen.dart` (~L996, ~L1244, ~L1419) | Trailing badge: `'1.5 mi'`<br>Imperial units: `mi` | Hardcoded 1.5 mi and miles units. | ✅ **Fixed on Mobile:** Replaced with dynamic `$distance km` and Indian metric units. |
| `active_ride_screen.dart` (~L1008) | `_buildOutlinedButton('Contact passenger', ..., () {})` | Empty callback `() {}` prevented driver from calling passenger even with phone number present. | ✅ **Fixed on Mobile:** Wired `url_launcher` to dial `tel:$passengerPhone`. |
| `api_client.dart` (~L51) | `gatewayBase`: `http://irtucumwj9akelon0k4iyatv.187.127.157.13.sslip.io` | Legacy hardcoded sslip.io temporary IP fallback. | `.env` has production `https://nginx.niklo.co/api/v1`. |

---

## 6. Backend Developer Implementation Guide: Driver Details Fix

To completely eliminate hardcoded driver details on the mobile app, the backend developer should implement the following in `niklo/ride-service/src/rides/rides.service.ts` inside `acceptRide()`:

```typescript
// File: niklo/ride-service/src/rides/rides.service.ts
async acceptRide(rideId: string, driverId: string) {
  // 1. Atomic update to claim ride
  const result = await this.rideRepository.createQueryBuilder()
    .update(Ride)
    .set({ status: RideStatus.ACCEPTED, driver_id: driverId })
    .where('id = :rideId AND status = :status', { rideId, status: RideStatus.REQUESTED })
    .execute();

  if (result.affected === 0) {
    throw new Error('Ride already accepted by another driver or cancelled');
  }

  const ride = await this.rideRepository.findOne({ where: { id: rideId } });
  if (!ride) return;

  // 2. Fetch Driver & Vehicle details from driver-service
  let driverRecord: any = {};
  try {
    const driverRes = await axios.get(
      `${process.env.DRIVER_SERVICE_URL || 'http://driver-service:3011'}/api/v1/driver/${driverId}/profile`,
      { timeout: 3000 },
    );
    driverRecord = driverRes.data?.data || driverRes.data || {};
  } catch (err: any) {
    this.logger.warn(`driver-service profile fetch failed for ${driverId}: ${err?.message}`);
  }

  // 3. Fetch Driver Personal details (Name, Phone, Photo) from user-service using driver's user_id
  const targetUserId = driverRecord.user_id || driverId;
  let userRecord: any = {};
  try {
    const userRes = await axios.get(
      `${process.env.USER_SERVICE_URL || 'http://user-service:3002'}/api/v1/user/${targetUserId}/profile`,
      { timeout: 3000 },
    );
    userRecord = userRes.data?.data || userRes.data || {};
  } catch (err: any) {
    this.logger.warn(`user-service profile fetch failed for ${targetUserId}: ${err?.message}`);
  }

  // 4. Populate ride row with real verified driver identity
  ride.driver_id        = driverId;
  ride.driver_name      = userRecord.name || userRecord.full_name || driverRecord.name || null;
  ride.driver_phone     = userRecord.phone || userRecord.mobile || driverRecord.phone || null;
  ride.driver_photo_url = userRecord.photo_url || userRecord.avatar || driverRecord.photo_url || null;
  ride.vehicle_number   = driverRecord.vehicle_number || null;
  ride.vehicle_model    = driverRecord.vehicle_model || driverRecord.vehicle_type || null;
  ride.vehicle_color    = driverRecord.vehicle_color || 'White';
  ride.status           = RideStatus.ACCEPTED;

  await this.rideRepository.save(ride);

  // 5. Broadcast to passenger via WebSocket
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

  await this.redisService.publish(
    'ride:status_update',
    JSON.stringify({ rideId, status: RideStatus.ACCEPTED, driverId }),
  );
}
```

