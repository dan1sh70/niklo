# Module 1: Common, Authentication & User Management (Backend Requirements)

## 1. Overview
This document specifies the backend requirements, existing implementation analysis, static/mocked component identification, and API contracts for the Common, Authentication, Onboarding, and Profile management modules in the `niklo-partner` app.

---

## 2. Component & Feature Status Analysis

| Feature / Screen | Frontend Status | Backend Status (`niklo-main/auth-service` & `user-service`) | Current Gap / Action Required |
| :--- | :--- | :--- | :--- |
| **Mobile Login (OTP Send)** | Integrated | `POST /api/v1/auth/send-otp` exists in `auth-service` | Active. Need SMS gateway production configuration. |
| **OTP Verification & JWT** | Integrated | `POST /api/v1/auth/verify-otp` exists in `auth-service` | Returns JWT containing `id`, `role`, `phone`. Roles supported: `Car Driver`, `Bus Operator`, `Hotel Partner`. |
| **Signup / Registration** | Integrated | `POST /api/v1/auth/send-otp` with name & email | Requires auto-creation of partner record upon first sign-up. |
| **User/Partner Profile Fetch** | Integrated | `GET /api/v1/users/profile` exists | Currently returns base user details. |
| **User/Partner Profile Edit** | **STATIC (Mocked)** | Missing endpoint `PATCH /api/v1/users/profile` | **High Priority:** Edits to name, email, avatar, preferred language live strictly in local state (`profileEditsProvider`). Backend must implement `PATCH /api/v1/users/profile`. |
| **Driver/Partner Online Status** | Integrated | Socket connection + REST fallback | Need Redis state persistence for active driver sockets. |

---

## 3. Detailed Endpoint Contracts Required

### 3.1 Fetch User Profile
- **Endpoint:** `GET /api/v1/users/profile`
- **Auth:** Bearer Token
- **Response Format:**
```json
{
  "id": "uuid",
  "phone": "+919876543210",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Car Driver", // or "Bus Operator", "Hotel Partner"
  "avatar_url": "https://cdn.niklo.com/avatars/user.jpg",
  "preferred_language": "en",
  "status": "APPROVED",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### 3.2 Update User Profile (NEW Endpoint Needed)
- **Endpoint:** `PATCH /api/v1/users/profile`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "avatar_url": "https://cdn.niklo.com/avatars/new.jpg",
  "preferred_language": "hi"
}
```
- **Response:** Updated Profile Object.

---

## 4. Immediate Backend Developer Checklist
1. Implement `PATCH /api/v1/users/profile` in `auth-service` / `user-service`.
2. Ensure JWT payload exposes `role` explicitly (`Car Driver`, `Bus Operator`, `Hotel Partner`).
3. Ensure proper error responses (401 for expired token, 400 for invalid phone numbers).
