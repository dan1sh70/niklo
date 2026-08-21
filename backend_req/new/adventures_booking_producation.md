# Adventures / Experiences — Database Image URLs & Data Update

All adventure/experience frontend flows, categories, search, details, and payments are **100% resolved and working**.

To display high-resolution images and real categories for the live experiences in the database, run the SQL script below in the PostgreSQL database for `adventure-service`.

---

## 1. Quick SQL Update for Existing Live Adventures

```sql
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
```

---

## 2. Image URLs Reference

### Adventure Activities:
- **Paragliding (Bir Billing)**: `https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80`
- **River Rafting (Rishikesh)**: `https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80`
- **Scuba Diving (Goa)**: `https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80`
- **Kerala Kayaking & Nature**: `https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80`
- **Dune Bashing (Jaisalmer)**: `https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80`
- **Gulmarg Heli-Skiing**: `https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80`

### Adventure Category Badges:
- 🌊 **Water Sports**: `https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80`
- 🪂 **Air Sports**: `https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80`
- 🥾 **Trekking**: `https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=400&q=80`
- ⛺ **Camping**: `https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80`
- 🐅 **Wildlife**: `https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=400&q=80`
- 🌲 **Nature Escapes**: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80`

### Popular Destinations:
- **Goa**: `https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80`
- **Rishikesh**: `https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=400&q=80`
- **Bir Billing**: `https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80`
- **Kerala**: `https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80`

---

## 3. Verification cURL Commands

```bash
ADV_BASE="http://ra0qdnh3xfolrfu1y82bva9g.187.127.157.13.sslip.io"

# 1. Get All Adventures
curl -s "$ADV_BASE/api/v1/adventures" | python -m json.tool

# 2. Get Categories
curl -s "$ADV_BASE/api/v1/adventures/categories" | python -m json.tool
```
