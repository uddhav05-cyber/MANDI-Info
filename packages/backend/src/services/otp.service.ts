/**
 * OTP Service for generating and managing OTPs
 * Requirements: 9.2
 */

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

export class OTPService {
  private redisClient: RedisClientType;
  private otpExpiryMinutes: number;

  constructor(redisUrl?: string, otpExpiryMinutes: number = 10) {
    this.redisClient = createClient({
      url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.otpExpiryMinutes = otpExpiryMinutes;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    // Generate a random 6-digit number
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store OTP in Redis with TTL
   * @param phoneNumber - User's phone number
   * @returns Generated OTP
   */
  async createOTP(phoneNumber: string): Promise<string> {
    await this.connect();
    
    const otp = this.generateOTP();
    const key = this.getRedisKey(phoneNumber);
    const expirySeconds = this.otpExpiryMinutes * 60;

    // Store OTP with expiry
    await this.redisClient.setEx(key, expirySeconds, otp);

    return otp;
  }

  /**
   * Verify OTP for a phone number
   * @param phoneNumber - User's phone number
   * @param otp - OTP to verify
   * @returns true if OTP is valid, false otherwise
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    await this.connect();
    
    const key = this.getRedisKey(phoneNumber);
    const storedOTP = await this.redisClient.get(key);

    if (!storedOTP) {
      return false; // OTP expired or doesn't exist
    }

    if (storedOTP === otp) {
      // Delete OTP after successful verification
      await this.redisClient.del(key);
      return true;
    }

    return false;
  }

  /**
   * Delete OTP for a phone number
   * @param phoneNumber - User's phone number
   */
  async deleteOTP(phoneNumber: string): Promise<void> {
    await this.connect();
    
    const key = this.getRedisKey(phoneNumber);
    await this.redisClient.del(key);
  }

  /**
   * Check if OTP exists for a phone number
   * @param phoneNumber - User's phone number
   * @returns true if OTP exists, false otherwise
   */
  async hasOTP(phoneNumber: string): Promise<boolean> {
    await this.connect();
    
    const key = this.getRedisKey(phoneNumber);
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  /**
   * Get remaining TTL for an OTP
   * @param phoneNumber - User's phone number
   * @returns Remaining seconds, or -1 if OTP doesn't exist
   */
  async getOTPTTL(phoneNumber: string): Promise<number> {
    await this.connect();
    
    const key = this.getRedisKey(phoneNumber);
    return await this.redisClient.ttl(key);
  }

  /**
   * Generate Redis key for phone number
   */
  private getRedisKey(phoneNumber: string): string {
    return `otp:${phoneNumber}`;
  }
}
