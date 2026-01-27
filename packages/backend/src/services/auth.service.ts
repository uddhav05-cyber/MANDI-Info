/**
 * Authentication Service
 * Handles OTP-based authentication flow
 * Requirements: 9.2
 */

import { UserRepository } from '../repositories/user.repository';
import { OTPService } from './otp.service';
import { SMSService } from './sms.service';
import { JWTService } from './jwt.service';
import { User, CreateUserInput, UpdateUserInput } from '../models/types';

export interface RequestOTPResult {
  success: boolean;
  message: string;
  expiresIn?: number; // seconds
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export class AuthService {
  private userRepository: UserRepository;
  private otpService: OTPService;
  private smsService: SMSService;
  private jwtService: JWTService;

  constructor(
    userRepository?: UserRepository,
    otpService?: OTPService,
    smsService?: SMSService,
    jwtService?: JWTService
  ) {
    this.userRepository = userRepository || new UserRepository();
    this.otpService = otpService || new OTPService();
    this.smsService = smsService || new SMSService();
    this.jwtService = jwtService || new JWTService();
  }

  /**
   * Request OTP for phone number
   * @param phoneNumber - User's phone number
   * @returns Result with success status and message
   */
  async requestOTP(phoneNumber: string): Promise<RequestOTPResult> {
    try {
      // Validate phone number format (basic validation)
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          message: 'Invalid phone number format',
        };
      }

      // Generate OTP
      const otp = await this.otpService.createOTP(phoneNumber);

      // Send OTP via SMS
      const smsSent = await this.smsService.sendOTP(phoneNumber, otp);

      if (!smsSent) {
        // Clean up OTP if SMS failed
        await this.otpService.deleteOTP(phoneNumber);
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.',
        };
      }

      // Get OTP expiry time
      const expiresIn = await this.otpService.getOTPTTL(phoneNumber);

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: expiresIn > 0 ? expiresIn : undefined,
      };
    } catch (error) {
      console.error('Error requesting OTP:', error);
      return {
        success: false,
        message: 'An error occurred while requesting OTP',
      };
    }
  }

  /**
   * Verify OTP and authenticate user
   * @param phoneNumber - User's phone number
   * @param otp - OTP to verify
   * @param userInput - Optional user data for registration (if new user)
   * @returns Result with success status, token, and user data
   */
  async verifyOTP(
    phoneNumber: string,
    otp: string,
    userInput?: Omit<CreateUserInput, 'phoneNumber'>
  ): Promise<VerifyOTPResult> {
    try {
      // Verify OTP
      const isValid = await this.otpService.verifyOTP(phoneNumber, otp);

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid or expired OTP',
        };
      }

      // Check if user exists
      let user = await this.userRepository.findByPhoneNumber(phoneNumber);

      // If user doesn't exist and registration data provided, create new user
      if (!user && userInput) {
        user = await this.userRepository.create({
          phoneNumber,
          ...userInput,
        });
      }

      // If user still doesn't exist, return error
      if (!user) {
        return {
          success: false,
          message: 'User not found. Please provide registration details.',
        };
      }

      // Generate JWT token
      const token = this.jwtService.generateToken({
        userId: user.id,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      });

      return {
        success: true,
        message: 'Authentication successful',
        token,
        user,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'An error occurred during verification',
      };
    }
  }

  /**
   * Verify JWT token and get user
   * @param token - JWT token
   * @returns User or null if invalid
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verifyToken(token);
      if (!payload) {
        return null;
      }

      const user = await this.userRepository.findById(payload.userId);
      return user;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  /**
   * Refresh JWT token
   * @param token - Existing JWT token
   * @returns New token or null if invalid
   */
  refreshToken(token: string): string | null {
    return this.jwtService.refreshToken(token);
  }

  /**
   * Basic phone number validation
   * @param phoneNumber - Phone number to validate
   * @returns true if valid format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation: should start with + and contain 10-15 digits
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param input - Profile update data
   * @returns Result with success status and updated user
   */
  async updateProfile(userId: string, input: UpdateUserInput): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    try {
      const updatedUser = await this.userRepository.update(userId, input);

      if (!updatedUser) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: 'An error occurred while updating profile',
      };
    }
  }

  /**
   * Delete user account and all associated data
   * @param userId - User ID
   * @returns Result with success status
   */
  async deleteAccount(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const deleted = await this.userRepository.deleteById(userId);

      if (!deleted) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      return {
        success: false,
        message: 'An error occurred while deleting account',
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.otpService.disconnect();
  }
}
