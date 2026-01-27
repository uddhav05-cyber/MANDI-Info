-- Migration: Create negotiations table
-- Description: Track price negotiation sessions between buyers and vendors
-- Requirements: 6.2, 6.3

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'accepted', 'rejected', 'expired')),
  initial_price DECIMAL(10, 2) NOT NULL CHECK (initial_price >= 0),
  final_price DECIMAL(10, 2) CHECK (final_price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on product_id for product-specific negotiations
CREATE INDEX IF NOT EXISTS idx_negotiations_product_id ON negotiations(product_id);

-- Create index on buyer_id for buyer's negotiation history
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_id ON negotiations(buyer_id);

-- Create index on vendor_id for vendor's negotiation management
CREATE INDEX IF NOT EXISTS idx_negotiations_vendor_id ON negotiations(vendor_id);

-- Create index on status for filtering active/completed negotiations
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);

-- Create composite index for buyer's active negotiations (common query)
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_status ON negotiations(buyer_id, status);

-- Create composite index for vendor's active negotiations (common query)
CREATE INDEX IF NOT EXISTS idx_negotiations_vendor_status ON negotiations(vendor_id, status);

-- Create index on expires_at for finding expired negotiations
CREATE INDEX IF NOT EXISTS idx_negotiations_expires_at ON negotiations(expires_at);

-- Add comment for documentation
COMMENT ON TABLE negotiations IS 'Price negotiation sessions between buyers and vendors';
COMMENT ON COLUMN negotiations.status IS 'Current state of negotiation: active (ongoing), accepted (deal made), rejected (declined), expired (timed out)';
COMMENT ON COLUMN negotiations.initial_price IS 'Starting price offered by vendor';
COMMENT ON COLUMN negotiations.final_price IS 'Agreed upon price (NULL if not yet accepted)';
COMMENT ON COLUMN negotiations.expires_at IS 'Timestamp when negotiation automatically expires (24 hours from creation)';
