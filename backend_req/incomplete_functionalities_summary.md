# Incomplete Backend Functionalities

Based on the audit of the backend requirements documentation, the following functionalities are currently incomplete, missing, or require further implementation across the microservices.

## 1. Auth & Profile Module (`auth-service` / `user-service`)
- **Profile Edit Endpoint (High Priority):** Implement `PATCH /api/v1/users/profile` to allow updates to name, email, avatar, and preferred language (currently mocked in local state).
- **JWT Roles:** Ensure the JWT payload explicitly exposes the user's `role` (`Car Driver`, `Bus Operator`, `Hotel Partner`).
- **Partner Auto-creation:** Ensure a partner record is automatically created upon a user's first sign-up.
- **SMS Gateway:** Configure a production SMS gateway for the existing `POST /api/v1/auth/send-otp` endpoint.
- **Driver Online State:** Implement Redis state persistence for active driver sockets.

## 2. Car Driver Module (`ride-service`, `driver-service`, `payment-service`)
- **Driver Onboarding Expansion (High Priority):** Expand the existing `POST /api/v1/driver/onboard` endpoint (and `OnboardDriverDto`) to support full driver metadata including Aadhaar, PAN, RC, vehicle ownership, DOB, and availability.
- **Bank Details Endpoint (High Priority):** Implement `POST /api/v1/driver/bank-details` (or equivalent in payment service) to securely store payout account information (Holder Name, Bank Name, Account Number, IFSC, Account Type).
- **Go Offline Endpoint:** Add the missing REST endpoint `POST /api/v1/ride/driver/go-offline` to match the frontend `RideRepository.goOffline()` call.
- **Ride OTP Verification (Security Gap):** 
  - Update the `@SubscribeMessage('ride:start')` socket handler to properly validate the 4-digit OTP.
  - Add a REST fallback endpoint: `POST /api/v1/ride/:id/verify-otp`.
- **Enhanced Ride Request Payload:** Update the `ride:new_request` socket broadcast payload to include full ride details (`pickupAddress`, `dropAddress`, `pickupLat`, `pickupLng`, `dropLat`, `dropLng`, `fareEstimate`, `distanceKm`, `passengerName`, `passengerPhone`) to prevent the frontend from needing to re-fetch this data.
- **Wallet Payouts:** Integrate the existing `withdraw` endpoint with a real payment gateway (like Razorpay or Cashfree) for automated bank/UPI transfers.
- **Ratings Storage:** Implement database storage and aggregation for passenger and driver ratings, which are currently stubbed.
- **Live GPS Bridging:** Add a Redis subscriber in the `ride-service` to bridge driver location pings to the passenger's socket connection so they can see the car moving on the map.
- **Session Tracking (Optional):** Introduce a `driver_sessions` table to track online hours server-side rather than relying on local device storage.

## 3. Bus Operator Module (`bus-service`)
- **Operator Summary Dashboard:** Implement `GET /api/v1/bus/operators/:id/summary` to return aggregated statistics (total buses, active schedules, tickets sold today, total earnings, occupancy rate).
- **Passenger Manifest Export:** Implement `GET /api/v1/bus/schedules/:id/manifest.pdf` (or `.csv`) to allow operators to download passenger manifests for specific schedules.

## 4. Hotel Partner Module (`hotel-service`)
- **Database Migrations:** Ensure database migrations and TypeORM entities exist for missing tables: `PartnerOffer`, `PartnerReviewReply`, and `PartnerCalendar`.
- **JWT Partner Scoping:** Ensure that property management queries and mutations are properly scoped to the authenticated partner using JWT token decoding.
