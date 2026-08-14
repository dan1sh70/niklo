# Niklo — Bookings & Payment Module Production Backend Specification & API Blueprint

> **Target Microservices**: `booking-service` (`niklo-main/booking-service`, Port `3014`) & `payment-service` (`niklo-main/payment-service`, Port `3007`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/bookings` ([booking_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bookings/data/models/booking_model.dart), [payment_order_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bookings/data/models/payment_order_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Bookings & Payments Module** ([booking_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bookings/data/models/booking_model.dart)) manages reservations across all travel verticals (`BUS`, `CAR`, `JOURNEY_LEG`, `PACKAGE`, `ADVENTURE`, `HOTEL`), Razorpay order creation and server webhooks, cancellation refund quotes, and cryptographic QR code ticket verification.

In `niklo-main`, the mobile client currently calls multiple microservices and joins data in client memory. Furthermore, server-to-server Razorpay HMAC SHA256 webhook verification is missing, posing a severe security risk.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter App Enum / Model | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `BookingType` | 🟢 Matches | `BUS`, `CAR`, `JOURNEY_LEG`, `PACKAGE`, `ADVENTURE`, `HOTEL` | Maintain enum compatibility |
| Booking History Feed | 🔴 Split endpoints | `GET /api/v1/bookings/history` querying all 5 verticals | Unified paginated history API |
| Razorpay Webhook | ❌ Client simulation | `POST /api/v1/payment/webhook/razorpay` with HMAC SHA256 check | Implement server webhook security |
| Cancellation Quote | ❌ Missing | `POST /api/v1/bookings/:id/cancellation-quote` | Implement penalty & refund calculator |
| QR Code Verification | ❌ Plain UUID | `POST /api/v1/tickets/verify-qr` verifying signed JWT | Implement cryptographic ticket check |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_booking`):

```sql
-- PostgreSQL Migration DDL for Booking & Payment Module (booking-service & payment-service DB)

CREATE TYPE booking_type_enum AS ENUM ('BUS', 'CAR', 'JOURNEY_LEG', 'PACKAGE', 'ADVENTURE', 'HOTEL');
CREATE TYPE booking_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_type booking_type_enum NOT NULL,
    reference_id UUID NOT NULL,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    travel_date DATE NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status booking_status_enum DEFAULT 'CONFIRMED',
    qr_code_token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100) UNIQUE NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status payment_status_enum DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Unified Booking History Feed
- **Method**: `GET`
- **Route**: `/api/v1/bookings/history?type=ALL&status=UPCOMING`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "bkg_771029",
      "bookingReference": "NIK-BUS-88210",
      "bookingType": "BUS",
      "title": "Greenline Travels (AC Sleeper)",
      "subtitle": "Kolkata to Siliguri",
      "fromLocation": "Esplanade, Kolkata",
      "toLocation": "Junction, Siliguri",
      "travelDate": "2026-08-28",
      "departureTime": "20:00",
      "totalAmount": 1200.00,
      "status": "CONFIRMED",
      "qrCodeToken": "eyJhbGciOiJIUzI1Ni..."
    }
  ]
}
```

---

### 3.2. Razorpay Server Webhook Handler
- **Method**: `POST`
- **Route**: `/api/v1/payment/webhook/razorpay`
- **Headers**: `X-Razorpay-Signature: <hmac_sha256_hash>`

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment webhook processed successfully"
}
```

---

## 4. NestJS Controller Blueprint for `booking-service`

Update `niklo-main/booking-service/src/bookings/bookings.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('history')
  async getHistory(@Query() query: any) {
    const data = await this.bookingsService.getHistory(query);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/cancellation-quote')
  @HttpCode(HttpStatus.OK)
  async getCancellationQuote(@Param('id') id: string) {
    const data = await this.bookingsService.getCancellationQuote(id);
    return { success: true, statusCode: 200, data };
  }

  @Post('verify-ticket')
  @HttpCode(HttpStatus.OK)
  async verifyTicket(@Body('token') token: string) {
    const data = await this.bookingsService.verifyTicket(token);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `BookingModel` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | Booking UUID |
| `bookingReference` | `bookingReference` | `booking_reference` | Readable ticket ID |
| `bookingType` | `bookingType` | `booking_type` | Enum string |
| `title` | `title` | `title` | Main title |
| `subtitle` | `subtitle` | `subtitle` | Subtitle text |
| `travelDate` | `travelDate` | `travel_date` | Date format "YYYY-MM-DD" |
| `totalAmount` | `totalAmount` | `total_amount` | Calculated numeric price |
| `status` | `status` | `status` | Enum string |

---

## 6. Definition of Done Checklist
- [ ] DDL migration script executed creating `bookings` and `payment_orders` tables.
- [ ] `GET /api/v1/bookings/history` returns unified list across all travel verticals.
- [ ] `POST /api/v1/payment/webhook/razorpay` verifies HMAC SHA256 signatures securely.
