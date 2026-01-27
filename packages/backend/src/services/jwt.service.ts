/**
 * JWT Service for token generation and verification
 * Requirements: 9.2
 */

import jwt, { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  userType: 'vendor' | 'buyer';
}

export class JWTService {
  private secret: string;
  private expiresIn: string;

  constructor(secret?: string, expiresIn?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.expiresIn = expiresIn || process.env.JWT_EXPIRES_IN || '7d';

    if (this.secret === 'default-secret-change-in-production') {
      console.warn('Using default JWT secret. Please set JWT_SECRET in production!');
    }
  }

  /**
   * Generate JWT token
   * @param payload - Token payload
   * @returns JWT token string
   */
  generateToken(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as any, // Type assertion needed for string expiry format
    };
    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Verify JWT token
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode JWT token without verification (for debugging)
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh token (generate new token with same payload)
   * @param token - Existing JWT token
   * @returns New JWT token or null if invalid
   */
  refreshToken(token: string): string | null {
    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    // Remove JWT standard claims before regenerating
    const { userId, phoneNumber, userType } = payload;
    return this.generateToken({ userId, phoneNumber, userType });
  }
}
