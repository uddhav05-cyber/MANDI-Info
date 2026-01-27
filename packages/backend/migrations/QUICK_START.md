# Database Migration Quick Start Guide

## Prerequisites

1. **PostgreSQL 14+** installed and running
2. **Node.js 18+** installed
3. **Environment variables** configured

## Setup Steps

### 1. Configure Environment Variables

Copy the example environment file:

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` and update database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multilingual_mandi
DB_USER=postgres
DB_PASSWORD=your_password
```

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

```sql
CREATE DATABASE multilingual_mandi;
\q
```

### 3. Run Migrations

Execute the migration script:

```bash
cd packages/backend
npm run migrate
```

Expected output:
```
✅ Database connection successful
📅 Server time: 2024-01-15 10:30:00

🚀 Starting database migrations...

Found 9 migration files:

📄 Running migration: 000_enable_extensions.sql
✅ Successfully executed: 000_enable_extensions.sql

📄 Running migration: 001_create_users_table.sql
✅ Successfully executed: 001_create_users_table.sql

... (continues for all migrations)

✨ All migrations completed successfully!
```

### 4. Verify Schema

Check that all tables were created:

```bash
psql -U postgres -d multilingual_mandi -c "\dt"
```

Expected output:
```
                List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | categories            | table | postgres
 public | negotiation_messages  | table | postgres
 public | negotiations          | table | postgres
 public | price_history         | table | postgres
 public | products              | table | postgres
 public | ratings               | table | postgres
 public | users                 | table | postgres
 public | vendors               | table | postgres
```

## Common Tasks

### View Table Structure

```bash
psql -U postgres -d multilingual_mandi -c "\d products"
```

### Check Indexes

```bash
psql -U postgres -d multilingual_mandi -c "\di"
```

### View Table Comments

```bash
psql -U postgres -d multilingual_mandi -c "\d+ users"
```

### Insert Sample Data

```sql
-- Create a test user
INSERT INTO users (phone_number, name, user_type, preferred_language)
VALUES ('+919876543210', 'Test Vendor', 'vendor', 'hi')
RETURNING id;

-- Create vendor profile (use the returned user_id)
INSERT INTO vendors (user_id, shop_name, shop_name_translations)
VALUES (
  'user-id-from-above',
  'Test Shop',
  '{"en": "Test Shop", "hi": "टेस्ट दुकान"}'::jsonb
)
RETURNING id;

-- Create a category
INSERT INTO categories (name, name_translations)
VALUES (
  'Vegetables',
  '{"en": "Vegetables", "hi": "सब्जियां", "bho": "तरकारी"}'::jsonb
)
RETURNING id;

-- Create a product (use vendor_id and category_id from above)
INSERT INTO products (
  vendor_id,
  category_id,
  name,
  name_translations,
  price,
  unit,
  quantity
)
VALUES (
  'vendor-id-from-above',
  'category-id-from-above',
  'Tomato',
  '{"en": "Tomato", "hi": "टमाटर", "bho": "टमाटर"}'::jsonb,
  40.00,
  'kg',
  100.00
);
```

## Troubleshooting

### Error: "database does not exist"

**Solution**: Create the database first:
```bash
psql -U postgres -c "CREATE DATABASE multilingual_mandi;"
```

### Error: "extension does not exist"

**Solution**: Install PostgreSQL contrib package:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-contrib

# macOS (Homebrew)
brew install postgresql
```

### Error: "permission denied"

**Solution**: Grant necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE multilingual_mandi TO your_user;
```

### Error: "connection refused"

**Solution**: Check PostgreSQL is running:
```bash
# Check status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Error: "relation already exists"

**Solution**: The migrations are idempotent (use `IF NOT EXISTS`), but if you need to start fresh:
```bash
npm run migrate:rollback
npm run migrate
```

## Rollback

To drop all tables and start over:

```bash
npm run migrate:rollback
```

**⚠️ WARNING**: This will delete all data!

## Docker Setup

If using Docker Compose:

### 1. Start Database

```bash
docker-compose up -d postgres
```

### 2. Run Migrations

```bash
docker-compose exec backend npm run migrate
```

### 3. Access Database

```bash
docker-compose exec postgres psql -U postgres -d multilingual_mandi
```

## Next Steps

After running migrations:

1. **Set up ORM**: Configure Prisma or TypeORM with the schema
2. **Create seed data**: Add sample categories and test users
3. **Run tests**: Verify database operations work correctly
4. **Set up backups**: Configure automated backup strategy

## Useful Commands

### Export Schema

```bash
pg_dump -U postgres -d multilingual_mandi --schema-only > schema.sql
```

### Export Data

```bash
pg_dump -U postgres -d multilingual_mandi --data-only > data.sql
```

### Backup Database

```bash
pg_dump -U postgres -d multilingual_mandi > backup.sql
```

### Restore Database

```bash
psql -U postgres -d multilingual_mandi < backup.sql
```

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('multilingual_mandi'));
```

### Check Table Sizes

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Schema Design Document](./SCHEMA_DESIGN.md)
- [Schema Diagram](./SCHEMA_DIAGRAM.md)
- [Migration README](./README.md)
