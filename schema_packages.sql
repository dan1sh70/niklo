CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Travel Packages Core Table
CREATE TABLE IF NOT EXISTS travel_packages (
    id VARCHAR(100) PRIMARY KEY, -- e.g., 'goa_beach_escape'
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Beach Escapes', 'Mountain Escapes', 'Honeymoon', 'Family Trips', 'Spiritual Journeys'
    destination VARCHAR(100) NOT NULL, -- 'Goa', 'Manali', 'Kashmir', 'Andaman', 'Kerala'
    start_city VARCHAR(100) NOT NULL DEFAULT 'Kolkata', -- Optional pickup/start point metadata
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.80,
    reviews_count INT NOT NULL DEFAULT 85,
    location_text VARCHAR(255) NOT NULL, -- 'North Goa, South Goa'
    snippet TEXT NOT NULL,
    description TEXT NOT NULL,
    duration VARCHAR(50) NOT NULL, -- '4 Days / 3 Nights'
    duration_days INT NOT NULL DEFAULT 4,
    duration_nights INT NOT NULL DEFAULT 3,
    group_size VARCHAR(50) NOT NULL DEFAULT '2-6 Travelers',
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) DEFAULT NULL,
    discount_percent INT NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL,
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_trending BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Search and filter indexes
CREATE INDEX IF NOT EXISTS idx_pkg_destination ON travel_packages(destination);
CREATE INDEX IF NOT EXISTS idx_pkg_location_text ON travel_packages(location_text);
CREATE INDEX IF NOT EXISTS idx_pkg_category ON travel_packages(category);
CREATE INDEX IF NOT EXISTS idx_pkg_price ON travel_packages(price);
CREATE INDEX IF NOT EXISTS idx_pkg_rating ON travel_packages(rating DESC);
CREATE INDEX IF NOT EXISTS idx_pkg_trending ON travel_packages(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_pkg_active ON travel_packages(is_active) WHERE is_active = true;
