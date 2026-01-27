-- Migration: Enable PostgreSQL extensions
-- Description: Enable required extensions for the application
-- Requirements: All

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable trigram similarity for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Add comment for documentation
COMMENT ON EXTENSION pgcrypto IS 'Provides cryptographic functions including UUID generation';
COMMENT ON EXTENSION pg_trgm IS 'Provides trigram-based text similarity and fuzzy matching for search';
