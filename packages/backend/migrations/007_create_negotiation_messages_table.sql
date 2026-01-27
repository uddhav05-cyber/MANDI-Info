-- Migration: Create negotiation_messages table
-- Description: Store messages and offers exchanged during negotiations
-- Requirements: 6.2, 6.4

CREATE TABLE IF NOT EXISTS negotiation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('buyer', 'vendor')),
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('offer', 'counter', 'accept', 'reject', 'message')),
  price DECIMAL(10, 2) CHECK (price >= 0),
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on negotiation_id for retrieving all messages in a negotiation
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_negotiation_id ON negotiation_messages(negotiation_id);

-- Create composite index on negotiation_id and created_at for chronological message retrieval
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_negotiation_time ON negotiation_messages(negotiation_id, created_at ASC);

-- Create index on sender_id for user's message history
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_sender_id ON negotiation_messages(sender_id);

-- Create index on message_type for filtering specific message types
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_type ON negotiation_messages(message_type);

-- Add comment for documentation
COMMENT ON TABLE negotiation_messages IS 'Messages and offers exchanged during price negotiations';
COMMENT ON COLUMN negotiation_messages.sender_type IS 'Type of user sending the message (buyer or vendor)';
COMMENT ON COLUMN negotiation_messages.message_type IS 'Type of message: offer (initial), counter (counter-offer), accept (agreement), reject (decline), message (text only)';
COMMENT ON COLUMN negotiation_messages.price IS 'Price value for offer/counter messages (NULL for text-only messages)';
COMMENT ON COLUMN negotiation_messages.text IS 'Optional text message accompanying the offer or standalone message';
