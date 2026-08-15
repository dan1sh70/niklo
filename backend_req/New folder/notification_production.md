# Niklo — Notification Module Production Backend Specification & Developer Action Guide

> **Target Microservice**: `notification-service` (`niklo-main/notification-service`, Port `3008`)  
> **Target Database**: `niklo_notification` (PostgreSQL)  
> **Frontend Code Reference**: `lib/features/notifications` ([notification_model.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/notifications/data/models/notification_model.dart), [notification_repository.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/notifications/data/repositories/notification_repository.dart), [notification_screen.dart](file:///d:/Users/anish/Project/Niklo-Travel-Booking-App/lib/features/home/presentation/screens/notification_screen.dart))

---

## 1. Executive Summary & Codebase Audit for Backend Developer

The **Notification Module** in the Flutter client (`lib/features/notifications`) requires a user-scoped notification feed (`id`, `title`, `message`, `category`, `deep_link`, `is_read`, `created_at`), FCM/APNs push token registration, and read/delete capabilities.

### ⚠️ Current Backend Problems in `niklo-main/notification-service`:

1. **Legacy DTOs (`create-notification.dto.ts`)**:
   - `create-notification.dto.ts` still contains outdated travel package fields (`price`, `duration_days`, `duration_nights`, `destinations`, `inclusions`, `is_active`) instead of notification fields.
2. **Missing Device Token DTO (`register-device-token.dto.ts`)**:
   - Controller currently receives `any` instead of a strongly typed DTO (`fcmToken`, `platform`).
3. **Dead / Legacy Entity (`notification.entity.ts`)**:
   - `src/notifications/entities/notification.entity.ts` still defines `TravelNotification` (`travel_notifications` table) which is obsolete and unused.
4. **Missing Endpoints in `NotificationsController`**:
   - `POST /api/v1/notifications`: Needed to trigger/create notifications from other microservices or admin panels.
   - `DELETE /api/v1/notifications/:id`: Needed for dismissing/deleting notifications.
5. **Incomplete Service Methods**:
   - `NotificationsService` needs `createNotification(dto)` and `deleteNotification(id)` methods, as well as optional `userId` filtering.

---

### Backend Developer Action Matrix

| Component / Task | File Location | Current Status | Required Action for Backend Developer |
|---|---|---|---|
| Notification Feed API | `src/notifications/notifications.controller.ts` | 🟡 Basic | Add optional `userId` query param filter |
| Create Notification API | `src/notifications/notifications.controller.ts` | 🔴 Missing | Implement `POST /api/v1/notifications` |
| Register Push Token API | `src/notifications/notifications.controller.ts` | 🟡 Uses `any` | Use `RegisterDeviceTokenDto` for validation |
| Mark Read API | `src/notifications/notifications.controller.ts` | 🟢 Implemented | `PUT /api/v1/notifications/:id/read` |
| Delete Notification API | `src/notifications/notifications.controller.ts` | 🔴 Missing | Implement `DELETE /api/v1/notifications/:id` |
| Create Notification DTO | `src/notifications/dto/create-notification.dto.ts` | 🔴 Legacy Data | Replace travel package fields with notification fields |
| Register Token DTO | `src/notifications/dto/register-device-token.dto.ts` | 🔴 Missing | Create new DTO with `fcmToken`, `platform` |
| Legacy Entity Cleanup | `src/notifications/entities/notification.entity.ts` | 🔴 Obsolete | Delete this unused travel notification entity file |

---

## 2. PostgreSQL Database Schema Migration (DDL Script)

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

## 3. OpenAPI Endpoint Specifications & Payload Schemas

### 3.1. Fetch User Notifications Feed
- **Method**: `GET`
- **Route**: `/api/v1/notifications`
- **Query Params**: `userId` (optional string, UUID)
- **Response (200 OK)**:
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

### 3.2. Create Notification (Inter-Service / Admin Trigger)
- **Method**: `POST`
- **Route**: `/api/v1/notifications`
- **Request Body**:
```json
{
  "userId": "11111111-1111-1111-1111-111111111111",
  "title": "Upcoming Ride",
  "message": "Your cab arrives in 15 minutes.",
  "category": "RIDE_UPDATE",
  "deepLink": "niklo://rides/ride_5521"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "ntf_mock_04",
    "title": "Upcoming Ride",
    "message": "Your cab arrives in 15 minutes.",
    "category": "RIDE_UPDATE",
    "deep_link": "niklo://rides/ride_5521",
    "is_read": false,
    "created_at": "2026-08-15T01:30:00.000Z"
  }
}
```

### 3.3. Register FCM / APNs Device Token
- **Method**: `POST`
- **Route**: `/api/v1/notifications/device-token`
- **Request Body**:
```json
{
  "fcmToken": "fcm_token_string_here...",
  "platform": "ANDROID"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Device token registered successfully"
  }
}
```

### 3.4. Toggle Read Status
- **Method**: `PUT`
- **Route**: `/api/v1/notifications/:id/read`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "ntf_991823",
    "title": "Booking Confirmed! 🎉",
    "message": "Your bus ticket to Siliguri (NIK-BUS-88210) has been confirmed.",
    "category": "BOOKING",
    "deep_link": "niklo://bookings/bkg_771029",
    "is_read": true,
    "created_at": "2026-08-13T10:30:00Z"
  }
}
```

### 3.5. Delete Notification
- **Method**: `DELETE`
- **Route**: `/api/v1/notifications/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Notification deleted successfully"
  }
}
```

---

## 4. Complete Code Blueprints for Backend Developer

### 4.1. `src/notifications/dto/create-notification.dto.ts`
```typescript
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  deepLink?: string;
}
```

### 4.2. `src/notifications/dto/register-device-token.dto.ts`
```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsString()
  @IsOptional()
  platform?: string;
}
```

### 4.3. `src/notifications/notifications.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Query('userId') userId?: string) {
    const data = await this.notificationsService.getUserNotifications(userId);
    return { success: true, statusCode: 200, data };
  }

  @Post()
  async createNotification(@Body() dto: CreateNotificationDto) {
    const data = await this.notificationsService.createNotification(dto);
    return { success: true, statusCode: 201, data };
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(@Body() dto: RegisterDeviceTokenDto) {
    const data = await this.notificationsService.registerDeviceToken(dto);
    return { success: true, statusCode: 200, data };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(id);
    return { success: true, statusCode: 200, data };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    const data = await this.notificationsService.deleteNotification(id);
    return { success: true, statusCode: 200, data };
  }
}
```

### 4.4. `src/notifications/notifications.service.ts`
```typescript
import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNotification } from './entities/user-notification.entity';
import { DeviceToken } from './entities/device-token.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class NotificationsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

  constructor(
    @InjectRepository(UserNotification)
    private readonly userNotificationRepo: Repository<UserNotification>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.userNotificationRepo.count();
    if (count === 0) {
      await this.userNotificationRepo.save([
        {
          id: 'ntf_mock_01',
          user_id: this.MOCK_USER_ID,
          title: 'Booking Confirmed! 🎉',
          message: 'Your bus ticket to Siliguri (NIK-BUS-88210) has been confirmed.',
          category: 'BOOKING',
          deep_link: 'niklo://bookings/bkg_771029',
          is_read: false,
        },
        {
          id: 'ntf_mock_02',
          user_id: this.MOCK_USER_ID,
          title: 'Upcoming Ride',
          message: 'Your cab to the airport arrives in 30 minutes. Driver: Raj Kumar.',
          category: 'RIDE_UPDATE',
          deep_link: 'niklo://rides/ride_5521',
          is_read: true,
        },
        {
          id: 'ntf_mock_03',
          user_id: this.MOCK_USER_ID,
          title: 'Exclusive Offer!',
          message: 'Get 20% off on your next hotel booking in Manali.',
          category: 'OFFER',
          deep_link: 'niklo://offers/off_sum20',
          is_read: false,
        }
      ] as any[]);
      this.logger.log('Seeded user notifications mock data successfully.');
    }
  }

  private mapNotificationToDto(n: UserNotification) {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category,
      deep_link: n.deep_link,
      is_read: n.is_read,
      created_at: n.created_at ? n.created_at.toISOString() : new Date().toISOString(),
    };
  }

  async getUserNotifications(userId?: string) {
    const targetUserId = userId || this.MOCK_USER_ID;
    const notifications = await this.userNotificationRepo.find({
      where: { user_id: targetUserId },
      order: { created_at: 'DESC' },
    });
    
    return notifications.map(n => this.mapNotificationToDto(n));
  }

  async createNotification(dto: CreateNotificationDto) {
    const targetUserId = dto.userId || this.MOCK_USER_ID;
    const newNotif = this.userNotificationRepo.create({
      user_id: targetUserId,
      title: dto.title,
      message: dto.message,
      category: dto.category || 'BOOKING',
      deep_link: dto.deepLink || null,
      is_read: false,
    });

    const saved = await this.userNotificationRepo.save(newNotif);
    return this.mapNotificationToDto(saved);
  }

  async registerDeviceToken(dto: RegisterDeviceTokenDto) {
    const userId = this.MOCK_USER_ID;
    const { fcmToken, platform } = dto;

    if (!fcmToken) {
      throw new Error('fcmToken is required');
    }

    let deviceToken = await this.deviceTokenRepo.findOne({
      where: { user_id: userId, fcm_token: fcmToken }
    });

    if (!deviceToken) {
      deviceToken = this.deviceTokenRepo.create({
        user_id: userId,
        fcm_token: fcmToken,
        platform: platform || 'ANDROID'
      });
    } else {
      deviceToken.platform = platform || deviceToken.platform;
    }
    
    await this.deviceTokenRepo.save(deviceToken);
    return { message: 'Device token registered successfully' };
  }

  async markAsRead(notificationId: string) {
    const userNotif = await this.userNotificationRepo.findOne({
      where: { id: notificationId }
    });

    if (!userNotif) {
      throw new NotFoundException('Notification not found');
    }

    userNotif.is_read = true;
    const updated = await this.userNotificationRepo.save(userNotif);
    return this.mapNotificationToDto(updated);
  }

  async deleteNotification(notificationId: string) {
    const userNotif = await this.userNotificationRepo.findOne({
      where: { id: notificationId }
    });

    if (!userNotif) {
      throw new NotFoundException('Notification not found');
    }

    await this.userNotificationRepo.remove(userNotif);
    return { message: 'Notification deleted successfully' };
  }
}
```

---

## 5. Definition of Done Checklist for Backend Developer
- [ ] DDL Migration executed creating `user_notifications` and `user_device_tokens`.
- [ ] Obsolete `src/notifications/entities/notification.entity.ts` deleted.
- [ ] `create-notification.dto.ts` updated with notification fields (`title`, `message`, `category`, `deepLink`).
- [ ] `register-device-token.dto.ts` created for FCM/APNs token validation.
- [ ] `GET /api/v1/notifications` returns user notifications list with category, deep_link, and read status.
- [ ] `POST /api/v1/notifications` implemented for creating notifications.
- [ ] `POST /api/v1/notifications/device-token` implemented for registering device push tokens.
- [ ] `PUT /api/v1/notifications/:id/read` implemented for marking items as read.
- [ ] `DELETE /api/v1/notifications/:id` implemented for removing notifications.
