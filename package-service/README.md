# Niklo Package Microservice

This is the Package Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

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
DB_NAME=niklo_package
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

The Package service endpoints are versioned under `/api/v1/packages`.

### 1. Create Travel Package
- **Endpoint**: `POST /api/v1/packages`
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

### 2. Get All Packages
- **Endpoint**: `GET /api/v1/packages`

### 3. Get Package by ID
- **Endpoint**: `GET /api/v1/packages/:id`

### 4. Update Package
- **Endpoint**: `PUT /api/v1/packages/:id`
- **Body**:
  ```json
  {
    "price": 24000.00
  }
  ```

### 5. Delete Package
- **Endpoint**: `DELETE /api/v1/packages/:id`

## Postman Collection
A Postman collection is included in the project root: `Niklo_Package_Service.postman_collection.json`. Import this file into Postman to easily test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- Class Validator & Class Transformer
