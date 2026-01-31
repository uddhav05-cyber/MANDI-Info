-- Migration: Create verification tables
-- Description: Vendor verification system with document validation and complaint tracking
-- Requirements: 15.1, 15.2, 15.3, 15.4

-- Vendor verification records
CREATE TABLE IF NOT EXISTS vendor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'verified', 'premium')),
  documents JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor complaints
CREATE TABLE IF NOT EXISTS vendor_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for verification queries
CREATE INDEX IF NOT EXISTS idx_vendor_verifications_vendor ON vendor_verifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_verifications_status ON vendor_verifications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_verifications_level ON vendor_verifications(level);
CREATE INDEX IF NOT EXISTS idx_vendor_complaints_vendor ON vendor_complaints(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_complaints_status ON vendor_complaints(status);
CREATE INDEX IF NOT EXISTS idx_vendor_complaints_created ON vendor_complaints(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE vendor_verifications IS 'Vendor verification levels and document validation';
COMMENT ON TABLE vendor_complaints IS 'Customer complaints against vendors for verification downgrade';
COMMENT ON COLUMN vendor_verifications.level IS 'Verification level: basic (default), verified, premium';
COMMENT ON COLUMN vendor_verifications.documents IS 'JSON array of document objects with type and file URL';
COMMENT ON COLUMN vendor_verifications.status IS 'Verification request status: pending, approved, rejected';
COMMENT ON COLUMN vendor_complaints.status IS 'Complaint status: open, resolved, dismissed';
