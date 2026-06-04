# Niklo Bus Microservice

This is the Bus Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3003
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_bus

# JWT configuration (same secret as auth-service)
JWT_SECRET=super-secret-jwt-key
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

All endpoints are under `/api/v1/bus`. Protected endpoints require a `Bearer` token issued by the `auth-service`.

---

### Operators

#### `POST /api/v1/bus/operators` 🔒
Create a new bus operator.
```json
{
  "name": "VRL Travels",
  "contact_phone": "+919876543210",
  "contact_email": "ops@vrl.com",
  "gst_number": "29ABCDE1234F1Z5"
}
```

#### `GET /api/v1/bus/operators`
List all active operators.

#### `GET /api/v1/bus/operators/:id`
Get operator details with associated buses.

#### `PATCH /api/v1/bus/operators/:id` 🔒
Update operator details.

#### `DELETE /api/v1/bus/operators/:id` 🔒
Soft-delete an operator.

---

### Buses

#### `POST /api/v1/bus/buses` 🔒
Register a new bus.
```json
{
  "operator_id": "uuid",
  "registration_number": "KA01AB1234",
  "bus_type": "AC_SLEEPER",
  "total_seats": 36,
  "amenities": { "wifi": true, "charging": true, "blanket": true, "water": true }
}
```
**Bus Types**: `AC_SLEEPER`, `NON_AC_SLEEPER`, `AC_SEATER`, `NON_AC_SEATER`, `VOLVO_AC`

#### `GET /api/v1/bus/buses?operator_id=uuid`
List all active buses. Optionally filter by operator.

#### `GET /api/v1/bus/buses/:id`
Get bus details with seat layout.

#### `PATCH /api/v1/bus/buses/:id` 🔒
Update bus details.

#### `POST /api/v1/bus/buses/:id/seats` 🔒
Bulk create/replace seat layout for a bus.
```json
{
  "seats": [
    { "seat_number": "L1", "deck": "LOWER", "row": 1, "column": 1, "seat_type": "SLEEPER" },
    { "seat_number": "L2", "deck": "LOWER", "row": 1, "column": 2, "seat_type": "SLEEPER" },
    { "seat_number": "U1", "deck": "UPPER", "row": 1, "column": 1, "seat_type": "SLEEPER" }
  ]
}
```
**Deck**: `LOWER`, `UPPER`  
**Seat Types**: `SEATER`, `SLEEPER`, `SEMI_SLEEPER`

#### `GET /api/v1/bus/buses/:id/seats`
Get seat layout for a bus.

---

### Routes

#### `GET /api/v1/bus/routes/search?source=Bangalore&destination=Chennai`
Search routes by source and destination city (case-insensitive, partial match).

#### `POST /api/v1/bus/routes` 🔒
Create a new route with boarding and dropping points.
```json
{
  "source_city": "Bangalore",
  "destination_city": "Chennai",
  "distance_km": 350,
  "estimated_duration_minutes": 360,
  "boarding_points": [
    { "name": "Majestic", "address": "Kempegowda Bus Station", "landmark": "Near Railway Station", "latitude": 12.9772, "longitude": 77.5713, "order_index": 1 },
    { "name": "Electronic City", "address": "Toll Gate", "order_index": 2 }
  ],
  "dropping_points": [
    { "name": "Koyambedu", "address": "CMBT Bus Stand", "latitude": 13.0694, "longitude": 80.1948, "order_index": 1 },
    { "name": "Guindy", "address": "Guindy Bus Stop", "order_index": 2 }
  ]
}
```

#### `GET /api/v1/bus/routes`
List all active routes.

#### `GET /api/v1/bus/routes/:id`
Get route details with boarding and dropping points.

#### `PATCH /api/v1/bus/routes/:id` 🔒
Update route details.

#### `DELETE /api/v1/bus/routes/:id` 🔒
Soft-delete a route.

---

### Schedules

#### `GET /api/v1/bus/schedules/search?source=Bangalore&destination=Chennai&date=2026-06-15`
Search available bus schedules by source city, destination city, and travel date. Returns schedules with full route, bus, operator, and seat layout data.

#### `POST /api/v1/bus/schedules` 🔒
Create a new schedule.
```json
{
  "route_id": "uuid",
  "bus_id": "uuid",
  "operator_id": "uuid",
  "departure_time": "22:00",
  "arrival_time": "06:00",
  "departure_date": "2026-06-15",
  "base_fare": 850.00,
  "available_seats": 36
}
```

#### `GET /api/v1/bus/schedules?route_id=uuid&date=2026-06-15`
List schedules. Optionally filter by route and/or date.

#### `GET /api/v1/bus/schedules/:id`
Get schedule details with route (incl. boarding/dropping points), bus, and operator.

#### `GET /api/v1/bus/schedules/:id/seats`
Get live seat availability for a specific schedule.

#### `PATCH /api/v1/bus/schedules/:id` 🔒
Update schedule details (time, fare, available seats, status).

#### `DELETE /api/v1/bus/schedules/:id` 🔒
Cancel a schedule (sets status to CANCELLED).

**Schedule Statuses**: `SCHEDULED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`

---

## Postman Collection

Import `Niklo_Bus_Service.postman_collection.json` from the project root into Postman to test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- Passport-JWT (shared auth with auth-service)
- Class Validator & Class Transformer
- Throttler (Rate Limiting)
- Helmet (Security Headers)
