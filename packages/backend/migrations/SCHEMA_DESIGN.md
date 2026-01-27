# Database Schema Design Documentation

## Overview

The Multilingual Mandi database schema is designed to support a multilingual e-commerce platform for Indian local markets (mandis). The schema prioritizes:

1. **Multilingual Support**: JSONB columns for translations
2. **Performance**: Strategic indexing for common query patterns
3. **Data Integrity**: Foreign key constraints and check constraints
4. **Scalability**: UUID primary keys for distributed systems
5. **Auditability**: Timestamp tracking on all tables

## Design Decisions

### 1. UUID Primary Keys

**Decision**: Use UUID (v4) for all primary keys instead of auto-incrementing integers.

**Rationale**:
- Enables distributed database systems without key conflicts
- Prevents enumeration attacks (security)
- Allows client-side ID generation for offline-first features
- No performance penalty with proper indexing

**Implementation**:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### 2. JSONB for Multilingual Content

**Decision**: Store translations in JSONB columns rather than separate translation tables.

**Rationale**:
- Simpler queries (no joins needed for translations)
- Better performance for read-heavy workloads
- Flexible schema for adding new languages
- PostgreSQL JSONB is indexed and queryable

**Example Structure**:
```json
{
  "en": "Tomato",
  "hi": "टमाटर",
  "bho": "टमाटर",
  "mr": "टोमॅटो"
}
```

**Trade-offs**:
- Slightly more storage space
- Requires application-level validation
- Less normalized (acceptable for translations)

### 3. Separate Users and Vendors Tables

**Decision**: Split user data into `users` (core) and `vendors` (extended) tables.

**Rationale**:
- Not all users are vendors (buyers don't need vendor fields)
- Cleaner separation of concerns
- Easier to add buyer-specific fields later
- One-to-one relationship with CASCADE delete

**Alternative Considered**: Single table with nullable vendor fields
**Why Rejected**: Would lead to many NULL values for buyers, harder to maintain

### 4. Price History as Separate Table

**Decision**: Track price changes in a dedicated `price_history` table.

**Rationale**:
- Enables trend analysis and price discovery AI
- Preserves historical data even if product is deleted
- Supports time-series queries efficiently
- Required for Requirements 12.1 (30-day price history)

**Performance Optimization**:
- Composite indexes on (product_id, recorded_at)
- Partitioning strategy for large datasets (future)

### 5. Negotiation Message Types

**Decision**: Use enum-like CHECK constraint for message types.

**Rationale**:
- Type safety at database level
- Clear semantics for different message purposes
- Enables filtering by message type
- Supports complex negotiation flows

**Message Types**:
- `offer`: Initial price offer
- `counter`: Counter-offer with new price
- `accept`: Accept current offer
- `reject`: Reject negotiation
- `message`: Text-only message

### 6. Indexing Strategy

**Decision**: Create indexes based on expected query patterns.

**Key Indexes**:

1. **Authentication Queries**:
   ```sql
   CREATE INDEX idx_users_phone_number ON users(phone_number);
   ```
   - Used for login lookups (high frequency)

2. **Product Search**:
   ```sql
   CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
   ```
   - Enables fuzzy text search with trigrams
   - Supports multilingual search

3. **Vendor Products**:
   ```sql
   CREATE INDEX idx_products_vendor_available ON products(vendor_id, is_available);
   ```
   - Composite index for common query: "show vendor's available products"

4. **Price History Queries**:
   ```sql
   CREATE INDEX idx_price_history_product_time ON price_history(product_id, recorded_at DESC);
   ```
   - Optimizes time-series queries for price trends

5. **Active Negotiations**:
   ```sql
   CREATE INDEX idx_negotiations_vendor_status ON negotiations(vendor_id, status);
   ```
   - Fast lookup of vendor's active negotiations

**Index Maintenance**:
- Monitor index usage with `pg_stat_user_indexes`
- Remove unused indexes to reduce write overhead
- Consider partial indexes for large tables

### 7. Cascade Delete Strategy

**Decision**: Use `ON DELETE CASCADE` for dependent data, `ON DELETE SET NULL` for optional references.

**Cascade Deletes**:
- User deleted → Vendor profile deleted
- Vendor deleted → Products deleted
- Product deleted → Price history deleted
- Negotiation deleted → Messages deleted

**Set NULL**:
- Category deleted → Products remain (category_id = NULL)

**Rationale**:
- Maintains referential integrity
- Prevents orphaned records
- Simplifies application logic
- Aligns with business rules (e.g., deleting user removes all their data)

### 8. Timestamp Tracking

**Decision**: Include `created_at` and `updated_at` on all mutable tables.

**Implementation**:
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Note**: `updated_at` requires trigger or application-level updates.

**Rationale**:
- Audit trail for debugging
- Enables time-based queries
- Supports data analytics
- Required for sync operations in offline mode

### 9. Decimal for Currency

**Decision**: Use `DECIMAL(10, 2)` for all price fields.

**Rationale**:
- Exact precision (no floating-point errors)
- Supports prices up to 99,999,999.99
- Standard for financial data
- Consistent across all price-related tables

**Alternative Considered**: Store as integer (cents)
**Why Rejected**: Less readable, requires conversion in queries

### 10. Check Constraints for Data Validation

**Decision**: Enforce business rules at database level with CHECK constraints.

**Examples**:
```sql
-- Ensure valid user types
CHECK (user_type IN ('vendor', 'buyer'))

-- Ensure positive prices
CHECK (price >= 0)

-- Ensure valid ratings
CHECK (rating >= 1 AND rating <= 5)

-- Ensure valid negotiation status
CHECK (status IN ('active', 'accepted', 'rejected', 'expired'))
```

**Rationale**:
- Data integrity at the lowest level
- Prevents invalid data even if application has bugs
- Self-documenting schema
- Consistent validation across all clients

## Query Patterns and Optimization

### Common Query 1: Get Vendor's Available Products

```sql
SELECT * FROM products 
WHERE vendor_id = $1 AND is_available = true
ORDER BY created_at DESC;
```

**Optimization**: Composite index `idx_products_vendor_available`

### Common Query 2: Search Products by Name (Multilingual)

```sql
SELECT * FROM products 
WHERE name ILIKE '%tomato%' 
   OR name_translations::text ILIKE '%टमाटर%'
ORDER BY similarity(name, 'tomato') DESC;
```

**Optimization**: Trigram index `idx_products_name_trgm`

### Common Query 3: Get Price History for Last 30 Days

```sql
SELECT * FROM price_history 
WHERE product_id = $1 
  AND recorded_at >= NOW() - INTERVAL '30 days'
ORDER BY recorded_at DESC;
```

**Optimization**: Composite index `idx_price_history_product_time`

### Common Query 4: Calculate Average Vendor Rating

```sql
SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
FROM ratings 
WHERE vendor_id = $1;
```

**Optimization**: Composite index `idx_ratings_vendor_rating`

### Common Query 5: Get Active Negotiations for Vendor

```sql
SELECT n.*, p.name as product_name, u.name as buyer_name
FROM negotiations n
JOIN products p ON n.product_id = p.id
JOIN users u ON n.buyer_id = u.id
WHERE n.vendor_id = $1 AND n.status = 'active'
ORDER BY n.created_at DESC;
```

**Optimization**: Composite index `idx_negotiations_vendor_status`

## Scalability Considerations

### Horizontal Scaling

1. **Read Replicas**: Use PostgreSQL streaming replication for read-heavy workloads
2. **Connection Pooling**: Use PgBouncer to manage database connections
3. **Caching Layer**: Redis for frequently accessed data (product details, vendor profiles)

### Vertical Scaling

1. **Table Partitioning**: Partition `price_history` by date for better query performance
2. **Index-Only Scans**: Ensure indexes cover common queries
3. **Materialized Views**: Pre-compute expensive aggregations (e.g., vendor ratings)

### Data Archival

1. **Price History**: Archive data older than 1 year to separate table
2. **Negotiations**: Archive completed negotiations after 90 days
3. **Ratings**: Keep all ratings (relatively small dataset)

## Security Considerations

### SQL Injection Prevention

- Use parameterized queries exclusively
- Never concatenate user input into SQL
- Validate input at application level

### Data Privacy

- Hash sensitive data (passwords) before storage
- Encrypt PII at rest (phone numbers, addresses)
- Implement row-level security for multi-tenant scenarios

### Access Control

- Use separate database users for different services
- Grant minimum required privileges
- Audit database access logs

## Maintenance Tasks

### Regular Maintenance

1. **Vacuum**: Run `VACUUM ANALYZE` weekly to reclaim space and update statistics
2. **Reindex**: Rebuild indexes monthly to prevent bloat
3. **Backup**: Daily full backups, continuous WAL archiving
4. **Monitor**: Track slow queries, index usage, table sizes

### Performance Monitoring

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

## Future Enhancements

### Potential Schema Changes

1. **Full-Text Search**: Add `tsvector` columns for better search performance
2. **Geospatial Queries**: Use PostGIS for location-based features
3. **Time-Series Optimization**: Use TimescaleDB extension for price_history
4. **Audit Logging**: Add trigger-based audit tables for compliance
5. **Soft Deletes**: Add `deleted_at` column for recoverable deletions

### New Tables (Future)

1. **transactions**: Record completed sales
2. **notifications**: Store user notifications
3. **favorites**: User-saved products
4. **product_images**: Multiple images per product
5. **vendor_followers**: Social features

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
