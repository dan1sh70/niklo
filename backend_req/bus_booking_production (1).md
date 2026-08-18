# Niklo — Booking Service Production Backend Action Guide

> **Target Microservices**: `bus-service` (`niklo-main/bus-service`, Port `3003`) & `booking-service` (`niklo-main/booking-service`, Port `3014`)
> **Target Database**: `niklo_bus` & `niklo_booking` (PostgreSQL)
> **Status**: 🔴 CRITICAL — Seat availability not persisted after booking confirmed

---

## 🔴 PRIORITY 1 — Seats Still Show as Available After Booking

### Root Cause

The entire seat booking flow has a **missing final step**: after payment confirmation, nobody writes `is_available = false` back to the `bus_seats` table in `bus-service`.

**Current incomplete flow:**
1. ✅ `POST /api/v1/bus/schedules/:id/lock-seat` → Writes a Redis key with a **300-second TTL**.
2. ✅ `POST /api/v1/bookings` → Creates booking row in `booking-service`.
3. ✅ `POST /api/v1/bookings/:id/confirm-payment` → Sets booking status = `CONFIRMED`.
4. ❌ **MISSING**: Nothing marks `bus_seats.is_available = false` in PostgreSQL.

When the user re-opens the seat map, `GET /api/v1/bus/schedules/:id/seat-map` reads fresh from PostgreSQL (`bus_seats`), and since `is_available` was never updated, the booked seats still show as available.

---

### Required Fix in `bus-service`

#### 1. Add `markSeatsBooked` Method in `SchedulesService`
**File**: `niklo-main/bus-service/src/schedules/schedules.service.ts`

```typescript
async markSeatsBooked(scheduleId: string, seatNumbers: string[]): Promise<void> {
  // Mark seats as unavailable in the bus_seats table
  await this.seatRepo
    .createQueryBuilder()
    .update()
    .set({ is_available: false })
    .where('bus_id = (SELECT bus_id FROM schedules WHERE id = :scheduleId)', { scheduleId })
    .andWhere('seat_number IN (:...seatNumbers)', { seatNumbers })
    .execute();

  // Decrement available_seats count on the schedule
  await this.scheduleRepo
    .createQueryBuilder()
    .update()
    .set({ available_seats: () => `available_seats - ${seatNumbers.length}` })
    .where('id = :scheduleId', { scheduleId })
    .andWhere('available_seats >= :count', { count: seatNumbers.length })
    .execute();

  // Clear Redis locks (they are now permanently booked, locks no longer needed)
  const pipeline = this.redis.pipeline();
  seatNumbers.forEach(seat => pipeline.del(`lock:bus:${scheduleId}:${seat}`));
  await pipeline.exec();
}
```

#### 2. Expose a New Route in `SchedulesController`
**File**: `niklo-main/bus-service/src/schedules/schedules.controller.ts`

```typescript
@Post(':id/confirm-seats')
@HttpCode(HttpStatus.OK)
async confirmSeats(
  @Param('id') scheduleId: string,
  @Body() body: { seat_numbers: string[] },
) {
  await this.schedulesService.markSeatsBooked(scheduleId, body.seat_numbers);
  return { success: true, statusCode: 200, message: 'Seats marked as booked' };
}
```

#### 3. Call `confirmSeats` from `booking-service` on Payment Confirmation
**File**: `niklo-main/booking-service/src/bookings/bookings.service.ts`

After `booking.status = CONFIRMED`, add an HTTP call to `bus-service`:

```typescript
// Inside confirmPayment(), after booking.status = BookingStatus.CONFIRMED:
if (booking.booking_type === BookingType.BUS && booking.reference_id && booking.seat_numbers?.length) {
  try {
    await this.httpService.post(
      `${process.env.BUS_SERVICE_URL}/api/v1/bus/schedules/${booking.reference_id}/confirm-seats`,
      { seat_numbers: booking.seat_numbers },
    ).toPromise();
  } catch (e) {
    // Log but don't fail — seats will auto-release after Redis TTL anyway
    this.logger.error(`Failed to mark seats booked on bus-service: ${e.message}`);
  }
}
```

> **Note**: `booking.seat_numbers` must be added to the `Booking` entity and `CreateBookingDto` (see section below).

---

### Required Entity & DTO Updates

#### Add `seat_numbers` to `Booking` entity
**File**: `niklo-main/booking-service/src/bookings/entities/booking.entity.ts`

```typescript
@Column({ type: 'simple-array', nullable: true })
seat_numbers: string[];
```

#### Add `seat_numbers` to `CreateBookingDto`
**File**: `niklo-main/booking-service/src/bookings/dto/booking.dto.ts`

```typescript
@IsOptional()
@IsArray()
@IsString({ each: true })
seat_numbers?: string[];
```

#### Pass `seat_numbers` when creating the booking in `BookingsService.create()`
**File**: `niklo-main/booking-service/src/bookings/bookings.service.ts`

```typescript
const booking = this.bookingRepo.create({
  // ... existing fields
  seat_numbers: dto.seat_numbers,
});
```

---

### Also Check: `getSeatMap` Should Overlay Redis Locks

Even before a final booking, seats locked in Redis (300s TTL) should appear as unavailable in the seat map. Currently `getSeatMap` only reads from PostgreSQL and ignores active Redis locks.

**Update `getSeatMap()` in `schedules.service.ts`**:

```typescript
async getSeatMap(id: string) {
  const seatData = await this.getSeats(id);

  // Check Redis for currently locked seats
  const lockPattern = `lock:bus:${id}:*`;
  const lockKeys = await this.redis.keys(lockPattern);
  const lockedSeatNumbers = lockKeys.map(k => k.split(':').pop()!);

  const formatSeat = (s: SeatLayout) => ({
    seat_number: s.seat_number,
    row: s.row_num,
    column: s.col_num,
    is_upper_deck: s.is_upper_deck,
    seat_type: s.seat_type,
    price: Number(seatData.base_fare) + Number(s.price_offset),
    // A seat is unavailable if marked in DB OR currently locked in Redis
    is_available: s.is_available && !lockedSeatNumbers.includes(s.seat_number),
    is_ladies_seat: false,
  });

  const lowerDeck = seatData.seats.filter(s => !s.is_upper_deck).map(formatSeat);
  const upperDeck = seatData.seats.filter(s => s.is_upper_deck).map(formatSeat);

  return {
    schedule_id: seatData.schedule_id,
    total_seats: seatData.total_seats,
    available_seats: seatData.available_seats,
    lower_deck: lowerDeck,
    upper_deck: upperDeck.length > 0 ? upperDeck : null,
  };
}
```

---

## 🔴 PRIORITY 1b — Seat Colors Incorrect (Pink Female Seats Never Show)

### Root Cause: Missing `is_ladies_seat` Column + `getSeatMap` Hardcodes `false`

**Two bugs together** cause female/ladies seats to never show pink in the UI:

1. `SeatLayout` entity (`bus_seats` table) has **no `is_ladies_seat` or `booked_gender` column** — so this data is never stored in the database.
2. `getSeatMap()` in `schedules.service.ts` hardcodes `is_ladies_seat: false` for every seat, regardless.

> **Flutter fix already applied**: `BusSeatModel.fromJson` was fixed to correctly parse `false` from backend (previously a bug caused backend `false` to be treated as `true`). The remaining fix is 100% in the backend.

---

### Required Fix in `bus-service`

#### 1. Add Columns to `SeatLayout` entity
**File**: `niklo-main/bus-service/src/buses/entities/seat-layout.entity.ts`

```typescript
@Column({ type: 'boolean', default: false })
is_ladies_seat: boolean;

@Column({ type: 'varchar', length: 5, nullable: true, default: null })
booked_gender: string | null; // 'M' | 'F' | null
```

#### 2. Update `CreateSeatDto` to accept new fields
**File**: `niklo-main/bus-service/src/buses/dto/create-seat.dto.ts`

```typescript
@IsOptional()
@IsBoolean()
is_ladies_seat?: boolean;

@IsOptional()
@IsString()
booked_gender?: string;
```

#### 3. Fix `getSeatMap()` to pass real values
**File**: `niklo-main/bus-service/src/schedules/schedules.service.ts`

Change the `formatSeat` function from:
```typescript
is_ladies_seat: false,  // ← BUG: hardcoded
```
To:
```typescript
is_ladies_seat: s.is_ladies_seat ?? false,
booked_gender: s.booked_gender ?? null,
```

#### 4. Run DB Migration
After adding the columns, generate and run a TypeORM migration:
```bash
npm run migration:generate -- -n AddLadiesSeatToSeatLayout
npm run migration:run
```

---

## 📌 PRIORITY 2 — Persist Applied Coupon on Booking

When a user applies a coupon on checkout (e.g. `NIKLOBUS`), the frontend validates the code via `POST /api/v1/offers/validate`. Before initiating payment gateway capture, `booking-service` must persist the coupon code and discount on the booking record.

---

### 1. Update `Booking` Entity
**File**: `niklo-main/booking-service/src/bookings/entities/booking.entity.ts`

Add `coupon_code` and `discount_amount` columns:

```typescript
@Column({ type: 'varchar', length: 50, nullable: true })
coupon_code: string;

@Column({ type: 'numeric', precision: 10, scale: 2, default: 0.00 })
discount_amount: number;
```

---

### 2. Add Route to `BookingsController`
**File**: `niklo-main/booking-service/src/bookings/bookings.controller.ts`

Add the `POST :id/apply-coupon` endpoint:

```typescript
@Post(':id/apply-coupon')
@HttpCode(HttpStatus.OK)
async applyCoupon(
  @Param('id') id: string,
  @Body() body: { coupon_code: string; discount_amount: number },
) {
  const data = await this.bookingsService.applyCoupon(id, body);
  return { success: true, statusCode: 200, data };
}
```

---

### 3. Implement Method in `BookingsService`
**File**: `niklo-main/booking-service/src/bookings/bookings.service.ts`

Add `applyCoupon`:

```typescript
async applyCoupon(id: string, body: { coupon_code: string; discount_amount: number }) {
  const booking = await this.bookingRepo.findOne({
    where: { id },
  });
  if (!booking) throw new NotFoundException('Booking not found');

  const discount = Number(body.discount_amount) || 0;
  booking.coupon_code = body.coupon_code;
  booking.discount_amount = discount;
  booking.total_amount = Math.max(0, Number(booking.total_amount) - discount);
  await this.bookingRepo.save(booking);

  return this.mapBookingToDto(booking);
}
```

And update `mapBookingToDto`:

```typescript
private mapBookingToDto(b: Booking) {
  return {
    id: b.id,
    bookingReference: b.booking_reference,
    bookingType: b.booking_type,
    title: b.title,
    subtitle: b.subtitle,
    fromLocation: b.from_location,
    toLocation: b.to_location,
    travelDate: b.travel_date ? b.travel_date.toISOString().split('T')[0] : null,
    departureTime: b.departure_time,
    totalAmount: Number(b.total_amount),
    status: b.status,
    qrCodeToken: b.qr_code_token,
    couponCode: b.coupon_code,
    discountAmount: b.discount_amount ? Number(b.discount_amount) : 0,
  };
}
```

---

### 4. API Request & Response Contract

- **Endpoint**: `POST /api/v1/bookings/:id/apply-coupon`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "coupon_code": "NIKLOBUS",
  "discount_amount": 142.50
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "bkg_771029",
    "bookingReference": "NIK-BUS-88210",
    "bookingType": "BUS",
    "totalAmount": 807.50,
    "couponCode": "NIKLOBUS",
    "discountAmount": 142.50,
    "status": "PENDING"
  }
}
```
