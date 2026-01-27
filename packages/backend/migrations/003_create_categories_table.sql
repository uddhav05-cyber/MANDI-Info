-- Migration: Create categories table
-- Description: Product categories with multilingual support and hierarchical structure
-- Requirements: 10.1, 10.4

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_translations JSONB NOT NULL,
  icon VARCHAR(50),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Create index on name for search operations
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Add comment for documentation
COMMENT ON TABLE categories IS 'Product categories with support for hierarchical structure and multilingual names';
COMMENT ON COLUMN categories.name_translations IS 'JSON object with language codes as keys and translated category names as values';
COMMENT ON COLUMN categories.icon IS 'Icon identifier or emoji for visual representation';
COMMENT ON COLUMN categories.parent_id IS 'Self-referencing foreign key for hierarchical categories (NULL for top-level categories)';
