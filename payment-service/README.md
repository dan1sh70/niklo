# Niklo Payment Microservice

This is the Payment Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3007
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_payment

# JWT configuration (same secret as auth-service)
JWT_SECRET=super-secret-jwt-key

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
RAZORPAY_KEY_SECRET=YourSecretKeyHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Documentation

All endpoints are under `/api/v1/payment`. Protected endpoints require a `Bearer` token issued by the `auth-service`.

---

### Payments

#### `POST /api/v1/payment/orders` 🔒
Create a Razorpay order for a booking or generic payment.
```json
{
  "amount": 500,
  "currency": "INR",
  "booking_id": "optional-uuid"
}
```

#### `GET /api/v1/payment/orders/:id` 🔒
Get details of a payment by its internal UUID.

---

### Wallet

#### `POST /api/v1/payment/wallet/topup` 🔒
Initiate a wallet top-up. Creates a Razorpay order specifically for topping up.
```json
{
  "amount": 1000,
  "description": "Monthly Wallet Top-up"
}
```

#### `GET /api/v1/payment/wallet/transactions` 🔒
Get the wallet transaction history (ledger) for the authenticated user.

---

### Webhooks

#### `POST /api/v1/payment/webhook/razorpay` [Public]
Endpoint for Razorpay to send webhook events. Expects the `x-razorpay-signature` header for HMAC validation.
Handled events:
- `payment.captured`: Updates payment to `COMPLETED` and processes wallet top-ups if applicable.
- `payment.failed`: Updates payment to `FAILED`.

---

## Postman Collection

Import `Niklo_Payment_Service.postman_collection.json` from the project root into Postman to test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- Passport-JWT (shared auth)
- Razorpay Node SDK
- Class Validator & Class Transformer
- Throttler (Rate Limiting)
- Helmet (Security Headers)
