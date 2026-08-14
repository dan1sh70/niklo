# Niklo Travel Booking Platform — Project Manager Executive Status & Client Extension Report

> **Target Audience**: Project Manager / Client Stakeholders  
> **Prepared Date**: August 13, 2026  
> **Overall Progress Summary**: **Frontend is 88% Complete** | **Backend (`niklo-main`) is 40% Complete**  
> **Key Recommendation**: Request a **4 to 6-Week Time Extension Buffer** from the client for backend API development, database schema expansion, real-time WebSocket setup, and payment gateway webhooks.

---

## 📊 Executive Overview & Completion Summary

The Flutter mobile application frontend is nearly complete across all 10 core product verticals (88% average completion), featuring production-ready UI/UX, Riverpod state management, offline fallback handling, and responsive layout components.

However, an audit of the backend repository (`niklo-main`) shows that while microservice skeletons exist, most services are operating on basic CRUD or mock stubs (40% average completion). Critical business logic, real-time tracking, multi-leg routing engines, and server-side payment security webhooks have **not yet been implemented**.

| # | Module / Feature Vertical | Frontend Status | Backend Status | Status Summary | Estimated Backend Buffer Needed |
|---|---|:---:|:---:|---|:---:|
| 1 | **AI Journey Planner** | 🟢 90% | 🔴 10% | Frontend ready; backend lacks routing engine & `ai-planner-service`. | 1.5 - 2.0 Weeks |
| 2 | **Intercity Bus Booking** | 🟢 90% | 🟡 45% | UI complete; missing 2D seat map layout API & Redis seat locks. | 1.0 Week |
| 3 | **Car Rides / Cab Booking** | 🟢 85% | 🟡 40% | UI built; missing Google ETA polyline, Redis Geo & WebSockets. | 1.0 - 1.5 Weeks |
| 4 | **Hotel Booking** | 🟢 90% | 🟡 50% | UI complete; missing real-time room availability matrix & filters. | 1.0 Week |
| 5 | **Tour Packages** | 🟢 90% | 🟡 35% | UI complete; missing JSONB itinerary schema & date slot APIs. | 1.0 Week |
| 6 | **Experiences & Adventure** | 🟢 85% | 🔴 25% | UI complete; DB missing JSONB details, GPS points & slot checks. | 1.0 Week |
| 7 | **User Profile, Safety & SOS** | 🟢 90% | 🔴 20% | UI complete; missing avatar upload, wallet API & SOS SMS trigger. | 0.8 Week |
| 8 | **Bookings & Core Payments** | 🟢 90% | 🔴 30% | UI complete; missing unified history API, Razorpay webhooks & QR verify. | 1.0 - 1.5 Weeks |
| 9 | **Home Screen Dashboard** | 🟢 95% | 🔴 20% | UI complete; missing active trip ticker & PostGIS spatial recommendations. | 0.5 Week |
| 10 | **Push Notifications** | 🟢 85% | 🔴 20% | UI complete; missing user-scoped inbox API & FCM device token registration. | 0.5 Week |

---

## 🔍 Detailed Module-by-Module Gap Analysis (Parts Not Completed)

---

### SECTION 1: AI Journey Planner Module
* **Frontend Completion**: 🟢 90% (Multi-leg trip search forms, mode selectors, journey visualizer cards built)
* **Backend Completion**: 🔴 10% (Only static mock response JSON exists)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing `ai-planner-service` Microservice**: The entire microservice is missing from `niklo-main`.
2. **Missing Journey Generation API**: `POST /api/v1/ai-planner/plan-journey` endpoint is not implemented.
3. **Missing Multi-Leg Spatial Router**: No Dijkstra algorithm or inter-modal connecting engine (Cab ➔ Bus ➔ Cab schedule matching).
4. **Missing Master One-Click Orchestrator**: Atomically locking and booking hotel + bus + cab under a single checkout session is not built.
5. **Missing Saved Journeys & Price Alerts APIs**: `GET/POST /api/v1/ai-planner/saved-journeys` CRUD endpoints missing.

* **Backend Effort Needed**: **1.5 – 2.0 Weeks**

---

### SECTION 2: Intercity Bus Booking (`bus-service`)
* **Frontend Completion**: 🟢 90% (Seat grid UI, filter sheets, operator details, checkout flow complete)
* **Backend Completion**: 🟡 45% (Basic Bus, Route, and Schedule CRUD endpoints exist)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing City Search Autocomplete API**: `GET /api/v1/bus/locations/autocomplete` with fuzzy matching is missing.
2. **Missing Interactive 2D Seat Layout Grid API**: `GET /api/v1/bus/schedules/:id/seat-map` currently returns simple counts; missing 2D layout matrix (`row`, `col`, `isDeck`, `seatType`, `status`).
3. **Missing Boarding & Dropping Points API**: `GET /api/v1/bus/schedules/:id/boarding-points` lacks lat/lng coordinates and timetables.
4. **Missing Redis 5-Minute Seat Locking Engine**: Redis 300-second TTL locking logic & WebSocket broadcast to prevent double seat booking are missing.
5. **Missing Multi-Criteria Query Sorting**: Sorting schedules by fare, duration, departure time, and operator ratings is not implemented.

* **Backend Effort Needed**: **1.0 Week**

---

### SECTION 3: Car Rides & Cab Booking (`ride-service` & `driver-service`)
* **Frontend Completion**: 🟢 85% (Ride request map view, vehicle selector, driver tracking UI complete)
* **Backend Completion**: 🟡 40% (Basic Ride entity and basic status updates exist)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing Fare Estimator & Traffic Polyline API**: OSRM / Google Directions API route polyline calculation and dynamic pricing engine missing.
2. **Missing Driver Dispatch Radial Engine**: Redis Geo 3km radial spatial query (`GEORADIUS`) for finding nearest available drivers is missing.
3. **Missing Real-Time WebSockets GPS Tracking**: Nginx reverse proxy strips WebSocket upgrade headers (`Upgrade: websocket`), preventing live map driver tracking.
4. **Missing Ride Cancellation Penalty Engine**: Logic to calculate driver/passenger cancellation fees is missing.

* **Backend Effort Needed**: **1.0 – 1.5 Weeks**

---

### SECTION 4: Hotel Booking (`hotel-service`)
* **Frontend Completion**: 🟢 90% (Hotel search, filter dialogs, room selector, review lists complete)
* **Backend Completion**: 🟡 50% (Basic Hotel & Room entity CRUD endpoints exist)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing Real-Time Room Availability Matrix**: `POST /api/v1/hotels/:id/check-availability` for requested check-in/check-out date ranges missing.
2. **Missing Multi-Parametric Filter API**: Filtering by star rating, amenities (JSONB array), property type, and price range missing.
3. **Missing PostgreSQL JSONB Room Schema**: DB schema lacks JSONB columns for room amenities, bed configurations, and house rules.
4. **Missing Guest Reviews & Category Breakdown Endpoints**: Endpoint for user ratings, category breakdown (Cleanliness, Location, Service), and guest photos missing.

* **Backend Effort Needed**: **1.0 Week**

---

### SECTION 5: Tour Packages (`package-service`)
* **Frontend Completion**: 🟢 90% (Package search, day-by-day itinerary view, inclusions sheet complete)
* **Backend Completion**: 🟡 35% (Scalar package database table exists without structured data)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing DB Schema JSONB Columns**: Database lacks JSONB columns for multi-day structured itineraries, inclusions/exclusions, and gallery images.
2. **Missing Popular Destinations & Categories Endpoints**: `GET /api/v1/packages/destinations/popular` and `GET /api/v1/packages/categories` missing.
3. **Missing Date Slot Availability Engine**: `POST /api/v1/packages/:id/availability` to query batch dates and capacity missing.
4. **Missing Search & Filter Pagination**: Multi-parametric search by duration, budget, and travel style missing.

* **Backend Effort Needed**: **1.0 Week**

---

### SECTION 6: Experiences & Adventure (`adventure-service`)
* **Frontend Completion**: 🟢 85% (Adventure activity grid, category tabs, activity details complete)
* **Backend Completion**: 🔴 25% (Minimal scalar table with 8 basic columns)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing Category Schema & Endpoints**: Table lacks `category` column; `GET /api/v1/adventures/categories` endpoint missing.
2. **Missing Activity Highlights & JSONB Details**: Schema lacks inclusions, safety guidelines, physical fitness level, and equipment provided.
3. **Missing GPS Meeting Point Coordinates**: Meeting point textual location and lat/lng geo-coordinates schema missing.
4. **Missing Real-Time Slot Capacity Check**: `POST /api/v1/adventures/:id/availability` endpoint missing.

* **Backend Effort Needed**: **1.0 Week**

---

### SECTION 7: User Profile, Safety & Emergency (`user-service`)
* **Frontend Completion**: 🟢 90% (Profile settings UI, avatar cropper, emergency SOS trigger dialog, wallet card complete)
* **Backend Completion**: 🔴 20% (Operating on mock response stubs)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing Real Database Persistence**: Profile updates return mock responses instead of persisting to PostgreSQL.
2. **Missing Avatar Photo Upload API**: `POST /api/v1/user/avatar` multipart file upload with S3/Cloudinary integration missing.
3. **Missing Wallet Balance Endpoint**: `GET /api/v1/payment/wallet/balance` missing (**CRITICAL BLOCKER** for frontend wallet checkout).
4. **Missing Emergency Contacts & SOS Trigger API**: `POST /api/v1/user/emergency-sos/trigger` with Twilio SMS alert integration missing.
5. **Missing User Preferences Persistence**: `GET/PUT /api/v1/user/preferences` missing.

* **Backend Effort Needed**: **0.8 Week**

---

### SECTION 8: Bookings & Core Payments (`booking-service` & `payment-service`)
* **Frontend Completion**: 🟢 90% (Booking history list, ticket view, payment flow, QR code ticket scanner complete)
* **Backend Completion**: 🔴 30% (Isolated booking creation exists per service)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing Unified Booking History Feed API**: `GET /api/v1/bookings/history` aggregating hotels, buses, cabs, packages, and adventures under one user endpoint missing.
2. **Missing Razorpay Server Webhook Handler**: HMAC SHA256 signature verification webhook for secure async payment confirmation missing.
3. **Missing Cancellation Quote & Refund Engine**: `POST /api/v1/bookings/:id/cancellation-quote` and refund status tracking missing.
4. **Missing Cryptographic Signed JWT QR Verification API**: `POST /api/v1/tickets/verify-qr` for validating digital ticket QR codes missing.

* **Backend Effort Needed**: **1.0 – 1.5 Weeks**

---

### SECTION 9: Home Screen Dashboard
* **Frontend Completion**: 🟢 95% (Hero banner carousel, active trip ticker card, smart recommendations grid complete)
* **Backend Completion**: 🔴 20% (Hardcoded frontend fallbacks used)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing Active Trip Ticker Endpoint**: `GET /api/v1/user/active-trip` (currently omits active hotel stays and cab rides).
2. **Missing PostGIS Spatial Recommendations**: PostGIS radius spatial query (`ST_DWithin`) for location-aware recommendations missing.
3. **Missing Dynamic Marketing Banners API**: `GET /api/v1/promotions/banners` missing.

* **Backend Effort Needed**: **0.5 Week**

---

### SECTION 10: Push Notifications (`notification-service`)
* **Frontend Completion**: 🟢 85% (Notification list screen, unread badge counter, push listener hooks complete)
* **Backend Completion**: 🔴 20% (Broadcast stub only)

#### ❌ Backend Parts NOT Completed (Missing Backend Code):
1. **Missing User-Scoped Notification Feed API**: `GET /api/v1/notifications/user` authenticated JWT inbox missing.
2. **Missing FCM / APNS Device Token Registration API**: `POST /api/v1/notifications/device-token` missing.
3. **Missing Read/Unread Status Endpoints**: `PUT /notifications/:id/read` & `GET /notifications/unread-count` missing.

* **Backend Effort Needed**: **0.5 Week**

---

## 📌 Recommendation & Talking Points for Project Manager (Client Discussion)

1. **Acknowledge High Frontend Quality (88% Done)**: Emphasize to the client that all app screens, user flows, UI designs, and state management logic are fully built and tested.
2. **Highlight Backend Security & Reliability Requirements (40% Done)**: Explain that while the frontend is visual, the backend powers crucial financial, security, and real-time functions (Razorpay payment verification webhooks, Redis 5-min seat locks, WebSockets live GPS tracking, and PostGIS spatial queries).
3. **Request a 4 to 6-Week Buffer**: Present a structured 4 to 6-week backend sprint plan to complete all missing APIs, database schema migrations, third-party integrations, and end-to-end integration testing prior to production launch.
