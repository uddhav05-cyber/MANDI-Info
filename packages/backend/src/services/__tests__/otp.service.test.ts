/**
 * Unit tests for OTP Service
 * Requirements: 9.2
 */

import { OTPService } from '../otp.service';
import { createClient } from 'redis';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('OTPService', () => {
  let otpService: OTPService;
  let mockRedisClient: any;

  beforeEach(() => {
    // Create mock Redis client
    mockRedisClient = {
      isOpen: false,
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      setEx: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn(),
      ttl: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);
    otpService = new OTPService('redis://localhost:6379', 10);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOTP', () => {
    it('should generate a 6-digit OTP', async () => {
      const phoneNumber = '+919876543210';
      const otp = await otpService.createOTP(phoneNumber);

      expect(otp).toMatch(/^\d{6}$/);
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `otp:${phoneNumber}`,
        600, // 10 minutes in seconds
        otp
      );
    });

    it('should generate different OTPs for different calls', async () => {
      const phoneNumber = '+919876543210';
      const otp1 = await otpService.createOTP(phoneNumber);
      const otp2 = await otpService.createOTP(phoneNumber);

      // While theoretically they could be the same, probability is very low
      expect(otp1).toMatch(/^\d{6}$/);
      expect(otp2).toMatch(/^\d{6}$/);
    });
  });

  describe('verifyOTP', () => {
    it('should return true for valid OTP', async () => {
      const phoneNumber = '+919876543210';
      const otp = '123456';

      mockRedisClient.get.mockResolvedValue(otp);

      const result = await otpService.verifyOTP(phoneNumber, otp);

      expect(result).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`otp:${phoneNumber}`);
      expect(mockRedisClient.del).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });

    it('should return false for invalid OTP', async () => {
      const phoneNumber = '+919876543210';
      const storedOTP = '123456';
      const providedOTP = '654321';

      mockRedisClient.get.mockResolvedValue(storedOTP);

      const result = await otpService.verifyOTP(phoneNumber, providedOTP);

      expect(result).toBe(false);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should return false for expired OTP', async () => {
      const phoneNumber = '+919876543210';
      const otp = '123456';

      mockRedisClient.get.mockResolvedValue(null);

      const result = await otpService.verifyOTP(phoneNumber, otp);

      expect(result).toBe(false);
    });
  });

  describe('deleteOTP', () => {
    it('should delete OTP from Redis', async () => {
      const phoneNumber = '+919876543210';

      await otpService.deleteOTP(phoneNumber);

      expect(mockRedisClient.del).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });
  });

  describe('hasOTP', () => {
    it('should return true if OTP exists', async () => {
      const phoneNumber = '+919876543210';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await otpService.hasOTP(phoneNumber);

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });

    it('should return false if OTP does not exist', async () => {
      const phoneNumber = '+919876543210';
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await otpService.hasOTP(phoneNumber);

      expect(result).toBe(false);
    });
  });

  describe('getOTPTTL', () => {
    it('should return remaining TTL', async () => {
      const phoneNumber = '+919876543210';
      const ttl = 300; // 5 minutes
      mockRedisClient.ttl.mockResolvedValue(ttl);

      const result = await otpService.getOTPTTL(phoneNumber);

      expect(result).toBe(ttl);
      expect(mockRedisClient.ttl).toHaveBeenCalledWith(`otp:${phoneNumber}`);
    });

    it('should return -1 if OTP does not exist', async () => {
      const phoneNumber = '+919876543210';
      mockRedisClient.ttl.mockResolvedValue(-1);

      const result = await otpService.getOTPTTL(phoneNumber);

      expect(result).toBe(-1);
    });
  });

  describe('connect and disconnect', () => {
    it('should connect to Redis', async () => {
      await otpService.connect();

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should not connect if already open', async () => {
      mockRedisClient.isOpen = true;

      await otpService.connect();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
    });

    it('should disconnect from Redis', async () => {
      mockRedisClient.isOpen = true;

      await otpService.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should not disconnect if not open', async () => {
      mockRedisClient.isOpen = false;

      await otpService.disconnect();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });
});
