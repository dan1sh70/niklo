# Backend Base URLs Audit & Service Integration Guide

> **Target Audience**: Backend Developers & DevOps / Infrastructure Engineers  
> **Prepared By**: Mobile Frontend Team (`niklo-partner`)  
> **Date**: September 2026  
> **Associated Specs**:  
> - `package_partner_backend.md` (Package Partner API & DB Specification)  
> - `adv_rider_backend.md` (Adventure Partner API & DB Specification)  
> - `.env` (Frontend Environment Configuration)  
> - `lib/core/network/api_client.dart` (Mobile Network Routing Layer)

---

## 1. Executive Summary

This document audits the microservice base URLs configured in the mobile application's [`.env`](.env) file, reports live connectivity test results, highlights **broken/down services**, and identifies missing backend implementations—specifically that the **Package Partner backend specified in [`package_partner_backend.md`](package_partner_backend.md) is not yet implemented or configured** in the backend service.

---

## 2. Microservice Base URLs & Live Health Matrix

Each host from [`.env`](.env) was tested for live HTTP connectivity and protocol accessibility.

| # | Environment Variable in `.env` | Configured Base URL | Live Test Status | Live Response / Banner | Current Operational State |
|---|--------------------------------|---------------------|------------------|------------------------|---------------------------|
| 1 | `API_BASE_URL` | `http://lc7g5kixd0vu31p5jtsfjil6.187.127.157.13.sslip.io/api/v1` | **HTTP 404** | `404 page not found` | 🔴 **DOWN / UNROUTED** (Traefik has no router) |
| 2 | `GATEWAY_URL` | `http://lc7g5kixd0vu31p5jtsfjil6.187.127.157.13.sslip.io` | **HTTP 404** | `404 page not found` | 🔴 **DOWN / UNROUTED** (Traefik has no router) |
| 3 | `AUTH_SERVICE_URL` | `http://szs601uiqefhc8jbpeq587f3.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟢 **ONLINE** |
| 4 | `USER_SERVICE_URL` | `http://f11slpsqn3bkula8r1yr292u.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟢 **ONLINE** |
| 5 | `RIDE_SERVICE_URL` | `http://my41fssoetuy2w34a2yettfe.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟢 **ONLINE** |
| 6 | `DRIVER_SERVICE_URL` | `http://ebzdp7jvp5z5bhrl05tkvxsa.187.127.157.13.sslip.io` | **HTTP 404** | `404 page not found` | 🔴 **DOWN / UNROUTED** (Container down or missing ingress) |
| 7 | `PACKAGE_SERVICE_URL` | `http://ltmzir9qa389f53ho5hkzlq0.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟡 **ONLINE (User catalog only; Partner API missing)** |
| 8 | `ADVENTURE_SERVICE_URL` | `http://ra0qdnh3xfolrfu1y82bva9g.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟡 **ONLINE (User catalog live; Partner update pending deploy)** |
| 9 | `NOTIFICATION_SERVICE_URL` | `http://l2pdf6ail6mlmurxhtjjf44i.187.127.157.13.sslip.io` | **HTTP 404** | `404 page not found` | 🔴 **DOWN / UNROUTED** (Container down or missing ingress) |
| 10 | `ADMIN_SERVICE_URL` | `http://k1lrz8qb78v16uuvqngcahj0.187.127.157.13.sslip.io` | **HTTP 404** | `404 page not found` | 🔴 **DOWN / UNROUTED** (Container down or missing ingress) |
| 11 | `BUS_SERVICE_URL` | `http://w1n68oxs2na9q9tbveqsqa4s.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟢 **ONLINE** |
| 12 | `PAYMENT_SERVICE_URL` | `http://n13chiypv5vg517ffvioht20.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟢 **ONLINE** |
| 13 | `HOTEL_SERVICE_URL` | `http://b5m0ntg98i0cpdaidmcvdqwd.187.127.157.13.sslip.io` | **HTTP 200** | `"Hello World!"` | 🟢 **ONLINE** |
| 14 | `BOOKING_SERVICE_URL` | `http://yjfbvszz8e2yv5sefwcpxye4.187.127.157.13.sslip.io` | **HTTP 200** | `"Booking Service is running!"` | 🟢 **ONLINE** |
| 15 | `POSTGRES_DB_URL` | `http://wecjnkio8g7cm34mvoob3gig.187.127.157.13.sslip.io` | **TCP 5432 OK** | Database Port Open | 🔵 **ONLINE DATABASE** (TCP 5432 reachable; HTTP 502 expected) |

---

## 3. Critical Infrastructure & Routing Issues

### Issue 1: API Gateway (`GATEWAY_URL` / `API_BASE_URL`) Returns Traefik 404
* **Host**: `http://lc7g5kixd0vu31p5jtsfjil6.187.127.157.13.sslip.io`
* **Symptom**: Every request returns `404 page not found` from the ingress proxy.
* **Impact**: The mobile app cannot use unified gateway mode (`USE_GATEWAY=true`). It has been forced to run in direct service mode (`USE_GATEWAY=false`), requiring independent DNS routing to each individual service container.
* **Required Action**:
  1. Verify the Gateway/Kong/Traefik reverse proxy container is running.
  2. Map the domain `lc7g5kixd0vu31p5jtsfjil6.187.127.157.13.sslip.io` to forward traffic to the gateway service.

### Issue 2: Driver, Notification, and Admin Services Down
* **Hosts**:
  - `DRIVER_SERVICE_URL`: `http://ebzdp7jvp5z5bhrl05tkvxsa.187.127.157.13.sslip.io`
  - `NOTIFICATION_SERVICE_URL`: `http://l2pdf6ail6mlmurxhtjjf44i.187.127.157.13.sslip.io`
  - `ADMIN_SERVICE_URL`: `http://k1lrz8qb78v16uuvqngcahj0.187.127.157.13.sslip.io`
* **Symptom**: All return Traefik `404 page not found`.
* **Impact**:
  - Mobile driver onboarding and ride matching cannot communicate with Driver Service.
  - Push notifications, device FCM token registration, and in-app alert queries fail.
* **Required Action**: Restart or deploy these microservice containers and ensure Traefik routers are configured for these subdomains.

---

## 4. Package Partner Backend Is NOT Configured / Implemented

### Background & Gap Analysis
The file [`package_partner_backend.md`](package_partner_backend.md) specifies a comprehensive backend architecture for Holiday Tour Operators (**56 endpoints across 8 modules**).

However, an inspection of `niklo-main/package-service/src` reveals that **none of the partner modules exist in the codebase**:
```
niklo-main/package-service/src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── config/
├── main.ts
└── packages/                    <-- ONLY CUSTOMER-FACING CATALOG
    ├── dto/
    ├── entities/
    ├── packages.controller.ts   <-- /api/v1/packages only
    ├── packages.module.ts
    └── packages.service.ts
```

### Missing Package Partner Modules (from `package_partner_backend.md`):

| Module | Route Prefix | Specified Endpoints | Current Status in Backend |
|---|---|:---:|---|
| **Module 0: Authentication** | `/api/v1/auth/*` | 4 | Handled by `auth-service`, but partner role handling (`"Package Partner"`) must be verified. |
| **Module 1: Partner Setup & KYC** | `/api/v1/partner/setup/*` | 8 | ❌ **Missing**: Partner profile entity, document upload, verification state machine. |
| **Module 2: Package Catalog** | `/api/v1/partner/packages/*` | 14 | ❌ **Missing**: 7-step package creation wizard, tier pricing, seasonal availability calendars, itinerary stops. |
| **Module 3: Bookings Management** | `/api/v1/partner/bookings/*` | 7 | ❌ **Missing**: Booking requests, accept/reject, guest passenger manifests, cancellation policies. |
| **Module 4: Earnings & Settlements** | `/api/v1/partner/earnings/*` | 6 | ❌ **Missing**: Weekly Monday payout pipeline, TDS 1% deduction, GST calculation, settlement history, PDF invoices. |
| **Module 5: Home Dashboard** | `/api/v1/partner/home/*` | 2 | ❌ **Missing**: Aggregated stats (active packages, monthly revenue, pending requests, today's arrivals). |
| **Module 6: Profile & Settings** | `/api/v1/partner/profile/*` | 10 | ❌ **Missing**: Business profile update, bank account verification (penny drop), emergency contacts, legal policies. |
| **Module 7: Notifications Center** | `/api/v1/partner/notifications/*` | 5 | ❌ **Missing**: In-app notification center, FCM triggers for new booking requests and settlements. |

### Required Action for Backend Team:
1. Scaffold `src/partner/` in `niklo-main/package-service` following the pattern implemented in `adventure-service`.
2. Create controllers, services, entities, and migrations adhering to the contracts and schema defined in [`package_partner_backend.md`](package_partner_backend.md).
3. Connect the controllers to `package-service/src/app.module.ts`.
4. Deploy the updated `package-service` to `http://ltmzir9qa389f53ho5hkzlq0.187.127.157.13.sslip.io`.

---

## 5. Adventure Service Backend Status

* **Local Codebase**: The partner module has been fully coded in `niklo-main/adventure-service/src/partner` covering all 9 partner modules (`/setup`, `/home`, `/activities`, `/availability`, `/bookings`, `/packages`, `/earnings`, `/notifications`, `/profile`).
* **Remote Deployment**: The deployed remote host `http://ra0qdnh3xfolrfu1y82bva9g.187.127.157.13.sslip.io` is still running the older image (only public `/api/v1/adventures` responds; partner routes return 404).
* **Action**: Re-build and re-deploy the `adventure-service` Docker image to the remote server so the local partner module changes go live.

---

## 6. Frontend Network Layer Architecture

The Flutter application (`niklo-partner`) routes API traffic using [`ApiClient`](lib/core/network/api_client.dart):

```
                                    ┌─── USE_GATEWAY=true  ───> API Gateway (http://...sslip.io/api/v1)
                                    │
Flutter App Request                 │
(e.g., /adventure/activities) ─── ApiClient 
                                    │                           ┌──> /auth       ──> AUTH_SERVICE_URL
                                    └─── USE_GATEWAY=false ───> ├──> /adventure  ──> ADVENTURE_SERVICE_URL
                                         (Direct Mode)          ├──> /package    ──> PACKAGE_SERVICE_URL
                                                                └──> /bookings   ──> BOOKING_SERVICE_URL
```

### Path-to-Host Mapping in `lib/core/network/api_client.dart`:
```dart
static const Map<String, String> _serviceEnvKeys = {
  '/auth': 'AUTH_SERVICE_URL',
  '/users': 'USER_SERVICE_URL',
  '/ride': 'RIDE_SERVICE_URL',
  '/driver': 'DRIVER_SERVICE_URL',
  '/bus': 'BUS_SERVICE_URL',
  '/payment': 'PAYMENT_SERVICE_URL',
  '/bookings/hotel': 'HOTEL_SERVICE_URL',
  '/bookings': 'BOOKING_SERVICE_URL',
  '/hotels': 'HOTEL_SERVICE_URL',
  '/hotel': 'HOTEL_SERVICE_URL',
  '/package': 'PACKAGE_SERVICE_URL',
  '/adventure': 'ADVENTURE_SERVICE_URL',
  '/notification': 'NOTIFICATION_SERVICE_URL',
  '/admin': 'ADMIN_SERVICE_URL',
};
```

### Authentication Header:
All requests (except those with `ApiClient.skipAuthKey: true`) automatically attach:
```http
Authorization: Bearer <access_token>
```

---

## 7. Immediate Action Checklist for Backend & DevOps

- [ ] **Fix Traefik Routing for Gateway**: Ensure `lc7g5kixd0vu31p5jtsfjil6.187.127.157.13.sslip.io` properly proxies traffic to the API gateway service.
- [ ] **Restore Down Services**:
  - [ ] Restart `driver-service` (`ebzdp7jvp5z5bhrl05tkvxsa...`)
  - [ ] Restart `notification-service` (`l2pdf6ail6mlmurxhtjjf44i...`)
  - [ ] Restart `admin-service` (`k1lrz8qb78v16uuvqngcahj0...`)
- [ ] **Deploy Updated Adventure Service**:
  - [ ] Deploy the latest build of `niklo-main/adventure-service` (including `src/partner/`) to `ra0qdnh3xfolrfu1y82bva9g.187.127.157.13.sslip.io`.
- [ ] **Implement Package Partner Service**:
  - [ ] Reference [`package_partner_backend.md`](package_partner_backend.md) for data schemas, endpoints, and status codes.
  - [ ] Implement `src/partner/` in `niklo-main/package-service`.
  - [ ] Deploy updated `package-service` to `ltmzir9qa389f53ho5hkzlq0.187.127.157.13.sslip.io`.
