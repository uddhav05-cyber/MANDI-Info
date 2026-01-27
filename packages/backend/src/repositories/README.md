# Repository Pattern Implementation

This directory contains the repository pattern implementation for the Multilingual Mandi backend. The repository pattern provides a clean abstraction layer between the application logic and data access, making the codebase more maintainable and testable.

## Architecture

### Base Repository

The `BaseRepository` class provides common CRUD operations that all repositories inherit:

- `findById(id)` - Find a record by ID
- `findAll(limit?, offset?)` - Find all records with pagination
- `deleteById(id)` - Delete a record by ID
- `count()` - Count total records
- `exists(id)` - Check if a record exists

### Specific Repositories

Each entity has its own repository with specialized methods:

#### UserRepository
- `create(input)` - Create a new user
- `update(id, input)` - Update user information
- `findByPhoneNumber(phoneNumber)` - Find user by phone number (for authentication)
- `findByType(userType, limit?, offset?)` - Find users by type (vendor/buyer)
- `findNearby(lat, lng, radiusKm, limit?)` - Find users within geographic radius
- `updateRating(id, rating)` - Update user rating

#### VendorRepository
- `create(input)` - Create a new vendor profile
- `update(id, input)` - Update vendor information
- `findByUserId(userId)` - Find vendor by user ID
- `findVerified(limit?, offset?)` - Find verified vendors
- `searchByShopName(searchTerm, limit?)` - Search vendors by shop name

#### ProductRepository
- `create(input)` - Create a new product
- `update(id, input)` - Update product information
- `findByVendorId(vendorId, limit?, offset?)` - Find products by vendor
- `findByCategoryId(categoryId, limit?, offset?)` - Find products by category
- `findAvailable(limit?, offset?)` - Find available products
- `searchByName(searchTerm, limit?)` - Search products by name
- `findByPriceRange(minPrice, maxPrice, limit?)` - Find products in price range
- `updateAvailability(id, isAvailable)` - Update product availability
- `bulkCreate(inputs)` - Bulk create products (for CSV upload)

#### CategoryRepository
- `create(input)` - Create a new category
- `update(id, input)` - Update category information
- `findTopLevel()` - Find top-level categories (no parent)
- `findByParentId(parentId)` - Find subcategories
- `searchByName(searchTerm, limit?)` - Search categories by name

#### PriceHistoryRepository
- `create(input)` - Record a price change
- `findByProductId(productId, limit?)` - Find price history for a product
- `findByVendorId(vendorId, limit?)` - Find price history for a vendor
- `findByDateRange(productId, startDate, endDate)` - Find price history in date range
- `getLatestPrice(productId)` - Get latest price for a product
- `getAveragePrice(productId, days)` - Get average price over time period
- `deleteOlderThan(days)` - Clean up old price history

#### NegotiationRepository
- `create(input)` - Create a new negotiation
- `update(id, input)` - Update negotiation status
- `findByBuyerId(buyerId, status?, limit?)` - Find buyer's negotiations
- `findByVendorId(vendorId, status?, limit?)` - Find vendor's negotiations
- `findByProductId(productId, limit?)` - Find negotiations for a product
- `findActive(limit?)` - Find active negotiations
- `findExpired()` - Find expired negotiations
- `markExpired()` - Mark expired negotiations as expired
- `accept(id, finalPrice)` - Accept a negotiation
- `reject(id)` - Reject a negotiation

#### NegotiationMessageRepository
- `create(input)` - Create a new message
- `findByNegotiationId(negotiationId, limit?)` - Find messages in a negotiation
- `findBySenderId(senderId, limit?)` - Find messages by sender
- `getLatestMessage(negotiationId)` - Get latest message in negotiation
- `countByNegotiationId(negotiationId)` - Count messages in negotiation
- `findOffers(negotiationId)` - Find offer/counter-offer messages

#### RatingRepository
- `create(input)` - Create a new rating
- `update(id, input)` - Update a rating
- `findByVendorId(vendorId, limit?, offset?)` - Find ratings for a vendor
- `findByBuyerId(buyerId, limit?)` - Find ratings by a buyer
- `findByVendorAndBuyer(vendorId, buyerId)` - Find specific rating
- `getAverageRating(vendorId)` - Calculate average rating
- `countByVendorId(vendorId)` - Count ratings for a vendor
- `getRatingDistribution(vendorId)` - Get rating distribution (1-5 stars)
- `findRecent(days, limit?)` - Find recent ratings

## Usage Example

```typescript
import { UserRepository, ProductRepository } from './repositories';
import { pool } from './config/database';

// Create repository instances
const userRepo = new UserRepository(pool);
const productRepo = new ProductRepository(pool);

// Create a new user
const user = await userRepo.create({
  phoneNumber: '+919876543210',
  name: 'John Doe',
  userType: 'vendor',
  preferredLanguage: 'hi',
});

// Find user by phone number
const foundUser = await userRepo.findByPhoneNumber('+919876543210');

// Create a product
const product = await productRepo.create({
  vendorId: vendor.id,
  name: 'Fresh Tomatoes',
  nameTranslations: {
    hi: 'ताज़ा टमाटर',
    en: 'Fresh Tomatoes',
  },
  price: 40.00,
  unit: 'kg',
  quantity: 100,
  isAvailable: true,
});

// Search products
const products = await productRepo.searchByName('tomato', 10);

// Find products in price range
const affordableProducts = await productRepo.findByPriceRange(10, 50, 20);
```

## Type Safety

All repositories are fully typed with TypeScript:

- **Model types** (`User`, `Product`, etc.) - Application-level types with camelCase
- **Row types** (`UserRow`, `ProductRow`, etc.) - Database-level types with snake_case
- **Input types** (`CreateUserInput`, `UpdateProductInput`, etc.) - Input validation types

The mapper functions in `models/mappers.ts` handle conversion between database rows and application models.

## Database Connection

Repositories use the connection pool from `config/database.ts`. The pool is configured with:

- Connection pooling for performance
- Automatic reconnection on failure
- Query logging for slow queries (>500ms)
- Graceful shutdown handling

## Testing

Repositories can be tested with a test database by passing a custom pool:

```typescript
import { Pool } from 'pg';
import { UserRepository } from './repositories';

const testPool = new Pool({
  host: 'localhost',
  database: 'test_db',
  // ... other config
});

const userRepo = new UserRepository(testPool);
```

## Performance Considerations

- All repositories use parameterized queries to prevent SQL injection
- Indexes are defined in migration files for optimal query performance
- Slow queries (>500ms) are automatically logged
- Connection pooling prevents connection exhaustion
- JSONB fields are used for flexible multilingual data

## Requirements Mapping

- **Requirement 9.1** - User authentication and profiles (UserRepository)
- **Requirement 9.4** - Vendor profile management (VendorRepository)
- **Requirement 9.5** - Rating system (RatingRepository)
- **Requirement 10.1, 10.2, 10.3** - Product catalog management (ProductRepository)
- **Requirement 10.4** - Product categories (CategoryRepository)
- **Requirement 12.1** - Price history tracking (PriceHistoryRepository)
- **Requirement 6.2, 6.3** - Price negotiation (NegotiationRepository)
- **Requirement 6.4** - Negotiation messages (NegotiationMessageRepository)
