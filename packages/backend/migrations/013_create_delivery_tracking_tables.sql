-- Migration: Create delivery tracking tables
-- Description: Real-time delivery tracking with GPS location and proof of delivery
-- Requirements: 15.1, 15.2, 15.3, 15.4

-- Delivery assignments
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  delivery_latitude DECIMAL(10,8) NOT NULL,
  delivery_longitude DECIMAL(11,8) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id)
);

-- Delivery location tracking
CREATE TABLE IF NOT EXISTS delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_person_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(6,2) NOT NULL CHECK (accuracy >= 0),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery proof (photo or signature)
CREATE TABLE IF NOT EXISTS delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_person_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_type VARCHAR(20) NOT NULL CHECK (proof_type IN ('photo', 'signature')),
  proof_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id)
);

-- Create indexes for delivery tracking queries
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_person ON delivery_assignments(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_person ON delivery_locations(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_recorded ON delivery_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_order ON delivery_proofs(order_id);

-- Add comments for documentation
COMMENT ON TABLE delivery_assignments IS 'Assignment of orders to delivery personnel with pickup and delivery locations';
COMMENT ON TABLE delivery_locations IS 'GPS location tracking for delivery personnel during delivery';
COMMENT ON TABLE delivery_proofs IS 'Proof of delivery with photo or digital signature';
COMMENT ON COLUMN delivery_locations.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN delivery_proofs.proof_type IS 'Type of proof: photo or signature';
COMMENT ON COLUMN delivery_proofs.proof_data IS 'Base64 encoded image or signature data';
