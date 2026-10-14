-- ParkCloud Initial Database Schema
-- Optimized for PostgreSQL with concurrency protection via btree_gist

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'EV', 'COMMERCIAL')),
    nickname VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_vehicle_reg UNIQUE (user_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON vehicles(registration_number);

-- 3. Parking Lots table
CREATE TABLE IF NOT EXISTS parking_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    description TEXT,
    operating_start_hour INT NOT NULL DEFAULT 6 CHECK (operating_start_hour >= 0 AND operating_start_hour <= 23),
    operating_end_hour INT NOT NULL DEFAULT 23 CHECK (operating_end_hour >= 0 AND operating_end_hour <= 23),
    -- Hourly rates in integer paise for each vehicle type
    rate_two_wheeler_paise INT NOT NULL DEFAULT 2000, -- ₹20/hr
    rate_three_wheeler_paise INT NOT NULL DEFAULT 3000, -- ₹30/hr
    rate_four_wheeler_paise INT NOT NULL DEFAULT 5000, -- ₹50/hr
    rate_ev_paise INT NOT NULL DEFAULT 4000, -- ₹40/hr
    rate_commercial_paise INT NOT NULL DEFAULT 8000, -- ₹80/hr
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Parking Slots table
CREATE TABLE IF NOT EXISTS parking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    slot_number VARCHAR(20) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'STANDARD' CHECK (category IN ('STANDARD', 'ACCESSIBLE', 'EV_CHARGING', 'TWO_WHEELER', 'RESERVED')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lot_slot_number UNIQUE (lot_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_slots_lot_id ON parking_slots(lot_id);

-- 5. Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(30) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE RESTRICT,
    slot_id UUID NOT NULL REFERENCES parking_slots(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
    estimated_fee_paise INT NOT NULL CHECK (estimated_fee_paise >= 0),
    base_fee_paise INT NOT NULL CHECK (base_fee_paise >= 0),
    gst_paise INT NOT NULL CHECK (gst_paise >= 0),
    actual_fee_paise INT CHECK (actual_fee_paise IS NULL OR actual_fee_paise >= 0),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_time_range CHECK (end_time > start_time),
    -- PostgreSQL btree_gist exclusion constraint preventing double booking for overlapping intervals on the same slot
    CONSTRAINT exclude_slot_time_overlap EXCLUDE USING gist (
        slot_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status IN ('CONFIRMED', 'ACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lot_id ON bookings(lot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_end ON bookings(start_time, end_time);

-- 6. Parking Sessions (Operational check-in / check-out records)
CREATE TABLE IF NOT EXISTS parking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMPTZ,
    checked_in_by UUID REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_booking_id ON parking_sessions(booking_id);

-- 7. Stored Files metadata table (S3 metadata)
CREATE TABLE IF NOT EXISTS stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES parking_lots(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_key VARCHAR(500) NOT NULL UNIQUE,
    s3_bucket VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('LOT_IMAGE', 'REPORT_CSV', 'REPORT_PDF', 'DOCUMENT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_lot_id ON stored_files(lot_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON stored_files(file_type);

-- 8. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
