# Niklo — Profile Module Production Backend Specification & API Blueprint

> **Target Microservices**: `user-service` (`niklo-main/user-service`, Port `3002`), `auth-service` (Port `3001`), `payment-service` (Port `3007`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/profile` ([get_user_profile.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/profile/data/models/get_user_profile.dart), [emergency_contact_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/profile/data/models/emergency_contact_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Profile Module** ([get_user_profile.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/profile/data/models/get_user_profile.dart)) manages user profile data, KYC verification status, avatar photo uploads, saved addresses, emergency contacts & SOS panic safety triggers, wallet balance, and user security preferences.

In `niklo-main/user-service`, `GET/PUT /api/v1/user/profile` currently operates on mock fallback stubs, multipart avatar image uploading is missing, and the wallet balance endpoint (`GET /api/v1/payment/wallet/balance`) is not implemented.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter `GetUserProfile` Property | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `id` / `name` / `email` / `phone` | 🟡 Static stubs | `id UUID`, `name VARCHAR`, `email VARCHAR`, `phone VARCHAR` | Persist in PostgreSQL `users` table |
| `avatar_url` | ❌ Missing | `avatar_url TEXT` | Implement `POST /api/v1/user/avatar` file upload |
| `kyc_status` | 🟡 Unsaved stub | `kyc_status VARCHAR(50)` ('NOT_SUBMITTED', 'VERIFIED', 'REJECTED') | Persist status in DB |
| `wallet_balance` | ❌ Missing | `wallet_balance NUMERIC(10,2)` in `payment-service` | Implement `GET /api/v1/payment/wallet/balance` |
| `preferred_language` | ❌ Missing | `preferred_language VARCHAR(10)` DEFAULT 'en' | Add column to DB |
| Emergency Contacts | ❌ Missing | `GET/POST/DELETE /api/v1/user/emergency-contacts` | Implement CRUD endpoints |
| SOS Panic Trigger | ❌ Missing | `POST /api/v1/user/emergency-sos/trigger` | Twilio / SMS alert integration |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_user`):

```sql
-- PostgreSQL Migration DDL for Profile Module (user-service DB)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    kyc_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    preferred_language VARCHAR(10) DEFAULT 'en',
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(100) DEFAULT 'Family',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_saved_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON user_emergency_contacts(user_id);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Fetch User Profile
- **Method**: `GET`
- **Route**: `/api/v1/user/profile`
- **Auth**: Bearer JWT Token

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "usr_77102",
    "phone": "+919876543210",
    "email": "user@niklo.com",
    "name": "Rahul Sharma",
    "avatar_url": "https://cdn.niklo.com/avatars/usr_77102.jpg",
    "kyc_status": "VERIFIED",
    "wallet_balance": 1250.00,
    "preferred_language": "en"
  }
}
```

---

### 3.2. Emergency SOS Panic Trigger
- **Method**: `POST`
- **Route**: `/api/v1/user/emergency-sos/trigger`

#### Request Body Schema:
```json
{
  "latitude": 15.4989,
  "longitude": 73.8278,
  "active_booking_id": "rd_cab_9910"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "sos_id": "sos_991823",
    "alerts_sent": 3,
    "police_notified": true,
    "message": "Emergency SOS alert dispatched to contacts and safety team"
  }
}
```

---

## 4. NestJS Controller Blueprint for `user-service`

Update `niklo-main/user-service/src/users/users.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Body, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

@Controller('api/v1/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile() {
    const data = await this.usersService.getProfile();
    return { success: true, statusCode: 200, data };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any) {
    const data = await this.usersService.uploadAvatar(file);
    return { success: true, statusCode: 200, data };
  }

  @Post('emergency-sos/trigger')
  @HttpCode(HttpStatus.OK)
  async triggerSOS(@Body() dto: any) {
    const data = await this.usersService.triggerSOS(dto);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `GetUserProfile` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | User UUID |
| `phone` | `phone` | `phone` | Mobile number |
| `email` | `email` | `email` | Email address |
| `name` | `name` | `name` | Full name |
| `avatarUrl` | `avatar_url` | `avatar_url` | HTTP CDN image |
| `kycStatus` | `kyc_status` | `kyc_status` | Verification state |
| `walletBalance` | `wallet_balance` | `wallet_balance` | Numeric balance |
| `preferredLanguage` | `preferred_language` | `preferred_language` | Language code |

---

## 6. Definition of Done Checklist
- [ ] DDL migration executed creating `users`, `user_emergency_contacts`, `user_saved_addresses`.
- [ ] `GET /api/v1/user/profile` returns `GetUserProfile` JSON fields matching Flutter client.
- [ ] `POST /api/v1/user/emergency-sos/trigger` dispatches Twilio SMS alerts.
