# Niklo Notification Microservice

This is the Notification Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example` if available) and add the following:

```env
PORT=3012
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_notification
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

The Notification service endpoints are versioned under `/api/v1/notifications`.

### 1. Create Travel Notification
- **Endpoint**: `POST /api/v1/notifications`
- **Body**:
  ```json
  {
    "title": "Kerala Tour",
    "description": "5 days trip to Kerala",
    "price": 25000.00,
    "duration_days": 5,
    "duration_nights": 4,
    "destinations": ["Munnar", "Thekkady", "Alleppey"],
    "inclusions": ["Hotel", "Breakfast", "Transport"]
  }
  ```

### 2. Get All Notifications
- **Endpoint**: `GET /api/v1/notifications`

### 3. Get Notification by ID
- **Endpoint**: `GET /api/v1/notifications/:id`

### 4. Update Notification
- **Endpoint**: `PUT /api/v1/notifications/:id`
- **Body**:
  ```json
  {
    "price": 24000.00
  }
  ```

### 5. Delete Notification
- **Endpoint**: `DELETE /api/v1/notifications/:id`

## Postman Collection
A Postman collection is included in the project root: `Niklo_Notification_Service.postman_collection.json`. Import this file into Postman to easily test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- Class Validator & Class Transformer
