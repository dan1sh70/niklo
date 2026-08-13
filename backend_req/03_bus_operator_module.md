# Module 3: Bus Operator Module (Backend Requirements)

## 1. Overview
This document specifies backend requirements, API specifications, and gap analysis for the **Bus Operator** module in `niklo-partner`.

---

## 2. Component & Feature Status Analysis

| Feature / Screen | Frontend Status | Backend Status (`bus-service`) | Gap & Backend Action Required |
| :--- | :--- | :--- | :--- |
| **Operator Setup / Profile** | Integrated | `POST /api/v1/bus/operators`, `PATCH /api/v1/bus/operators/:id` | Handles operator registration (Name, GST number, Contact Info). |
| **Bus Fleet Management** | Integrated | `GET/POST/PATCH /api/v1/bus/buses` | Creates and updates bus metadata (Reg No, Bus Type, AC/Non-AC, Total Seats). |
| **Seat Layout Configurator** | Integrated | `POST /api/v1/bus/buses/:id/seats`, `GET /api/v1/bus/buses/:id/seats` | Configures seat layout (Seater/Sleeper, Deck, Row, Column, Seat Number). |
| **Route Management** | Integrated | `GET/POST/PATCH /api/v1/bus/routes` | Manages source/destination corridors, distance, and boarding/dropping points. |
| **Schedule Creation** | Integrated | `POST /api/v1/bus/schedules` | Creates scheduled trips linking Operator, Bus, and Route with pricing (base, window, upper fare). |
| **Seat Matrix / Availability** | Integrated | `GET /api/v1/bus/schedules/:id/seats` | Retrieves real-time seat lock & booking matrix for a schedule. |
| **Seat Lock / Override** | Integrated | `PATCH /api/v1/bus/schedules/:id` | Allows operators to manually block/unblock specific seat numbers. |
| **Bookings & Passenger Manifest**| Integrated | `GET /api/v1/bus/schedules/:id/bookings` | **Needs Extension:** Manifest export endpoint (`GET /api/v1/bus/schedules/:id/manifest.pdf`). |
| **Operator Earnings & Dashboard** | Integrated | Derived from schedule bookings | **New Endpoint Required:** Summary dashboard endpoint `GET /api/v1/bus/operators/:id/summary`. |

---

## 3. Data Schema & REST API Specifications

### 3.1 Operator Profile Setup
- **Endpoint:** `POST /api/v1/bus/operators`
- **Request Body:**
```json
{
  "name": "Royal Travels",
  "contact_phone": "+919876543210",
  "contact_email": "info@royaltravels.com",
  "gst_number": "29ABCDE1234F1Z5"
}
```

### 3.2 Add Bus to Fleet
- **Endpoint:** `POST /api/v1/bus/buses`
- **Request Body:**
```json
{
  "operator_id": "op_112233",
  "registration_number": "KA-01-F-9999",
  "bus_type": "AC Sleeper 2+1",
  "total_seats": 36,
  "amenities": ["WiFi", "Charging Point", "Water Bottle", "Blanket"]
}
```

### 3.3 Bulk Seat Layout Definition
- **Endpoint:** `POST /api/v1/bus/buses/:busId/seats`
- **Request Body:**
```json
{
  "seats": [
    {
      "seat_number": "L1",
      "deck": "LOWER",
      "row": 1,
      "column": 1,
      "seat_type": "SLEEPER",
      "is_window": true
    },
    {
      "seat_number": "L2",
      "deck": "LOWER",
      "row": 1,
      "column": 2,
      "seat_type": "SLEEPER",
      "is_window": false
    }
  ]
}
```

### 3.4 Create Trip Schedule
- **Endpoint:** `POST /api/v1/bus/schedules`
- **Request Body:**
```json
{
  "operator_id": "op_112233",
  "bus_id": "bus_445566",
  "source_city": "Bangalore",
  "destination_city": "Hyderabad",
  "departure_date": "2026-08-20",
  "operating_days": ["MON", "WED", "FRI"],
  "departure_time": "21:30",
  "arrival_time": "06:00",
  "base_fare": 850.00,
  "window_fare": 950.00,
  "upper_fare": 900.00,
  "available_seats": 36
}
```

### 3.5 Operator Summary Dashboard (NEW Required)
- **Endpoint:** `GET /api/v1/bus/operators/:id/summary`
- **Response:**
```json
{
  "total_buses": 12,
  "active_schedules_today": 8,
  "total_tickets_sold_today": 240,
  "total_earnings_today": 204000.00,
  "occupancy_rate_percent": 88.5
}
```

---

## 4. Summary of Backend Updates Needed for Bus Operator Module
1. Implement `GET /api/v1/bus/operators/:id/summary` for dashboard stats.
2. Implement PDF/CSV passenger manifest download endpoint `GET /api/v1/bus/schedules/:id/manifest`.
3. Support seat blocking/unblocking state per schedule in Postgres & Redis lock manager.
