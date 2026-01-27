# Database Migrations

This directory contains SQL migration scripts for the Multilingual Mandi database schema.

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. **000_enable_extensions.sql** - Enable required PostgreSQL extensions (pgcrypto, pg_trgm)
2. **001_create_users_table.sql** - Core user table for authentication and profiles
3. **002_create_vendors_table.sql** - Extended vendor information
4. **003_create_categories_table.sql** - Product categories with multilingual support
5. **004_create_products_table.sql** - Product catalog
6. **005_create_price_history_table.sql** - Historical price tracking
7. **006_create_negotiations_table.sql** - Price negotiation sessions
8. **007_create_negotiation_messages_table.sql** - Negotiation messages and offers
9. **008_create_ratings_table.sql** - Vendor ratings and reviews

## Running Migrations

### Using psql (PostgreSQL CLI)

Run all migrations in order:

```bash
# Set your database connection details
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=multilingual_mandi
export PGUSER=postgres
export PGPASSWORD=your_password

# Run migrations in order
for file in migrations/*.sql; do
  echo "Running migration: $file"
  psql -f "$file"
done
```

### Using Docker Compose

If using the Docker Compose setup:

```bash
# Start the database
docker-compose up -d postgres

# Run migrations
docker-compose exec postgres psql -U postgres -d multilingual_mandi -f /migrations/000_enable_extensions.sql
docker-compose exec postgres psql -U postgres -d multilingual_mandi -f /migrations/001_create_users_table.sql
# ... continue for all migrations
```

### Using Node.js Script

A migration runner script is provided:

```bash
cd packages/backend
npm run migrate
```

## Schema Overview

### Core Tables

- **users**: Authentication and user profiles (vendors and buyers)
- **vendors**: Extended vendor business information
- **categories**: Product categories with hierarchical structure
- **products**: Product catalog with multilingual names

### Transaction Tables

- **price_history**: Historical price data for trend analysis
- **negotiations**: Price negotiation sessions
- **negotiation_messages**: Messages exchanged during negotiations
- **ratings**: Vendor ratings and reviews

## Indexes

The migrations include indexes optimized for common query patterns:

- **Authentication**: `phone_number` for fast login lookups
- **Product Search**: `vendor_id`, `category_id`, `name` (with trigram), `price`
- **Price History**: `product_id`, `vendor_id`, `recorded_at` for time-series queries
- **Negotiations**: `buyer_id`, `vendor_id`, `status`, `expires_at` for active negotiation management
- **Ratings**: `vendor_id`, `rating` for calculating average ratings

## Data Types

- **UUID**: Primary keys using `gen_random_uuid()` for distributed systems
- **JSONB**: Multilingual translations and flexible data structures
- **DECIMAL(10,2)**: Prices with 2 decimal places
- **TIMESTAMP**: All timestamps with timezone support

## Constraints

- **Foreign Keys**: All relationships use `ON DELETE CASCADE` or `ON DELETE SET NULL`
- **Check Constraints**: Validate enum values, price ranges, rating ranges
- **Unique Constraints**: Prevent duplicate ratings, ensure unique phone numbers

## Requirements Mapping

Each migration file includes comments mapping to specific requirements from the requirements document:

- Requirements 9.x: User authentication and profiles
- Requirements 10.x: Product catalog management
- Requirements 12.x: Price transparency and history
- Requirements 6.x: Real-time price negotiation

## Rollback

To rollback migrations, drop tables in reverse order:

```sql
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS negotiation_messages CASCADE;
DROP TABLE IF EXISTS negotiations CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## Notes

- All tables use UUID primary keys for scalability
- JSONB columns store multilingual translations efficiently
- Indexes are optimized for read-heavy workloads typical of e-commerce
- Timestamps use `CURRENT_TIMESTAMP` for automatic tracking
- Comments are included on tables and columns for documentation
