/**
 * Unit tests for Auth Service
 * Requirements: 9.2
 */

import { AuthService } from '../auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { OTPService } from '../otp.service';
import { SMSService, MockSMSProvider } from '../sms.service';
import { JWTService } from '../jwt.service';
import { User } from '../../models/types';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../otp.service');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockOTPService: jest.Mocked<OTPService>;
  let mockSMSService: SMSService;
  let jwtService: JWTService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    phoneNumber: '+919876543210',
    name: 'Test User',
    userType: 'vendor',
    preferredLanguage: 'hi',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Create mocks
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockOTPService = new OTPService() as jest.Mocked<OTPService>;
    mockSMSService = new SMSService(new MockSMSProvider());
    jwtService = new JWTService('test-secret', '1h');

    // Setup default mock implementations
    mockOTPService.createOTP = jest.fn().mockResolvedValue('123456');
    mockOTPService.verifyOTP = jest.fn().mockResolvedValue(true);
    mockOTPService.deleteOTP = jest.fn().mockResolvedValue(undefined);
    mockOTPService.getOTPTTL = jest.fn().mockResolvedValue(600);

    authService = new AuthService(
      mockUserRepository,
      mockOTPService,
      mockSMSService,
      jwtService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestOTP', () => {
    it('should generate and send OTP for valid phone number', async () => {
      const phoneNumber = '+919876543210';

      const result = await authService.requestOTP(phoneNumber);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(result.expiresIn).toBe(600);
      expect(mockOTPService.createOTP).toHaveBeenCalledWith(phoneNumber);
    });

    it('should reject invalid phone number', async () => {
      const invalidPhoneNumber = '123'; // Too short

      const result = await authService.requestOTP(invalidPhoneNumber);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid phone number format');
      expect(mockOTPService.createOTP).not.toHaveBeenCalled();
    });

    it('should handle SMS sending failure', async () => {
      const phoneNumber = '+919876543210';
      
      // Mock SMS service to fail
      const failingSMSService = {
        sendOTP: jest.fn().mockResolvedValue(false),
      } as any;

      const authServiceWithFailingSMS = new AuthService(
        mockUserRepository,
        mockOTPService,
        failingSMSService,
        jwtService
      );

      const result = await authServiceWithFailingSMS.requestOTP(phoneNumber);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send OTP. Please try again.');
      expect(mockOTPService.deleteOTP).toHaveBeenCalledWith(phoneNumber);
    });

    it('should accept phone numbers with country code', async () => {
      const phoneNumbers = [
        '+919876543210',
        '+14155552671',
        '+447911123456',
      ];

      for (const phoneNumber of phoneNumbers) {
        const result = await authService.requestOTP(phoneNumber);
        expect(result.success).toBe(true);
      }
    });

    it('should accept phone numbers without + prefix', async () => {
      const phoneNumber = '919876543210';

      const result = await authService.requestOTP(phoneNumber);

      expect(result.success).toBe(true);
    });
  });

  describe('verifyOTP', () => {
    it('should authenticate existing user with valid OTP', async () => {
      const phoneNumber = '+919876543210';
      const otp = '123456';

      mockUserRepository.findByPhoneNumber = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyOTP(phoneNumber, otp);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Authentication successful');
      expect(result.token).toBeTruthy();
      expect(result.user).toEqual(mockUser);
      expect(mockOTPService.verifyOTP).toHaveBeenCalledWith(phoneNumber, otp);
    });

    it('should reject invalid OTP', async () => {
      const phoneNumber = '+919876543210';
      const otp = '654321';

      mockOTPService.verifyOTP = jest.fn().mockResolvedValue(false);

      const result = await authService.verifyOTP(phoneNumber, otp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired OTP');
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
    });

    it('should create new user when registration data provided', async () => {
      const phoneNumber = '+919876543210';
      const otp = '123456';
      const userInput = {
        name: 'New User',
        userType: 'buyer' as const,
        preferredLanguage: 'en',
      };

      mockUserRepository.findByPhoneNumber = jest.fn().mockResolvedValue(null);
      mockUserRepository.create = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyOTP(phoneNumber, otp, userInput);

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
      expect(result.user).toEqual(mockUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        phoneNumber,
        ...userInput,
      });
    });

    it('should fail when user not found and no registration data', async () => {
      const phoneNumber = '+919876543210';
      const otp = '123456';

      mockUserRepository.findByPhoneNumber = jest.fn().mockResolvedValue(null);

      const result = await authService.verifyOTP(phoneNumber, otp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found. Please provide registration details.');
      expect(result.token).toBeUndefined();
    });

    it('should generate valid JWT token', async () => {
      const phoneNumber = '+919876543210';
      const otp = '123456';

      mockUserRepository.findByPhoneNumber = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.verifyOTP(phoneNumber, otp);

      expect(result.token).toBeTruthy();

      // Verify token can be decoded
      const decoded = jwtService.verifyToken(result.token!);
      expect(decoded?.userId).toBe(mockUser.id);
      expect(decoded?.phoneNumber).toBe(mockUser.phoneNumber);
      expect(decoded?.userType).toBe(mockUser.userType);
    });
  });

  describe('verifyToken', () => {
    it('should return user for valid token', async () => {
      const token = jwtService.generateToken({
        userId: mockUser.id,
        phoneNumber: mockUser.phoneNumber,
        userType: mockUser.userType,
      });

      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);

      const user = await authService.verifyToken(token);

      expect(user).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      const user = await authService.verifyToken(invalidToken);

      expect(user).toBeNull();
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      const token = jwtService.generateToken({
        userId: mockUser.id,
        phoneNumber: mockUser.phoneNumber,
        userType: mockUser.userType,
      });

      mockUserRepository.findById = jest.fn().mockResolvedValue(null);

      const user = await authService.verifyToken(token);

      expect(user).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should generate new token for valid token', async () => {
      const originalToken = jwtService.generateToken({
        userId: mockUser.id,
        phoneNumber: mockUser.phoneNumber,
        userType: mockUser.userType,
      });

      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      const newToken = authService.refreshToken(originalToken);

      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(originalToken);

      // Verify new token has same payload
      const decoded = jwtService.verifyToken(newToken!);
      expect(decoded?.userId).toBe(mockUser.id);
      expect(decoded?.phoneNumber).toBe(mockUser.phoneNumber);
      expect(decoded?.userType).toBe(mockUser.userType);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const newToken = authService.refreshToken(invalidToken);

      expect(newToken).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = mockUser.id;
      const updateInput = {
        name: 'Updated Name',
        preferredLanguage: 'en',
      };

      const updatedUser = { ...mockUser, ...updateInput };
      mockUserRepository.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(userId, updateInput);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.user).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateInput);
    });

    it('should update location fields', async () => {
      const userId = mockUser.id;
      const updateInput = {
        locationLatitude: 28.6139,
        locationLongitude: 77.2090,
        locationAddress: 'New Delhi, India',
      };

      const updatedUser = { ...mockUser, ...updateInput };
      mockUserRepository.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(userId, updateInput);

      expect(result.success).toBe(true);
      expect(result.user?.locationLatitude).toBe(updateInput.locationLatitude);
      expect(result.user?.locationLongitude).toBe(updateInput.locationLongitude);
      expect(result.user?.locationAddress).toBe(updateInput.locationAddress);
    });

    it('should fail when user not found', async () => {
      const userId = 'non-existent-id';
      const updateInput = { name: 'Updated Name' };

      mockUserRepository.update = jest.fn().mockResolvedValue(null);

      const result = await authService.updateProfile(userId, updateInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.user).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const userId = mockUser.id;
      const updateInput = { name: 'Updated Name' };

      mockUserRepository.update = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await authService.updateProfile(userId, updateInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred while updating profile');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      const userId = mockUser.id;

      mockUserRepository.deleteById = jest.fn().mockResolvedValue(true);

      const result = await authService.deleteAccount(userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account deleted successfully');
      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(userId);
    });

    it('should fail when user not found', async () => {
      const userId = 'non-existent-id';

      mockUserRepository.deleteById = jest.fn().mockResolvedValue(false);

      const result = await authService.deleteAccount(userId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should handle errors gracefully', async () => {
      const userId = mockUser.id;

      mockUserRepository.deleteById = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await authService.deleteAccount(userId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred while deleting account');
    });
  });
});
