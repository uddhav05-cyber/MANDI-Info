-- Migration: Create price_history table
-- Description: Track historical price changes for products
-- Requirements: 12.1

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on product_id for product price history queries
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);

-- Create index on vendor_id for vendor-specific price history
CREATE INDEX IF NOT EXISTS idx_price_history_vendor_id ON price_history(vendor_id);

-- Create composite index on product_id and recorded_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_price_history_product_time ON price_history(product_id, recorded_at DESC);

-- Create composite index on vendor_id and recorded_at for vendor price trends
CREATE INDEX IF NOT EXISTS idx_price_history_vendor_time ON price_history(vendor_id, recorded_at DESC);

-- Create index on recorded_at for time-based filtering (e.g., last 30 days)
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);

-- Add comment for documentation
COMMENT ON TABLE price_history IS 'Historical record of product price changes for trend analysis and price discovery';
COMMENT ON COLUMN price_history.product_id IS 'Reference to the product whose price was recorded';
COMMENT ON COLUMN price_history.vendor_id IS 'Reference to the vendor who set this price';
COMMENT ON COLUMN price_history.recorded_at IS 'Timestamp when this price was recorded';
