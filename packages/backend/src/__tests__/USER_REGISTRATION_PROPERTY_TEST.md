# User Registration Data Completeness Property Test

## Overview

This test file implements **Property 19: User Registration Data Completeness** from the Multilingual Mandi design specification.

## Test File

- **File**: `user-registration.property.test.ts`
- **Property**: Property 19: User Registration Data Completeness
- **Requirements**: 9.1
- **Task**: 3.4 Write property test for user registration data completeness

## Property Description

**Property 19** states: *For any new user registration, the stored user record should contain name, phone number, and user type (vendor or buyer).*

## Test Configuration

- **Framework**: Jest with fast-check
- **Iterations**: 5 runs (fast execution as specified in task requirements)
- **Timeout**: 30 seconds
- **Cleanup**: Automatic cleanup of test data after all tests complete

## What This Test Validates

The property-based test validates that:

1. **Required Fields Are Stored**: All three required fields (name, phoneNumber, userType) are correctly stored in the database
2. **Data Integrity**: The stored values exactly match the input values
3. **Optional Fields**: Optional fields (preferredLanguage, location data) are handled correctly
4. **Default Values**: Default language ('hi') is set when not provided
5. **Auto-Generated Fields**: System-generated fields (id, createdAt, updatedAt) are created properly

## Smart Generators

The test uses intelligent generators that create realistic test data:

- **Phone Numbers**: Valid Indian phone numbers with +91 prefix (10 digits)
- **Names**: Non-empty strings (1-100 characters)
- **User Types**: Either 'vendor' or 'buyer'
- **Preferred Language**: Optional values from supported languages (hi, en, bho, mwr)
- **Location Coordinates**: Valid latitude (-90 to 90) and longitude (-180 to 180)
- **Location Address**: Optional string up to 200 characters

## Running the Test

### Prerequisites

1. **PostgreSQL Database**: Must be running on localhost:5432
2. **Redis**: Must be running on localhost:6379 (for OTP service)
3. **Database Setup**: Database must be created and migrated

### Setup Steps

```bash
# 1. Navigate to backend directory
cd packages/backend

# 2. Ensure database is running and migrated
npm run migrate

# 3. Run the property-based test
npm test -- user-registration.property.test.ts
```

### Alternative: Run All Tests

```bash
npm test
```

## Database Requirements

The test requires the users table from the database schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('vendor', 'buyer')),
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi',
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Test Output

When the test passes, you'll see output like:

```
PASS  src/__tests__/user-registration.property.test.ts
  Property 19: User Registration Data Completeness
    ✓ should store all required registration fields (name, phone number, user type) correctly (1500ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

## Why Only 5 Iterations?

This test is configured with only 5 iterations (numRuns: 5) for fast execution, as specified in the task requirements. This is suitable for:

- Quick feedback during development
- CI/CD pipelines where speed is important
- Simple properties that don't require extensive randomization

For production or comprehensive testing, you may want to increase this to 100+ iterations.

## Design Principles

This test follows property-based testing best practices:

1. **Universal Property**: Verifies that registration data completeness holds for ALL valid inputs
2. **Smart Generators**: Uses constrained random generation for realistic test data
3. **No Mocks**: Tests use real database operations for authentic validation
4. **Automatic Cleanup**: Ensures test data is removed after execution
5. **Fast Execution**: Optimized with 5 iterations for quick feedback

## Related Files

- **Repository**: `../repositories/user.repository.ts`
- **Service**: `../services/auth.service.ts`
- **Types**: `../models/types.ts`
- **Mappers**: `../models/mappers.ts`
- **Migration**: `../../../migrations/001_create_users_table.sql`

## References

- **Design Document**: `.kiro/specs/multilingual-mandi/design.md` (Property 19)
- **Requirements**: `.kiro/specs/multilingual-mandi/requirements.md` (Requirement 9.1)
- **Tasks**: `.kiro/specs/multilingual-mandi/tasks.md` (Task 3.4)
- **fast-check Documentation**: https://github.com/dubzzz/fast-check

## Troubleshooting

### Database Connection Errors

If you see `ECONNREFUSED` errors:
1. Verify PostgreSQL is running on localhost:5432
2. Check database credentials in `.env` file
3. Ensure the database 'multilingual_mandi' exists
4. Run migrations: `npm run migrate`

### Test Failures

If the property test fails:
1. Check the counterexample provided by fast-check
2. Verify the users table schema matches expectations
3. Ensure migrations have been run successfully
4. Check for unique constraint violations on phone_number

### Timeout Errors

If the test times out:
1. Check database connection performance
2. Verify cleanup is working properly
3. Increase timeout if needed (currently 30s)
