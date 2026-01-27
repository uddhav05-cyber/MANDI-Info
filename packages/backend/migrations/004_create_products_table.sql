-- Migration: Create products table
-- Description: Core product catalog with multilingual support
-- Requirements: 10.1, 10.2, 10.3

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_translations JSONB NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity >= 0),
  image_url TEXT,
  qr_code TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on vendor_id for fast vendor product lookups
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);

-- Create index on category_id for category-based filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Create index on is_available for filtering available products
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);

-- Create composite index for vendor's available products (common query pattern)
CREATE INDEX IF NOT EXISTS idx_products_vendor_available ON products(vendor_id, is_available);

-- Create index on price for price range filtering
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Create index on name for text search (using trigram for fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Add comment for documentation
COMMENT ON TABLE products IS 'Product catalog with multilingual names and vendor association';
COMMENT ON COLUMN products.name_translations IS 'JSON object with language codes as keys and translated product names as values';
COMMENT ON COLUMN products.unit IS 'Unit of measurement (e.g., kg, piece, dozen, liter)';
COMMENT ON COLUMN products.qr_code IS 'Generated QR code data or URL for product identification';
COMMENT ON COLUMN products.is_available IS 'Indicates if product is currently in stock and available for sale';
