/**
 * Unit tests for Auth Middleware
 * Requirements: 9.2
 */

import { Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../auth.middleware';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/types';

// Mock AuthService
jest.mock('../../services/auth.service');

describe('Auth Middleware', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

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
    // Reset mocks
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    mockAuthService.verifyToken = jest.fn();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should attach user to request for valid token', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockResolvedValue(mockUser);

      const middleware = authMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header', async () => {
      mockRequest.headers = {};

      const middleware = authMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authorization token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid authorization header format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      const middleware = authMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for missing Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'token.without.bearer',
      };

      const middleware = authMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization header format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      const token = 'invalid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockResolvedValue(null);

      const middleware = authMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on internal error', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Internal error'));

      const middleware = authMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work without injected AuthService', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Mock the default AuthService constructor
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => {
        return {
          verifyToken: jest.fn().mockResolvedValue(mockUser),
        } as any;
      });

      const middleware = authMiddleware();
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should attach user to request for valid token', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockResolvedValue(mockUser);

      const middleware = optionalAuthMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user when no authorization header', async () => {
      mockRequest.headers = {};

      const middleware = optionalAuthMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user for invalid token', async () => {
      const token = 'invalid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockResolvedValue(null);

      const middleware = optionalAuthMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user for invalid header format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      const middleware = optionalAuthMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user on internal error', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthService.verifyToken.mockRejectedValue(new Error('Internal error'));

      const middleware = optionalAuthMiddleware(mockAuthService);
      await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
