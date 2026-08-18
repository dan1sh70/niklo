-- Database Schema Updates for Bookings & Offers
-- Apply this against the `niklo_booking` and `niklo_payment` databases if `synchronize: true` is not enabled.

-- 1. Updates to bookings table
ALTER TABLE bookings
ADD COLUMN has_insurance BOOLEAN DEFAULT false,
ADD COLUMN insurance_premium NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN insurance_policy_number VARCHAR(100),
ADD COLUMN insurance_partner VARCHAR(50) DEFAULT 'Digit / Acko',
ADD COLUMN has_gov_id_verification BOOLEAN DEFAULT false,
ADD COLUMN primary_gov_id_type VARCHAR(50),
ADD COLUMN primary_gov_id_number VARCHAR(100),
ADD COLUMN id_verification_status VARCHAR(30) DEFAULT 'UNVERIFIED';

-- 2. New table for Coupons/Offers
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('FLAT', 'PERCENTAGE')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),
    applicable_category VARCHAR(50) DEFAULT 'ALL',
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INT DEFAULT 1000,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Updates to Payment Status Enum (If using ENUMs natively)
-- ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'SUCCESS';
-- Note: 'COMPLETED' was renamed to 'SUCCESS' in TypeORM Entities.
