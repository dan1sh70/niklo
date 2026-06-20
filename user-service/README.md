# Niklo User Microservice

This is the User Management Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example` if available) and add the following:

```env
PORT=3002
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_user
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

The User service endpoints are versioned under `/api/v1/user`.

### 1. Get User Profile
- **Endpoint**: `GET /api/v1/user/profile`
- **Headers**: `Authorization: Bearer <token>`

### 2. Update User Profile
- **Endpoint**: `PUT /api/v1/user/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```

### 3. Add Saved Location
- **Endpoint**: `POST /api/v1/user/locations`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "Home",
    "address": "123 Main St",
    "lat": 12.9716,
    "lng": 77.5946
  }
  ```

## Postman Collection
A Postman collection is included in the project root: `Niklo_User_Service.postman_collection.json`. Import this file into Postman to easily test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- Class Validator & Class Transformer
