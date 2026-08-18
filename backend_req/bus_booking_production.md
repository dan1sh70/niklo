# Niklo — Bus Booking Module Production Backend Action Guide

> **Target Microservice**: `bus-service` (`niklo-main/bus-service`, Port `3003`) & `booking-service` (`niklo-main/booking-service`, Port `3014`)  
> **Target Database**: `niklo_bus` (PostgreSQL & Redis)  
> **Frontend Code Reference**: `lib/features/bus_booking/` ([bus_booking_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/presentation/screens/bus_booking_screen.dart), [select_seats_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/presentation/screens/select_seats_screen.dart), [passenger_details_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/presentation/screens/passenger_details_screen.dart), [bus_repository.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bus_booking/data/repositories/bus_repository.dart))  
> **Status**: 🟢 Frontend & Backend Core APIs Integrated.

---

## ⚡ Backend Status & Implementation Verification

All primary REST API endpoints on `bus-service` are **🟢 ALREADY IMPLEMENTED** in `niklo-main/bus-service`:

| # | Feature / Endpoint | Backend File Location | Status |
|---|---|---|---|
| **1** | `GET /api/v1/bus/locations/autocomplete` | `src/locations/locations.controller.ts` | 🟢 Implemented (Fuzzy ILIKE on source/destination cities) |
| **2** | `GET /api/v1/bus/schedules/search` | `src/schedules/schedules.service.ts` | 🟢 Implemented (`searchByRoute` with eager relations) |
| **3** | `GET /api/v1/bus/schedules/:id/seat-map` | `src/schedules/schedules.service.ts` | 🟢 Implemented (Structured 2D `lower_deck` & `upper_deck` grid) |
| **4** | `POST /api/v1/bus/schedules/:id/lock-seat` | `src/schedules/schedules.service.ts` | 🟢 Implemented (Redis 300s TTL lock + atomic rollback) |
| **5** | `GET /api/v1/bus/schedules/:id/boarding-points` | `src/schedules/schedules.service.ts` | 🟢 Implemented (Pickup & drop locations with landmarks) |

---

## 1. Fix `LockSeatsDto` Validation in `booking-service`
**File**: `niklo-main/booking-service/src/bookings/dto/booking.dto.ts`

### Issue:
The `LockSeatsDto` was using `@IsUUID('all', { each: true })` on `seatIds`. Bus seat numbers are alphanumeric codes (e.g. `'L1'`, `'L2'`, `'1A'`, `'3B'`), NOT UUIDs. This caused a 400 Bad Request error: `"each value in seatIds must be a UUID"`.

### Fix:
Change `@IsUUID` to `@IsString`:

```typescript
export class LockSeatsDto {
  @IsUUID('all')
  scheduleId: string;

  @IsArray()
  @IsString({ each: true }) // <--- FIX: Must be String, not UUID
  seatIds: string[];
}
```

---

## 2. Dynamic Date Query in `SchedulesService`
**File**: `niklo-main/bus-service/src/schedules/schedules.service.ts`

To support daily recurring bus schedules across any search date:

```typescript
  async searchByRoute(
    source: string,
    destination: string,
    date?: string,
  ): Promise<Schedule[]> {
    const qb = this.scheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.route', 'route')
      .leftJoinAndSelect('schedule.bus', 'bus')
      .leftJoinAndSelect('schedule.operator', 'operator')
      .leftJoinAndSelect('bus.seats', 'seats')
      .where('schedule.status = :status', { status: ScheduleStatus.SCHEDULED })
      .andWhere('route.is_active = :active', { active: true });

    if (source) {
      qb.andWhere('LOWER(route.source_city) LIKE LOWER(:source)', {
        source: `%${source.trim()}%`,
      });
    }
    if (destination) {
      qb.andWhere('LOWER(route.destination_city) LIKE LOWER(:dest)', {
        dest: `%${destination.trim()}%`,
      });
    }
    
    // Support daily schedules across dates
    if (date) {
      qb.andWhere(
        '(schedule.departure_date = :date OR schedule.departure_date <= :date)',
        { date }
      );
    }

    return qb.orderBy('schedule.departure_time', 'ASC').getMany();
  }
```

---

## 3. Government ID Verification & Fast-Track Boarding Pass Contract
**Target Microservice**: `booking-service` / `bus-service`

When passengers opt into **Govt ID Verification** during seat reservation:
1. `passenger_details` in `CreateBookingDto` accepts `gov_id_type` and `gov_id_number` for the primary passenger:
```json
{
  "booking_type": "BUS",
  "schedule_id": "11111111-1111-1111-1111-111111111113",
  "seat_numbers": ["L1"],
  "passenger_details": [
    {
      "seat_number": "L1",
      "name": "Anish Dandapat",
      "age": 25,
      "gender": "Male",
      "is_child": false,
      "gov_id_type": "Aadhaar Card",
      "gov_id_number": "1234-5678-9012"
    }
  ]
}
```
2. The encrypted QR token emitted in `Booking.qr_code_token` includes `{ verified_id: true, id_type: 'AADHAAR' }` allowing the conductor/driver app scanner to instantly validate the identity for fast-track boarding.
