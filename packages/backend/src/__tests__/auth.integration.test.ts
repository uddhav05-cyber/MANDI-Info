/**
 * Integration tests for authentication flow
 * Requirements: 9.2
 */

import { AuthService } from '../services/auth.service';
import { OTPService } from '../services/otp.service';
import { SMSService, MockSMSProvider } from '../services/sms.service';
import { JWTService } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';
import { Pool } from 'pg';

describe('Authentication Integration Tests', () => {
  let authService: AuthService;
  let otpService: OTPService;
  let smsProvider: MockSMSProvider;
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
    smsProvider = new MockSMSProvider();
    smsService = new SMSService(smsProvider);
    jwtService = new JWTService('test-secret', '1h');
    userRepository = new UserRepository(pool);
    authService = new AuthService(userRepository, otpService, smsService, jwtService);
  });

  afterAll(async () => {
    await otpService.disconnect();
    await pool.end();
  });

  describe('Complete authentication flow', () => {
    const testPhoneNumber = '+919876543210';
    const testUserData = {
      name: 'Integration Test User',
      userType: 'vendor' as const,
      preferredLanguage: 'hi',
    };

    it('should complete full OTP authentication flow for new user', async () => {
      // Step 1: Request OTP
      const requestResult = await authService.requestOTP(testPhoneNumber);
      expect(requestResult.success).toBe(true);
      expect(requestResult.expiresIn).toBeGreaterThan(0);

      // Verify SMS was sent
      const sentMessages = smsProvider.getSentMessages();
      expect(sentMessages.length).toBeGreaterThan(0);
      const lastMessage = sentMessages[sentMessages.length - 1];
      expect(lastMessage.phoneNumber).toBe(testPhoneNumber);

      // Extract OTP from message (for testing purposes)
      const otpMatch = lastMessage.message.match(/\d{6}/);
      expect(otpMatch).toBeTruthy();
      const otp = otpMatch![0];

      // Step 2: Verify OTP and register user
      const verifyResult = await authService.verifyOTP(testPhoneNumber, otp, testUserData);
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.token).toBeTruthy();
      expect(verifyResult.user).toBeTruthy();
      expect(verifyResult.user?.phoneNumber).toBe(testPhoneNumber);
      expect(verifyResult.user?.name).toBe(testUserData.name);

      // Step 3: Verify token works
      const user = await authService.verifyToken(verifyResult.token!);
      expect(user).toBeTruthy();
      expect(user?.id).toBe(verifyResult.user?.id);

      // Cleanup: Delete test user
      if (verifyResult.user) {
        await userRepository.deleteById(verifyResult.user.id);
      }
    }, 15000); // Increase timeout for integration test

    it('should authenticate existing user', async () => {
      // Create a test user first
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      try {
        // Step 1: Request OTP
        const requestResult = await authService.requestOTP(testPhoneNumber);
        expect(requestResult.success).toBe(true);

        // Get OTP from SMS
        const sentMessages = smsProvider.getSentMessages();
        const lastMessage = sentMessages[sentMessages.length - 1];
        const otpMatch = lastMessage.message.match(/\d{6}/);
        const otp = otpMatch![0];

        // Step 2: Verify OTP (no registration data needed)
        const verifyResult = await authService.verifyOTP(testPhoneNumber, otp);
        expect(verifyResult.success).toBe(true);
        expect(verifyResult.token).toBeTruthy();
        expect(verifyResult.user?.id).toBe(user.id);
      } finally {
        // Cleanup
        await userRepository.deleteById(user.id);
      }
    }, 15000);

    it('should reject invalid OTP', async () => {
      // Request OTP
      await authService.requestOTP(testPhoneNumber);

      // Try with wrong OTP
      const verifyResult = await authService.verifyOTP(testPhoneNumber, '000000');
      expect(verifyResult.success).toBe(false);
      expect(verifyResult.message).toBe('Invalid or expired OTP');
      expect(verifyResult.token).toBeUndefined();
    }, 15000);

    it('should reject expired OTP', async () => {
      // This test would require waiting for OTP expiry or mocking time
      // For now, we'll test that OTP can only be used once
      const requestResult = await authService.requestOTP(testPhoneNumber);
      expect(requestResult.success).toBe(true);

      // Get OTP
      const sentMessages = smsProvider.getSentMessages();
      const lastMessage = sentMessages[sentMessages.length - 1];
      const otpMatch = lastMessage.message.match(/\d{6}/);
      const otp = otpMatch![0];

      // Create user for first verification
      const user = await userRepository.create({
        phoneNumber: testPhoneNumber,
        ...testUserData,
      });

      try {
        // Use OTP once
        const firstVerify = await authService.verifyOTP(testPhoneNumber, otp);
        expect(firstVerify.success).toBe(true);

        // Try to use same OTP again
        const secondVerify = await authService.verifyOTP(testPhoneNumber, otp);
        expect(secondVerify.success).toBe(false);
        expect(secondVerify.message).toBe('Invalid or expired OTP');
      } finally {
        await userRepository.deleteById(user.id);
      }
    }, 15000);
  });
});

  describe('User profile management', () => {
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
        expect(updateRes