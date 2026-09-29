# Niklo Hotel Service — Production Readiness & Architecture Specification (v0.4)
**Target Service:** `hotel-service` (NestJS / TypeORM / PostgreSQL)  
**Client Apps:** `niklo-travel-booking-app` (User App) & `niklo-partner` (Partner Portal)  
**Date:** September 2026  
**Document Status:** Ready for Backend Implementation  

---

## 1. Executive Summary & Objective

This document outlines the **complete backend requirements, API specifications, pricing algorithms, database migrations, and validation rules** required to bring the **Hotel Service** and **Hourly Stay Booking Module** to production-grade quality.

### Primary Goals:
1. **Hourly Stays Integration**: Unify search, availability checking, price quotation, and booking creation for 3-hour, 6-hour, and 9-hour micro-stays.
2. **Eliminate Pricing Mismatches**: Replace the flawed linear arithmetic `(duration / 24)` with industry-standard tiered micro-stay rate factors (35%, 55%, 75%).
3. **Cutoff & Operating Hours Validation**: Prevent invalid slot bookings (e.g., past times, stays concluding after midnight, or micro-stays overlapping overnight operations).
4. **Contract Synchronization**: Ensure JSON request/response keys between Flutter clients and NestJS controllers align with zero dropped properties.

---

## 2. Database Schema Migrations

### 2.1 Table: `hotels`
Add support for hourly stays configuration and eliminate fallback dummy data defaults.

```sql
-- 1. Add hourly stay flags & configuration
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS is_hourly BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hourly_options JSONB DEFAULT '{
  "3h": { "available": true, "rate_multiplier": 0.35 },
  "6h": { "available": true, "rate_multiplier": 0.55 },
  "9h": { "available": true, "rate_multiplier": 0.75 }
}'::jsonb,
ADD COLUMN IF NOT EXISTS hourly_operating_hours JSONB DEFAULT '{
  "checkin_start": "05:00",
  "checkin_end": "22:00",
  "max_checkout": "24:00"
}'::jsonb;

-- 2. Clean up defaults on city column to avoid persisting literal "City"
ALTER TABLE hotels ALTER COLUMN city SET DEFAULT 'Bengaluru';
```

#### Entity Definition (`src/hotels/entities/hotel.entity.ts`)
```typescript
@Column({ default: false })
is_hourly: boolean;

@Column({ type: 'jsonb', nullable: true })
hourly_options: {
  '3h'?: { available: boolean; price?: number; rate_multiplier?: number };
  '6h'?: { available: boolean; price?: number; rate_multiplier?: number };
  '9h'?: { available: boolean; price?: number; rate_multiplier?: number };
};

@Column({ type: 'jsonb', nullable: true })
hourly_operating_hours: {
  checkin_start: string; // e.g. "05:00" (5 AM)
  checkin_end: string;   // e.g. "22:00" (10 PM)
  max_checkout: string;  // e.g. "24:00" (Midnight)
};
```

---

### 2.2 Table: `bookings`
Ensure all fields required for hourly stay audit trails and check-in verifications exist.

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS is_hourly BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hourly_check_in_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS hourly_duration_hours INT,
ADD COLUMN IF NOT EXISTS hourly_check_out_time VARCHAR(50);
```

#### Entity Definition (`src/bookings/entities/booking.entity.ts`)
```typescript
@Column({ default: false })
isHourly: boolean;

@Column({ nullable: true })
hourlyCheckInTime: string; // e.g., "12 PM"

@Column({ type: 'int', nullable: true })
hourlyDurationHours: number; // e.g., 3, 6, 9

@Column({ nullable: true })
hourlyCheckOutTime: string; // e.g., "3 PM"
```

---

## 3. Pricing Logic & Rate Calculation Engine

### 3.1 The Hourly Pricing Standard
In hotel revenue management, short-stay micro-stays cannot be priced linearly by dividing by 24 hours (`pricePerNight / 24`). Cleaning, linen turnover, amenities, front desk check-in, and sanitation overhead apply regardless of duration.

| Duration | Standard Industry Rate Factor | Formula | Example (₹2,000/night room) |
|---|---|---|---|
| **3 Hours** | **35% (0.35)** | `round(price_per_night * 0.35)` | ₹700 + 12% GST = ₹784 |
| **6 Hours** | **55% (0.55)** | `round(price_per_night * 0.55)` | ₹1,100 + 12% GST = ₹1,232 |
| **9 Hours** | **75% (0.75)** | `round(price_per_night * 0.75)` | ₹1,500 + 12% GST = ₹1,680 |
| **Full Night**| **100% (1.00)** | `price_per_night * nights` | ₹2,000 * 1 = ₹2,000 + 12% GST = ₹2,240 |

### 3.2 Pricing Utility (`src/common/pricing.util.ts`)
```typescript
export function getHourlyRateFactor(durationHours: number): number {
  if (durationHours <= 3) return 0.35;
  if (durationHours <= 6) return 0.55;
  if (durationHours <= 9) return 0.75;
  return 1.0;
}

export function computeStayPrice(
  pricePerNight: number,
  rooms: number,
  isHourly: boolean,
  durationHours?: number,
  nights: number = 1,
): { basePrice: number; taxes: number; grandTotal: number } {
  let factor = nights;
  if (isHourly) {
    factor = getHourlyRateFactor(durationHours || 3);
  }
  const basePrice = Math.round(pricePerNight * rooms * factor);
  const taxes = Math.round(basePrice * 0.12); // Standard 12% GST
  const grandTotal = basePrice + taxes;

  return { basePrice, taxes, grandTotal };
}
```

---

## 4. API Endpoint Specifications

### 4.1 Hotel Search: `POST /api/v1/hotels/search`

#### Request Payload:
```json
{
  "location": "Bengaluru",
  "checkInDate": "2026-09-29",
  "checkOutDate": "2026-09-30",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "isHourly": true,
  "hourlyCheckInTime": "12 PM",
  "filters": {
    "priceFilter": "Low to High",
    "ratingFilter": "4 Star & above",
    "amenityFilter": "Free WiFi"
  },
  "page": 1,
  "limit": 20
}
```

#### Key Implementation Requirements in `HotelsService.searchHotels`:
1. **Support Top-Level `isHourly`**:
   The Flutter app sends `'isHourly': isHourly` at the root level of the payload.
   ```typescript
   const isHourlyRequested = 
     params.isHourly === true || params.isHourly === 'true' ||
     params.filters?.isHourly === true || params.filters?.isHourly === 'true';

   if (isHourlyRequested) {
     query.andWhere('hotel.is_hourly = true');
   }
   ```
2. **DTO Mapper (`mapHotelToDto`)**:
   Must expose `is_hourly`, `isHourly`, and `hourlyOptions`:
   ```typescript
   is_hourly: h.is_hourly,
   isHourly: h.is_hourly,
   hourlyOptions: h.hourly_options || {
     '3h': { available: true, price: Math.round(Number(h.price_per_night) * 0.35) },
     '6h': { available: true, price: Math.round(Number(h.price_per_night) * 0.55) },
     '9h': { available: true, price: Math.round(Number(h.price_per_night) * 0.75) },
   },
   ```

---

### 4.2 Check Availability: `POST /api/v1/hotels/:id/check-availability`

#### Request Payload:
```json
{
  "room_type_id": "rm_deluxe_01",
  "check_in": "2026-09-29",
  "check_out": "2026-09-29",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "is_hourly": true,
  "hourly_duration": 3,
  "hours": 3
}
```

#### Required Response Payload:
> [!IMPORTANT]
> The Flutter app's `HotelBookingQuote` parser specifically expects the `availableRooms` list in the response. If this is omitted, the mobile checkout flow fails or falls back to an error state.

```json
{
  "success": true,
  "data": {
    "hotel_id": "htl_kolkata_001",
    "room_type_id": "rm_deluxe_01",
    "room_title": "Deluxe Comfort Room",
    "available": true,
    "remaining_rooms": 4,
    "nights_count": 0,
    "hours_count": 3,
    "price_per_night": 2275,
    "total_room_price": 2275,
    "taxes_and_fees": 273,
    "grand_total": 2548,
    "availableRooms": [
      {
        "id": "rm_deluxe_01",
        "title": "Deluxe Comfort Room",
        "price": 2275,
        "total_price": 2275,
        "available_count": 4
      }
    ]
  }
}
```

---

### 4.3 Price Quote: `POST /api/v1/bookings/hotel/quote`

#### Request Payload:
```json
{
  "hotelId": "htl_kolkata_001",
  "roomTypeId": "rm_deluxe_01",
  "checkInDate": "2026-09-29",
  "checkOutDate": "2026-09-29",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "isHourly": true,
  "hourlyDurationHours": 3
}
```

#### Bug to Fix in `BookingsService.quoteBooking`:
- **Current Buggy Code:**
  ```typescript
  // DO NOT USE THIS: 3 / 24 = 0.125 (gives only 12.5% rate)
  const base = pricePerNight * rooms * (isHourly ? (hourlyDurationHours / 24) : nights);
  ```
- **Required Production Code:**
  ```typescript
  const duration = Number(hourlyDurationHours) || 3;
  const factor = isHourly ? getHourlyRateFactor(duration) : nights;
  const base = Math.round(pricePerNight * rooms * factor);
  const tax = Math.round(base * 0.12);
  const total = base + tax;

  return {
    nights_count: isHourly ? 0 : nights,
    hours_count: isHourly ? duration : 0,
    rooms,
    price_per_night: pricePerNight,
    base_price: base,
    taxes_and_fees: tax,
    grand_total: total,
    currency: 'INR'
  };
  ```

---

### 4.4 Create Booking: `POST /api/v1/bookings/hotel`

#### Request Payload:
```json
{
  "hotelId": "htl_kolkata_001",
  "roomTypeId": "rm_deluxe_01",
  "checkInDate": "2026-09-29",
  "checkOutDate": "2026-09-29",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "childAges": [],
  "isHourly": true,
  "hourlyCheckInTime": "12 PM",
  "hourlyDurationHours": 3,
  "guests": [
    {
      "name": "Anish Kumar",
      "age": 28,
      "gender": "Male",
      "idProofType": "Aadhar Card"
    }
  ],
  "contactPhone": "+919876543210",
  "contactEmail": "anish@example.com",
  "paymentMethod": "online"
}
```

#### Validation & Creation Logic:
1. **Hourly Input Validation**:
   If `isHourly === true`:
   - `hourlyCheckInTime` must be provided (e.g. `'12 PM'`).
   - `hourlyDurationHours` must be in `[3, 6, 9]`.
2. **Calculate End Time**:
   - Compute `hourlyCheckOutTime` from `hourlyCheckInTime + hourlyDurationHours`.
3. **Same-Day Past Slot Check**:
   - If `checkInDate` is today (UTC+5:30), parse slot hour and reject if `slotHour <= currentHour`.
4. **Operating Window Cutoff**:
   - Reject if `slotHour + durationHours > 24` (crosses midnight).
   - Reject 6-hour stays starting at or after 8 PM (20:00).
   - Reject 9-hour stays starting at or after 6 PM (18:00).
5. **Compute Exact Amount**:
   - Use `computeStayPrice(...)` with tiered rate factor.
6. **Save to Database**:
   - Set status to `'pending_payment'` (for online) or `'confirmed'` (for pay_at_property).

---

## 5. Seed Data Updates (`HotelsService.onApplicationBootstrap`)

Update the default seed script so that staging and development environments have valid hourly hotels immediately available:

```typescript
{
  id: 'htl_kolkata_001',
  title: 'The Lalit Great Eastern Kolkata',
  stay_type: StayType.HOTEL,
  city: 'Kolkata',
  address: '1-2 Old Court House St, Dalhousie, Kolkata',
  price_per_night: 6500,
  is_active: true,
  is_hourly: true,
  hourly_options: {
    '3h': { available: true, price: 2275 }, // 35% of 6500
    '6h': { available: true, price: 3575 }, // 55% of 6500
    '9h': { available: true, price: 4875 }  // 75% of 6500
  },
  // ... rest of fields
},
{
  id: 'htl_goa_002',
  title: 'Taj Exotica Resort & Spa, Goa',
  stay_type: StayType.RESORT,
  city: 'Goa',
  address: 'Benaulim Beach, South Goa',
  price_per_night: 8500,
  is_active: true,
  is_hourly: true,
  hourly_options: {
    '3h': { available: true, price: 2975 }, // 35% of 8500
    '6h': { available: true, price: 4675 }, // 55% of 8500
    '9h': { available: true, price: 6375 }  // 75% of 8500
  },
  // ... rest of fields
}
```

---

## 6. Implementation Checklist for Backend Developer

- [ ] **Run Database Migrations**: Add `is_hourly`, `hourly_options`, and `hourly_operating_hours` to `hotels`. Add hourly columns to `bookings`.
- [ ] **Fix Pricing Multiplier in `BookingsService`**: Replace `(duration / 24)` with `getHourlyRateFactor` (`0.35`, `0.55`, `0.75`) in both `quoteBooking` and `createBooking`.
- [ ] **Search Filter Support**: Check `params.isHourly` at the root level of `POST /api/v1/hotels/search`.
- [ ] **DTO Mapping**: Return `hourlyOptions`, `is_hourly`, and `isHourly` in `mapHotelToDto`.
- [ ] **Check Availability Contract**: Return `availableRooms: [{ id, title, price, total_price, available_count }]` in `POST /api/v1/hotels/:id/check-availability`.
- [ ] **Check-In Slot Validations**: Reject past hours for same-day bookings and enforce midnight/evening micro-stay cutoff limits.
- [ ] **Seed Data Update**: Ensure sample hotels in database have `is_hourly: true` and configured `hourly_options`.
- [ ] **Reviews API**: Implement `GET /api/v1/hotels/:id/reviews` and `POST /api/v1/hotels/:id/reviews` (see Section 7).
- [ ] **Integration Test**: Verify the end-to-end flow with the Flutter user app on search, price quote, booking completion, and review submission.

---

## 7. Reviews & Ratings API (MISSING — Required for Production)

The Flutter user app has a complete Reviews & Ratings UI including a **"Write a Review"** bottom sheet, rating breakdown bars, and a post-stay rating prompt. All of this requires the following backend endpoints.

### 7.1 `GET /api/v1/hotels/:id/reviews`

**Query Parameters:**
```
sort=helpful|latest|positive  (default: helpful)
page=1
limit=20
```

**Expected Response:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "title": "Amazing stay!",
      "reviewer_name": "Anish Kumar",
      "rating": 4.5,
      "comment": "Great cleanliness and friendly staff.",
      "created_at": "2026-09-15T10:30:00Z",
      "property_reply": "Thank you for your kind words!",
      "has_property_reply": true
    }
  ],
  "total": 128,
  "page": 1,
  "limit": 20
}
```

> [!IMPORTANT]
> The Flutter app's `GuestReview.fromJson` parser now supports both camelCase and snake_case field names (`reviewer_name`, `created_at`, `property_reply`, `has_property_reply`). All field variants are handled — **backend should send snake_case** as standard.

---

### 7.2 `POST /api/v1/hotels/:id/reviews`

**Authentication:** Required (JWT Bearer Token)

**Request Body:**
```json
{
  "title": "Great hotel!",
  "rating": 4.5,
  "comment": "Loved the cleanliness and location.",
  "review": "Loved the cleanliness and location.",
  "reviewer_name": "Anish Kumar",
  "reviewerName": "Anish Kumar"
}
```

> [!NOTE]
> The Flutter app sends both `reviewer_name` and `reviewerName` to handle any backend casing preference. The field `review` is a duplicate of `comment` to support APIs that use either key.

**Expected Response (any of these formats are accepted):**
```json
{ "success": true, "message": "Review submitted." }
```
Or:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Great hotel!",
    "rating": 4.5,
    "comment": "Loved the cleanliness and location.",
    "reviewer_name": "Anish Kumar",
    "created_at": "2026-09-28T12:00:00Z"
  }
}
```

---

### 7.3 `GET /api/v1/hotels/:id` — Rating Breakdown Field

The Flutter `hotel_details_reviews_section.dart` renders a category breakdown bar chart (Cleanliness, Location, Service, Value). For this to render from real data, the `GET /api/v1/hotels/:id` response should include:

```json
{
  "ratingBreakdown": {
    "overall": 4.5,
    "label": "Very Good",
    "totalRatings": 128,
    "breakdown": {
      "cleanliness": 4.7,
      "location": 4.8,
      "service": 4.6,
      "value": 4.4
    }
  }
}
```

> [!NOTE]
> If this field is absent, the Flutter frontend now gracefully falls back to a computed estimate from `hotel.ratingValue`. No crash will occur — but real data from the backend will give accurate, meaningful breakdown bars.

---

### 7.4 Frontend Contract Alignment Summary

| Flutter Field Read | Backend Must Send | Status |
|---|---|---|
| `reviewer_name` / `reviewerName` | `reviewer_name` (snake_case preferred) | ✅ Frontend handles both |
| `created_at` / `date` / `createdAt` | `created_at` (ISO 8601 string) | ✅ Frontend auto-formats to `15 Sep 2026` |
| `property_reply` / `propertyReply` | `property_reply` | ✅ Frontend handles both |
| `has_property_reply` / boolean | Optional (derived from `property_reply` presence) | ✅ Frontend auto-detects |
| `ratingBreakdown.breakdown.*` | `{ cleanliness, location, service, value }` | ✅ Frontend fallback if missing |
| `hourlyOptions` / `hourly_options` | `hourly_options` (snake_case preferred) | ✅ Frontend handles both |
| `topReviews` / `top_reviews` / `reviews` | Any of these key names | ✅ Frontend handles all three |
| `ratingBreakdown` / `rating_breakdown` | Either casing | ✅ Frontend handles both |

---

## 8. Bus Service — Production Requirements

### 8.1 Ratings & Reviews (MISSING — Required for Production)

The bus booking frontend's **Select Seats** screen shows a `RatingsReviewsCard` with operator rating, distribution bars, tag clouds, and individual reviews. Currently, ratings fall back to a hash-derived value because the `bus-service` does not expose rating data.

#### Required: Expose `rating` and `ratings_count` in Schedule Responses

The Flutter app reads rating from:
- `json['rating']` OR `json['operator']['rating']`
- `json['total_ratings']` OR `json['operator']['ratings_count']`

**Add to `GET /api/v1/bus/schedules/search` and `GET /api/v1/bus/schedules/:id`:**
```json
{
  "operator": {
    "id": "op_uuid",
    "name": "VRL Travels",
    "rating": 4.7,
    "ratings_count": 737
  }
}
```

**DB Migration:**
```sql
ALTER TABLE operators
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS ratings_count INT DEFAULT 0;
```

#### Required: Operator Reviews Endpoints (NEW)

**`GET /api/v1/bus/operators/:operatorId/reviews?page=1&limit=10`**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "user_name": "Rahul Sharma",
      "rating": 5.0,
      "comment": "Clean bus, punctual driver.",
      "tags": ["Cleanliness", "Punctuality"],
      "is_verified": true,
      "created_at": "2026-06-14T00:00:00Z"
    }
  ],
  "total": 282,
  "page": 1,
  "limit": 10
}
```

**`POST /api/v1/bus/operators/:operatorId/reviews`** (JWT Auth required)
```json
{
  "booking_id": "uuid",
  "rating": 4.5,
  "comment": "Very clean and punctual.",
  "tags": ["Cleanliness", "Punctuality"]
}
```

---

### 8.2 Seat Map — Missing `base_fare` in Response (BUG)

`GET /api/v1/bus/schedules/:id/seat-map` does not include `base_fare` at the response root.

Flutter reads `rawData['base_fare']` from the seat-map root to price each seat. Without it, all seats fall back to `₹0`.

**Required — add `base_fare` to seat-map response:**
```json
{
  "schedule_id": "...",
  "base_fare": 850.00,
  "total_seats": 36,
  "available_seats": 24,
  "lower_deck": [...],
  "upper_deck": [...]
}
```

Fix in `SchedulesService.getSeatMap()`:
```typescript
return {
  schedule_id: seatData.schedule_id,
  base_fare: Number(seatData.base_fare),   // ← ADD THIS
  total_seats: seatData.total_seats,
  available_seats: seatData.available_seats,
  lower_deck: lowerDeck,
  upper_deck: upperDeck.length > 0 ? upperDeck : null,
};
```

---

### 8.3 Bus Service Backend Checklist

- [ ] **Add `rating` + `ratings_count` to `operators` table** and expose in schedule responses.
- [ ] **Implement `GET /api/v1/bus/operators/:id/reviews`** — paginated operator reviews.
- [ ] **Implement `POST /api/v1/bus/operators/:id/reviews`** — JWT-authenticated review submission.
- [ ] **Add `base_fare` to seat-map response root** so seats price correctly.
- [ ] **Fix manifest endpoint** — return real passenger data instead of hardcoded mock array.
- [ ] **Seed operator ratings** — set `rating: 4.5`, `ratings_count: 100` on all seed operators.

---

### 8.4 Bus Frontend Contract Alignment Summary

| Flutter Field Read | Backend Must Send | Status |
|---|---|---|
| `schedule.operator.rating` | `operator.rating` (number) | ⚠️ Backend missing — Flutter falls back to hash |
| `schedule.operator.ratings_count` | `operator.ratings_count` (int) | ⚠️ Backend missing — Flutter falls back to hash |
| `seat_map.base_fare` | `base_fare` at seat-map root | ⚠️ Backend missing — seats price as ₹0 without it |
| `seat.is_available` | `is_available` (boolean) | ✅ Redis lock integration works correctly |
| `seat.is_ladies_seat` | `is_ladies_seat` (boolean) | ✅ Frontend handles both snake and camelCase |
| `seat.price` | `price` = `base_fare + price_offset` | ✅ Backend computes this correctly |
| `route.boarding_points[]` | `boarding_points` array | ✅ Fully wired |
| `route.dropping_points[]` | `dropping_points` array | ✅ Fully wired |
| `operator.name` | `operator.name` | ✅ Used for logo + bus name display |

---

## 9. Adventure & Experience Service Production Requirements & Gap Analysis

> **Service**: `adventure-service` (Port 3013, default `/api/v1/adventures`)  
> **Central Booking**: `booking-service` (Port 3014, `booking_type: 'ADVENTURE'`)  
> **Status**: Audit completed. Frontend has implemented robust fallback parsing and review submission; backend requires review endpoints, slot date comparison bugfix, and UUID format alignment.

---

### 9.1 Missing Review Submission Endpoint (`POST /api/v1/adventures/:id/reviews`)

#### Problem
The `adventure_reviews` database table and `AdventureReview` TypeORM entity already exist in `adventure-service`, and `GET /api/v1/adventures/:id/reviews` returns review overviews and lists. However, **there is no `POST` endpoint** in `AdventuresController` to submit a review.

#### Backend Implementation Required

**1. Controller Endpoint in `adventures.controller.ts`**:
```typescript
@Post(':id/reviews')
@HttpCode(HttpStatus.CREATED)
async createReview(
  @Param('id') id: string,
  @Body() createReviewDto: {
    rating: number;
    comment: string;
    user_name?: string;
    user_avatar?: string;
    safety_rating?: number;
    experience_rating?: number;
    value_rating?: number;
  },
  @Req() req: any,
) {
  const userId = req.user?.id; // from JWT auth if authenticated
  const data = await this.adventuresService.createReview(id, {
    ...createReviewDto,
    user_id: userId,
  });
  return { success: true, statusCode: 201, data };
}
```

**2. Service Method in `adventures.service.ts`**:
```typescript
async createReview(adventureId: string, dto: any) {
  const adventure = await this.adventureRepository.findOne({ where: { id: adventureId } });
  if (!adventure) {
    throw new NotFoundException(`Adventure with ID ${adventureId} not found`);
  }

  const review = this.reviewRepository.create({
    adventure_id: adventureId,
    user_id: dto.user_id,
    user_name: dto.user_name || 'Verified Adventurer',
    user_avatar: dto.user_avatar,
    rating: Number(dto.rating),
    comment: dto.comment,
    safety_rating: dto.safety_rating ?? 5.0,
    experience_rating: dto.experience_rating ?? 5.0,
    value_rating: dto.value_rating ?? 5.0,
  });
  await this.reviewRepository.save(review);

  // Recalculate average rating & total reviews on parent adventure table
  const allReviews = await this.reviewRepository.find({ where: { adventure_id: adventureId } });
  const avg = allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / allReviews.length;

  adventure.rating = Number(avg.toFixed(1));
  adventure.reviews_count = allReviews.length;
  await this.adventureRepository.save(adventure);

  return review;
}
```

---

### 9.2 Midnight Date Comparison Bug in `checkAvailability()`

#### Problem
In `adventures.service.ts` (line 209):
```typescript
const requestedDate = new Date(checkParams.date);
// ...
const isValidDate = requestedDate > new Date();
```
When a customer attempts to book for today (e.g. `checkParams.date = '2026-09-29'`), `new Date('2026-09-29')` constructs UTC midnight `00:00:00.000Z`. At any hour of the day, `requestedDate > new Date()` evaluates to **`false`**, incorrectly returning `available: false` and `remaining_slots: 0` for today's bookings.

#### Fix Required in `adventures.service.ts`
```typescript
const requestedDate = new Date(checkParams.date);
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

// Same-day or future dates are valid for slot checking
const isValidDate = requestedDate >= startOfToday;
```

---

### 9.3 Seed Data and UUID Contract Integrity

#### Problem
In `adventures.service.ts` (line 24):
```typescript
id: 'exp_scuba_goa_01',
```
The TypeORM entity specifies `@PrimaryGeneratedColumn('uuid') id: string;`. Furthermore, `booking-service` defines `reference_id` as `@Column({ type: 'uuid' })`.

When a booking is created against `exp_scuba_goa_01`, PostgreSQL throws:
`invalid input syntax for type uuid: "exp_scuba_goa_01"`

#### Fix Required
All adventure IDs in seed migrations and partner creation must be standard RFC 4122 v4 UUIDs (e.g. `e4d8a1c9-5b23-4f76-88a2-71c18e9d3a01`).

---

### 9.4 Aggregate Fallback in `getReviews()`

#### Problem
If an activity has no user-submitted reviews in `adventure_reviews` yet, `getReviews()` returns:
```json
{
  "overview": {
    "averageRating": 5.0,
    "totalReviews": 0
  }
}
```
However, the parent activity in `travel_adventures` has baseline ratings (e.g. `rating: 4.8`, `reviews_count: 120`). This causes a visual contradiction between the card score and the reviews screen.

#### Fix in `getReviews()`
```typescript
if (reviews.length === 0) {
  const adventure = await this.adventureRepository.findOne({ where: { id } });
  return {
    overview: {
      averageRating: adventure ? Number(adventure.rating) : 5.0,
      totalReviews: adventure ? adventure.reviews_count : 0,
      breakdown: { safety: 5.0, experience: 5.0, value: 5.0 },
    },
    reviews: [],
  };
}
```

---

### 9.5 Slot Booking & Partner Synchronization

#### Architecture Recommendation
1. When a user completes checkout on `booking-service` with `booking_type: 'ADVENTURE'`:
   - Either `booking-service` calls `POST http://adventure-service:3013/api/v1/adventures/:id/confirm-slots` with `{ slot_date, time_slot, participants }`.
   - Or an event `adventure.booking.confirmed` is published over the message broker so `adventure-service` decreases remaining capacity in `adventure_slots` and creates an entry in `adventure_bookings` for partner check-in.

---

### 9.6 Adventure & Experience Service Production Checklist

- [ ] **Implement `POST /api/v1/adventures/:id/reviews`** with rating recalculation.
- [ ] **Fix `checkAvailability()` date comparison** to allow same-day bookings (`requestedDate >= startOfToday`).
- [ ] **Use standard UUIDs** across all seeded adventures and activity creation.
- [ ] **Add aggregate fallback in `getReviews()`** to reflect the activity's baseline rating when no detailed reviews exist.
- [ ] **Filter `is_active: true`** in `findOne` and `checkAvailability`.
- [ ] **Coordinate slot confirmation** between `booking-service` payment confirmation and `adventure-service` slot decrementing.

---

### 9.7 Frontend Contract Alignment Summary (Experiences)

| Feature / Contract | Frontend Field | Backend API Expectation | Status |
|---|---|---|---|
| Experience Search & List | `experiencesProvider` | `GET /api/v1/adventures` | ✅ Live & verified |
| Trending Filter | `trendingExperiencesProvider` | `GET /api/v1/adventures?is_trending=true` | ✅ Wired with fallback |
| Category Aggregation | `experienceCategoriesProvider` | `GET /api/v1/adventures/categories` | ✅ Live & verified |
| Detailed Reviews Breakdown | `experienceReviewsProvider` | `GET /api/v1/adventures/:id/reviews` | ✅ Live & verified |
| Review Submission | `showWriteExperienceReviewBottomSheet` | `POST /api/v1/adventures/:id/reviews` | ⚠️ UI ready; awaiting backend endpoint |
| Slot Availability Check | `experienceAvailabilityProvider` | `POST /api/v1/adventures/:id/availability` | ✅ Live; awaiting same-day fix |
| Booking Creation | `createItemBooking` | `POST /api/v1/bookings` (`booking_type: 'ADVENTURE'`) | ✅ Live & verified with UUID guard |

