# Niklo Ride Microservice

This is the Ride Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+) with PostGIS extension

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example` if available) and add the following:

```env
PORT=3005
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_ride
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

The Ride service endpoints are versioned under `/api/v1/ride`.

### 1. Request Ride
- **Endpoint**: `POST /api/v1/ride/request`
- **Body**:
  ```json
  {
    "pickup": {"lat": 12.9716, "lng": 77.5946},
    "dropoff": {"lat": 12.9352, "lng": 77.6245},
    "vehicleType": "sedan"
  }
  ```

### 2. Accept Ride (Driver)
- **Endpoint**: `POST /api/v1/ride/:id/accept`
- **Body**:
  ```json
  {
    "driverId": "uuid"
  }
  ```

### 3. Get Ride Status
- **Endpoint**: `GET /api/v1/ride/:id`

### 4. Complete Ride
- **Endpoint**: `POST /api/v1/ride/:id/complete`

## Postman Collection
A Postman collection is included in the project root: `Niklo_Ride_Service.postman_collection.json`. Import this file into Postman to easily test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL with PostGIS)
- Class Validator & Class Transformer
