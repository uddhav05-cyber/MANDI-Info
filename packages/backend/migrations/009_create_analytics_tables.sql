-- Migration: Create analytics tables
-- Description: Vendor analytics dashboard tables for sales trends, product metrics, and customer demographics
-- Requirements: 15.1, 15.2, 15.3, 15.4

-- Vendor analytics aggregated by time period
CREATE TABLE IF NOT EXISTS vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, period_type, period_start)
);

-- Product performance metrics
CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  inquiries INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id)
);

-- Customer demographics by vendor
CREATE TABLE IF NOT EXISTS customer_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region VARCHAR(100) NOT NULL,
  language VARCHAR(50) NOT NULL,
  buyer_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, region, language)
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_vendor ON vendor_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_period ON vendor_analytics(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_product_metrics_vendor ON product_metrics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_metrics_product ON product_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_demographics_vendor ON customer_demographics(vendor_id);

-- Add comments for documentation
COMMENT ON TABLE vendor_analytics IS 'Aggregated sales analytics by time period for vendor dashboard';
COMMENT ON TABLE product_metrics IS 'Product performance metrics including views, inquiries, and conversion rates';
COMMENT ON TABLE customer_demographics IS 'Customer distribution by region and language preference for each vendor';
COMMENT ON COLUMN vendor_analytics.period_type IS 'Time period granularity: daily, weekly, or monthly';
COMMENT ON COLUMN product_metrics.conversion_rate IS 'Calculated as (orders / inquiries) * 100';
