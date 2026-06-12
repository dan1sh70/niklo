# Niklo Auth Microservice

This is the Authentication Microservice for the Niklo Multi-Modal Transportation Booking Platform, built with [NestJS](https://nestjs.com/).

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)
- Redis (v7+)

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example` if available) and add the following:

```env
PORT=3001
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=niklo_auth

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT configuration
JWT_SECRET=super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
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

The Auth service endpoints are versioned under `/api/v1/auth`.

### 1. Send OTP
Sends an OTP to a provided phone number.
- **Endpoint**: `POST /api/v1/auth/otp/send`
- **Access**: Public
- **Rate Limit**: 100 req/min (Global)
- **Body**:
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "OTP sent successfully"
  }
  ```

### 2. Verify OTP
Verifies the OTP. If valid, authenticates the user and returns tokens.
- **Endpoint**: `POST /api/v1/auth/otp/verify`
- **Access**: Public
- **Body**:
  ```json
  {
    "phone": "+919876543210",
    "otp": "123456"
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhb...",
      "refreshToken": "eyJhb...",
      "user": {
        "id": "uuid",
        "phone": "+919876543210",
        "name": null,
        "email": null
      }
    }
  }
  ```

### 3. Refresh Tokens
Rotates the access token using a valid refresh token.
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Access**: Public
- **Body**:
  ```json
  {
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }
  ```
- **Success Response** (200 OK): Returns new access/refresh tokens.

### 4. Social Login
Authenticates via OAuth2 providers (Google, Apple, Facebook).
- **Endpoint**: `POST /api/v1/auth/social`
- **Access**: Public
- **Body**:
  ```json
  {
    "provider": "google",
    "idToken": "OAUTH_ID_TOKEN"
  }
  ```

### 5. Logout
Invalidates the current session token in Redis.
- **Endpoint**: `POST /api/v1/auth/logout`
- **Access**: Protected (Requires Bearer Token)
- **Headers**:
  - `Authorization: Bearer <accessToken>`
- **Success Response** (200 OK):
  ```json
  {
    "success": true
  }
  ```

## Postman Collection
A Postman collection is included in the project root: `Niklo_Auth_Service.postman_collection.json`. Import this file into Postman to easily test all endpoints.

## Tech Stack
- NestJS (TypeScript)
- TypeORM (PostgreSQL)
- ioredis (Redis)
- Passport-JWT
- Class Validator & Class Transformer
- Throttler (Rate Limiting)
