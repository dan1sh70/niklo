# Niklo — Notification Module Production Backend Specification & API Blueprint

> **Target Microservice**: `notification-service` (`niklo-main/notification-service`, Port `3008`)  
> **Target Audience**: Backend Engineers & Flutter Integration Team  
> **Frontend Code Reference**: `lib/features/notifications` ([notification_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/notifications/data/models/notification_model.dart))

---

## 1. Executive Summary & Codebase Audit (`niklo-main` vs Flutter App Requirements)

The Flutter **Notification Module** ([notification_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/notifications/data/models/notification_model.dart)) expects a user-scoped notification inbox (`title`, `message`, `category`, `deep_link`, `is_read`, `created_at`) and FCM/APNs push token registration.

Currently, `niklo-main/notification-service` incorrectly stores rows shaped like a travel package (`price`, `duration_days`) rather than a real notification feed. As a result, the Flutter app has to map `description` ➔ `message` and filter out unneeded properties.

### Audit Matrix: Current `niklo-main` Backend vs Required Flutter App Models

| Flutter App Property | `niklo-main` DB Status | Required Production Backend Field & Type | Backend Action Needed |
|---|---|---|---|
| `title` | 🟢 Present | `title VARCHAR(255)` | Keep field |
| `message` | 🟡 Mapped from `description` | `message TEXT` | Add dedicated `message` column |
| `category` | ❌ Missing | `category VARCHAR(50)` ('BOOKING', 'RIDE_UPDATE', 'OFFER', 'SECURITY') | Add column |
| `deep_link` | ❌ Missing | `deep_link TEXT` (e.g. `niklo://bookings/bkg_991`) | Add column |
| `is_read` | ❌ Missing | `is_read BOOLEAN` DEFAULT `false` | Add column & read status APIs |
| `createdAt` | 🟢 Mapped from `created_at` | `created_at TIMESTAMPTZ` DEFAULT `NOW()` | Keep UTC timestamp |
| FCM / APNs Push Tokens | ❌ Missing | `POST /api/v1/notifications/device-token` | Implement token registration |

---

## 2. Production PostgreSQL Database Schema Migration (DDL Script)

Execute the following DDL script on the PostgreSQL database (`postgres-db` for `niklo_notification`):

```sql
-- PostgreSQL Migration DDL for Notification Module (notification-service DB)

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'BOOKING',
    deep_link TEXT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    fcm_token TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'ANDROID',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_token UNIQUE (user_id, fcm_token)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications ON user_notifications(user_id, is_read);
```

---

## 3. Production API Specifications & cURL Verification Commands

All endpoints return HTTP 200 OK responses with `{ success: true, statusCode: 200, data: ... }`.

### 3.1. Fetch User Notifications Feed
- **Method**: `GET`
- **Route**: `/api/v1/notifications`
- **Auth**: Bearer JWT Token

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "ntf_991823",
      "title": "Booking Confirmed! 🎉",
      "message": "Your bus ticket to Siliguri (NIK-BUS-88210) has been confirmed.",
      "category": "BOOKING",
      "deep_link": "niklo://bookings/bkg_771029",
      "is_read": false,
      "created_at": "2026-08-13T10:30:00Z"
    }
  ]
}
```

---

### 3.2. Register FCM / APNs Device Token
- **Method**: `POST`
- **Route**: `/api/v1/notifications/device-token`

#### Request Body Schema:
```json
{
  "fcmToken": "fcm_token_string_here...",
  "platform": "ANDROID"
}
```

#### Response Body Schema (HTTP 200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Device token registered successfully"
}
```

---

## 4. NestJS Controller Blueprint for `notification-service`

Update `niklo-main/notification-service/src/notifications/notifications.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications() {
    const data = await this.notificationsService.getUserNotifications();
    return { success: true, statusCode: 200, data };
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(@Body() dto: any) {
    const data = await this.notificationsService.registerDeviceToken(dto);
    return { success: true, statusCode: 200, data };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(id);
    return { success: true, statusCode: 200, data };
  }
}
```

---

## 5. Flutter Dart Model to Backend Field Mapping

| Flutter `NotificationModel` Property | Backend JSON Field | Database Column | Notes |
|---|---|---|---|
| `id` | `id` | `id` | UUID string |
| `title` | `title` | `title` | Notification title |
| `message` | `message` / `description` | `message` | Body text |
| `createdAt` | `created_at` / `createdAt` | `created_at` | ISO UTC Timestamp |

---

## 6. Definition of Done Checklist
- [ ] DB table `user_notifications` migrated with `message`, `category`, `deep_link`, `is_read`.
- [ ] `GET /api/v1/notifications` returns user-scoped notifications matching `NotificationModel`.
- [ ] `POST /api/v1/notifications/device-token` registers mobile push tokens.
