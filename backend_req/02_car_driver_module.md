# Module 2: Car Driver / Rider Module (Backend & Frontend Audit Requirements)

## 1. Overview
This document specifies the backend developer requirements, static/mocked frontend component audit, realtime Socket.io event contracts, and REST API endpoints for the **Car Driver / Rider** module in `niklo-partner` and `niklo-main`.

---

## 2. Comprehensive Component & Feature Audit Matrix

| Feature / Screen | Frontend Status (`niklo-partner`) | Backend Status (`niklo-main`) | Current Gap & Backend Action Required |
| :--- | :--- | :--- | :--- |
| **Driver Onboarding Forms** | **STATIC (Mockup UI)**<br>`submit_documents_screen.dart`, `vehicle_registration_screen.dart`, `driver_profile_screen.dart` | `POST /api/v1/driver/onboard` exists in `driver-service` | **High Priority:** Form fields (Aadhaar, PAN, RC, vehicle ownership, DOB, availability) only navigate locally via `context.push`. Backend `OnboardDriverDto` needs expansion to support full driver metadata. |
| **Bank Details & Payout Account** | **STATIC (Mockup UI)**<br>`bank_details_screen.dart` | **MISSING Endpoint** | **High Priority:** Frontend has no API call on submit. Backend requires `POST /api/v1/driver/bank-details` (or `POST /api/v1/payment/wallet/bank-account`) to store account holder name, bank name, account number, IFSC code, and account type for payouts. |
| **Go Online / Offline** | Integrated | Sockets (`driver:go_online`, `driver:location`) exist.<br>**MISSING REST Endpoint:** `POST /api/v1/ride/driver/go-offline` | `RideRepository.goOffline()` calls REST `POST /api/v1/ride/driver/go-offline`, but backend `rides.controller.ts` only has `go-online`. Backend must add `POST /api/v1/ride/driver/go-offline`. |
| **Ride Request Stream** | Integrated modal in `home_screen.dart` | Socket event `ride:new_request` | **Payload Update Needed:** `driver.gateway.ts` currently sends only `{ rideId, driverId, timeout }`. Backend MUST include `pickupAddress`, `dropAddress`, `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `fareEstimate`, `distanceKm`, `passengerName`, `passengerPhone` in `ride:new_request` broadcast to prevent forced REST re-hydration. |
| **Accept / Reject Ride** | Integrated | REST `POST /api/v1/ride/:id/accept`, Socket `ride:accepted` | Handles 409 conflict (`RideNoLongerAvailable`). Active and verified. |
| **Ride OTP Verification** | Driver enters 4-digit OTP in `active_ride_screen.dart` | `driver.gateway.ts` handles `ride:start` but **ignores OTP** | **Security Gap:** Backend `@SubscribeMessage('ride:start')` updates status to `IN_PROGRESS` without validating OTP. Backend must add OTP validation logic and REST fallback `POST /api/v1/ride/:id/verify-otp`. |
| **Active Ride & Route polyline** | Integrated with Google Maps & Directions API | Sockets `driver:location` + REST `POST /api/v1/ride/:id/complete` | Complete ride accepts `finalLat` and `finalLng` and re-quotes final fare (`fare_final`). |
| **Trip History** | Integrated | REST `GET /api/v1/ride/driver/:driverId/trips` | Returns past completed & cancelled trips. Used to calculate daily earnings. |
| **Daily Earnings Summary** | Integrated | Calculated dynamically from completed trips (`todaysSummaryProvider`) | Aggregates `fare_final` for today's completed rides. |
| **Online Hours Counter** | **STATIC (Local Device Only)** | No server-side session tracking | Client tracks session minutes via local `FlutterSecureStorage`. Backend should optionally introduce `driver_sessions` table (`session_start`, `session_end`). |
| **Wallet & Payouts** | Integrated (`wallet_screen.dart`) | `GET /api/v1/payment/wallet/transactions`, `POST /api/v1/payment/wallet/withdraw` | `withdraw` endpoint creates `PENDING` database entry. Needs integration with real Razorpay/Cashfree Payout gateway for automated bank/UPI transfers. |
| **Passenger & Driver Ratings** | Hardcoded UI strings (`4.8`, `124 trips`) | REST `POST /api/v1/ride/:id/rate` (Stub response) | Ratings are not saved in DB or aggregated. Backend needs rating storage & passenger average rating field in user profile response. |

---

## 3. Realtime Socket.io Contracts (`ride-service`)

### 3.1 Driver Connect & Online Handshake
- **Socket Event:** `driver:go_online`
- **Payload:**
```json
{
  "driverId": "d1111111-1111-1111-1111-111111111111",
  "lat": 12.9716,
  "lng": 77.5946
}
```

### 3.2 Live Location Ping (Frequency: 3-5s)
- **Socket Event:** `driver:location`
- **Payload:**
```json
{
  "driverId": "d1111111-1111-1111-1111-111111111111",
  "lat": 12.9720,
  "lng": 77.5950,
  "bearing": 95.2,
  "speed": 32.5
}
```

### 3.3 New Ride Request Offer (Server -> Driver)
- **Socket Event:** `ride:new_request`
- **Required Enhanced Payload:**
```json
{
  "rideId": "r1111111-1111-1111-1111-111111111111",
  "timeout": 30,
  "passengerName": "Alice Smith",
  "passengerPhone": "+919876543210",
  "passengerRating": 4.8,
  "pickupAddress": "Koramangala 5th Block, Bengaluru",
  "dropAddress": "Indiranagar 100ft Road, Bengaluru",
  "pickupLat": 12.9352,
  "pickupLng": 77.6245,
  "dropLat": 12.9784,
  "dropLng": 77.6408,
  "fareEstimate": 245.50,
  "distanceKm": 7.2,
  "otp": "4821"
}
```

### 3.4 Start Ride with OTP (Driver -> Server)
- **Socket Event:** `ride:start`
- **Payload:**
```json
{
  "rideId": "r1111111-1111-1111-1111-111111111111",
  "otp": "4821"
}
```

---

## 4. REST API Endpoint Specifications Required

### 4.1 Driver Bank Details (NEW Endpoint Needed)
- **Endpoint:** `POST /api/v1/driver/bank-details`
- **Auth:** Bearer Token (Driver)
- **Request Body:**
```json
{
  "driverId": "d1111111-1111-1111-1111-111111111111",
  "accountHolderName": "John Doe",
  "bankName": "HDFC Bank",
  "accountNumber": "5010023456789",
  "ifscCode": "HDFC0001234",
  "accountType": "Savings"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Bank details updated successfully"
}
```

### 4.2 Driver Go-Offline REST (NEW Endpoint Needed)
- **Endpoint:** `POST /api/v1/ride/driver/go-offline`
- **Auth:** Bearer Token (Driver)
- **Request Body:**
```json
{
  "driverId": "d1111111-1111-1111-1111-111111111111"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Driver is now offline"
}
```

### 4.3 Verify Start-Ride OTP (NEW Endpoint Needed)
- **Endpoint:** `POST /api/v1/ride/:id/verify-otp`
- **Auth:** Bearer Token (Driver)
- **Request Body:**
```json
{
  "otp": "4821"
}
```
- **Response:**
```json
{
  "success": true,
  "status": "IN_PROGRESS",
  "started_at": "2026-08-13T14:30:00Z"
}
```

### 4.4 Complete Ride
- **Endpoint:** `POST /api/v1/ride/:id/complete`
- **Auth:** Bearer Token (Driver)
- **Request Body:**
```json
{
  "finalLat": 12.9784,
  "finalLng": 77.6408
}
```

---

## 5. Master Action Checklist for Backend Developers
1. **Verify OTP on Ride Start**: Update `@SubscribeMessage('ride:start')` in `driver.gateway.ts` and add `POST /api/v1/ride/:id/verify-otp` in `rides.controller.ts` to validate the 4-digit OTP.
2. **Enhance `ride:new_request` Broadcast**: Include full addresses, coordinates, fare estimate, and passenger details in the socket payload.
3. **Add `POST /api/v1/driver/bank-details`**: Save driver payout bank account info in `driver-service`.
4. **Add `POST /api/v1/ride/driver/go-offline`**: Add REST handler in `rides.controller.ts`.
5. **Implement `PATCH /api/v1/users/profile`**: Allow updating driver profile (name, email, preferred language).
6. **Payout Gateway Integration**: Connect `POST /api/v1/payment/wallet/withdraw` in `payment-service` to a real Payout API (Razorpay/Cashfree).
7. **Bridge Live GPS Location to Passengers**: Add a subscriber to Redis `'driver_locations'` in `ride-service` to invoke `PassengerGateway.broadcastLocationUpdate(rideId, payload)` so passenger apps receive live moving driver markers on active rides.

