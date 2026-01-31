-- Migration: Create review tables
-- Description: Product reviews and ratings with vendor responses and helpful votes
-- Requirements: 15.1, 15.2, 15.3, 15.4

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT CHECK (LENGTH(text) <= 1000),
  media JSONB,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, buyer_id)
);

-- Helpful votes on reviews
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, buyer_id)
);

-- Vendor responses to reviews
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id)
);

-- Create indexes for review queries
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer ON product_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_helpful ON product_reviews(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_buyer ON review_helpful_votes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_responses_review ON vendor_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_vendor_responses_vendor ON vendor_responses(vendor_id);

-- Add comments for documentation
COMMENT ON TABLE product_reviews IS 'Product reviews with ratings, text, and media attachments';
COMMENT ON TABLE review_helpful_votes IS 'Helpful votes on reviews to rank most useful reviews';
COMMENT ON TABLE vendor_responses IS 'Vendor responses to customer reviews';
COMMENT ON COLUMN product_reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN product_reviews.text IS 'Review text content, maximum 1000 characters';
COMMENT ON COLUMN product_reviews.media IS 'JSON array of media files (up to 5 photos or 1 video)';
COMMENT ON COLUMN product_reviews.verified_purchase IS 'True if buyer purchased the product';
COMMENT ON COLUMN review_helpful_votes.buyer_id IS 'Buyer who marked review as helpful (one vote per buyer per review)';
