/**
 * Authentication System Usage Examples
 * Requirements: 9.2
 * 
 * This file demonstrates how to use the phone-based OTP authentication system.
 */

import { AuthService } from '../services/auth.service';
import { OTPService } from '../services/otp.service';
import { SMSService, MockSMSProvider } from '../services/sms.service';
import { JWTService } from '../services/jwt.service';
import { UserRepository } from '../repositories/user.repository';

/**
 * Example 1: Complete authentication flow for a new user
 */
async function authenticateNewUser() {
  const authService = new AuthService();
  const phoneNumber = '+919876543210';

  try {
    // Step 1: Request OTP
    console.log('Step 1: Requesting OTP...');
    const requestResult = await authService.requestOTP(phoneNumber);
    
    if (!requestResult.success) {
      console.error('Failed to request OTP:', requestResult.message);
      return;
    }
    
    console.log('OTP sent successfully!');
    console.log(`Expires in: ${requestResult.expiresIn} seconds`);

    // Step 2: User receives OTP via SMS and enters it
    const otp = '123456'; // In real app, user would enter this

    // Step 3: Verify OTP and register user
    console.log('\nStep 2: Verifying OTP and registering user...');
    const verifyResult = await authService.verifyOTP(phoneNumber, otp, {
      name: 'Rajesh Kumar',
      userType: 'vendor',
      preferredLanguage: 'hi',
    });

    if (!verifyResult.success) {
      console.error('Failed to verify OTP:', verifyResult.message);
      return;
    }

    console.log('Authentication successful!');
    console.log('User:', verifyResult.user);
    console.log('Token:', verifyResult.token);

    // Step 4: Use token for authenticated requests
    console.log('\nStep 3: Verifying token...');
    const user = await authService.verifyToken(verifyResult.token!);
    console.log('Token verified! User:', user);

  } catch (error) {
    console.error('Error during authentication:', error);
  } finally {
    await authService.cleanup();
  }
}

/**
 * Example 2: Authenticate existing user
 */
async function authenticateExistingUser() {
  const authService = new AuthService();
  const phoneNumber = '+919876543210';

  try {
    // Step 1: Request OTP
    const requestResult = await authService.requestOTP(phoneNumber);
    
    if (!requestResult.success) {
      console.error('Failed to request OTP:', requestResult.message);
      return;
    }

    // Step 2: Verify OTP (no registration data needed for existing user)
    const otp = '123456';
    const verifyResult = await authService.verifyOTP(phoneNumber, otp);

    if (!verifyResult.success) {
      console.error('Failed to verify OTP:', verifyResult.message);
      return;
    }

    console.log('Welcome back!');
    console.log('User:', verifyResult.user);
    console.log('Token:', verifyResult.token);

  } catch (error) {
    console.error('Error during authentication:', error);
  } finally {
    await authService.cleanup();
  }
}

/**
 * Example 3: Using individual services
 */
async function useIndividualServices() {
  // Initialize services
  const otpService = new OTPService();
  const smsService = new SMSService(new MockSMSProvider());
  const jwtService = new JWTService();
  const userRepository = new UserRepository();

  const phoneNumber = '+919876543210';

  try {
    // Generate OTP
    console.log('Generating OTP...');
    const otp = await otpService.createOTP(phoneNumber);
    console.log('OTP generated:', otp);

    // Send OTP via SMS
    console.log('\nSending OTP via SMS...');
    const smsSent = await smsService.sendOTP(phoneNumber, otp);
    console.log('SMS sent:', smsSent);

    // Verify OTP
    console.log('\nVerifying OTP...');
    const isValid = await otpService.verifyOTP(phoneNumber, otp);
    console.log('OTP valid:', isValid);

    // Find or create user
    let user = await userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      console.log('\nCreating new user...');
      user = await userRepository.create({
        phoneNumber,
        name: 'Test User',
        userType: 'buyer',
        preferredLanguage: 'en',
      });
    }
    console.log('User:', user);

    // Generate JWT token
    console.log('\nGenerating JWT token...');
    const token = jwtService.generateToken({
      userId: user.id,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
    });
    console.log('Token:', token);

    // Verify token
    console.log('\nVerifying token...');
    const payload = jwtService.verifyToken(token);
    console.log('Token payload:', payload);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await otpService.disconnect();
  }
}

/**
 * Example 4: Token refresh
 */
async function refreshTokenExample() {
  const jwtService = new JWTService();

  // Generate initial token
  const token = jwtService.generateToken({
    userId: '123e4567-e89b-12d3-a456-426614174000',
    phoneNumber: '+919876543210',
    userType: 'vendor',
  });

  console.log('Original token:', token);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Refresh token
  const newToken = jwtService.refreshToken(token);
  console.log('Refreshed token:', newToken);

  // Verify both tokens have same payload
  const originalPayload = jwtService.verifyToken(token);
  const refreshedPayload = jwtService.verifyToken(newToken!);

  console.log('\nOriginal payload:', originalPayload);
  console.log('Refreshed payload:', refreshedPayload);
  console.log('Same user?', originalPayload?.userId === refreshedPayload?.userId);
}

/**
 * Example 5: Error handling
 */
async function errorHandlingExample() {
  const authService = new AuthService();

  try {
    // Invalid phone number
    console.log('Testing invalid phone number...');
    const result1 = await authService.requestOTP('123');
    console.log('Result:', result1);

    // Invalid OTP
    console.log('\nTesting invalid OTP...');
    const result2 = await authService.verifyOTP('+919876543210', '000000');
    console.log('Result:', result2);

    // Invalid token
    console.log('\nTesting invalid token...');
    const user = await authService.verifyToken('invalid.token.here');
    console.log('User:', user);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await authService.cleanup();
  }
}

/**
 * Example 6: Using with Express routes
 */
function expressRouteExample() {
  // This is a conceptual example showing how to use in Express routes
  
  /*
  import express from 'express';
  import { AuthController } from '../controllers/auth.controller';
  import { authMiddleware } from '../middleware/auth.middleware';

  const app = express();
  const authController = new AuthController();

  // Public routes
  app.post('/api/auth/request-otp', authController.requestOTP);
  app.post('/api/auth/verify-otp', authController.verifyOTP);
  app.post('/api/auth/refresh-token', authController.refreshToken);

  // Protected routes
  app.get('/api/auth/me', authMiddleware(), authController.getCurrentUser);

  // Protected vendor route
  app.get('/api/vendor/dashboard', authMiddleware(), (req, res) => {
    const user = req.user;
    if (user.userType !== 'vendor') {
      return res.status(403).json({ error: 'Vendors only' });
    }
    res.json({ message: 'Welcome to vendor dashboard', user });
  });
  */

  console.log('See comments in code for Express route examples');
}

// Run examples (uncomment to test)
// authenticateNewUser();
// authenticateExistingUser();
// useIndividualServices();
// refreshTokenExample();
// errorHandlingExample();
// expressRouteExample();

export {
  authenticateNewUser,
  authenticateExistingUser,
  useIndividualServices,
  refreshTokenExample,
  errorHandlingExample,
  expressRouteExample,
};
