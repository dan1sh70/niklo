CREATE TYPE bus_type_enum AS ENUM ('SEATER', 'SLEEPER', 'AC_SLEEPER', 'VOLVO_AC_MULTI_AXLE', 'LUXURY_NON_AC');

CREATE TABLE IF NOT EXISTS bus_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    contact_phone VARCHAR(20) NOT NULL,
    cancellation_policy TEXT DEFAULT '100% refund prior to 24 hrs, 50% prior to 12 hrs',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES bus_operators(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) NOT NULL,
    bus_type bus_type_enum DEFAULT 'AC_SLEEPER',
    total_seats INT DEFAULT 36,
    amenities JSONB DEFAULT '{"wifi": true, "water_bottle": true, "charging_point": true, "blanket": true}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    base_fare NUMERIC(10, 2) NOT NULL,
    available_seats INT DEFAULT 36,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    row_num INT NOT NULL,
    col_num INT NOT NULL,
    is_upper_deck BOOLEAN DEFAULT FALSE,
    seat_type VARCHAR(50) DEFAULT 'SLEEPER',
    price_offset NUMERIC(10, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS bus_boarding_dropping_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES bus_schedules(id) ON DELETE CASCADE,
    point_type VARCHAR(20) NOT NULL, -- 'BOARDING' or 'DROPPING'
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    time_offset VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 6) NULL,
    longitude NUMERIC(10, 6) NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bus_schedules_search ON bus_schedules(origin_city, destination_city, departure_date);
CREATE INDEX IF NOT EXISTS idx_bus_seats_bus ON bus_seats(bus_id);
