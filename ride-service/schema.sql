-- Run on niklo_ride database

-- Snapshot driver details onto ride row at accept time
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS driver_name       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS driver_phone      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS driver_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_number    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS vehicle_model     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS vehicle_color     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vehicle_image_url TEXT,
  ADD COLUMN IF NOT EXISTS fare_final        NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS started_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at          TIMESTAMPTZ;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_rides_user_id_created ON rides (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides (status)
  WHERE status IN ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS');
