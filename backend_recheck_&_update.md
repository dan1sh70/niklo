# Niklo Platform — Backend Re-Check & Required Updates (Master Specification)

> ⚠️ **ATTENTION BACKEND DEVELOPER**:  
> Following a full audit of the backend repository (`https://github.com/dan1sh70/niklo`), several endpoints, database schemas, and microservice features specified in the earlier `backend_needed` files were found to be **missing, incomplete, or returning stub responses** on `main`.  
>  
> Please use this **single master document** to re-check your backend codebase, run the required PostgreSQL DDL migrations, and implement the missing endpoints.

---

## 📌 Master Checklist of Missing Endpoints & Actions by Microservice

---

### 1. 👤 Profile Module (`user-service`, Port 3002)
> **Status**: Static stub response returned in `users.service.ts`. Avatar upload, emergency contacts, and SOS trigger endpoints are missing.

- [ ] **`POST /api/v1/user/avatar`**: Implement multipart image upload handler returning CDN URL.
- [ ] **`GET /api/v1/user/emergency-contacts`**: Fetch list of user emergency contacts.
- [ ] **`POST /api/v1/user/emergency-contacts`**: Add a new emergency contact.
- [ ] **`DELETE /api/v1/user/emergency-contacts/:id`**: Remove an emergency contact.
- [ ] **`POST /api/v1/user/emergency-sos/trigger`**: Panic button dispatch sending SMS/Firebase alerts.
- 🗄️ **Database DDL**: Create `user_emergency_contacts` table (`id`, `user_id`, `name`, `phone`, `relationship`).

---

### 2. 🤖 AI Journey Planner Module (`ai-planner-service`, Port 3015) — *NEW MICROSERVICE REQUIRED*
> **Status**: 🔴 **0% Implemented**. Directory `ai-planner-service` does NOT exist in backend repository.

- [ ] **`POST /api/v1/ai-planner/plan-journey`**: Multi-modal route planner (Cab ➔ Intercity Bus ➔ Cab).
- [ ] **`POST /api/v1/ai-planner/book-multimodal`**: One-click multi-leg seat locking & Razorpay order generation.
- [ ] **`GET /api/v1/ai-planner/saved-journeys`**: Fetch user saved itineraries.
- [ ] **`POST /api/v1/ai-planner/save-journey`**: Save an itinerary.
- [ ] **`DELETE /api/v1/ai-planner/saved-journeys/:id`**: Remove a saved itinerary.
- [ ] **`GET /api/v1/ai-planner/alerts`**: Fetch notification alert preferences.
- [ ] **`PUT /api/v1/ai-planner/alerts`**: Update notification alert preferences.
- [ ] **`POST /api/v1/ai-planner/smart-schedule-optimizer`**: Traffic & weather departure delay buffer optimizer.
- 🗄️ **Database DDL**: Create `ai_journey_plans`, `user_saved_journeys`, and `journey_alerts` tables.
- 🌐 **Gateway & Docker**: Add location `/api/v1/ai-planner` to `nginx.conf` and `ai-planner-service` to `docker-compose.yaml`.

---

### 3. 🚌 Bus Booking Module (`bus-service`, Port 3003)
> **Status**: Basic schedules exist, but city autocomplete, 2D seat map grid, and Redis seat locking are missing.

- [ ] **`GET /api/v1/bus/locations/autocomplete`**: Fuzzy city search suggestion endpoint (`?query=...`).
- [ ] **`GET /api/v1/bus/schedules/:id/seat-map`**: Return 2D deck position grid (`lower_deck` & `upper_deck` arrays with `row`, `column`, `is_upper_deck`, `seat_type`, `price`).
- [ ] **`POST /api/v1/bus/schedules/:id/lock-seat`**: Enforce 300-second Redis TTL seat lock (`lock:bus:{schedule_id}:{seat_no}`).
- [ ] **`GET /api/v1/bus/schedules/:id/boarding-points`**: Return pickup & drop location lists with timestamps and geo-coordinates.
- 🗄️ **Database DDL**: Create `bus_operators`, `buses`, `bus_schedules`, `bus_seats`, `bus_boarding_dropping_points` tables.

---

### 4. 🏨 Hotel Booking Module (`hotel-service`, Port 3004)
> **Status**: Search exists, but property amenities JSONB schema and date-range room availability validation are missing.

- [ ] **`POST /api/v1/hotels/:hotelId/check-availability`**: Validate date-range (`check_in`, `check_out`) room availability & pricing.
- 🗄️ **Database DDL**: Add JSONB columns to `hotels` table (`amenities`, `nearby_places`, `features`, `house_rules`, `rating_breakdown`) and create `room_types` table.

---

### 5. 🚗 Car Rides & Cab Module (`ride-service`, Port 3005)
> **Status**: 🟢 Core CRUD endpoints exist! Missing spatial Redis driver search and Nginx WebSockets.

- [ ] **Redis Spatial Driver Search**: Replace DB table scans in `POST /api/v1/ride/request` with Redis Geo 3km radial search (`GEOSEARCH driver_locations`).
- [ ] **WebSockets Reverse Proxy**: Add `Upgrade: websocket` headers to `nginx.conf` for real-time Socket.IO driver tracking.

---

### 6. 🏠 Home Screen Module (Home Aggregator)
> **Status**: 🔴 **0% Implemented**. Unified multi-vertical aggregator endpoints are missing.

- [ ] **`GET /api/v1/user/active-trip`**: Query all 5 travel verticals (Bus, Cab, Hotel, Package, Experience) and return the single next upcoming active trip ticker.
- [ ] **`GET /api/v1/recommendations/smart-suggestions`**: Spatial PostGIS recommendation engine (`?latitude=..&longitude=..`).
- [ ] **`GET /api/v1/promotions/banners`**: Marketing banners with deep-link URIs.
- 🗄️ **Database DDL**: Create `marketing_banners` table.

---

### 7. 🎟️ Bookings & Payments Module (`booking-service`, Port 3014 & `payment-service`, Port 3007)
> **Status**: 🟢 History feed exists! Missing cancellation refund quote, QR ticket verify, and Razorpay HMAC webhook.

- [ ] **`POST /api/v1/bookings/:id/cancellation-quote`**: Calculate cancellation penalty and refundable amount preview.
- [ ] **`POST /api/v1/tickets/verify-qr`**: Verify cryptographically signed JWT ticket QR codes.
- [ ] **`POST /api/v1/payment/webhook/razorpay`**: Server-to-server Razorpay HMAC SHA256 signature verification handler.
- 🗄️ **Database DDL**: Create `bookings` and `payment_orders` tables.

---

### 8. 🧳 Tour Packages Module (`package-service`, Port 3009)
> **Status**: Basic CRUD exists, but structured itinerary JSONB columns and popular destinations API are missing.

- [ ] **`GET /api/v1/packages/destinations/popular`**: Return top holiday destinations with package counts.
- [ ] **`POST /api/v1/packages/:id/availability`**: Check date slot capacity.
- 🗄️ **Database DDL**: Add `itinerary JSONB`, `gallery_images JSONB`, `inclusions JSONB`, and `exclusions JSONB` to `travel_packages` table.

---

### 9. 🔔 Notification Module (`notification-service`, Port 3008)
> **Status**: Raw SMS/Email push dispatch exists, but mobile push token registration and user inbox feed are missing.

- [ ] **`POST /api/v1/notifications/device-token`**: Register FCM / APNs mobile device tokens.
- [ ] **`PUT /api/v1/notifications/:id/read`**: Toggle notification read status.
- 🗄️ **Database DDL**: Create `user_notifications` (`message`, `category`, `deep_link`, `is_read`) and `user_device_tokens` tables.

---

### 10. 🏄 Experiences & Activity Module (`adventure-service`, Port 3010)
> **Status**: Basic CRUD exists, but activity category list and slot availability checks are missing.

- [ ] **`GET /api/v1/adventures/categories`**: Return category list (Water Sports, Air Sports, Trekking, Wildlife).
- [ ] **`POST /api/v1/adventures/:id/availability`**: Date slot availability check.
- 🗄️ **Database DDL**: Migration adding `category`, `meeting_point`, `latitude`, `longitude`, `rating`, `difficulty`, `gallery_images`, `highlights`, `whats_included`, `what_to_bring` to `travel_adventures`.
