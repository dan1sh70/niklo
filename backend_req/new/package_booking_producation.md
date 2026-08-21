# Travel Packages — Database Image URLs & Data Update

All package frontend logic and payment flows are **100% resolved and working**. 

To display high-resolution images in the app for the current live packages, run the SQL script below in the PostgreSQL database for `package-service`.

---

## 1. Quick SQL Update for Existing Live Packages

```sql
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
```

---

## 2. Image URLs Reference

### Destination Cover Images:
- **Goa**: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop`
- **Manali / Himachal**: `https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop`
- **Kerala**: `https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop`
- **Andaman**: `https://images.unsplash.com/photo-1586359716568-3e1907e4cf9f?w=800&auto=format&fit=crop`
- **Kashmir**: `https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop`
- **Gangtok / Darjeeling**: `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop`

### Category Artwork Images:
- **Beach Escapes**: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop`
- **Mountain Escapes**: `https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800&auto=format&fit=crop`
- **Nature Escapes / Family Trips**: `https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop`
- **Honeymoon**: `https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop`
- **Spiritual Journeys**: `https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&auto=format&fit=crop`
