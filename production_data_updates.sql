-- =====================================================================
-- NIKLO PRODUCTION DATA UPDATES
-- =====================================================================
-- Contains data updates for:
-- 1. Adventure Service (travel_adventures)
-- 2. Package Service (travel_packages)
-- 3. Hotel Service (hotels, room_types)
--
-- Instructions: Execute these scripts against your production PostgreSQL database.
-- =====================================================================

-- =====================================================================
-- 1. ADVENTURE SERVICE UPDATES
-- =====================================================================
\c niklo_adventure

-- 1. Paragliding in Bir Billing (Himachal Pradesh)
UPDATE travel_adventures SET
    category = 'Air Sports',
    city = 'Bir Billing',
    location = 'Bir Billing, Himachal Pradesh',
    image_url = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80'
    ],
    original_price = 4500.00,
    discount_percent = 22,
    meeting_point = 'Billing Take-off Site, Bir - 176077',
    latitude = 32.0520,
    longitude = 76.7230,
    is_trending = true
WHERE id = 'ad222222-2222-2222-2222-222222222222' OR title ILIKE '%Paragliding%';

-- 2. River Rafting at Kaliagong / Shivpuri (Rishikesh)
UPDATE travel_adventures SET
    category = 'Water Sports',
    city = 'Rishikesh',
    location = 'Rishikesh, Uttarakhand',
    image_url = 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80'
    ],
    original_price = 3200.00,
    discount_percent = 22,
    meeting_point = 'Shivpuri Rafting Base, Rishikesh - 249201',
    latitude = 30.0869,
    longitude = 78.2676,
    is_trending = true
WHERE id = '96cc9214-6a00-4928-9877-c7007aef5a21' OR title ILIKE '%Rafting%';

-- 3. Scuba Diving at Grande Island (Goa)
UPDATE travel_adventures SET
    category = 'Water Sports',
    city = 'Goa',
    location = 'Grande Island, Goa',
    image_url = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=800&q=80'
    ],
    original_price = 5500.00,
    discount_percent = 24,
    meeting_point = 'Malim Jetty, Panaji, Goa - 403001',
    latitude = 15.5011,
    longitude = 73.8244,
    is_trending = true
WHERE id = 'f74acd9a-c39f-4286-bb7e-91e600b46b4a' OR title ILIKE '%Scuba%';

-- 4. Kerala Tour & Backwaters Kayaking (Kerala)
UPDATE travel_adventures SET
    category = 'Nature Escapes',
    city = 'Alleppey',
    location = 'Alleppey, Kerala',
    image_url = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80'
    ],
    original_price = 28000.00,
    discount_percent = 11,
    meeting_point = 'Finishing Point Jetty, Alleppey - 688013',
    latitude = 9.4981,
    longitude = 76.3388,
    is_trending = true
WHERE id = '51898244-1d66-461c-9390-10c6e037b732' OR title ILIKE '%Kerala%';

-- =====================================================================
-- 2. PACKAGE SERVICE UPDATES
-- =====================================================================
\c niklo_package

-- 1. Kerala Tour
UPDATE travel_packages SET
    destination = 'Kerala',
    category = 'Nature Escapes',
    image_url = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop'
    ],
    duration = '5 Days / 4 Nights',
    is_trending = true
WHERE id = '36eb021b-2b06-4830-a46c-e0194d48a216' OR title ILIKE '%Kerala%';

-- 2. Goa Sunshine Tour
UPDATE travel_packages SET
    destination = 'Goa',
    category = 'Beach Escapes',
    image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop'
    ],
    duration = '5 Days / 4 Nights',
    is_trending = true
WHERE id = '5713beb6-6437-41f7-b9d0-5548b6bbcecc' OR title ILIKE '%Goa%';

-- 3. Himachal Snow Adventure
UPDATE travel_packages SET
    destination = 'Manali',
    category = 'Mountain Escapes',
    image_url = 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop',
    gallery_images = ARRAY[
        'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800&auto=format&fit=crop'
    ],
    duration = '4 Days / 3 Nights',
    is_trending = true
WHERE id = '63bf88e1-1a9b-40d5-8992-14c8312ed01f' OR title ILIKE '%Himachal%';

-- =====================================================================
-- 3. HOTEL SERVICE UPDATES
-- =====================================================================
\c niklo_hotel

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
