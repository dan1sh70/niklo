# ⚙️ Backend Production Audit Report: Bus Service & Booking Architecture

**Target Audience:** Backend Engineers & System Architects (`bus-service` & `booking-service`)  
**Date:** September 2026  
**Audited Services:**  
1. **Bus Service:** `niklo-main/bus-service` (NestJS, TypeORM, PostgreSQL, Redis)  
2. **Booking Service:** `niklo-main/booking-service` (NestJS, TypeORM, PostgreSQL)  
3. **Gateway / Routing:** `niklo-main/nginx.conf`  

---

## Executive Summary

An in-depth technical audit was conducted on the backend microservices supporting bus travel. While the service foundations (NestJS, Redis seat locking, TypeORM entities) are established, **severe architectural defects in seat inventory management, query logic regressions, missing modules, and inconsistent API envelopes currently block production deployment.**

### High-Priority Architectural Flaws:
1. **Permanent Physical Bus Seat Depletion:** Confirming a seat booking marks `bus_seats.is_available = false` on the physical bus template rather than on the schedule instance. This permanently breaks seat availability for all future trips running on that bus.
2. **Date Query Regression in Schedule Search:** The search query filters `departure_date <= :date`, returning historical/past schedules from months ago.
3. **Data Loss in Booking Service:** `passenger_details` (names, ages, genders, seat allocations, Govt IDs) received in the booking DTO are completely discarded; the `Booking` entity has no column to store them.
4. **Hardcoded Mock User in Production:** `booking-service` forces all bookings to a hardcoded `MOCK_USER_ID`, preventing authenticated mobile users from retrieving their own tickets.
5. **Missing Driver Management Module:** The partner app relies on `GET/POST/PATCH/DELETE /api/v1/bus/drivers`, but no controller, service, or database table exists.

---

## 1. Critical Architectural & Data Integrity Bugs

---

### 1.1 Physical Bus Seat Depletion Bug (`markSeatsBooked`)
* **File:** [schedules.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/bus-service/src/schedules/schedules.service.ts#L200-L223)
* **Problematic Code:**
  ```typescript
  async markSeatsBooked(scheduleId: string, seatNumbers: string[]): Promise<void> {
    // ❌ CRITICAL BUG: Marks the physical bus template seats as unavailable
    await this.seatRepo
      .createQueryBuilder()
      .update()
      .set({ is_available: false })
      .where('bus_id = (SELECT bus_id FROM schedules WHERE id = :scheduleId)', { scheduleId })
      .andWhere('seat_number IN (:...seatNumbers)', { seatNumbers })
      .execute();
    ...
  }
  ```
* **Impact:**  
  `bus_seats` (`SeatLayout`) is the physical blueprint of the bus (e.g., Bus KA-01-1234 has 36 seats).  
  When a passenger books seat `L1` for a trip today, `is_available` is flipped to `false` on the bus template.  
  When the same bus is scheduled for tomorrow, next week, or next month, `getSeatMap()` queries `this.seatRepo.find({ where: { bus_id } })`. **Seat `L1` will permanently show as occupied for all future schedules!**
* **Architectural Fix:**  
  1. Seat availability **must never mutate the `bus_seats` master layout table**.
  2. `bus_seats` should only store immutable layout definitions (`seat_number`, `row_num`, `col_num`, `is_upper_deck`, `seat_type`, `price_offset`).
  3. Seat occupancy for a schedule must be determined by:
     - Checking active Redis locks: `lock:bus:<scheduleId>:<seatNumber>`
     - Checking confirmed seat bookings for that specific `schedule_id` (either via a `schedule_booked_seats` table or by querying `booking-service`).

---

### 1.2 Past Schedules Returned in Search Query (`<= :date`)
* **File:** [schedules.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/bus-service/src/schedules/schedules.service.ts#L99-L105)
* **Problematic Code:**
  ```typescript
  if (date) {
    qb.andWhere(
      '(schedule.departure_date = :date OR schedule.departure_date <= :date)',
      { date }
    );
  }
  ```
* **Impact:**  
  If a customer searches for buses departing on `2026-10-01`, this SQL query matches all schedules where `departure_date <= '2026-10-01'`. The API returns expired bus trips from months or years ago!
* **Fix:**
  ```typescript
  if (date) {
    qb.andWhere('schedule.departure_date = :date', { date });
  }
  ```

---

### 1.3 Discarded Passenger Details in `booking-service`
* **File:** [bookings.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/booking-service/src/bookings/bookings.service.ts#L78-L108) and [booking.entity.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/booking-service/src/bookings/entities/booking.entity.ts)
* **Problem:**  
  The mobile app sends complete passenger details:
  ```json
  "passenger_details": [
    { "seat_number": "L1", "name": "Rajesh Kumar", "age": 32, "gender": "M", "gov_id_number": "1234..." }
  ]
  ```
  In `bookings.service.ts`, `dto.passenger_details` is only used to compute insurance premium:
  ```typescript
  if (dto.has_insurance && dto.passenger_details) {
    insurance_premium = dto.passenger_details.length * 49;
  }
  ```
  `Booking` entity **does not have a `passenger_details` column**. The array is discarded!  
  Neither the passenger's digital ticket nor the bus operator's manifest can display passenger names.
* **Fix:**  
  Add `passenger_details` as a `jsonb` column in `booking.entity.ts`:
  ```typescript
  @Column({ type: 'jsonb', nullable: true, default: [] })
  passenger_details: Array<{
    seat_number: string;
    name: string;
    age: number;
    gender: string;
    is_child?: boolean;
    gov_id_type?: string;
    gov_id_number?: string;
  }>;
  ```

---

### 1.4 Hardcoded `MOCK_USER_ID` in `booking-service`
* **File:** [bookings.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/booking-service/src/bookings/bookings.service.ts#L14)
* **Problem:**  
  ```typescript
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';
  ```
  In `create()`: `user_id: this.MOCK_USER_ID`  
  In `getHistory()`: `.where('b.user_id = :userId', { userId: this.MOCK_USER_ID })`  
  In `confirmPayment()`: `where: { id, user_id: this.MOCK_USER_ID }`  
  Real authenticated users (with their own JWT `req.user.userId`) never have their bookings saved under their account and cannot see their trip history.
* **Fix:**  
  Extract `userId` from the authenticated request (`@Req() req` with `req.user.userId`).

---

## 2. Missing Endpoints & Controller Enhancements

---

### 2.1 Operator Schedule Filtering Missing
* **File:** [schedules.controller.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/bus-service/src/schedules/schedules.controller.ts#L40-L47)
* **Current Implementation:**
  ```typescript
  @Get()
  async findAll(
    @Query('route_id') routeId?: string,
    @Query('date') date?: string,
  ) {
    const data = await this.schedulesService.findAll(routeId, date);
    return { success: true, statusCode: 200, data };
  }
  ```
* **Problem:**  
  The Partner App calls `GET /api/v1/bus/schedules?operator_id=<uuid>`.  
  `SchedulesController.findAll` completely ignores `operator_id`.  
  Every bus operator sees **all schedules belonging to every competitor in the system**.
* **Required Change:**
  ```typescript
  @Get()
  async findAll(
    @Query('operator_id') operatorId?: string,
    @Query('route_id') routeId?: string,
    @Query('date') date?: string,
  ) {
    const data = await this.schedulesService.findAll(routeId, date, operatorId);
    return { success: true, statusCode: 200, data };
  }
  ```

---

### 2.2 Boarding & Dropping Points Missing from Schedule Search
* **File:** [schedules.service.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/bus-service/src/schedules/schedules.service.ts#L80-L107)
* **Problem:**  
  `searchByRoute()` executes:
  ```typescript
  const qb = this.scheduleRepo
    .createQueryBuilder('schedule')
    .leftJoinAndSelect('schedule.route', 'route')
    .leftJoinAndSelect('schedule.bus', 'bus')
    .leftJoinAndSelect('schedule.operator', 'operator')
    .leftJoinAndSelect('bus.seats', 'seats')
  ```
  It does **not** join `route.boarding_points` or `route.dropping_points`.  
  When the User App renders the seat selection screen, `activeSchedule.route.boardingPoints` is empty `[]`.
* **Required Change:**
  Add the relations to the query builder:
  ```typescript
  .leftJoinAndSelect('route.boarding_points', 'boarding_points')
  .leftJoinAndSelect('route.dropping_points', 'dropping_points')
  ```

---

### 2.3 Expose Schedule Seats Endpoint (`/seats`)
* **File:** [schedules.controller.ts](file:///d:/Users/anish/Project/niklo_project/niklo-main/bus-service/src/schedules/schedules.controller.ts)
* **Problem:**  
  `SchedulesService` contains `getSeats(scheduleId)`, but `SchedulesController` only exposes `@Get(':id/seat-map')`.  
  The Partner App calls `GET /api/v1/bus/schedules/:id/seats` and crashes with 404.
* **Required Change:**  
  Add route alias in `SchedulesController`:
  ```typescript
  @Get(':id/seats')
  async getSeatsAlias(@Param('id') id: string) {
    const data = await this.schedulesService.getSeats(id);
    return { success: true, statusCode: 200, data };
  }
  ```

---

### 2.4 Missing Drivers Management Module
* **Path:** `niklo-main/bus-service/src/drivers/` (Currently does not exist)
* **Problem:**  
  The Partner App implements a complete driver management flow:
  - `GET /api/v1/bus/drivers?operator_id=...`
  - `POST /api/v1/bus/drivers`
  - `PATCH /api/v1/bus/drivers/:id`
  - `DELETE /api/v1/bus/drivers/:id`
  
  All 4 calls return 404.
* **Required Implementation:**  
  Create `Driver` entity, `DriversController`, `DriversService`, and `DriversModule`:
  ```typescript
  @Entity('bus_drivers')
  export class BusDriver {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    operator_id: string;

    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'varchar', length: 50 })
    license_number: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'uuid', nullable: true })
    assigned_bus_id: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
  }
  ```

---

### 2.5 Passenger Manifest Endpoint for Operators
* **Problem:**  
  Operators need to view the passenger list for an upcoming trip (`GET /api/v1/bus/schedules/:id/manifest` or `GET /api/v1/bookings/schedule/:id`).
* **Current State:**  
  `schedules.service.ts` contains a private method `getManifest()` returning fake data (`John Doe`, `Jane Doe`), but it is not exposed on `SchedulesController`.
* **Required Implementation:**  
  Expose `@Get(':id/manifest')` on `SchedulesController` and query real confirmed bookings from `booking-service` or database.

---

## 3. Response Format Standardization

Currently, controllers across `bus-service` return inconsistent response envelopes:

| Controller | Method | Current Return Shape |
| :--- | :--- | :--- |
| `SchedulesController` | `findAll`, `search`, `findOne` | `{ success: true, statusCode: 200, data: T }` |
| `BusesController` | `findAll`, `findOne`, `create` | Direct raw entity `Bus` or `Bus[]` |
| `RoutesController` | `findAll`, `search`, `create` | Direct raw entity `Route` or `Route[]` |
| `LocationsController` | `autocomplete` | Direct array `[{ id, name, type }]` |
| `PopularRoutesController`| `getPopularRoutes` | `{ success: true, statusCode: 200, data: T }` |

This inconsistency causes Dart deserialization exceptions (`TypeError: _Map is not Iterable`).

### Recommended Fix: Global NestJS Transform Interceptor
Create `src/common/interceptors/transform.interceptor.ts`:
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    return next.handle().pipe(
      map((data) => {
        // Avoid double-wrapping
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return {
          success: true,
          statusCode,
          data,
        };
      }),
    );
  }
}
```
Apply globally in `main.ts`:
```typescript
app.useGlobalInterceptors(new TransformInterceptor());
```

---

## 4. DTO Validation & Schema Adjustments

1. **Allow `id` in `CreateOperatorDto`:**  
   The partner app passes the authenticated user's profile ID as the operator ID. Because `ValidationPipe` has `whitelist: true`, `id` is stripped.  
   Add `@IsOptional() @IsUUID() id?: string;` to `CreateOperatorDto` and pass it to `operatorRepo.create(dto)`.
2. **Add `LUXURY_COACH` to `BusType` Enum:**  
   Add `LUXURY_COACH = 'LUXURY_COACH'` to `bus.entity.ts` and update the PostgreSQL enum:
   ```sql
   ALTER TYPE bus_type_enum ADD VALUE IF NOT EXISTS 'LUXURY_COACH';
   ```
3. **Support Flexible Phone Regex in `CreateOperatorDto`:**  
   Currently `@Matches(/^\+[1-9]\d{1,14}$/)` rejects Indian phone numbers without `+91` (e.g. `9876543210`). Change regex to allow standard 10-digit mobile numbers:
   ```typescript
   @Matches(/^(\+?[1-9]\d{1,14}|\d{10})$/, { message: 'Invalid phone format' })
   ```
4. **Implement Real Operator Summary:**  
   `OperatorsService.getSummary` currently returns hardcoded integers (`total_buses: 12`, `total_earnings_today: 204000.00`). Wire this to aggregate counts from `buses` and `schedules` tables.

---

## 5. Backend Action Checklist

- [ ] **Fix `markSeatsBooked`:** Stop updating `bus_seats.is_available = false`. Implement schedule-scoped seat occupancy.
- [ ] **Fix `searchByRoute` Date Filter:** Change `<= :date` to `= :date`.
- [ ] **Join Route Points in `searchByRoute`:** Include `boarding_points` and `dropping_points`.
- [ ] **Persist `passenger_details` in `booking-service`:** Add `jsonb` column to `bookings` entity and save the array.
- [ ] **Remove `MOCK_USER_ID` in `booking-service`:** Use `req.user.userId`.
- [ ] **Add `operator_id` Query Filter:** Update `SchedulesController.findAll` and `SchedulesService.findAll`.
- [ ] **Create `DriversModule` in `bus-service`:** Support driver CRUD operations.
- [ ] **Expose `/bus/schedules/:id/seats` & `/manifest`:** Add routes to `SchedulesController`.
- [ ] **Standardize Response Envelope:** Apply `TransformInterceptor` globally.
