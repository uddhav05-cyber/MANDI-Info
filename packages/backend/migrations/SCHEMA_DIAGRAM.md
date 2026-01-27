# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS TABLE                                     │
│─────────────────────────────────────────────────────────────────────────────│
│ PK  id                    UUID                                               │
│ UK  phone_number          VARCHAR(15)                                        │
│     name                  VARCHAR(100)                                       │
│     user_type             VARCHAR(10)  [vendor, buyer]                       │
│     preferred_language    VARCHAR(10)                                        │
│     location_latitude     DECIMAL(10,8)                                      │
│     location_longitude    DECIMAL(11,8)                                      │
│     location_address      TEXT                                               │
│     rating                DECIMAL(3,2)                                       │
│     created_at            TIMESTAMP                                          │
│     updated_at            TIMESTAMP                                          │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                    │
         │ 1:1                                │ 1:N
         ▼                                    ▼
┌──────────────────────────┐      ┌──────────────────────────────────────────┐
│    VENDORS TABLE         │      │         RATINGS TABLE                     │
│──────────────────────────│      │──────────────────────────────────────────│
│ PK  id           UUID    │      │ PK  id           UUID                    │
│ FK  user_id      UUID ───┘      │ FK  vendor_id    UUID ───┐               │
│     shop_name    VARCHAR │      │ FK  buyer_id     UUID    │               │
│     shop_name_   JSONB   │      │     rating       INTEGER │               │
│       translations       │      │     comment      TEXT    │               │
│     description  TEXT    │      │     created_at   TIMESTAMP               │
│     business_    JSONB   │      │     updated_at   TIMESTAMP               │
│       hours              │      │ UK  (vendor_id, buyer_id)                │
│     verified     BOOLEAN │      └──────────────────────────────────────────┘
│     created_at   TIMESTAMP      
└──────────────────────────┘
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTS TABLE                                      │
│──────────────────────────────────────────────────────────────────────────────│
│ PK  id                    UUID                                                │
│ FK  vendor_id             UUID                                                │
│ FK  category_id           UUID                                                │
│     name                  VARCHAR(200)                                        │
│     name_translations     JSONB                                               │
│     price                 DECIMAL(10,2)                                       │
│     unit                  VARCHAR(20)                                         │
│     quantity              DECIMAL(10,2)                                       │
│     image_url             TEXT                                                │
│     qr_code               TEXT                                                │
│     is_available          BOOLEAN                                             │
│     created_at            TIMESTAMP                                           │
│     updated_at            TIMESTAMP                                           │
└──────────────────────────────────────────────────────────────────────────────┘
         │                           │
         │ 1:N                       │ N:1
         ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────────────────────────┐
│  PRICE_HISTORY TABLE     │   │       CATEGORIES TABLE                        │
│──────────────────────────│   │──────────────────────────────────────────────│
│ PK  id          UUID     │   │ PK  id                UUID                   │
│ FK  product_id  UUID ────┘   │     name              VARCHAR(100)           │
│ FK  vendor_id   UUID         │     name_translations JSONB                  │
│     price       DECIMAL      │     icon              VARCHAR(50)            │
│     recorded_at TIMESTAMP    │ FK  parent_id         UUID (self-reference)  │
└──────────────────────────┘   │     created_at        TIMESTAMP              │
                               └──────────────────────────────────────────────┘
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         NEGOTIATIONS TABLE                                    │
│──────────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                      │
│ FK  product_id      UUID                                                      │
│ FK  buyer_id        UUID                                                      │
│ FK  vendor_id       UUID                                                      │
│     status          VARCHAR(20)  [active, accepted, rejected, expired]       │
│     initial_price   DECIMAL(10,2)                                             │
│     final_price     DECIMAL(10,2)                                             │
│     created_at      TIMESTAMP                                                 │
│     expires_at      TIMESTAMP                                                 │
│     updated_at      TIMESTAMP                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    NEGOTIATION_MESSAGES TABLE                                 │
│──────────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                      │
│ FK  negotiation_id  UUID                                                      │
│ FK  sender_id       UUID                                                      │
│     sender_type     VARCHAR(10)  [buyer, vendor]                             │
│     message_type    VARCHAR(20)  [offer, counter, accept, reject, message]   │
│     price           DECIMAL(10,2)                                             │
│     text            TEXT                                                      │
│     created_at      TIMESTAMP                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Relationship Summary

### One-to-One Relationships
- **users → vendors**: Each vendor has exactly one user account

### One-to-Many Relationships
- **users → ratings**: A buyer can rate multiple vendors
- **vendors → products**: A vendor can have multiple products
- **vendors → price_history**: A vendor can have multiple price records
- **vendors → negotiations**: A vendor can have multiple negotiations
- **products → price_history**: A product can have multiple price records
- **products → negotiations**: A product can be negotiated multiple times
- **negotiations → negotiation_messages**: A negotiation can have multiple messages
- **categories → categories**: Categories can have subcategories (hierarchical)
- **categories → products**: A category can contain multiple products

### Many-to-One Relationships
- **ratings → vendors**: Multiple ratings belong to one vendor
- **ratings → users**: Multiple ratings can be given by one buyer
- **products → vendors**: Multiple products belong to one vendor
- **products → categories**: Multiple products belong to one category
- **negotiations → products**: Multiple negotiations can be for one product
- **negotiations → users**: Multiple negotiations can involve one buyer
- **negotiations → vendors**: Multiple negotiations can involve one vendor

## Key Indexes

### Performance-Critical Indexes

```
users:
  - idx_users_phone_number (phone_number)
  - idx_users_user_type (user_type)
  - idx_users_location (location_latitude, location_longitude)

vendors:
  - idx_vendors_user_id (user_id)
  - idx_vendors_verified (verified)

products:
  - idx_products_vendor_id (vendor_id)
  - idx_products_category_id (category_id)
  - idx_products_is_available (is_available)
  - idx_products_vendor_available (vendor_id, is_available)
  - idx_products_price (price)
  - idx_products_name_trgm (name) [GIN trigram]

categories:
  - idx_categories_parent_id (parent_id)
  - idx_categories_name (name)

price_history:
  - idx_price_history_product_id (product_id)
  - idx_price_history_vendor_id (vendor_id)
  - idx_price_history_product_time (product_id, recorded_at DESC)
  - idx_price_history_vendor_time (vendor_id, recorded_at DESC)
  - idx_price_history_recorded_at (recorded_at)

negotiations:
  - idx_negotiations_product_id (product_id)
  - idx_negotiations_buyer_id (buyer_id)
  - idx_negotiations_vendor_id (vendor_id)
  - idx_negotiations_status (status)
  - idx_negotiations_buyer_status (buyer_id, status)
  - idx_negotiations_vendor_status (vendor_id, status)
  - idx_negotiations_expires_at (expires_at)

negotiation_messages:
  - idx_negotiation_messages_negotiation_id (negotiation_id)
  - idx_negotiation_messages_negotiation_time (negotiation_id, created_at ASC)
  - idx_negotiation_messages_sender_id (sender_id)
  - idx_negotiation_messages_type (message_type)

ratings:
  - idx_ratings_vendor_id (vendor_id)
  - idx_ratings_buyer_id (buyer_id)
  - idx_ratings_rating (rating)
  - idx_ratings_vendor_rating (vendor_id, rating)
  - idx_ratings_created_at (created_at DESC)
```

## Data Flow Examples

### Example 1: User Registration and Product Creation

```
1. INSERT INTO users (phone_number, name, user_type)
   → Returns user_id

2. INSERT INTO vendors (user_id, shop_name)
   → Returns vendor_id

3. INSERT INTO products (vendor_id, name, price, ...)
   → Returns product_id

4. INSERT INTO price_history (product_id, vendor_id, price)
   → Records initial price
```

### Example 2: Price Negotiation Flow

```
1. Buyer views product
   → SELECT * FROM products WHERE id = ?

2. Buyer initiates negotiation
   → INSERT INTO negotiations (product_id, buyer_id, vendor_id, initial_price)
   → Returns negotiation_id

3. Buyer sends counter-offer
   → INSERT INTO negotiation_messages (negotiation_id, sender_id, message_type='counter', price)

4. Vendor accepts
   → INSERT INTO negotiation_messages (negotiation_id, sender_id, message_type='accept')
   → UPDATE negotiations SET status='accepted', final_price=?

5. Price history updated
   → INSERT INTO price_history (product_id, vendor_id, price)
```

### Example 3: Product Search with Filters

```
1. Search by name (multilingual)
   → SELECT * FROM products 
     WHERE name ILIKE '%query%' 
     OR name_translations::text ILIKE '%query%'

2. Filter by category
   → JOIN categories ON products.category_id = categories.id

3. Filter by price range
   → WHERE price BETWEEN min_price AND max_price

4. Filter by vendor rating
   → JOIN vendors ON products.vendor_id = vendors.id
   → JOIN users ON vendors.user_id = users.id
   → WHERE users.rating >= min_rating

5. Sort by proximity
   → ORDER BY distance(user_location, vendor_location)
```

## Constraints Summary

### Primary Keys
- All tables use UUID primary keys

### Foreign Keys
- All foreign keys use CASCADE or SET NULL on delete
- Ensures referential integrity

### Unique Constraints
- users.phone_number (unique phone numbers)
- vendors.user_id (one vendor per user)
- ratings(vendor_id, buyer_id) (one rating per buyer-vendor pair)

### Check Constraints
- user_type IN ('vendor', 'buyer')
- price >= 0
- quantity >= 0
- rating >= 1 AND rating <= 5
- status IN ('active', 'accepted', 'rejected', 'expired')
- sender_type IN ('buyer', 'vendor')
- message_type IN ('offer', 'counter', 'accept', 'reject', 'message')

## Storage Estimates

### Estimated Row Sizes

```
users:              ~200 bytes per row
vendors:            ~300 bytes per row
products:           ~400 bytes per row
categories:         ~150 bytes per row
price_history:      ~100 bytes per row
negotiations:       ~150 bytes per row
negotiation_messages: ~200 bytes per row
ratings:            ~150 bytes per row
```

### Growth Projections (1 year, 10,000 active vendors)

```
users:              20,000 rows × 200 bytes = 4 MB
vendors:            10,000 rows × 300 bytes = 3 MB
products:           100,000 rows × 400 bytes = 40 MB
categories:         500 rows × 150 bytes = 75 KB
price_history:      1,000,000 rows × 100 bytes = 100 MB
negotiations:       50,000 rows × 150 bytes = 7.5 MB
negotiation_messages: 200,000 rows × 200 bytes = 40 MB
ratings:            30,000 rows × 150 bytes = 4.5 MB

Total Data:         ~200 MB
Total with Indexes: ~400 MB (estimated)
```

## Backup Strategy

### Full Backup
- Daily full backup using `pg_dump`
- Retention: 30 days

### Incremental Backup
- Continuous WAL archiving
- Point-in-time recovery capability

### Critical Tables (Priority Backup)
1. users
2. vendors
3. products
4. negotiations
5. ratings

### Archival Tables (Can be archived)
- price_history (older than 1 year)
- negotiation_messages (older than 90 days)
