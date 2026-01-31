-- Migration: Create wishlist tables
-- Description: Buyer wishlist and favorites functionality with sharing capability
-- Requirements: 15.1, 15.2, 15.3, 15.4

-- Wishlist collections
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (LENGTH(TRIM(name)) > 0)
);

-- Wishlist items with price tracking
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_price DECIMAL(10,2) NOT NULL,
  UNIQUE(wishlist_id, product_id)
);

-- Shareable wishlist links
CREATE TABLE IF NOT EXISTS wishlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Create indexes for wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlists_buyer ON wishlists(buyer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_token ON wishlist_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_expires ON wishlist_shares(expires_at);

-- Add comments for documentation
COMMENT ON TABLE wishlists IS 'Buyer wishlist collections for saving products';
COMMENT ON TABLE wishlist_items IS 'Products saved in wishlists with original price for price drop tracking';
COMMENT ON TABLE wishlist_shares IS 'Shareable wishlist links with 30-day expiry';
COMMENT ON COLUMN wishlist_items.original_price IS 'Price when product was added to wishlist, used for price drop detection';
COMMENT ON COLUMN wishlist_shares.share_token IS 'Unique token for shareable wishlist URL';
