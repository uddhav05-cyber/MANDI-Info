/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 * Requirements: 9.2
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { CreateUserInput } from '../models/types';

export class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }

  /**
   * POST /api/auth/request-otp
   * Request OTP for phone number
   */
  requestOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      const result = await this.authService.requestOTP(phoneNumber);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in requestOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * POST /api/auth/verify-otp
   * Verify OTP and authenticate user
   */
  verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phoneNumber, otp, name, userType, preferredLanguage } = req.body;

      if (!phoneNumber || !otp) {
        res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required',
        });
        return;
      }

      // Prepare user input for registration (if new user)
      let userInput: Omit<CreateUserInput, 'phoneNumber'> | undefined;
      if (name && userType) {
        userInput = {
          name,
          userType,
          preferredLanguage: preferredLanguage || 'hi',
        };
      }

      const result = await this.authService.verifyOTP(phoneNumber, otp, userInput);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * POST /api/auth/refresh-token
   * Refresh JWT token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      const newToken = this.authService.refreshToken(token);

      if (newToken) {
        res.status(200).json({
          success: true,
          token: newToken,
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
    } catch (error) {
      console.error('Error in refreshToken:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      const { name, preferredLanguage, locationLatitude, locationLongitude, locationAddress } = req.body;

      // Validate at least one field is provided
      if (!name && !preferredLanguage && locationLatitude === undefined && locationLongitude === undefined && !locationAddress) {
        res.status(400).json({
          success: false,
          message: 'At least one field must be provided for update',
        });
        return;
      }

      const result = await this.authService.updateProfile(user.id, {
        name,
        preferredLanguage,
        locationLatitude,
        locationLongitude,
        locationAddress,
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * DELETE /api/auth/account
   * Delete user account and all associated data
   */
  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      const result = await this.authService.deleteAccount(user.id);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}
