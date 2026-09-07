# Package Partner Backend Audit & Specification Discrepancy Report

> **Target Specification**: [`package_partner_backend.md`](package_partner_backend.md) (56 Endpoints across 8 Modules)  
> **Backend Repository Audited**: `niklo-main/` (`auth-service`, `package-service`, `booking-service`, `nginx.conf`)  
> **Frontend App Target**: `lib/features/package_partner`  
> **Audit Date**: September 2026  
> **Audit Status**: ❌ **CRITICAL GAPS IDENTIFIED — NOT READY FOR FULL FRONTEND INTEGRATION**  
> **Rule Compliance**: *Backend code was NOT modified per user instruction ("don't touch any backend code").*

---

## Executive Summary

A comprehensive, line-by-line audit of the backend repository `niklo-main` against the official specification [`package_partner_backend.md`](package_partner_backend.md) reveals that **the backend cannot yet be integrated as-is into the Flutter frontend**.

While scaffolding exists in `package-service/src/partner`, there are:
1. **16 Missing or Broken Endpoints** (including a method missing its `@Delete` HTTP decorator, completely missing availability calendar, missing tax invoices, missing status toggles).
2. **12 Route Path & HTTP Method Mismatches** (e.g., HTTP `PUT` used instead of `POST`/`PATCH`, `/business-details` instead of `/business`, `/device-token` instead of `/fcm-token`).
3. **8 Empty Stub Implementations** (`getPackages()`, `getPackage()`, `getProfile()`, `updateBusinessDetails()`, `getOverview()`, `getChartData()` return `{}` or `[]`).
4. **Critical Runtime Auth Flaw**: `req.user.partnerProfileId` is accessed across 6 modules, but `jwt-auth.guard.ts` only sets `req.user.id`. `partnerProfileId` is `undefined` at runtime for all calls.
5. **Gateway Routing Blocker**: `nginx.conf` has **no proxy rule** for `/api/v1/package-partner`. All incoming requests through the API gateway will fail with `404 Not Found`.
6. **Adventure Service Copy-Paste Residue**: The setup module still enforces adventure provider categories (`river_rafting`, `paragliding`) and doc types (`adventure_license`, `safety_cert`) instead of holiday tour package rules.

---

## High-Severity Blockers (Systemic / Infrastructure)

| # | Blocker | Location | Impact |
|---|---|---|---|
| **B1** | **NGINX Gateway Missing Route** | `niklo-main/nginx.conf` | Gateway only proxies `/api/v1/packages`. Any call to `/api/v1/package-partner/*` returns `404 Not Found`. |
| **B2** | **`req.user.partnerProfileId` is `undefined`** | `package-service/src/partner/common/jwt-auth.guard.ts` | Guard only sets `req.user = { id: ... }`. Controllers pass `req.user.partnerProfileId` to services, causing queries to fail with `undefined`. |
| **B3** | **Auth Token Missing Partner Meta** | `auth-service/src/auth/auth.service.ts` | `verifyOtp` does not return `role`, `partnerProfileId`, or `onboardingStatus` in the `user` object. Flutter app cannot route on login. |
| **B4** | **Missing `@Delete` Decorator** | `packages-partner.controller.ts:L77` | `async deletePackage(...)` has no HTTP method decorator; route cannot be reached by clients. |
| **B5** | **Adventure Copy-Paste in Setup Service** | `setup.service.ts:L10-L11` | Valid partner types are hardcoded to `activity_provider`, `water_sports`, etc. Tour operators cannot submit valid holiday categories. |

---

## Detailed Module-by-Module Audit (56 Endpoints)

---

### Module 0: Authentication & Session Management (`/api/v1/auth`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 0.1 | `/api/v1/auth/otp/send` | `POST` | ⚠️ Incomplete | `SendOtpDto` only accepts `phone`. Drops `role`, `name`, `email` needed for partner registration. |
| 0.2 | `/api/v1/auth/otp/verify` | `POST` | ⚠️ Schema Mismatch | Generates tokens, but `user` response object only contains `{ id, phone, name, email }`. **Missing `role`, `partnerProfileId`, `onboardingStatus`**. |
| 0.3 | `/api/v1/auth/token/refresh` | `POST` | ❌ Route Mismatch | Controller endpoint is `@Post('refresh')` (`/api/v1/auth/refresh`). Spec requires `/api/v1/auth/token/refresh`. |
| 0.4 | `/api/v1/auth/logout` | `POST` | ⚠️ Incomplete | Controller accepts no request body; does not invalidate or unregister client `fcmToken`. |

---

### Module 1: Partner Setup & KYC (`/api/v1/package-partner/setup`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 1.1 | `/setup/business` | `POST` | ❌ Route Mismatch | Controller path is `@Post('business-details')`. Address is flat string instead of structured object `{ line1, city, state, pincode }`. |
| 1.2 | `/setup/categories` | `POST` | ❌ Schema Mismatch | Controller expects `{ categoryIds: string[] }` (adventure sports). Spec requires `{ primaryRegions, tourCategories, averageGroupSize }`. Controller also has non-spec `/partner-type` and `/location` endpoints. |
| 1.3 | `/setup/documents/upload` | `POST` | ⚠️ Field Mismatch | Expects fields `docType`, `title`, `file`. Spec requires `documentType`, `documentNumber`, `file`. |
| 1.4 | `/setup/documents` | `GET` | ❌ **MISSING** | Endpoint to fetch document checklist and upload statuses is completely absent. |
| 1.5 | `/setup/bank/ifsc-lookup` | `GET` | ❌ **MISSING** | IFSC automated branch verification endpoint is completely absent. |
| 1.6 | `/setup/bank` | `POST` | ⚠️ Field Mismatch | Controller expects `{ accountName, accountNumber, ifsc }`. Spec requires `{ accountHolderName, accountNumber, confirmAccountNumber, ifscCode, accountType }`. |
| 1.7 | `/setup/submit` | `POST` | ⚠️ Validation Flaw | Verifies against adventure doc types (`adventure_license`, `safety_cert`) rather than tour operator documents (`GST_CERTIFICATE`, `TOURISM_LICENSE`, etc.). |
| 1.8 | `/setup/status` | `GET` | ❌ Route Mismatch | Controller path is `@Get('verification-status')`. Returns adventure progress steps instead of the 4-phase review timeline. |

---

### Module 2: Package Catalog (`/api/v1/package-partner/packages`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 2.1 | `/packages` | `GET` | ❌ **EMPTY STUB** | `getPackages()` in `packages-partner.service.ts` line 29 returns `[]`. |
| 2.2 | `/packages/:id` | `GET` | ❌ **EMPTY STUB** | `getPackage()` in `packages-partner.service.ts` line 30 returns `{}`. |
| 2.3 | `/packages/draft` | `POST` | ✅ Implemented | Initializes draft package. |
| 2.4 | `/packages/:id/basic-info` | `PUT` | ⚠️ Missing Field | Saves basic info, but omits `tagline`. |
| 2.5 | `/packages/:id/photos` | `POST` | ❌ Batch Upload Missing | Only accepts single file `file` with `isCover` flag. Spec requires `coverImage` and up to 10 `galleryImages`. |
| 2.6 | `/packages/:id/itinerary` | `PUT` | ⚠️ Body Mismatch | Controller expects `{ days: any[] }` instead of `{ itinerary: [...] }`. |
| 2.7 | `/packages/:id/inclusions` | `PUT` | ⚠️ Body Mismatch | Controller expects `{ inclusions: string[] }`. Spec requires `{ included: string[], excluded: string[] }`. |
| 2.8 | `/packages/:id/pricing` | `PUT` | ✅ Implemented | Saves pricing and commercial rules. |
| 2.9 | `/packages/:id/availability` | `PUT` | ⚠️ Body Mismatch | Controller expects `{ departures: [...] }`. Spec requires `{ seatsPerDeparture, departureDates: [...] }`. |
| 2.10 | `/packages/:id/publish` | `POST` | ⚠️ No Validation | Publishes package without validating 6 preceding creation steps or partner verification status. |
| 2.11 | `/packages/:id/status` | `PATCH` | ❌ **MISSING** | Toggle active/inactive status is completely absent from controller and service. |
| 2.12 | `/packages/:id` | `DELETE` | ❌ **BROKEN ROUTE** | Line 77 in `packages-partner.controller.ts` is missing `@Delete(':id')` decorator. Route cannot be invoked. |
| 2.13 | `/packages/:id/availability-calendar` | `GET` | ❌ **MISSING** | Monthly calendar slot management endpoint is completely absent. |
| 2.14 | `/packages/:id/availability/slots` | `PUT` | ❌ **MISSING** | Batch update departure dates/seats endpoint is completely absent. |

---

### Module 3: Bookings Management (`/api/v1/package-partner/bookings`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 3.1 | `/bookings` | `GET` | ⚠️ Raw DB Return | Returns raw entity array without envelope, pagination metadata, counts, or formatted currency strings. |
| 3.2 | `/bookings/:id` | `GET` | ⚠️ Incomplete | Missing package media, schedule duration formatting, and financials breakdown calculation. |
| 3.3 | `/bookings/:id/accept` | `POST` | ❌ Method Mismatch | Defined as `@Put(':id/accept')` (HTTP `PUT` instead of `POST`). |
| 3.4 | `/bookings/:id/decline` | `POST` | ❌ Method Mismatch | Defined as `@Put(':id/decline')` (HTTP `PUT` instead of `POST`). |
| 3.5 | `/bookings/:id/cancel` | `POST` | ❌ Method Mismatch | Defined as `@Put(':id/cancel')` (HTTP `PUT` instead of `POST`). |
| 3.6 | `/bookings/:id/complete` | `PATCH` | ❌ **NOT EXPOSED** | Service method `completeBooking()` exists, but has NO route in `bookings-partner.controller.ts`. |
| 3.7 | `/bookings/:id/voucher` | `GET` | ❌ **NOT EXPOSED** | Service method `downloadVoucher()` exists, but has NO route in `bookings-partner.controller.ts`. |

*Note: Controller exposes non-spec `@Put(':id/reschedule')` and `@Put(':id/confirm')` which return empty `{}`.*

---

### Module 4: Earnings & Settlements (`/api/v1/package-partner/earnings`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 4.1 | `/earnings/overview` | `GET` | ❌ **NOT EXPOSED** | Service method `getOverview()` returns `{}` (EMPTY STUB) and is not exposed in controller. Controller exposes non-spec `/analytics` and `/payout-policy`. |
| 4.2 | `/earnings/chart` | `GET` | ❌ **NOT EXPOSED** | Service method `getChartData()` returns `[]` (EMPTY STUB) and is not exposed in controller. |
| 4.3 | `/earnings/withdraw` | `POST` | ✅ Implemented | Requests on-demand withdrawal. |
| 4.4 | `/earnings/transactions` | `GET` | ❌ Route Mismatch | Controller route is named `/settlements` instead of `/transactions`. |
| 4.5 | `/earnings/transactions/:id` | `GET` | ❌ Route Mismatch | Controller route is named `/settlements/:id` instead of `/transactions/:id`. |
| 4.6 | `/earnings/transactions/:id/invoice` | `GET` | ❌ **MISSING** | Settlement credit note & tax invoice PDF download endpoint is completely absent. |

---

### Module 5: Home Dashboard (`/api/v1/package-partner/home`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 5.1 | `/home/dashboard` | `GET` | ❌ Schema Mismatch | Returns primitive hardcoded counts `{ activePackages: 5, pendingBookings: 0, activeBookings: 0, todayEarnings: 25000, ... }`. Missing `partnerProfile`, `verificationBanner`, `stats` trend objects, `pendingBookingRequests` array, and `topPackages` array. |
| 5.2 | `/home/verification-banner` | `GET` | ❌ **MISSING** | Conditional verification banner endpoint is absent (Controller has non-spec `@Get('chart')`). |

---

### Module 6: Profile & Support (`/api/v1/package-partner/profile`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 6.1 | `/profile` | `GET` | ❌ **EMPTY STUB** | Service method `getProfile()` returns `{}`. |
| 6.2 | `/profile/business` | `PUT` | ❌ **EMPTY STUB** | Service method `updateBusinessDetails()` returns `{}`. |
| 6.3 | `/profile/notifications-toggle` | `PATCH` | ❌ **MISSING** | Notification toggle endpoint is completely absent. |
| 6.4 | `/profile/bank` | `GET` | ⚠️ Runtime Bug | Passes `req.user.partnerProfileId` which is `undefined`. |
| 6.5 | `/profile/bank/otp/send` | `POST` | ⚠️ Runtime Bug | Passes `req.user.partnerProfileId` which is `undefined`. |
| 6.6 | `/profile/bank` | `PUT` | ⚠️ Runtime Bug | Passes `req.user.partnerProfileId` which is `undefined`. |
| 6.7 | `/profile/support/categories` | `GET` | ✅ Implemented | Returns help categories and helpline info. |
| 6.8 | `/profile/support/tickets` | `GET` | ⚠️ Runtime Bug | Passes `req.user.partnerProfileId` which is `undefined`. |
| 6.9 | `/profile/support/tickets` | `POST` | ⚠️ Runtime Bug | Passes `req.user.partnerProfileId` which is `undefined`. |
| 6.10 | `/profile/legal/:documentType` | `GET` | ✅ Implemented | Returns terms / privacy markdown. |

*Note: Controller exposes non-spec adventure document routes: `@Get('documents')`, `@Post('documents')`, `@Put('documents/:id/renew')`.*

---

### Module 7: Notifications Center (`/api/v1/package-partner/notifications`)

| # | Spec Endpoint | Spec Method | Backend Status | Discrepancies & Issues |
|---|---|---|---|---|
| 7.1 | `/notifications` | `GET` | ⚠️ Missing Envelope | Returns raw DB array without pagination envelope or action link objects. Passes `req.user.partnerProfileId` (`undefined`). |
| 7.2 | `/notifications/:id/read` | `PATCH` | ❌ Method Mismatch | Defined as `@Put(':id/read')` (HTTP `PUT` instead of `PATCH`). |
| 7.3 | `/notifications/mark-all-read` | `PATCH` | ❌ Route & Method Mismatch | Defined as `@Put('read-all')` (HTTP `PUT` instead of `PATCH`, and path `read-all` instead of `mark-all-read`). |
| 7.4 | `/notifications/:id` | `DELETE` | ✅ Implemented | Dismisses single notification. |
| 7.5 | `/notifications/fcm-token` | `POST` | ❌ Route Mismatch | Defined as `@Post('device-token')` instead of `/fcm-token`. |

*Note: Controller exposes non-spec `@Get('preferences')` and `@Put('preferences')`.*

---

## Action Plan to Unblock Full Integration

### Phase A: Backend Remediation (Backend Team)
1. **Fix Gateway**: Add `location /api/v1/package-partner` into `nginx.conf` pointing to `package-service:3012`.
2. **Fix Auth Guard**: Update `jwt-auth.guard.ts` to look up or attach the partner's `partnerProfileId` to `req.user`.
3. **Fix Auth Controller**: Return `role`, `partnerProfileId`, and `onboardingStatus` from `/api/v1/auth/otp/verify`.
4. **Fix Controller Routes & Methods**:
   - Add missing `@Delete(':id')` on `deletePackage`.
   - Change booking actions from `PUT` to `POST` (`accept`, `decline`, `cancel`).
   - Expose `/complete` (`PATCH`) and `/voucher` (`GET`) in `BookingsPartnerController`.
   - Expose `/overview` and `/chart` in `EarningsController`, and rename `/settlements` to `/transactions`.
   - Update notification endpoints to `PATCH` and fix path names (`/mark-all-read`, `/fcm-token`).
5. **Implement Stubs**: Replace empty `{}` / `[]` in `packages-partner.service.ts`, `profile.service.ts`, and `earnings.service.ts` with actual database queries.

### Phase B: Frontend Data Layer Implementation (`lib/features/package_partner`)
While backend developers apply the fixes above, the frontend can be prepared without blocking:
1. **Create Clean Repository & Service Architecture**:
   - Implement data sources and repositories in `lib/features/package_partner/{setup, packages, bookings, earnings, home, profile, notifications}/data/`.
   - Map requests through `ApiClient().dio` targeting the official contract paths in `package_partner_backend.md`.
2. **Graceful Error Handling & Mock Fallback**:
   - Include mock fallbacks so the UI remains interactive and functional during development while waiting for backend deployment.
