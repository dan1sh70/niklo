# Niklo — Bookings & Payment Module Production Backend Specification & API Blueprint

> **Target Microservices**: `booking-service` (`niklo-main/booking-service`, Port `3014`) & `payment-service` (`niklo-main/payment-service`, Port `3007`)  
> **Target Database**: `niklo_booking` & `niklo_payment` (PostgreSQL)  
> **Frontend Code Reference**: `lib/features/bookings` ([booking_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bookings/data/models/booking_model.dart), [payment_order_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/bookings/data/models/payment_order_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Booking Requirements)

The **Bookings & Payments Module** in Niklo (`lib/features/bookings`) handles reservations across all travel verticals (`BUS`, `CAR`, `JOURNEY_LEG`, `PACKAGE`, `ADVENTURE`, `HOTEL`), Razorpay order creation and webhook verification, cancellation refund quotes, and cryptographic QR code ticket verification.

In `niklo-main/booking-service`, core history endpoints (`GET /api/v1/bookings/my-bookings`, `GET /:id`, `POST /:id/cancel`) are **🟢 IMPLEMENTED**! However, cancellation refund quote preview (`POST /api/v1/bookings/:id/cancellation-quote`), signed QR ticket verification (`POST /api/v1/tickets/verify-qr`), and server-to-server Razorpay HMAC SHA256 webhook verification are missing.

### Audit Matrix: Current Backend Code vs Required App Models

| Feature / Component | Endpoint / Entity | `niklo-main` Status | Backend Action Required |
|---|---|---|---|
| User Reservations History | `GET /api/v1/bookings/my-bookings` | 🟢 Complete | Implemented in `bookings.controller.ts` |
| Reservation Details & Cancellation | `GET /:id`, `POST /:id/cancel` | 🟢 Complete | Implemented in `bookings.controller.ts` |
| Cancellation Refund Quote | `POST /api/v1/bookings/:id/cancellation-quote` | 🔴 Missing | Implement refund quote calculator endpoint |
| Cryptographic Ticket QR Verify | `POST /api/v1/tickets/verify-qr` | 🔴 Missing | Implement JWT signed QR ticket checker |
| Razorpay Server Webhook | `POST /api/v1/payment/webhook/razorpay` | 🔴 Missing | Implement HMAC SHA256 webhook handler |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on PostgreSQL (`postgres-db` for `niklo_booking` & `niklo_payment`):

```sql
-- PostgreSQL Migration DDL for Booking & Payment Module

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

## 3. OpenAPI Endpoint Specifications & cURL Verification Suite

### 3.1. Razorpay Server Webhook Handler
- **Method**: `POST`
- **Route**: `/api/v1/payment/webhook/razorpay`
- **Headers**: `X-Razorpay-Signature: <hmac_sha256_hash>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment webhook processed successfully"
}
```

### 3.2. Cancellation Refund Quote
- **Method**: `POST`
- **Route**: `/api/v1/bookings/:id/cancellation-quote`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "booking_id": "bkg_771029",
    "total_paid": 1200.00,
    "cancellation_fee": 120.00,
    "refundable_amount": 1080.00,
    "refund_policy": "90% refund prior to 24 hours of departure"
  }
}
```

### 3.3. Confirm Booking Payment
- **Method**: `POST`
- **Route**: `/api/v1/bookings/:id/confirm-payment`
- **Request Body**:
```json
{
  "payment_id": "pay_1723902345",
  "payment_gateway_order_id": "order_1723902345"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "bkg_771029",
    "status": "CONFIRMED",
    "payment_id": "pay_1723902345",
    "total_amount": 1200.00
  }
}
```

---

## 4. NestJS Controller Blueprint for `booking-service`

Update `niklo-main/booking-service/src/bookings/bookings.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Body() dto: CreateBookingDto) {
    const data = await this.bookingsService.create(dto);
    return { success: true, statusCode: 201, data };
  }

  @Get('history')
  async getHistory(@Query() query: any) {
    const data = await this.bookingsService.getHistory(query);
    return { success: true, statusCode: 200, data };
  }

  @Post(':id/confirm-payment')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('id') id: string,
    @Body() body: { payment_id?: string; payment_gateway_order_id?: string },
  ) {
    const data = await this.bookingsService.confirmPayment(id, body);
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

## 5. Definition of Done for Backend Developer
- [ ] DDL migration script executed creating `bookings` and `payment_orders` tables.
- [ ] `POST /api/v1/bookings/:id/cancellation-quote` calculates cancellation penalty.
- [ ] `POST /api/v1/payment/webhook/razorpay` verifies HMAC SHA256 signatures.

---

## 6. Razorpay API Key & Sandbox Environment Setup
**Target Microservice**: `payment-service` (`niklo-main/payment-service`)

To enable live Razorpay order creation on `payment-service`:
1. Add the following environment variables to `niklo-main/payment-service/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_YourTestKeyIdHere
RAZORPAY_KEY_SECRET=YourTestKeySecretHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
```
2. In `PaymentsService.createOrder` (`src/payments/payments.service.ts`), if running in development / test mode without active keys, return a simulated order ID instead of throwing 500 error:
```typescript
if (!this.razorpayInstance) {
  // Return sandbox order for local development
  return {
    payment_id: `pay_${Date.now()}`,
    razorpay_order_id: `order_${Date.now()}`,
    amount: amountInPaise,
    currency: dto.currency || 'INR',
  };
}
```

---

## 7. Dynamic Offers & Coupon Code Validation API
**Target Microservice**: `booking-service` / `payment-service`

### 7.1. Database Schema (`coupons` Table)
```sql
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('FLAT', 'PERCENTAGE')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2) NULL,
    applicable_category VARCHAR(50) DEFAULT 'ALL', -- 'BUS', 'HOTEL', 'CAR', 'PACKAGE', 'ADVENTURE', 'ALL'
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit INT DEFAULT 1000,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial coupon codes
INSERT INTO coupons (code, title, description, discount_type, discount_value, min_order_amount, applicable_category, valid_until)
VALUES 
('NIKLOBUS', 'Flat 15% OFF on Bus Bookings', 'Save up to ₹200 on intercity bus bookings', 'PERCENTAGE', 15, 500, 'BUS', NOW() + INTERVAL '90 days'),
('STAYNIKLO', 'Flat ₹500 OFF on Luxury Hotels', 'Flat ₹500 discount on hotel stays above ₹2000', 'FLAT', 500, 2000, 'HOTEL', NOW() + INTERVAL '90 days'),
('NIKLOFLY', 'Flat 10% OFF on Packages', 'Enjoy 10% discount on holiday packages', 'PERCENTAGE', 10, 3000, 'PACKAGE', NOW() + INTERVAL '90 days'),
('ROADTRIP', 'Flat 20% OFF on Outstation Cabs', 'Get 20% discount on outstation rides', 'PERCENTAGE', 20, 800, 'CAR', NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;
```

### 7.2. Coupon Endpoints
#### 1. List Available Offers
- **Method**: `GET`
- **Route**: `/api/v1/offers?category=BUS`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "code": "NIKLOBUS",
      "title": "Flat 15% OFF on Bus Bookings",
      "discount_type": "PERCENTAGE",
      "discount_value": 15,
      "min_order_amount": 500,
      "max_discount_amount": 200,
      "valid_until": "2026-11-18T00:00:00Z"
    }
  ]
}
```

#### 2. Validate Coupon Code
- **Method**: `POST`
- **Route**: `/api/v1/offers/validate`
- **Request Body**:
```json
{
  "code": "NIKLOBUS",
  "category": "BUS",
  "order_amount": 1200.00
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "valid": true,
    "code": "NIKLOBUS",
    "discount_amount": 180.00,
    "final_amount": 1020.00,
    "message": "Coupon NIKLOBUS applied successfully!"
  }
}
```

---

## 8. Travel Insurance Addon & Policy Generation Specification
**Target Microservice**: `booking-service`

### 8.1. Database Schema Extension
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS insurance_partner VARCHAR(50) DEFAULT 'Digit / Acko';
```

### 8.2. Business Rules & Calculation:
1. **Premium Rate**: ₹49 per traveller / passenger.
2. **Coverage**:
   - Accidental hospitalization: Up to ₹3,00,000
   - Baggage loss / delay: Up to ₹10,000
   - Trip cancellation due to medical emergency: Up to ₹25,000
3. **Trigger**: When `has_insurance: true` is sent in `CreateBookingDto`, `booking-service` computes `insurance_premium = passenger_count * 49`, adds it to `fare_breakdown`, and issues an automated policy reference upon payment confirmation.

---

## 9. Government ID & Identity Document Verification Engine
**Target Microservice**: `booking-service` / `auth-service`

### 9.1. Database Schema Extension
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS has_gov_id_verification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS primary_gov_id_type VARCHAR(50) NULL, -- 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID'
ADD COLUMN IF NOT EXISTS primary_gov_id_number VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(30) DEFAULT 'UNVERIFIED'; -- 'UNVERIFIED', 'PENDING', 'VERIFIED', 'FAILED'
```

### 9.2. Document Verification API Endpoints
#### 1. Submit ID Document for Verification
- **Method**: `POST`
- **Route**: `/api/v1/bookings/verify-id`
- **Request Body**:
```json
{
  "booking_id": "bkg_771029",
  "id_type": "AADHAAR",
  "id_number": "XXXX-XXXX-9012",
  "document_url": "https://s3.niklo.com/docs/aadhaar_front.jpg"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "verified": true,
    "status": "VERIFIED",
    "id_type": "AADHAAR",
    "masked_id": "XXXX-XXXX-9012",
    "holder_name": "Anish Dandapat",
    "fast_boarding_pass": true,
    "verification_timestamp": "2026-08-18T01:10:00Z"
  }
}
```

#### 2. Get Verification Status
- **Method**: `GET`
- **Route**: `/api/v1/bookings/:id/id-verification`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "booking_id": "bkg_771029",
    "status": "VERIFIED",
    "fast_boarding_eligible": true,
    "badge_text": "Verified Traveller"
  }
}
```



