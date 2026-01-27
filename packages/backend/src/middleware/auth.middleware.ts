/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 * Requirements: 9.2
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authMiddleware = (authService?: AuthService) => {
  const service = authService || new AuthService();

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'No authorization token provided',
        });
        return;
      }

      // Extract token (format: "Bearer <token>")
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          success: false,
          message: 'Invalid authorization header format',
        });
        return;
      }

      const token = parts[1];

      // Verify token and get user
      const user = await service.verifyToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
        return;
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Error in auth middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = (authService?: AuthService) => {
  const service = authService || new AuthService();

  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          const token = parts[1];
          const user = await service.verifyToken(token);
          if (user) {
            req.user = user;
          }
        }
      }

      next();
    } catch (error) {
      console.error('Error in optional auth middleware:', error);
      next();
    }
  };
};
