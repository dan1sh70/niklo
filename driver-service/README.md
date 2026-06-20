# Niklo Driver Microservice

This is the Driver Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example` if available) and add the following:

```env
PORT=3011
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_driver
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

The Driver service endpoints are versioned under `/api/v1/driver`.

### 1. Register Driver
- **Endpoint**: `POST /api/v1/driver/register`
- **Body**:
  ```json
  {
    "userId": "uuid",
    "licenseNumber": "ABC1234567"
  }
  ```

### 2. Upload KYC Documents
- **Endpoint**: `POST /api/v1/driver/kyc`
- **Body**:
  ```json
  {
    "driverId": "uuid",
    "documentType": "LICENSE",
    "documentUrl": "https://s3.niklo/..."
  }
  ```

### 3. Get Driver Earnings
- **Endpoint**: `GET /api/v1/driver/:id/earnings`

### 4. Trigger Payout
- **Endpoint**: `POST /api/v1/driver/:id/payout`

## Postman Collection
A Postman collection is included in the project root: `Niklo_Driver_Service.postman_collection.json`. Import this file into Postman to easily test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- Class Validator & Class Transformer
