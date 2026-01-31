-- Migration: Create payment tables
-- Description: Payment transaction tracking and refund processing with gateway integration
-- Requirements: 15.1, 15.2, 15.3, 15.4

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  method VARCHAR(50) NOT NULL CHECK (method IN ('upi', 'card', 'wallet', 'netbanking')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  gateway_reference VARCHAR(255),
  gateway_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment refunds
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  reason TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
  gateway_refund_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Create indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction ON payment_refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);

-- Add comments for documentation
COMMENT ON TABLE payment_transactions IS 'Payment transaction records with gateway integration';
COMMENT ON TABLE payment_refunds IS 'Refund processing for cancelled or returned orders';
COMMENT ON COLUMN payment_transactions.method IS 'Payment method: upi, card, wallet, netbanking';
COMMENT ON COLUMN payment_transactions.gateway_reference IS 'External payment gateway transaction ID';
COMMENT ON COLUMN payment_transactions.status IS 'Transaction status: pending, success, failed, refunded';
COMMENT ON COLUMN payment_refunds.gateway_refund_id IS 'External payment gateway refund ID';
