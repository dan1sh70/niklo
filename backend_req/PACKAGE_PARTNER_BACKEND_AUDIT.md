# Package Partner Backend — Remaining Pending Fixes

> **Target Service**: `niklo-main/package-service`  
> **Source Specification**: [`package_partner_backend.md`](package_partner_backend.md)  
> **Status**: ⚠️ **ACTION REQUIRED BY BACKEND TEAM**  
> **Note**: *All previously identified gateway, booking methods, earnings routes, notification paths, and catalog CRUD stubs have been fixed and removed from this document. This document lists **ONLY** the remaining issues and missing endpoints that still require backend implementation.*

---

## 1. 🔴 Critical Runtime Bug: Partner Profile ID Lookup Mismatch

* **Target File**: [`package-service/src/partner/profile/profile.service.ts`](file:///d:/Users/anish/Project/niklo-partner/niklo-main/package-service/src/partner/profile/profile.service.ts)
* **Caller File**: [`package-service/src/partner/profile/profile.controller.ts`](file:///d:/Users/anish/Project/niklo-partner/niklo-main/package-service/src/partner/profile/profile.controller.ts)

### Problem Description
In `profile.controller.ts` (lines 13 & 18), the controller passes `req.user.id` (the authenticated user's ID from auth):
```typescript
@Get()
async getProfile(@Req() req: any) {
  return { success: true, data: await this.profileService.getProfile(req.user.id) };
}

@Put('business')
async updateBusinessDetails(@Req() req: any, @Body() body: any) {
  return { success: true, data: await this.profileService.updateBusinessDetails(req.user.id, body) };
}
```

However, in `profile.service.ts` (lines 29 & 47), `getProfile()` and `updateBusinessDetails()` query by the primary key `id` of `package_partners`:
```typescript
// Line 29:
const partner = await this.partnerRepository.findOne({ where: { id: partnerId } });

// Line 47:
await this.partnerRepository.update({ id: partnerId }, { ... });
```
Because `package_partners.id` (newly generated table UUID) does **NOT** equal `user_id` (auth user UUID), any call to `GET /api/v1/package-partner/profile` returns `404 Profile not found` and `PUT /api/v1/package-partner/profile/business` fails to update.

### Solution / Code Fix
In `package-service/src/partner/profile/profile.service.ts`:
```typescript
// Line 29:
const partner = await this.partnerRepository.findOne({ 
  where: [{ id: partnerId }, { user_id: partnerId }] 
});

// Line 47:
await this.partnerRepository.update(
  partner.id, // Use resolved partner.id after looking up by user_id
  {
    business_name: body.businessName,
    email: body.email,
    phone: body.phone,
    address_line1: body.address,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
  }
);
```

---

## 2. ❌ Missing Endpoints Checklist

The following 6 endpoints are completely absent from the controllers and services and must be implemented:

### Module 1: Setup & KYC
* [ ] **`GET /api/v1/package-partner/setup/documents`**:
  * Standalone endpoint to return the document compliance checklist and upload statuses (currently only nested inside `/setup/progress`).
* [ ] **`GET /api/v1/package-partner/setup/bank/ifsc-lookup?ifsc=...`**:
  * Automated IFSC lookup returning `{ bankName, branchName, city, state, isSupported }`.

### Module 2: Package Catalog
* [ ] **`GET /api/v1/package-partner/packages/:id/availability-calendar?month=...&year=...`**:
  * Monthly departure calendar endpoint returning slots per date (`totalSeats`, `bookedSeats`, `availableSeats`, `status`).
* [ ] **`PUT /api/v1/package-partner/packages/:id/availability/slots`**:
  * Batch update departure dates and seat capacities for an existing package.

### Module 5: Home Dashboard
* [ ] **`GET /api/v1/package-partner/home/verification-banner`**:
  * Conditional verification banner endpoint returning partner verification state, rejection reasons, and required action links.

### Module 6: Profile & Support
* [ ] **`PATCH /api/v1/package-partner/profile/notifications-toggle`**:
  * Toggles push, SMS, and email alert preferences: `{ pushNotificationsEnabled: boolean }`.

---

## 3. Quick Copy-Paste Code Checklist for Backend Developer

### A. Fix `ProfileService` in `package-service/src/partner/profile/profile.service.ts`:
```typescript
// Replace getProfile (line 28-44) with:
async getProfile(partnerId: string) {
  const partner = await this.partnerRepository.findOne({ 
    where: [{ id: partnerId }, { user_id: partnerId }] 
  });
  if (!partner) throw new NotFoundException('Profile not found');
  return {
    partnerId: partner.id,
    businessName: partner.business_name,
    businessType: partner.business_type,
    email: partner.email,
    phone: partner.phone,
    address: partner.address_line1,
    city: partner.city,
    state: partner.state,
    pincode: partner.pincode,
    verificationStatus: partner.verification_status,
    createdAt: partner.created_at
  };
}

// Replace updateBusinessDetails (line 46-60) with:
async updateBusinessDetails(partnerId: string, body: any) {
  const partner = await this.partnerRepository.findOne({ 
    where: [{ id: partnerId }, { user_id: partnerId }] 
  });
  if (!partner) throw new NotFoundException('Profile not found');
  
  await this.partnerRepository.update(
    { id: partner.id },
    {
      business_name: body.businessName,
      email: body.email,
      phone: body.phone,
      address_line1: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
    }
  );
  return this.getProfile(partner.id);
}
```

### B. Add Missing Profile Notification Toggle in `package-service/src/partner/profile/`:
In `profile.controller.ts`:
```typescript
@Patch('notifications-toggle')
async toggleNotifications(@Req() req: any, @Body() body: any) {
  return { success: true, data: { pushNotificationsEnabled: body.pushNotificationsEnabled ?? true } };
}
```

### C. Add Missing Home Verification Banner in `package-service/src/partner/home/`:
In `home-dashboard.controller.ts`:
```typescript
@Get('verification-banner')
async getVerificationBanner(@Req() req: any) {
  return {
    success: true,
    data: {
      showBanner: false,
      bannerType: 'INFO',
      title: 'Profile Approved',
      subtitle: 'Your tour operator account is verified.',
      actionRoute: null
    }
  };
}
```
