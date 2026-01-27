-- Migration: Create ratings table
-- Description: Store buyer ratings and reviews for vendors
-- Requirements: 9.5

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, buyer_id)
);

-- Create index on vendor_id for retrieving all ratings for a vendor
CREATE INDEX IF NOT EXISTS idx_ratings_vendor_id ON ratings(vendor_id);

-- Create index on buyer_id for buyer's rating history
CREATE INDEX IF NOT EXISTS idx_ratings_buyer_id ON ratings(buyer_id);

-- Create index on rating value for filtering by rating level
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);

-- Create composite index on vendor_id and rating for calculating average ratings
CREATE INDEX IF NOT EXISTS idx_ratings_vendor_rating ON ratings(vendor_id, rating);

-- Create index on created_at for time-based queries (e.g., recent ratings)
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE ratings IS 'Buyer ratings and reviews for vendors';
COMMENT ON COLUMN ratings.rating IS 'Rating value from 1 (worst) to 5 (best)';
COMMENT ON COLUMN ratings.comment IS 'Optional text review from the buyer';
COMMENT ON CONSTRAINT ratings_vendor_id_buyer_id_key ON ratings IS 'Ensures each buyer can only rate a vendor once';
