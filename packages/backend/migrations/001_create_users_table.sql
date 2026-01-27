-- Migration: Create users table
-- Description: Core user table for both vendors and buyers
-- Requirements: 9.1

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('vendor', 'buyer')),
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi',
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on phone_number for fast lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Create index on user_type for filtering vendors/buyers
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Create index on location for proximity-based searches
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_latitude, location_longitude);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Core user table storing both vendors and buyers with authentication and profile information';
COMMENT ON COLUMN users.phone_number IS 'Unique phone number used for OTP-based authentication';
COMMENT ON COLUMN users.user_type IS 'Distinguishes between vendor and buyer accounts';
COMMENT ON COLUMN users.preferred_language IS 'ISO 639-1 language code or custom code for regional dialects';
COMMENT ON COLUMN users.rating IS 'Average rating for vendors, NULL for buyers';
