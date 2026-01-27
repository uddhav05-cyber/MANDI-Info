# Product Repository Property-Based Tests

## Overview

This directory contains property-based tests for the Product repository, implementing **Property 23: Product CRUD Operations** from the Multilingual Mandi design specification.

## Test File

- **File**: `product.repository.property.test.ts`
- **Property**: Property 23: Product CRUD Operations
- **Requirements**: 10.1, 10.2, 10.3

## Property Description

**Property 23** states: *For any product, the following operations should maintain data integrity:*
1. Creating a product stores all required fields
2. Updating a product modifies only specified fields
3. Marking as unavailable changes only the availability status

## Test Coverage

The property-based tests validate the following behaviors across 100+ randomized inputs:

### 1. Product Creation (Requirement 10.1)
- **Test**: `should store all required fields when creating a product`
- **Validates**: All required fields (vendorId, name, nameTranslations, price, unit, quantity) are stored correctly
- **Validates**: Optional fields (categoryId, imageUrl, qrCode, isAvailable) are handled properly
- **Validates**: Auto-generated fields (id, createdAt, updatedAt) are created
- **Validates**: Default value for isAvailable is true when not specified

### 2. Product Update (Requirement 10.2)
- **Test**: `should modify only specified fields when updating a product`
- **Validates**: Only fields provided in the update input are modified
- **Validates**: Unspecified fields remain unchanged
- **Validates**: Immutable fields (id, vendorId, createdAt) are never modified
- **Validates**: Partial updates work correctly

### 3. Availability Update (Requirement 10.3)
- **Test**: `should change only availability status when marking as unavailable`
- **Validates**: Only the isAvailable field changes
- **Validates**: All other fields remain exactly the same
- **Validates**: Both true and false availability values work correctly

### 4. Full CRUD Cycle
- **Test**: `should maintain data integrity across create-read-update-delete cycle`
- **Validates**: Complete lifecycle of a product maintains data integrity
- **Validates**: Create → Read → Update → Delete operations work correctly
- **Validates**: Deleted products cannot be retrieved

## Test Configuration

- **Framework**: Jest with fast-check
- **Iterations**: 100 runs per property (50 for full CRUD cycle)
- **Timeout**: 60 seconds per test
- **Cleanup**: Automatic cleanup of test data after each run

## Smart Generators

The tests use intelligent generators that constrain inputs to valid ranges:

- **Product Names**: Non-empty strings (1-200 characters)
- **Prices**: Positive decimals (0.01 to 100,000) with 2 decimal places
- **Quantities**: Positive decimals (0.01 to 10,000) with 2 decimal places
- **Units**: Valid units (kg, piece, dozen, liter, gram, bundle)
- **Translations**: Multi-language support (en, hi, bho)
- **UUIDs**: Valid UUID v4 format for IDs

## Running the Tests

### Prerequisites

1. **PostgreSQL Database**: Must be running on localhost:5432
2. **Database Setup**: Database must be created and migrated

### Setup Steps

```bash
# 1. Start PostgreSQL (using Docker)
docker compose up -d

# 2. Navigate to backend directory
cd packages/backend

# 3. Run migrations
npm run migrate

# 4. Run the property-based tests
npm test -- product.repository.property.test.ts
```

### Alternative: Manual PostgreSQL Setup

If not using Docker, ensure PostgreSQL is running with these credentials:
- Host: localhost
- Port: 5432
- Database: multilingual_mandi
- User: postgres
- Password: postgres

## Database Requirements

The tests require the following database schema:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_translations JSONB NOT NULL,
  category_id UUID,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  qr_code TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Test Output

When tests pass, you'll see output like:

```
PASS  src/repositories/__tests__/product.repository.property.test.ts
  Product Repository - Property-Based Tests
    Property 23: Product CRUD Operations
      ✓ should store all required fields when creating a product (2500ms)
      ✓ should modify only specified fields when updating a product (2800ms)
      ✓ should change only availability status when marking as unavailable (2600ms)
      ✓ should maintain data integrity across create-read-update-delete cycle (2400ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## Troubleshooting

### Database Connection Errors

If you see `ECONNREFUSED` errors:
1. Verify PostgreSQL is running: `docker ps` or check your PostgreSQL service
2. Check database credentials in `.env` file
3. Ensure port 5432 is not blocked by firewall

### Test Failures

If property tests fail:
1. Check the counterexample provided by fast-check
2. Verify database schema matches expectations
3. Ensure migrations have been run
4. Check for data integrity constraints in the database

### Timeout Errors

If tests timeout:
1. Increase timeout in test configuration (currently 60s)
2. Check database performance
3. Reduce number of iterations (numRuns parameter)

## Design Principles

These tests follow property-based testing best practices:

1. **Universal Properties**: Tests verify properties that should hold for ALL valid inputs
2. **Randomization**: Uses fast-check to generate diverse test cases
3. **Shrinking**: When failures occur, fast-check automatically finds minimal failing examples
4. **No Mocks**: Tests use real database operations for authentic validation
5. **Cleanup**: Automatic cleanup ensures tests don't interfere with each other

## Related Files

- **Repository**: `../product.repository.ts`
- **Types**: `../../models/types.ts`
- **Mappers**: `../../models/mappers.ts`
- **Database Config**: `../../config/database.ts`
- **Migrations**: `../../../migrations/003_create_products_table.sql`

## References

- **Design Document**: `.kiro/specs/multilingual-mandi/design.md`
- **Requirements**: `.kiro/specs/multilingual-mandi/requirements.md`
- **Tasks**: `.kiro/specs/multilingual-mandi/tasks.md`
- **fast-check Documentation**: https://github.com/dubzzz/fast-check
