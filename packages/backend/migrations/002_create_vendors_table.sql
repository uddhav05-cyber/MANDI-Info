-- Migration: Create vendors table
-- Description: Extended vendor information for users with user_type='vendor'
-- Requirements: 9.4

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(200) NOT NULL,
  shop_name_translations JSONB,
  description TEXT,
  business_hours JSONB,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create index on user_id for fast vendor profile lookups
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);

-- Create index on verified status for filtering verified vendors
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified);

-- Add comment for documentation
COMMENT ON TABLE vendors IS 'Extended profile information for vendor users';
COMMENT ON COLUMN vendors.user_id IS 'Foreign key to users table, one-to-one relationship';
COMMENT ON COLUMN vendors.shop_name_translations IS 'JSON object with language codes as keys and translated shop names as values';
COMMENT ON COLUMN vendors.business_hours IS 'JSON object defining operating hours, e.g., {"monday": {"open": "09:00", "close": "18:00"}}';
COMMENT ON COLUMN vendors.verified IS 'Indicates if the vendor has been verified by platform administrators';
