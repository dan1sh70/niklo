-- Schema needed by the bus booking flow, written by hand and idempotent.
--
-- You should not normally need this: both bus-service and booking-service run
-- TypeORM with `synchronize` on (`DB_SYNCHRONIZE !== 'false'`), so these
-- objects are created automatically on boot. Keep it for the day you turn
-- synchronize off, or to repair a database where it was off during a deploy.
--
-- Run each block against ITS OWN database -- the two services do not share one.

-- ===========================================================================
-- booking-service database  (compose: DB_NAME=postgres, user `postgres`)
--   psql -U postgres -d postgres -f schema-bus-booking.sql
-- ===========================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_email varchar(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone varchar(20);

-- ===========================================================================
-- bus-service database  (compose: DB_NAME=niklo_bus, user `niklo_bus`)
--   psql -U niklo_bus -d niklo_bus -f schema-bus-booking.sql
-- Run ONLY this section there; the block above belongs to the other database.
-- ===========================================================================

-- Links an operator profile to the auth user who owns it. Without it the
-- passenger-manifest ownership check can never pass.
ALTER TABLE operators ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON operators (user_id);

-- Per-schedule seat state. `seat_layouts` describes the physical seats of a
-- bus and is shared by every trip that bus runs, so availability cannot live
-- there -- one booking would mark the seat sold on every date.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_seats_status_enum') THEN
    CREATE TYPE schedule_seats_status_enum AS ENUM ('BOOKED', 'RELEASED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS schedule_seats (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id   uuid NOT NULL REFERENCES schedules (id) ON DELETE CASCADE,
  seat_number   varchar(10) NOT NULL,
  status        schedule_seats_status_enum NOT NULL DEFAULT 'BOOKED',
  booking_id    uuid,
  user_id       uuid,
  booked_gender varchar(1),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- This is what actually prevents overselling: two concurrent checkouts for the
-- same seat cannot both commit.
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_schedule_seat"
  ON schedule_seats (schedule_id, seat_number);

CREATE INDEX IF NOT EXISTS idx_schedule_seats_schedule
  ON schedule_seats (schedule_id);
