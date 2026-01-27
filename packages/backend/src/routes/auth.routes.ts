/**
 * Authentication Routes
 * Requirements: 9.2
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const createAuthRouter = (authController?: AuthController): Router => {
  const router = Router();
  const controller = authController || new AuthController();

  // POST /api/auth/request-otp - Request OTP for phone number
  router.post('/request-otp', controller.requestOTP);

  // POST /api/auth/verify-otp - Verify OTP and authenticate
  router.post('/verify-otp', controller.verifyOTP);

  // POST /api/auth/refresh-token - Refresh JWT token
  router.post('/refresh-token', controller.refreshToken);

  // GET /api/auth/me - Get current authenticated user (requires auth)
  router.get('/me', authMiddleware(), controller.getCurrentUser);

  // PUT /api/auth/profile - Update user profile (requires auth)
  router.put('/profile', authMiddleware(), controller.updateProfile);

  // DELETE /api/auth/account - Delete user account (requires auth)
  router.delete('/account', authMiddleware(), controller.deleteAccount);

  return router;
};
