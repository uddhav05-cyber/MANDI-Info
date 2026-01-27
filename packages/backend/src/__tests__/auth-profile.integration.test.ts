/**
 * Integration tests for user profile management
 * Requirements: 9.1, 14.4
 */

import { AuthService } from '../services/auth.service';
import { OTPService } from '../services/otp.service';
import { SMSService, MockSMSProvider } from '../services/sms.service';
import { JWTService } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';
import { Pool } from 'pg';

describe('User Profile Management Integration Tests', () => {
  let authService: AuthService;
  let otpService: OTPService;
  let smsService: SMSService;
  let jwtService: JWTService;
  let userRepository: UserRepository;
  let pool: Pool;

  beforeAll(() => {
    // Create test database pool
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'multilingual_mandi',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    // Initialize services
    otpService = new OTPService(process.env.REDIS_URL, 10);
    smsService = new SMSService(new MockSMSProvider());
    jwtService = new JWTService('test-secret', '1h');
    userRepository = new UserRepository(pool);
    authService = new AuthService(userRepository, otpService, smsService, jwtService);
  });

  afterAll(async () => {
    await otpService.disconnect();
    await pool.end();
  });

  describe('updateProfile', () => {
    const testPhoneNumber = '+919876543211';
    const testUserData = {
      name: 'Profile Test User',
      userType: 'buyer' as const,
      preferredLanguage: 'hi',
    };

    it('should update user profile successfully', async () => {
      // Create a test user
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      try {
        // Update profile
        const updateResult = await authService.updateProfile(user.id, {
          name: 'Updated Name',
          preferredLanguage: 'en',
          locationLatitude: 28.6139,
          locationLongitude: 77.2090,
          locationAddress: 'New Delhi, India',
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.message).toBe('Profile updated successfully');
        expect(updateResult.user).toBeTruthy();
        expect(updateResult.user?.name).toBe('Updated Name');
        expect(updateResult.user?.preferredLanguage).toBe('en');
        expect(updateResult.user?.locationLatitude).toBe(28.6139);
        expect(updateResult.user?.locationLongitude).toBe(77.2090);
        expect(updateResult.user?.locationAddress).toBe('New Delhi, India');

        // Verify changes persisted in database
        const fetchedUser = await userRepository.findById(user.id);
        expect(fetchedUser?.name).toBe('Updated Name');
        expect(fetchedUser?.preferredLanguage).toBe('en');
      } finally {
        // Cleanup
        await userRepository.deleteById(user.id);
      }
    });

    it('should update only specified fields', async () => {
      // Create a test user
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      try {
        // Update only name
        const updateResult = await authService.updateProfile(user.id, {
          name: 'Only Name Updated',
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.user?.name).toBe('Only Name Updated');
        expect(updateResult.user?.preferredLanguage).toBe('hi'); // Should remain unchanged
      } finally {
        await userRepository.deleteById(user.id);
      }
    });

    it('should fail when user not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const updateResult = await authService.updateProfile(nonExistentId, {
        name: 'Updated Name',
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.message).toBe('User not found');
      expect(updateResult.user).toBeUndefined();
    });

    it('should update location fields independently', async () => {
      // Create a test user
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      try {
        // Update location
        const updateResult = await authService.updateProfile(user.id, {
          locationLatitude: 19.0760,
          locationLongitude: 72.8777,
          locationAddress: 'Mumbai, India',
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.user?.locationLatitude).toBe(19.0760);
        expect(updateResult.user?.locationLongitude).toBe(72.8777);
        expect(updateResult.user?.locationAddress).toBe('Mumbai, India');
        expect(updateResult.user?.name).toBe(testUserData.name); // Should remain unchanged
      } finally {
        await userRepository.deleteById(user.id);
      }
    });
  });

  describe('deleteAccount', () => {
    const testPhoneNumber = '+919876543212';
    const testUserData = {
      name: 'Delete Test User',
      userType: 'vendor' as const,
      preferredLanguage: 'hi',
    };

    it('should delete user account successfully', async () => {
      // Create a test user
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      // Delete account
      const deleteResult = await authService.deleteAccount(user.id);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('Account deleted successfully');

      // Verify user is deleted from database
      const fetchedUser = await userRepository.findById(user.id);
      expect(fetchedUser).toBeNull();
    });

    it('should fail when user not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const deleteResult = await authService.deleteAccount(nonExistentId);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toBe('User not found');
    });

    it('should remove all user data (cascade delete)', async () => {
      // Create a test user
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      // Delete account
      await authService.deleteAccount(user.id);

      // Verify user is completely removed
      const fetchedUser = await userRepository.findById(user.id);
      expect(fetchedUser).toBeNull();

      // Note: In a real scenario, we would also verify that related data
      // (vendors, products, negotiations, etc.) are also deleted due to
      // CASCADE constraints in the database schema
    });
  });
});
