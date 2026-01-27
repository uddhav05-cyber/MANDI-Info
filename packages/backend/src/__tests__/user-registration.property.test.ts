/**
 * Property-based tests for user registration data completeness
 * Feature: multilingual-mandi, Property 19: User Registration Data Completeness
 * **Validates: Requirements 9.1**
 * 
 * Requirements: 9.1
 */

import * as fc from 'fast-check';
import { UserRepository } from '../repositories/user.repository';
import { Pool } from 'pg';
import { CreateUserInput, UserType } from '../models/types';

describe('Property 19: User Registration Data Completeness', () => {
  let userRepository: UserRepository;
  let pool: Pool;
  const createdUserIds: string[] = [];

  beforeAll(() => {
    // Create test database pool
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'multilingual_mandi',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    userRepository = new UserRepository(pool);
  });

  afterAll(async () => {
    // Clean up all created users
    for (const userId of createdUserIds) {
      try {
        await userRepository.deleteById(userId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    await pool.end();
  });

  it('should store all required registration fields (name, phone number, user type) correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid user registration data
        fc.record({
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => `+91${s.replace(/\D/g, '').slice(0, 10)}`),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          userType: fc.constantFrom<UserType>('vendor', 'buyer'),
          preferredLanguage: fc.option(fc.constantFrom('hi', 'en', 'bho', 'mwr'), { nil: undefined }),
          locationLatitude: fc.option(fc.double({ min: -90, max: 90 }), { nil: undefined }),
          locationLongitude: fc.option(fc.double({ min: -180, max: 180 }), { nil: undefined }),
          locationAddress: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        }),
        async (input: CreateUserInput) => {
          // Create user with registration data
          const createdUser = await userRepository.create(input);
          
          // Track for cleanup
          createdUserIds.push(createdUser.id);

          // Retrieve the user from database
          const retrievedUser = await userRepository.findById(createdUser.id);

          // Assert that user was created
          expect(retrievedUser).not.toBeNull();

          // Property: All required fields must be stored correctly
          // Required fields: name, phoneNumber, userType
          expect(retrievedUser!.name).toBe(input.name);
          expect(retrievedUser!.phoneNumber).toBe(input.phoneNumber);
          expect(retrievedUser!.userType).toBe(input.userType);

          // Additional verification: Optional fields should also be stored if provided
          if (input.preferredLanguage !== undefined) {
            expect(retrievedUser!.preferredLanguage).toBe(input.preferredLanguage);
          } else {
            // Default language should be 'hi' if not provided
            expect(retrievedUser!.preferredLanguage).toBe('hi');
          }

          if (input.locationLatitude !== undefined) {
            expect(retrievedUser!.locationLatitude).toBeCloseTo(input.locationLatitude, 6);
          }

          if (input.locationLongitude !== undefined) {
            expect(retrievedUser!.locationLongitude).toBeCloseTo(input.locationLongitude, 6);
          }

          if (input.locationAddress !== undefined) {
            expect(retrievedUser!.locationAddress).toBe(input.locationAddress);
          }

          // Verify auto-generated fields exist
          expect(retrievedUser!.id).toBeTruthy();
          expect(retrievedUser!.createdAt).toBeInstanceOf(Date);
          expect(retrievedUser!.updatedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 5 } // Fast execution with only 5 iterations as specified
    );
  }, 30000); // Increased timeout for property test with database operations
});
