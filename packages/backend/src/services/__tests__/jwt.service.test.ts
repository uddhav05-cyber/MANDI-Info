/**
 * Unit tests for JWT Service
 * Requirements: 9.2
 */

import { JWTService, JWTPayload } from '../jwt.service';

describe('JWTService', () => {
  let jwtService: JWTService;
  const testSecret = 'test-secret-key';
  const testExpiresIn = '1h';

  beforeEach(() => {
    jwtService = new JWTService(testSecret, testExpiresIn);
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload: JWTPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+919876543210',
        userType: 'vendor',
      };

      const token = jwtService.generateToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1: JWTPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+919876543210',
        userType: 'vendor',
      };

      const payload2: JWTPayload = {
        userId: '223e4567-e89b-12d3-a456-426614174001',
        phoneNumber: '+919876543211',
        userType: 'buyer',
      };

      const token1 = jwtService.generateToken(payload1);
      const token2 = jwtService.generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload: JWTPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+919876543210',
        userType: 'vendor',
      };

      const token = jwtService.generateToken(payload);
      const decoded = jwtService.verifyToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.phoneNumber).toBe(payload.phoneNumber);
      expect(decoded?.userType).toBe(payload.userType);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = jwtService.verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const payload: JWTPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+919876543210',
        userType: 'vendor',
      };

      const token = jwtService.generateToken(payload);

      // Create new service with different secret
      const otherService = new JWTService('different-secret');
      const decoded = otherService.verifyToken(token);

      expect(decoded).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload: JWTPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+919876543210',
        userType: 'vendor',
      };

      const token = jwtService.generateToken(payload);
      const decoded = jwtService.decodeToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.phoneNumber).toBe(payload.phoneNumber);
      expect(decoded?.userType).toBe(payload.userType);
    });

    it('should return null for malformed token', () => {
      const invalidToken = 'not-a-jwt';
      const decoded = jwtService.decodeToken(invalidToken);

      expect(decoded).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should generate new token with same payload', async () => {
      const payload: JWTPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        phoneNumber: '+919876543210',
        userType: 'vendor',
      };

      const originalToken = jwtService.generateToken(payload);
      
      // Wait a bit to ensure different iat (issued at) timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      const refreshedToken = jwtService.refreshToken(originalToken);

      expect(refreshedToken).toBeTruthy();
      expect(refreshedToken).not.toBe(originalToken);

      // Verify both tokens have same payload
      const originalDecoded = jwtService.verifyToken(originalToken);
      const refreshedDecoded = jwtService.verifyToken(refreshedToken!);

      expect(refreshedDecoded?.userId).toBe(originalDecoded?.userId);
      expect(refreshedDecoded?.phoneNumber).toBe(originalDecoded?.phoneNumber);
      expect(refreshedDecoded?.userType).toBe(originalDecoded?.userType);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const refreshedToken = jwtService.refreshToken(invalidToken);

      expect(refreshedToken).toBeNull();
    });
  });
});
