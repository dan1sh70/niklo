# Module 4: Hotel Partner Module (Backend Requirements)

## 1. Overview
This document specifies backend requirements, gap analysis, and API contracts for the **Hotel Partner** module in `niklo-partner`.

---

## 2. Component & Feature Status Analysis

| Feature / Screen | Frontend Status | Backend Status (`hotel-service`) | Gap & Backend Action Required |
| :--- | :--- | :--- | :--- |
| **Property Management** | Integrated | `GET /hotels/partner/properties`, `POST /hotels`, `PATCH /hotels/:id` | Partner registers & manages hotel properties scoped by JWT. |
| **Room & Inventory Control**| Integrated | `GET /hotels/:id/rooms`, `POST /hotels/:id/rooms`, `PATCH /hotels/:id/rooms/:roomId`, `DELETE /hotels/:id/rooms/:roomId` | Full CRUD for room types, pricing, meal plans, amenities & total inventory count (`totalRooms`). |
| **Booking Operations (Check-in/Check-out)** | Integrated | `GET /bookings/hotel/partner/bookings`, `POST /bookings/hotel/:id/check-in`, `POST /bookings/hotel/:id/check-out`, `POST /bookings/hotel/partner/:id/cancel` | Realtime status transitions (`CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`). |
| **Dashboard & Earnings** | Integrated | `GET /bookings/hotel/partner/summary`, `GET /bookings/hotel/partner/earnings` | Returns total bookings, active stays, revenue, and monthly trends. |
| **Calendar & Availability Grid** | Integrated | `GET /bookings/hotel/partner/calendar` | Daily occupancy, blocked dates, and available room counts. |
| **Offers & Promotions** | Integrated | `GET /hotels/:id/offers`, `POST /hotels/:id/offers`, `PATCH /hotels/:id/offers/:offerId`, `DELETE /hotels/:id/offers/:offerId` | Enables partner to create & toggle discount deals. |
| **Review Responses** | Integrated | `GET /hotels/:id/reviews`, `POST /hotels/:id/reviews/:reviewId/reply` | Partners read guest reviews and post official responses. |
| **Monthly Occupancy Chart** | Integrated | `GET /bookings/hotel/partner/occupancy/monthly` | Returns month-by-month occupancy percentage analytics. |
| **Partner Notifications** | Integrated | `GET /bookings/hotel/partner/notifications` | Activity logs for new bookings, cancellations, check-ins. |

---

## 3. Data Schema & REST API Specifications

### 3.1 Partner Summary Dashboard
- **Endpoint:** `GET /api/v1/bookings/hotel/partner/summary`
- **Auth:** Bearer Token (Hotel Partner)
- **Response:**
```json
{
  "totalBookings": 142,
  "todayCheckIns": 8,
  "todayCheckOuts": 5,
  "activeStays": 18,
  "totalEarnings": 485000.00,
  "monthlyEarnings": 125000.00,
  "occupancyRate": 82.5
}
```

### 3.2 Add Room Category
- **Endpoint:** `POST /api/v1/hotels/:hotelId/rooms`
- **Auth:** Bearer Token (Hotel Partner)
- **Request Body:**
```json
{
  "title": "Deluxe Sea View Suite",
  "guestCount": "2 Guests",
  "price": 6500,
  "weekendPrice": 7500,
  "extraGuestCharge": 1200,
  "roomNumber": "101-110",
  "roomType": "Deluxe",
  "size": "380 sq ft",
  "mealPlan": "Breakfast Included",
  "mealPlanDesc": "Free buffet breakfast at main restaurant",
  "amenities": ["WiFi", "AC", "Mini Bar", "Sea View Balcony"],
  "inclusions": ["Welcome Drink", "Free Parking"],
  "images": ["https://cdn.niklo.com/rooms/deluxe1.jpg"],
  "totalRooms": 10
}
```

### 3.3 Check-in Guest
- **Endpoint:** `POST /api/v1/bookings/hotel/:bookingId/check-in`
- **Auth:** Bearer Token
- **Response:**
```json
{
  "id": "bk_998811",
  "status": "CHECKED_IN",
  "checkedInAt": "2026-08-13T14:00:00Z"
}
```

### 3.4 Calendar & Occupancy Grid
- **Endpoint:** `GET /api/v1/bookings/hotel/partner/calendar?from=2026-08-01&days=30`
- **Response:**
```json
{
  "calendar": [
    {
      "date": "2026-08-13",
      "totalAvailableRooms": 25,
      "bookedRooms": 20,
      "blockedRooms": 2,
      "occupancyRate": 80.0,
      "averageDailyRate": 5800.00
    }
  ]
}
```

---

## 4. Summary of Backend Updates Needed for Hotel Partner Module
1. All endpoints in `hotel_partner_repository.dart` are fully mapped to the `hotel-service` specifications.
2. Ensure database migrations exist for `PartnerOffer`, `PartnerReviewReply`, and `PartnerCalendar` tables in NestJS `hotel-service`.
3. Support partner scoping automatically via JWT token decoding.
