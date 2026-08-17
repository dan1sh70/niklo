-- Run on niklo_hotel database

-- Add new columns to room_types
ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS meal_plan           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS meal_plan_desc      TEXT,
  ADD COLUMN IF NOT EXISTS inclusions          JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cancellation_policy JSONB;

-- Add new columns to hotel_reviews
ALTER TABLE hotel_reviews
  ADD COLUMN IF NOT EXISTS reviewer_name  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS title          VARCHAR(200),
  ADD COLUMN IF NOT EXISTS property_reply TEXT;

-- Add new columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guests             TEXT,
  ADD COLUMN IF NOT EXISTS contactPhone       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contactEmail       VARCHAR(150),
  ADD COLUMN IF NOT EXISTS paymentMethod      VARCHAR(50) DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS paymentId          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cancellationReason TEXT;

-- Drop and re-seed the hotels to ensure valid Unsplash images (if you are wiping data)
-- TRUNCATE TABLE hotels CASCADE;
