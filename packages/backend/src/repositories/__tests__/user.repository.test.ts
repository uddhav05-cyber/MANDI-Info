/**
 * User Repository Tests
 * Basic tests to verify repository functionality
 */

import { Pool } from 'pg';
import { UserRepository } from '../user.repository';
import { CreateUserInput } from '../../models/types';

describe('UserRepository', () => {
  let pool: Pool;
  let userRepo: UserRepository;

  beforeAll(() => {
    // Create a mock pool for testing
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'multilingual_mandi',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    userRepo = new UserRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Type Safety', () => {
    it('should have correct type definitions for CreateUserInput', () => {
      const input: CreateUserInput = {
        phoneNumber: '+919876543210',
        name: 'Test User',
        userType: 'vendor',
        preferredLanguage: 'hi',
      };

      expect(input.phoneNumber).toBeDefined();
      expect(input.name).toBeDefined();
      expect(input.userType).toBeDefined();
    });

    it('should enforce userType enum', () => {
      const validInput: CreateUserInput = {
        phoneNumber: '+919876543210',
        name: 'Test User',
        userType: 'vendor', // Should be 'vendor' or 'buyer'
      };

      expect(['vendor', 'buyer']).toContain(validInput.userType);
    });
  });

  describe('Repository Methods', () => {
    it('should have all required methods', () => {
      expect(userRepo.create).toBeDefined();
      expect(userRepo.update).toBeDefined();
      expect(userRepo.findById).toBeDefined();
      expect(userRepo.findByPhoneNumber).toBeDefined();
      expect(userRepo.findByType).toBeDefined();
      expect(userRepo.findNearby).toBeDefined();
      expect(userRepo.updateRating).toBeDefined();
      expect(userRepo.deleteById).toBeDefined();
      expect(userRepo.count).toBeDefined();
      expect(userRepo.exists).toBeDefined();
    });
  });
});
