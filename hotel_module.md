# 🏨 Hotel Module — Backend API Documentation
> **For:** Backend Developer  
> **App:** Niklo Travel (Flutter)  
> **Purpose:** This document describes every screen in the Hotel Booking module, what data it needs, and the exact API contracts required to replace the current mock data.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Data Models](#2-core-data-models)
3. [Screen 1 — Hotel Home / Booking Search Screen](#3-screen-1--hotel-home--booking-search-screen)
4. [Screen 2 — Hotel Location Search Screen](#4-screen-2--hotel-location-search-screen)
5. [Screen 3 — Hotel List Screen](#5-screen-3--hotel-list-screen)
6. [Screen 4 — Hotel Details Screen](#6-screen-4--hotel-details-screen)
7. [Screen 5 — Room Details Screen](#7-screen-5--room-details-screen)
8. [Screen 6 — Hotel Reviews Screen](#8-screen-6--hotel-reviews-screen)
9. [Screen 7 — Hotel Photos Screen](#9-screen-7--hotel-photos-screen)
10. [Screen 8 — Hotel Rules Screen](#10-screen-8--hotel-rules-screen)
11. [Booking Flow — Payment Handoff](#11-booking-flow--payment-handoff)
12. [Filtering & Sorting Logic](#12-filtering--sorting-logic)
13. [Hourly Stay Feature](#13-hourly-stay-feature)
14. [Recent Searches](#14-recent-searches)
15. [Summary of All Required Endpoints](#15-summary-of-all-required-endpoints)

---

## 1. Architecture Overview

The app is built with **Flutter + Riverpod** (state management) and **GoRouter** (navigation). The backend needs to supply RESTful JSON APIs. The frontend currently uses **mock/static data** and needs to migrate to live API calls.

### Navigation Flow

```
HotelBookingScreen (Home)
  │
  ├──► HotelLocationSearchScreen   (location autocomplete)
  │
  └──► HotelListScreen             (search results)
         │
         └──► HotelDetailsScreen   (property detail)
                ├──► RoomDetailsScreen      (single room detail)
                ├──► HotelReviewsScreen     (all reviews)
                ├──► HotelPhotosScreen      (guest photos gallery)
                └──► HotelRulesScreen       (property rules)
                       │
                       └──► PaymentMethodsScreen (booking handoff)
```

### Search Parameters Object
This object is carried across all screens. It is set by the user in the Search Form and passed as query parameters or request body.

| Field | Type | Description |
|---|---|---|
| `location` | `string` | City / area / hotel name (e.g., `"Delhi"`) |
| `checkInDate` | `date` (ISO 8601) | Check-in date e.g., `"2025-12-25"` |
| `checkOutDate` | `date` (ISO 8601) | Check-out date e.g., `"2025-12-26"` |
| `rooms` | `int` | Number of rooms (1–10) |
| `adults` | `int` | Number of adults (1–20) |
| `children` | `int` | Number of children (0–10) |
| `childAges` | `int[]` | Ages of each child (0–17 years) |
| `isHourly` | `boolean` | `true` = hourly stay mode |
| `hourlyCheckInTime` | `string` | e.g., `"2 PM"` — only used when `isHourly = true` |

---

## 2. Core Data Models

### 2.1 HotelItem (Primary Hotel Object)

This is the central object used across List, Details, Reviews, Photos, Rules screens.

```json
{
  "id": "hotel_001",
  "hotelName": "The Lalit Great Eastern Kolkata",
  "badgeText": "Bestseller",
  "imagePath": "https://cdn.niklo.com/hotels/h_1.jpg",
  "galleryImages": [
    "https://cdn.niklo.com/hotels/h_1.jpg",
    "https://cdn.niklo.com/hotels/h_2.jpg",
    "https://cdn.niklo.com/hotels/h_3.jpg",
    "https://cdn.niklo.com/hotels/h_4.jpg"
  ],
  "distanceText": "1.2 km from city center",
  "ratingValue": 4.6,
  "ratingText": "Excellent",
  "reviewsCount": 1234,
  "freeBreakfast": true,
  "freeWifi": true,
  "freeCancellation": true,
  "priceText": "₹6,500",
  "priceInt": 6500,
  "description": "The Lalit Great Eastern Kolkata blends heritage charm with modern luxury...",
  "address": "1, 2, 3 Old Court House Street, Dalhousie Street, Kolkata",
  "latitude": 22.5694,
  "longitude": 88.3522,
  "popularAmenities": [
    { "name": "Free Wi-Fi", "icon": "wifi" },
    { "name": "Free Breakfast", "icon": "free_breakfast" },
    { "name": "Swimming Pool", "icon": "pool" },
    { "name": "Spa", "icon": "spa" },
    { "name": "Parking", "icon": "parking" },
    { "name": "Gym", "icon": "gym" }
  ],
  "nearbyPlaces": [
    { "name": "Victoria Memorial", "distance": "1.8 km", "imagePath": "https://cdn.niklo.com/places/victoria.jpg" },
    { "name": "Park Street", "distance": "2.2 km", "imagePath": "https://cdn.niklo.com/places/park_street.jpg" }
  ],
  "features": [
    {
      "title": "Excellent Location",
      "ratingText": "Guests rated the location 4.7/5",
      "description": "1.2 km from city center",
      "icon": "location_on"
    },
    {
      "title": "Great for Families",
      "ratingText": "Kid-friendly amenities and activities",
      "description": "Family rooms available",
      "icon": "people"
    }
  ]
}
```

> **Notes:**
> - `badgeText` is nullable — send `null` if no badge.
> - `icon` values are hint strings; the frontend maps them to Flutter Material Icons. Keep icon names aligned with Material Design icon names (snake_case).
> - `latitude` + `longitude` are required for the embedded Google Map mini-card on the Details screen.

### 2.2 RoomType Object

Used inside Hotel Details and Room Details screens.

```json
{
  "id": "room_triple_001",
  "title": "Triple Family Room with Smart TV",
  "guestCount": "3 guests",
  "size": "192 sq.ft",
  "imageCount": 9,
  "images": [
    "https://cdn.niklo.com/rooms/triple_1.jpg",
    "https://cdn.niklo.com/rooms/triple_2.jpg"
  ],
  "mealPlan": "Room Only",
  "mealPlanDesc": "No meals included",
  "price": 6500,
  "oldPrice": 14300,
  "taxes": "+₹92 taxes & service fees",
  "amenities": [
    { "icon": "local_drink", "label": "Mineral Water - additional charge" },
    { "icon": "bathroom", "label": "Bathroom" },
    { "icon": "ac_unit", "label": "Air Conditioning" }
  ],
  "cancellationPolicy": {
    "type": "non_refundable",
    "description": "This booking is not eligible for a refund",
    "table": [
      {
        "dateRange": "Before 18th June 11:59 PM",
        "penalty": "100% of booking amount"
      }
    ]
  },
  "inclusions": [
    "No meals included",
    "Early Check-In upto 2 hours (subject to availability)"
  ]
}
```

### 2.3 GuestReview Object

Used in Hotel Details (preview) and Hotel Reviews (full list) screens.

```json
{
  "id": "review_001",
  "title": "Excellent Stay",
  "reviewerName": "Saad Ansari",
  "date": "Dec 25, 2025",
  "rating": 5.0,
  "comment": "Very good hotel nearby New Delhi railway station...",
  "hasPropertyReply": true,
  "propertyReply": "Thank you for your wonderful feedback!"
}
```

### 2.4 PropertyRules Object

Used in Hotel Details (summary) and Hotel Rules (full screen).

```json
{
  "guestProfile": [
    "Unmarried couples allowed",
    "Primary guest should be at least 18 years of age",
    "Groups with only male guests are also allowed at the property"
  ],
  "guestProfileHourly": [
    "Unmarried couples are allowed in hourly stay rooms"
  ],
  "idProof": [
    "Passport, Aadhaar, Driving License and Govt. ID are accepted",
    "Local IDs are allowed"
  ],
  "smokingAlcohol": [
    "There are no restrictions on alcohol consumption.",
    "Smoking is allowed in designated areas only."
  ],
  "foodArrangement": [
    "Outside food is allowed at the property.",
    "Non veg food is allowed."
  ],
  "petsPolicy": [
    "Pets are not allowed."
  ],
  "infantPolicy": [
    "Infants under 2 years stay free when using existing beds."
  ],
  "childExtraBed": [
    "Children between 2-12 years require an extra bed at additional charge."
  ],
  "adultExtraBed": [
    "Adult extra bed is available upon request at additional charge."
  ]
}
```

### 2.5 RatingBreakdown Object

Used in Hotel Reviews screen.

```json
{
  "overall": 4.6,
  "label": "Excellent",
  "totalRatings": 1234,
  "breakdown": {
    "excellent": 0.80,
    "veryGood": 0.10,
    "average": 0.05,
    "poor": 0.03,
    "bad": 0.02
  }
}
```

---

## 3. Screen 1 — Hotel Home / Booking Search Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_booking_screen.dart`

### What the Screen Shows

This is the landing screen for hotel booking. It has two main sections:
1. **Blue Header Block** — App bar + Search Form (location, dates, guests) + Hourly toggle
2. **Dashboard Section (white)** — Popular Destinations, Stay Types, Benefits, Trending Hotels, Exclusive Offers Banner

### Sections & Required Data

#### 3.1 Popular Destinations

Horizontal scrollable list of destination cards with image + label.

```
GET /api/v1/hotels/popular-destinations
```

**Response:**
```json
{
  "destinations": [
    {
      "id": "dest_001",
      "name": "Delhi",
      "label": "Explore",
      "imagePath": "https://cdn.niklo.com/destinations/delhi.jpg"
    },
    {
      "id": "dest_002",
      "name": "Mumbai",
      "label": "Explore",
      "imagePath": "https://cdn.niklo.com/destinations/mumbai.jpg"
    }
  ]
}
```

#### 3.2 Browse by Stay Type (Travel Styles)

Grid of stay type cards (e.g., Beach, Hills, Business).

```
GET /api/v1/hotels/stay-types
```

**Response:**
```json
{
  "stayTypes": [
    {
      "id": "type_001",
      "label": "Beach",
      "imagePath": "https://cdn.niklo.com/stay_types/beach.jpg"
    },
    {
      "id": "type_002",
      "label": "Hill Station",
      "imagePath": "https://cdn.niklo.com/stay_types/hills.jpg"
    },
    {
      "id": "type_003",
      "label": "Business",
      "imagePath": "https://cdn.niklo.com/stay_types/business.jpg"
    }
  ]
}
```

#### 3.3 Trending Hotels Carousel

Horizontally scrollable hotel cards for homepage discovery.

```
GET /api/v1/hotels/trending?limit=10
```

**Response:** Array of `HotelItem` objects (see Section 2.1). Only the following fields are needed for the card:
- `id`, `hotelName`, `imagePath`, `ratingValue`, `priceInt`, `priceText`, `distanceText`

#### 3.4 Exclusive Offers Banner

Single promotional banner shown at the bottom of the home screen.

```
GET /api/v1/hotels/promotions/active
```

**Response:**
```json
{
  "offer": {
    "id": "promo_001",
    "title": "Exclusive Members Offer",
    "description": "Save up to 30% on select hotels this weekend!",
    "cta": "Grab Deal",
    "imagePath": "https://cdn.niklo.com/promos/exclusive_banner.jpg",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

### Search Form — No API Call Needed
The search form itself is a local UI widget. It collects:
- **Location** → opens `HotelLocationSearchScreen` (see Section 4)
- **Check-in / Check-out dates** → Flutter native date range picker
- **Rooms & Guests** → Flutter bottom sheet picker (rooms 1–10, adults 1–20, children 0–10)
- **Hourly toggle** → local boolean toggle + time slot selector (5 AM – 10 PM)

When the user taps **Search**, the collected params are stored in `HotelSearchParams` and the app navigates to `HotelListScreen`.

---

## 4. Screen 2 — Hotel Location Search Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_location_search_screen.dart`

### What the Screen Shows

A full-screen search overlay with:
1. **Search pill** — text input auto-focused on open
2. **"Near Me"** — uses device GPS to resolve location
3. **Recent Searches** — locally persisted (SharedPreferences), no API needed
4. **Popular Cities** — static list: `Bangalore, Mumbai, Delhi, Goa, Kolkata` *(currently hardcoded, can be made dynamic)*
5. **Live Suggestions** — autocomplete results as the user types

### Required API

#### 4.1 Location Autocomplete

```
GET /api/v1/location/autocomplete?q={query}&type=hotel
```

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `q` | `string` | User's typed query |
| `type` | `string` | `"hotel"` — to filter only hotel-relevant results |

**Response:**
```json
{
  "suggestions": [
    {
      "placeId": "place_001",
      "mainText": "Connaught Place",
      "secondaryText": "New Delhi, India"
    },
    {
      "placeId": "place_002",
      "mainText": "Karol Bagh",
      "secondaryText": "New Delhi, India"
    }
  ]
}
```

> **Notes:**
> - `mainText` is shown as the primary result label.
> - `secondaryText` is shown as the subtitle below it.
> - Debounce recommended: trigger search only after 300ms of no typing.
> - When a suggestion is tapped, the `mainText` value is returned to the search form as the location string.

#### 4.2 Popular Cities *(Optional — currently static)*

```
GET /api/v1/hotels/popular-cities
```

**Response:**
```json
{
  "cities": ["Bangalore", "Mumbai", "Delhi", "Goa", "Kolkata"]
}
```

---

## 5. Screen 3 — Hotel List Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_list_screen.dart`

### What the Screen Shows

The search results page. Includes:
1. **App Bar (HotelListHeader)** — shows search location + edit button
2. **Tab Bar** — "Full Night" vs "Hourly" tabs
3. **Filter Row** — Price, Rating, Amenity dropdowns + Clear button
4. **Hourly Time Selector** — horizontal scrollable time chip list (5 AM – 10 PM), only visible in Hourly mode
5. **"Showing properties in {location}"** — text label
6. **Hotel Cards** (`HotelSearchResultCard`) — full list of results
7. **"Book with Confidence" Banner** — shown at bottom of list

### Required API

#### 5.1 Search Hotels

```
POST /api/v1/hotels/search
```

**Request Body:**
```json
{
  "location": "Delhi",
  "checkInDate": "2025-12-25",
  "checkOutDate": "2025-12-26",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "childAges": [],
  "isHourly": false,
  "hourlyCheckInTime": null,
  "filters": {
    "priceFilter": "Low to High",
    "ratingFilter": "4 Star & above",
    "amenityFilter": "Free WiFi"
  },
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "totalResults": 42,
  "page": 1,
  "limit": 20,
  "hotels": [
    {
      "id": "hotel_001",
      "hotelName": "The Lalit Great Eastern Kolkata",
      "badgeText": "Bestseller",
      "imagePath": "https://cdn.niklo.com/hotels/h_1.jpg",
      "galleryImages": [
        "https://cdn.niklo.com/hotels/h_1.jpg",
        "https://cdn.niklo.com/hotels/h_2.jpg"
      ],
      "distanceText": "1.2 km from city center",
      "ratingValue": 4.6,
      "ratingText": "Excellent",
      "reviewsCount": 1234,
      "freeBreakfast": true,
      "freeWifi": true,
      "freeCancellation": true,
      "priceText": "₹6,500",
      "priceInt": 6500
    }
  ]
}
```

### HotelSearchResultCard — Fields Used

Each card in the list uses these fields from the hotel object:

| Field | Used For |
|---|---|
| `imagePath` | Fallback image |
| `galleryImages` | Swipeable image carousel (PageView) |
| `badgeText` | Top-left badge (e.g., "Bestseller"), nullable |
| `hotelName` | Hotel name title |
| `distanceText` | Distance label below hotel name |
| `ratingValue` | Amber rating badge (e.g., 4.6) |
| `ratingText` | Rating label (e.g., "Excellent") |
| `reviewsCount` | Number of ratings shown |
| `freeBreakfast` | Shows "Free Breakfast" badge if `true` |
| `priceInt` | Used for price calculations (discounts, tax) |
| `priceText` | Display price string |

### Card UI Behaviour (Frontend Logic — for your awareness)

- **Booking trend banner:** "110 bookings under 30 days" ← this is currently static text. Backend can supply this as `bookingTrend` string per hotel.
- **Flash deal countdown timer:** Currently fake (deterministic random based on hotel name hash). Backend can supply `flashDealEndsAt` (ISO datetime) to drive a real countdown.
- **Discount %:** Currently hardcoded at 54%. Backend should supply `discountPercent` and `originalPrice`.
- **Photo count:** Currently computed as `100 + hash % 200`. Backend should supply `guestPhotoCount`.
- **Locality label:** Currently one of `['Paharganj', 'Karol Bagh', 'Connaught Place', 'South Ext', 'Saket']` selected by hash. Backend should supply `locality` string.
- **Sentiment pill:** Derived from `ratingValue` on frontend. Backend can optionally supply `sentimentText`.

### Hourly Mode — Card Behaviour

When `isHourly = true` and the user has selected a check-in time (e.g., "2 PM"), each card shows **3 hourly duration boxes**: 3h, 6h, 9h.

Each box shows:
- Availability (is this duration slot available for this hotel?)
- Price for that duration
- Time range label (e.g., "2 PM – 5 PM")

**Backend should include in each hotel object when `isHourly = true`:**
```json
{
  "hourlyOptions": {
    "3h": { "available": true, "price": 975 },
    "6h": { "available": true, "price": 1625 },
    "9h": { "available": false, "price": null }
  }
}
```

> **Pricing logic currently on frontend (to move to backend):**
> - 3h price = `priceInt * 0.15`
> - 6h price = `priceInt * 0.25`  
> - 9h price = `priceInt * 0.35`

### Filters Reference

| Filter Type | Options |
|---|---|
| **Price** | `Under ₹2000`, `Above ₹2000`, `Low to High`, `High to Low` |
| **Rating** | `5 Star` (≥4.7), `4 Star & above` (≥4.0), `3 Star & above` (≥3.0) |
| **Amenity** | `Free WiFi`, `Breakfast Included`, `Swimming Pool`, `Gym` |

> Currently all filtering is done **client-side** on the mock data. Once real API is integrated, filtering should be handled **server-side** and passed as query params/body to the search endpoint.

---

## 6. Screen 4 — Hotel Details Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_details_screen.dart`

### What the Screen Shows

The most complex screen. Contains (in scroll order):
1. **Image Carousel** — full-width swipeable images
2. **Sticky Header** — fades in on scroll, shows hotel name + tabs (Room Types | Reviews & Ratings | Guest Photos | Location | Property Rules)
3. **Hotel Info Block** — city, name, rating, amenity chips, mini Google Map card
4. **About This Property** — description text
5. **Popular Amenities** — full grid of amenities
6. **Why Guests Love This Property** (Feature Highlights)
7. **Room Types** — horizontal scrollable room cards with Select/Selected button
8. **Reviews & Ratings** — preview of top reviews + "Read all reviews" button
9. **Guest Photos** — grid preview
10. **Location Section** — embedded Google Map + nearby places list
11. **Property Rules** — summary with "View all" button
12. **Sticky Bottom Bar** — price + "Book Now" CTA

### Required API

#### 6.1 Get Hotel Details

```
GET /api/v1/hotels/{hotelId}
```

**Response:** Full `HotelItem` object (see Section 2.1) with all nested data including:
- `popularAmenities[]`
- `nearbyPlaces[]`
- `features[]`
- `rules` (PropertyRules object — see Section 2.4)
- `roomTypes[]` (array of RoomType — see Section 2.2)
- `topReviews[]` (preview, 2–3 reviews — see Section 2.3)
- `ratingBreakdown` (see Section 2.5)

**Full Response Example:**
```json
{
  "id": "hotel_001",
  "hotelName": "The Lalit Great Eastern Kolkata",
  "badgeText": "Bestseller",
  "imagePath": "https://cdn.niklo.com/hotels/h_1.jpg",
  "galleryImages": ["..."],
  "distanceText": "1.2 km from city center",
  "ratingValue": 4.6,
  "ratingText": "Excellent",
  "reviewsCount": 1234,
  "freeBreakfast": true,
  "freeWifi": true,
  "freeCancellation": true,
  "priceText": "₹6,500",
  "priceInt": 6500,
  "description": "The Lalit Great Eastern Kolkata...",
  "address": "1, 2, 3 Old Court House Street, Dalhousie Street, Kolkata",
  "latitude": 22.5694,
  "longitude": 88.3522,
  "popularAmenities": [...],
  "nearbyPlaces": [...],
  "features": [...],
  "rules": {
    "guestProfile": ["Unmarried couples allowed", "..."],
    "guestProfileHourly": ["Unmarried couples are allowed in hourly stay rooms"],
    "idProof": ["..."],
    "smokingAlcohol": ["..."],
    "foodArrangement": ["..."],
    "petsPolicy": ["..."],
    "infantPolicy": ["..."],
    "childExtraBed": ["..."],
    "adultExtraBed": ["..."]
  },
  "roomTypes": [
    {
      "id": "room_triple_001",
      "title": "Triple Family Room with Smart TV",
      "guestCount": "3 guests",
      "size": "192 sq.ft",
      "imageCount": 9,
      "images": ["https://cdn.niklo.com/rooms/triple_1.jpg"],
      "mealPlan": "Room Only",
      "mealPlanDesc": "No meals included",
      "price": 6500,
      "oldPrice": 14300,
      "taxes": "+₹92 taxes & service fees",
      "amenities": [...],
      "cancellationPolicy": {
        "type": "non_refundable",
        "description": "This booking is not eligible for a refund",
        "table": [
          { "dateRange": "Before 18th June 11:59 PM", "penalty": "100% of booking amount" }
        ]
      },
      "inclusions": [
        "No meals included",
        "Early Check-In upto 2 hours (subject to availability)"
      ]
    }
  ],
  "topReviews": [...],
  "ratingBreakdown": {
    "overall": 4.6,
    "label": "Excellent",
    "totalRatings": 1234,
    "breakdown": {
      "excellent": 0.80,
      "veryGood": 0.10,
      "average": 0.05,
      "poor": 0.03,
      "bad": 0.02
    }
  },
  "guestPhotoCount": 131
}
```

### Sticky Navigation Tabs

The details screen has 5 anchor tabs that auto-highlight on scroll:

| Tab Index | Tab Label | Anchors To |
|---|---|---|
| 0 | Room Types | Room types section |
| 1 | Reviews & Ratings | Reviews section |
| 2 | Guest Photos | Photos grid |
| 3 | Location | Map + nearby places |
| 4 | Property Rules | Rules summary |

No API needed — this is pure scroll-position tracking on the frontend.

### Sticky Bottom Bar — Price Logic

| Room Selected | Multiplier |
|---|---|
| Room 0 (default, e.g., Triple) | `priceInt × 1.0` |
| Room 1 (e.g., Deluxe Double) | `priceInt × 1.4` |
| Room 2 (e.g., Executive Suite) | `priceInt × 2.2` |

For hourly stays:
| Duration | Multiplier |
|---|---|
| 3 hours | `roomPrice × 0.15` |
| 6 hours | `roomPrice × 0.25` |
| 9 hours | `roomPrice × 0.35` |

> These multipliers should ideally be replaced by backend-supplied per-room prices.

---

## 7. Screen 5 — Room Details Screen

**File:** `lib/features/hotel_booking/presentation/screens/room_details_screen.dart`

### What the Screen Shows

A full-screen detail view for a single room type. Accessed by tapping **"Details →"** button inside a room card on the Hotel Details screen.

**Content:**
- Room title + guest count
- Image carousel with dot indicators
- Room size (sq.ft)
- Amenities list
- "View All 9 Amenities" link
- Sticky bottom bar with price + "Proceed" button

### Data Passed from Hotel Details Screen

The room is passed as a `Map<String, dynamic>` (route `extra`). Fields required:

| Field | Type | Example |
|---|---|---|
| `title` | `string` | `"Triple Family Room with Smart TV"` |
| `guestCount` | `string` | `"3 guests"` |
| `size` | `string` | `"192 sq.ft"` |
| `image` | `string` (URL) | Hotel room image URL |
| `imageCount` | `int` | `9` |
| `mealPlan` | `string` | `"Room Only"` |
| `price` | `int` | `6500` |
| `oldPrice` | `int` | `14300` |
| `taxes` | `string` | `"+₹92 taxes & service fees"` |

### Room Amenities

Currently hardcoded to 3 amenities. Should come from `roomTypes[n].amenities[]` field in the hotel detail response:

```json
"amenities": [
  { "icon": "local_drink", "label": "Mineral Water - additional charge" },
  { "icon": "bathroom", "label": "Bathroom" },
  { "icon": "ac_unit", "label": "Air Conditioning" },
  { "icon": "tv", "label": "Smart TV" },
  { "icon": "wifi", "label": "Free Wi-Fi" }
]
```

> `"View All 9 Amenities"` — the number `9` should match `amenities.length`.

---

## 8. Screen 6 — Hotel Reviews Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_reviews_screen.dart`

### What the Screen Shows

A dedicated reviews page (opened via "Read all reviews" from Hotel Details).

**Content:**
- **App Bar Title:** `"{reviewsCount} reviews"` — uses `hotel.reviewsCount`
- **Score Header:** Two cards side by side —
  - Left: Overall score (`ratingValue`, `ratingText`, `reviewsCount`)
  - Right: Rating breakdown bars (Excellent, Very Good, Average, Poor, Bad — as percentages)
- **Sort by chips:** `Latest first`, `Helpful first`, `Positive first`
- **Review List:** Full list of guest reviews

### Required API

#### 8.1 Get Hotel Reviews (Paginated)

```
GET /api/v1/hotels/{hotelId}/reviews?sort={sortBy}&page={page}&limit={limit}
```

**Query Params:**
| Param | Type | Options |
|---|---|---|
| `sort` | `string` | `latest`, `helpful`, `positive` |
| `page` | `int` | Page number (default: 1) |
| `limit` | `int` | Results per page (default: 20) |

**Response:**
```json
{
  "hotelId": "hotel_001",
  "ratingBreakdown": {
    "overall": 4.6,
    "label": "Excellent",
    "totalRatings": 1234,
    "breakdown": {
      "excellent": 0.80,
      "veryGood": 0.10,
      "average": 0.05,
      "poor": 0.03,
      "bad": 0.02
    }
  },
  "totalReviews": 1234,
  "page": 1,
  "limit": 20,
  "reviews": [
    {
      "id": "review_001",
      "title": "Excellent Stay",
      "reviewerName": "Saad Ansari",
      "date": "Dec 25, 2025",
      "rating": 5.0,
      "comment": "Very good hotel nearby New Delhi railway station and metro station. All staff members friendly and helpful.",
      "hasPropertyReply": true,
      "propertyReply": "Thank you for choosing us, Saad!"
    },
    {
      "id": "review_002",
      "title": "Poor room.",
      "reviewerName": "Sheena Sharma",
      "date": "Dec 14, 2025",
      "rating": 1.0,
      "comment": "We didn't stay there b'coz room was so dirty...",
      "hasPropertyReply": false,
      "propertyReply": null
    }
  ]
}
```

### Review Card Colour Logic

The rating badge colour is determined on the frontend:
- `rating >= 4.0` → **Green** (`#22C784`)
- `rating < 4.0` → **Red** (`#E53935`)

---

## 9. Screen 7 — Hotel Photos Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_photos_screen.dart`

### What the Screen Shows

A 3-column grid of guest photos. Title: `"Guest Photos"`.

Currently, the app inflates the gallery images list to simulate 131 photos (`100 + hash % 200`). Backend should supply the real count and paginated URLs.

### Required API

#### 9.1 Get Hotel Guest Photos (Paginated)

```
GET /api/v1/hotels/{hotelId}/photos?page={page}&limit={limit}
```

**Response:**
```json
{
  "hotelId": "hotel_001",
  "totalPhotos": 131,
  "page": 1,
  "limit": 30,
  "photos": [
    "https://cdn.niklo.com/hotels/h_1/guest_photo_1.jpg",
    "https://cdn.niklo.com/hotels/h_1/guest_photo_2.jpg"
  ]
}
```

> Photos are rendered as square `1:1` aspect ratio images in a 3-column grid.

---

## 10. Screen 8 — Hotel Rules Screen

**File:** `lib/features/hotel_booking/presentation/screens/hotel_rules_screen.dart`

### What the Screen Shows

Full-screen, scrollable list of property rules with a **sticky horizontal tab bar** at the top. Tapping a tab scrolls the content to that section.

**Tab Sections (9 tabs):**

| Index | Tab Label | Rule Category |
|---|---|---|
| 0 | Guest Profile | General guest profile rules |
| 1 | Guest Profile (Hourly) | Rules specific to hourly stay |
| 2 | ID Proof | Accepted ID documents |
| 3 | Smoking/Alcohol | Policies on smoking & alcohol |
| 4 | Food Arrangement | Outside food & food type rules |
| 5 | Pets Policy | Whether pets are allowed |
| 6 | Infant Policy | Policy for children under 2 |
| 7 | Child Extra Bed | Policy for ages 2–12 |
| 8 | Adult Extra Bed | Policy for adults needing extra bed |

### Data Source

Rules are part of the `GET /api/v1/hotels/{hotelId}` response (see Section 6.1). No separate endpoint needed.

The `rules` object structure (see Section 2.4) maps to each tab:
- `guestProfile` → Tab 0
- `guestProfileHourly` → Tab 1
- `idProof` → Tab 2
- `smokingAlcohol` → Tab 3
- `foodArrangement` → Tab 4
- `petsPolicy` → Tab 5
- `infantPolicy` → Tab 6
- `childExtraBed` → Tab 7
- `adultExtraBed` → Tab 8

Each field is an **array of strings**, where each string is a bullet point.

---

## 11. Booking Flow — Payment Handoff

When the user taps **"Book Now"** on the Hotel Details bottom bar, the app navigates to `/payment-methods` and passes the following data as route `extra`:

```json
{
  "bookingType": "hotel",
  "amount": 6500,
  "title": "The Lalit Great Eastern Kolkata",
  "details": "1 Room • 2 Guests • 1 Night\nAddress: 1, 2, 3 Old Court House Street, Dalhousie Street, Kolkata"
}
```

For **hourly stays**:
```json
{
  "bookingType": "hotel",
  "amount": 975,
  "title": "The Lalit Great Eastern Kolkata",
  "details": "1 Room • 2 Guests • 3 Hours (2 PM - 5 PM)\nAddress: 1, 2, 3 Old Court House Street, Dalhousie Street, Kolkata"
}
```

### Required Booking API

```
POST /api/v1/bookings/hotel
```

**Request Body:**
```json
{
  "hotelId": "hotel_001",
  "roomTypeId": "room_triple_001",
  "checkInDate": "2025-12-25",
  "checkOutDate": "2025-12-26",
  "rooms": 1,
  "adults": 2,
  "children": 0,
  "childAges": [],
  "isHourly": false,
  "hourlyCheckInTime": null,
  "hourlyDurationHours": null,
  "totalAmount": 6500,
  "userId": "user_xyz"
}
```

**Response:**
```json
{
  "bookingId": "BKG20251225001",
  "status": "pending_payment",
  "amount": 6500,
  "currency": "INR",
  "paymentGatewayOrderId": "order_xyz123"
}
```

---

## 12. Filtering & Sorting Logic

Currently done **client-side**. Should be moved to **server-side** for performance.

### Price Filters

| Filter Value | Server-side Logic |
|---|---|
| `Under ₹2000` | `WHERE price < 2000` |
| `Above ₹2000` | `WHERE price >= 2000` |
| `Low to High` | `ORDER BY price ASC` |
| `High to Low` | `ORDER BY price DESC` |

### Rating Filters

| Filter Value | Server-side Logic |
|---|---|
| `5 Star` | `WHERE rating >= 4.7` |
| `4 Star & above` | `WHERE rating >= 4.0` |
| `3 Star & above` | `WHERE rating >= 3.0` |

### Amenity Filters

| Filter Value | Server-side Logic |
|---|---|
| `Free WiFi` | `WHERE freeWifi = true` |
| `Breakfast Included` | `WHERE freeBreakfast = true` |
| `Swimming Pool` | `WHERE amenities CONTAINS 'pool'` |
| `Gym` | `WHERE amenities CONTAINS 'gym'` |

### Destination Matching (Location Search)

When `isHourly = false`, results are filtered by:
- `address ILIKE '%{location}%'` OR `hotelName ILIKE '%{location}%'`

**Fallback:** If no results match, return all hotels (app currently shows full list as fallback).

---

## 13. Hourly Stay Feature

This is a key differentiator in the app. When the user toggles **"Hourly"** mode:

### Frontend Behaviour:
1. Tab bar switches to "Hourly" mode
2. A time chip selector appears (5 AM – 10 PM, 18 slots)
3. **Past time slots are disabled** (if check-in date is today, slots ≤ current hour are greyed out)
4. First available slot is auto-selected
5. Hotel cards show 3 hourly package boxes instead of standard amenity badges
6. The "Save 60%" shimmer badge appears on the Hourly tab

### Time Slots Available

```
5 AM, 6 AM, 7 AM, 8 AM, 9 AM, 10 AM, 11 AM, 12 PM,
1 PM, 2 PM, 3 PM, 4 PM, 5 PM, 6 PM, 7 PM, 8 PM, 9 PM, 10 PM
```

### Duration Packages Per Hotel

Each hotel card in hourly mode shows 3 boxes:
- **3h** — 80% of hotels have this available
- **6h** — 50% of hotels have this available  
- **9h** — 40% of hotels have this available

> Currently availability is determined by `hotelName.hashCode % 10`. Backend should supply real availability per hotel per time slot.

### Hourly Price Formula (Currently Frontend — move to backend):

```
hourlyPrice(duration) = (basePrice × factor).roundToNearest10
```
Where factor: `3h = 0.15`, `6h = 0.25`, `9h = 0.35`

### Hourly Time Range Label

`"2 PM"` + `3h` → displays as `"2 PM – 5 PM"`. Computed on frontend. Provide `checkInTime` + `durationHours` and let backend confirm the end time if needed.

---

## 14. Recent Searches

**File:** `lib/features/hotel_booking/presentation/providers/recent_searches_provider.dart`

Recent searches are currently stored **locally** using SharedPreferences (on the device). No backend API is required for this feature unless you want to sync across devices.

**Behaviour:**
- When a user selects a location, it is added to the front of the recent searches list.
- Displayed in the `HotelLocationSearchScreen` when the search box is empty.
- No de-duplication is explicitly shown in the code, but should ideally be implemented.

### Optional: Sync Recent Searches to Backend

```
POST /api/v1/users/{userId}/recent-searches
```
```json
{ "type": "hotel", "query": "Delhi" }
```

```
GET /api/v1/users/{userId}/recent-searches?type=hotel&limit=5
```

---

## 15. Summary of All Required Endpoints

| # | Method | Endpoint | Used In |
|---|---|---|---|
| 1 | `GET` | `/api/v1/hotels/popular-destinations` | Home Screen |
| 2 | `GET` | `/api/v1/hotels/stay-types` | Home Screen |
| 3 | `GET` | `/api/v1/hotels/trending?limit=10` | Home Screen |
| 4 | `GET` | `/api/v1/hotels/promotions/active` | Home Screen |
| 5 | `GET` | `/api/v1/location/autocomplete?q={query}&type=hotel` | Location Search Screen |
| 6 | `GET` | `/api/v1/hotels/popular-cities` | Location Search Screen *(optional)* |
| 7 | `POST` | `/api/v1/hotels/search` | Hotel List Screen |
| 8 | `GET` | `/api/v1/hotels/{hotelId}` | Hotel Details Screen |
| 9 | `GET` | `/api/v1/hotels/{hotelId}/reviews?sort=&page=&limit=` | Hotel Reviews Screen |
| 10 | `GET` | `/api/v1/hotels/{hotelId}/photos?page=&limit=` | Hotel Photos Screen |
| 11 | `POST` | `/api/v1/bookings/hotel` | Booking / Payment Screen |

---

## Additional Notes for Backend Developer

### Image URLs
All `imagePath` and `galleryImages` fields should be **full absolute CDN URLs** (e.g., `https://cdn.niklo.com/...`). The app currently uses local `assets/` paths — these will be replaced by network images once API is integrated.

### Pricing & Currency
- All prices are in **Indian Rupees (INR)**.
- `priceInt` must be an **integer** (no decimal).
- `priceText` should be formatted as `"₹6,500"` (with ₹ symbol and Indian number formatting with commas).
- Taxes are a separate string field: `"+₹92 taxes & service fees"`.

### Localization
The app supports multiple languages (Hindi, Bengali, Tamil, etc.) via a localization system. All text content from the API should be in **English** — the frontend handles translation via its own i18n system.

### Authentication
All protected endpoints should require a Bearer token:
```
Authorization: Bearer {jwt_token}
```

Public endpoints (search, suggestions, hotel details) may optionally be unauthenticated, but user-specific endpoints (bookings, recent searches) require auth.

### Error Responses
Use standard HTTP error codes:
```json
{
  "error": true,
  "code": "HOTEL_NOT_FOUND",
  "message": "Hotel with ID hotel_001 was not found.",
  "statusCode": 404
}
```

### Pagination
Use consistent pagination across all list endpoints:
```json
{
  "page": 1,
  "limit": 20,
  "totalResults": 100,
  "hasNextPage": true,
  "data": [...]
}
```

---

*Document generated from source code analysis of the Niklo Travel Flutter app — Hotel Booking Module.*  
*Last updated: June 2026*
