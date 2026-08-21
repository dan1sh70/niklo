# Niklo — Hotel Booking & Wishlist Module Production Backend Specification

> **Module Status Overview**:
> - ✅ **Frontend Hotel Flow**: **100% COMPLETED**. Hotel search, room type selection, quote calculation (`POST /api/v1/bookings/hotel/quote`), booking creation (`POST /api/v1/bookings/hotel`), payment confirmation, and booking history are fully integrated and verified.
> - ✅ **`payment-service` (Port `3007`)**: **100% COMPLETED**. Razorpay order creation and Webhooks are active.
> - ⚠️ **Database Image URLs**: Live database has stale `test.jpg` rows and dead CDN links (`cdn.niklo.com`). Run the SQL script below to update all hotels with real high-resolution Unsplash image URLs.
> - ⚠️ **`user-service` (Port `3004`)**: Wishlist API endpoints (`GET /api/v1/wishlist`, `POST /api/v1/wishlist/toggle`, `POST /api/v1/wishlist/sync`) specification provided in Section 4.

---

## 1. Quick SQL Update & Image Fix (Run in `hotel_db` PostgreSQL)

Run this SQL script to clean up dummy `test.jpg` rows and update all hotels with high-resolution image URLs, room types, and amenities:

```sql
-- 1. Clean up stale dummy test rows
DELETE FROM room_types WHERE hotel_id IN ('b5bffce6-0d50-4653-b362-525e75927af4', 'a474f254-bb4e-466f-93dd-5657e29aa6eb', '4a9ed0c8-e945-4516-8fbe-c82b7e8b0df4');
DELETE FROM hotel_reviews WHERE hotel_id IN ('b5bffce6-0d50-4653-b362-525e75927af4', 'a474f254-bb4e-466f-93dd-5657e29aa6eb', '4a9ed0c8-e945-4516-8fbe-c82b7e8b0df4');
DELETE FROM hotels WHERE id IN ('b5bffce6-0d50-4653-b362-525e75927af4', 'a474f254-bb4e-466f-93dd-5657e29aa6eb', '4a9ed0c8-e945-4516-8fbe-c82b7e8b0df4') OR image_url = 'test.jpg';

-- 2. Insert or Update Production Hotels
INSERT INTO hotels (
    id, title, stay_type, city, address, latitude, longitude,
    star_rating, user_rating, rating_text, reviews_count,
    price_per_night, original_price_per_night, discount_percent,
    badge_text, distance_text, free_breakfast, free_wifi, free_cancellation,
    is_hourly, is_trending, is_active, image_url, gallery_images,
    amenities, nearby_places, features, house_rules, description
) VALUES
(
    'htl_kolkata_001',
    'The Oberoi Grand Kolkata',
    'luxury',
    'Kolkata',
    '15 Jawaharlal Nehru Road, New Market, Kolkata, West Bengal 700013',
    22.5601,
    88.3518,
    5,
    4.90,
    'Exceptional',
    428,
    11500.00,
    14000.00,
    18,
    '5 Star Luxury',
    '500m from New Market',
    true,
    true,
    true,
    false,
    true,
    true,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop'
    ],
    '[{"icon": "spa", "name": "Luxury Wellness Spa"}, {"icon": "pool", "name": "Outdoor Swimming Pool"}, {"icon": "gym", "name": "24/7 Fitness Center"}, {"icon": "restaurant", "name": "Fine Dining Restaurant"}, {"icon": "wifi", "name": "High-Speed WiFi"}]'::jsonb,
    '[{"name": "Victoria Memorial", "distance": "2.1 km"}, {"name": "Howrah Railway Station", "distance": "4.5 km"}, {"name": "Park Street Metro Station", "distance": "400 m"}]'::jsonb,
    '[{"title": "Heritage Architecture", "description": "Colonial elegance with modern luxury."}, {"title": "City Center Location", "description": "Prime downtown location near shopping hubs."}]'::jsonb,
    ARRAY['Check-in: 2:00 PM', 'Check-out: 12:00 PM', 'Valid Government Photo ID required', 'Couples welcome'],
    'Fondly known as the Grande Dame of Chowringhee, The Oberoi Grand offers Victorian architecture, classic style, and award-winning dining in the heart of Kolkata.'
),
(
    'htl_goa_002',
    'Taj Exotica Resort & Spa Goa',
    'resort',
    'Goa',
    'Calwaddo, Benaulim, Salcete, Goa 403716',
    15.2472,
    73.9182,
    5,
    4.85,
    'Exceptional',
    612,
    18500.00,
    22000.00,
    16,
    'Beachfront Luxury',
    'Direct access to Benaulim Beach',
    true,
    true,
    true,
    false,
    true,
    true,
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop'
    ],
    '[{"icon": "pool", "name": "Infinity Beach Pool"}, {"icon": "spa", "name": "Jiva Ayurvedic Spa"}, {"icon": "beach", "name": "Private Beach Access"}, {"icon": "sports_tennis", "name": "Tennis & Golf Course"}]'::jsonb,
    '[{"name": "Benaulim Beach", "distance": "100 m"}, {"name": "Colva Beach", "distance": "3.5 km"}, {"name": "Goa Dabolim Airport", "distance": "27 km"}]'::jsonb,
    '[{"title": "56 Acres Lush Gardens", "description": "Mediterranean-style resort overlooking Arabian Sea."}]'::jsonb,
    ARRAY['Check-in: 3:00 PM', 'Check-out: 12:00 PM', 'Pets not allowed', 'Airport shuttle available'],
    'Embrace the languid and laid-back life that is so characteristic of Goa. Set in 56 acres of lush gardens along a private beach.'
),
(
    'htl_shimla_003',
    'Wildflower Hall, An Oberoi Resort',
    'mountain',
    'Shimla',
    'Chharabra, Shimla, Himachal Pradesh 171012',
    31.1214,
    77.2464,
    5,
    4.95,
    'Exceptional',
    340,
    26000.00,
    30000.00,
    13,
    'Himalayan Luxury',
    'Located at 8,250 feet amidst cedar forests',
    true,
    true,
    true,
    false,
    true,
    true,
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
    ARRAY[
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop'
    ],
    '[{"icon": "spa", "name": "Open-Air Heated Whirlpool"}, {"icon": "pool", "name": "Indoor Heated Pool"}, {"icon": "fireplace", "name": "Log Fireplace Lounges"}, {"icon": "terrain", "name": "Nature Walking Trails"}]'::jsonb,
    '[{"name": "Shimla Mall Road", "distance": "13 km"}, {"name": "Kufri Snow Point", "distance": "6 km"}, {"name": "Jakhoo Temple", "distance": "11 km"}]'::jsonb,
    '[{"title": "8,250 ft Himalayan Views", "description": "Former residence of Lord Kitchener in pine forests."}]'::jsonb,
    ARRAY['Check-in: 2:00 PM', 'Check-out: 12:00 PM', 'Heated rooms and blankets included'],
    'Situated at 8,250 feet above sea level in 23 acres of protected cedar forest, Wildflower Hall provides a unique opportunity to immerse yourself in the Himalayas.'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    stay_type = EXCLUDED.stay_type,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    star_rating = EXCLUDED.star_rating,
    user_rating = EXCLUDED.user_rating,
    rating_text = EXCLUDED.rating_text,
    reviews_count = EXCLUDED.reviews_count,
    price_per_night = EXCLUDED.price_per_night,
    original_price_per_night = EXCLUDED.original_price_per_night,
    discount_percent = EXCLUDED.discount_percent,
    badge_text = EXCLUDED.badge_text,
    distance_text = EXCLUDED.distance_text,
    image_url = EXCLUDED.image_url,
    gallery_images = EXCLUDED.gallery_images,
    amenities = EXCLUDED.amenities,
    nearby_places = EXCLUDED.nearby_places,
    features = EXCLUDED.features,
    house_rules = EXCLUDED.house_rules,
    description = EXCLUDED.description;

-- 3. Insert Room Types
INSERT INTO room_types (
    id, hotel_id, title, price_per_night, max_guests, max_adults, max_children,
    available_rooms_count, room_size_sqft, bed_type, meal_plan, amenities, images
) VALUES
(
    'rt_kolkata_deluxe',
    'htl_kolkata_001',
    'Deluxe Heritage Room',
    11500.00,
    2, 2, 1,
    8,
    375,
    'King Bed',
    'Free Buffet Breakfast',
    ARRAY['Free High Speed WiFi', 'Marble Bathroom with Tub', 'Pool View', '24h Room Service', 'Mini Bar'],
    ARRAY[
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop'
    ]
),
(
    'rt_kolkata_suite',
    'htl_kolkata_001',
    'Luxury Courtyard Suite',
    16500.00,
    3, 3, 1,
    3,
    650,
    'King Bed + Sofa Bed',
    'Free Breakfast & High Tea',
    ARRAY['Separate Living Area', 'Courtyard Garden View', 'Butler Service', 'Complimentary Airport Drop'],
    ARRAY[
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop'
    ]
),
(
    'rt_goa_villa',
    'htl_goa_002',
    'Sea View Villa Room',
    18500.00,
    3, 2, 2,
    5,
    550,
    'King Bed',
    'Free Breakfast & Airport Transfers',
    ARRAY['Private Balcony with Sea View', 'Soaking Bathtub', 'Direct Beach Walkway', 'Sunset View'],
    ARRAY[
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop'
    ]
),
(
    'rt_shimla_valley',
    'htl_shimla_003',
    'Premier Mountain Valley View Room',
    26000.00,
    2, 2, 1,
    4,
    450,
    'Four Poster King Bed',
    'Breakfast & High Tea Included',
    ARRAY['Himalayan Mountain View', 'Fireplace in Room', 'Burmese Teak Flooring', 'Heated Bathroom Floors'],
    ARRAY[
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price_per_night = EXCLUDED.price_per_night,
    max_guests = EXCLUDED.max_guests,
    room_size_sqft = EXCLUDED.room_size_sqft,
    bed_type = EXCLUDED.bed_type,
    meal_plan = EXCLUDED.meal_plan,
    amenities = EXCLUDED.amenities,
    images = EXCLUDED.images;
```

---

## 2. Image URLs Reference

### Hotel Hero & Gallery Photos:
- **The Oberoi Grand Kolkata**: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop`
- **Taj Exotica Goa**: `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop`
- **Wildflower Hall Shimla**: `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop`

### Room Type Photos:
- **Deluxe Room**: `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop`
- **Executive Suite**: `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop`
- **Luxury Villa / Balcony**: `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop`
- **Himalayan Mountain View**: `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop`

### Popular Destinations Photos:
- **Kolkata**: `https://images.unsplash.com/photo-1558431382-27e303142255?w=800&auto=format&fit=crop`
- **Goa**: `https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop`
- **Shimla / Manali**: `https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop`
- **Mumbai**: `https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop`
- **Delhi**: `https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop`

### Stay Types Photos:
- **Beach Resorts**: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop`
- **Hill Stations**: `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop`
- **Business Hotels**: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop`
- **Heritage & Palaces**: `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop`

---

## 3. Frontend & Backend Integration Status

| Component | Status | Endpoint / Mechanism |
|---|---|---|
| **Popular Destinations** | ✅ 100% Working | `GET /api/v1/hotels/popular-destinations` + client fallback |
| **Stay Types** | ✅ 100% Working | `GET /api/v1/hotels/stay-types` |
| **Trending Hotels** | ✅ 100% Working | `GET /api/v1/hotels/trending` |
| **Hotel Search** | ✅ 100% Working | `POST /api/v1/hotels/search` |
| **Hotel Details & Room Types** | ✅ 100% Working | `GET /api/v1/hotels/:id` |
| **Real Availability & Quote** | ✅ 100% Working | `POST /api/v1/hotels/:id/check-availability` & `POST /api/v1/bookings/hotel/quote` |
| **Room Reservation** | ✅ 100% Working | `POST /api/v1/bookings/hotel` |
| **Razorpay Payment** | ✅ 100% Working | `POST /api/v1/payment/orders` & `POST /api/v1/bookings/hotel/:id/confirm-payment` |
| **My Bookings / Trips** | ✅ 100% Working | `GET /api/v1/bookings/hotel/my-bookings` |
| **Wishlist Service** | ⚠️ Specification below | `GET/POST /api/v1/wishlist` (on `user-service`) |

---

## 4. Wishlist API Specification (for `user-service`)

### 4.1 Database Schema (`user_wishlist`)
```sql
CREATE TABLE IF NOT EXISTS user_wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'hotel', 'package', 'adventure', 'bus'
    item_id VARCHAR(100) NOT NULL,
    raw_data JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_wishlist_item UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wishlist_user ON user_wishlist(user_id);
```

### 4.2 Endpoints in `user-service`:
- `GET /api/v1/wishlist` — Fetch wishlisted items for authenticated user.
- `POST /api/v1/wishlist/toggle` — Toggle wishlist state (`{ item_type, item_id, raw_data }`).
- `POST /api/v1/wishlist/sync` — Bulk sync local items upon user login (`{ items: [...] }`).
