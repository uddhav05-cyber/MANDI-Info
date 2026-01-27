/**
 * Auth Service Property-Based Tests
 * Feature: multilingual-mandi, Property 20: OTP Authentication Round-Trip
 * 
 * **Validates: Requirements 9.2**
 * 
 * Property 20: OTP Authentication Round-Trip
 * For any phone number, requesting an OTP should generate a valid code that,
 * when verified within the expiration window, successfully authenticates the user.
 */

import * as fc from 'fast-check';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { OTPService } from '../otp.service';
import { SMSService, MockSMSProvider } from '../sms.service';
import { JWTService } from '../jwt.service';
import { User } from '../../models/types';

// Mock the dependencies to avoid real database/Redis connections
jest.mock('../../repositories/user.repository');
jest.mock('../otp.service');

describe('Auth Service - Property-Based Tests', () => {
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockOTPService: jest.Mocked<OTPService>;
  let smsService: SMSService;
  let jwtService: JWTService;
  let authService: AuthService;

  // Store OTPs in memory for testing
  const otpStore = new Map<string, { otp: string; expiresAt: number }>();

  beforeAll(() => {
    // Initialize real services that don't need external connections
    smsService = new SMSService(new MockSMSProvider());
    jwtService = new JWTService('test-secret-key', '1h');
  });

  beforeEach(() => {
    // Clear OTP store
    otpStore.clear();

    // Create mocks
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockOTPService = new OTPService() as jest.Mocked<OTPService>;

    // Mock OTPService methods
    mockOTPService.createOTP = jest.fn().mockImplementation(async (phoneNumber: string) => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(phoneNumber, { otp, expiresAt });
      return otp;
    });

    mockOTPService.verifyOTP = jest.fn().mockImplementation(async (phoneNumber: string, otp: string) => {
      const stored = otpStore.get(phoneNumber);
      if (!stored) return false;
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(phoneNumber);
        return false;
      }
      if (stored.otp === otp) {
        otpStore.delete(phoneNumber);
        return true;
      }
      return false;
    });

    mockOTPService.deleteOTP = jest.fn().mockImplementation(async (phoneNumber: string) => {
      otpStore.delete(phoneNumber);
    });

    mockOTPService.getOTPTTL = jest.fn().mockImplementation(async (phoneNumber: string) => {
      const stored = otpStore.get(phoneNumber);
      if (!stored) return -1;
      const ttl = Math.floor((stored.expiresAt - Date.now()) / 1000);
      return ttl > 0 ? ttl : -1;
    });

    mockOTPService.hasOTP = jest.fn().mockImplementation(async (phoneNumber: string) => {
      const stored = otpStore.get(phoneNumber);
      if (!stored) return false;
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(phoneNumber);
        return false;
      }
      return true;
    });

    // Mock UserRepository methods
    const userStore = new Map<string, User>();
    
    mockUserRepository.findByPhoneNumber = jest.fn().mockImplementation(async (phoneNumber: string) => {
      for (const user of userStore.values()) {
        if (user.phoneNumber === phoneNumber) {
          return user;
        }
      }
      return null;
    });

    mockUserRepository.create = jest.fn().mockImplementation(async (input: any) => {
      const user: User = {
        id: `user-${Date.now()}-${Math.random()}`,
        phoneNumber: input.phoneNumber,
        name: input.name,
        userType: input.userType,
        preferredLanguage: input.preferredLanguage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userStore.set(user.id, user);
      return user;
    });

    mockUserRepository.findById = jest.fn().mockImplementation(async (id: string) => {
      return userStore.get(id) || null;
    });

    mockUserRepository.deleteById = jest.fn().mockImplementation(async (id: string) => {
      return userStore.delete(id);
    });

    // Create auth service with mocked dependencies
    authService = new AuthService(
      mockUserRepository,
      mockOTPService,
      smsService,
      jwtService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    otpStore.clear();
  });


  // Arbitrary for generating valid phone numbers
  // Format: +[country code][number] (10-15 digits total)
  const phoneNumberArb = fc
    .tuple(
      fc.constantFrom('1', '44', '91', '86', '81', '49', '33', '39', '34', '61'), // Country codes
      fc.integer({ min: 1000000000, max: 9999999999 }) // 10-digit number
    )
    .map(([countryCode, number]) => `+${countryCode}${number}`);

  // Arbitrary for generating valid user names
  const userNameArb = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

  // Arbitrary for generating user types
  const userTypeArb = fc.constantFrom('vendor', 'buyer') as fc.Arbitrary<
    'vendor' | 'buyer'
  >;

  // Arbitrary for generating language codes
  const languageArb = fc.constantFrom('en', 'hi', 'bho', 'mr', 'ta', 'te', 'bn');

  // Arbitrary for generating user registration data
  const userRegistrationArb = fc.record({
    name: userNameArb,
    userType: userTypeArb,
    preferredLanguage: languageArb,
  });

  describe('Property 19: User Registration Data Completeness', () => {
    it('should store complete user registration data (name, phone number, user type)', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneNumberArb,
          userRegistrationArb,
          async (phoneNumber, userInput) => {
            // Step 1: Request OTP for registration
            const requestResult = await authService.requestOTP(phoneNumber);
            expect(requestResult.success).toBe(true);

            // Step 2: Get the OTP
            const stored = otpStore.get(phoneNumber);
            expect(stored).toBeTruthy();
            const otp = stored!.otp;

            // Step 3: Verify OTP and register user
            const verifyResult = await authService.verifyOTP(
              phoneNumber,
              otp,
              userInput
            );

            // Verify registration was successful
            expect(verifyResult.success).toBe(true);
            expect(verifyResult.user).toBeTruthy();

            // Step 4: Verify all required fields are present and correct
            const user = verifyResult.user!;

            // Property 19: User Registration Data Completeness
            // **Validates: Requirements 9.1**
            // For any new user registration, the stored user record should contain
            // name, phone number, and user type (vendor or buyer)

            // Verify phone number is stored
            expect(user.phoneNumber).toBeDefined();
            expect(user.phoneNumber).toBe(phoneNumber);
            expect(typeof user.phoneNumber).toBe('string');
            expect(user.phoneNumber.length).toBeGreaterThan(0);

            // Verify name is stored
            expect(user.name).toBeDefined();
            expect(user.name).toBe(userInput.name);
            expect(typeof user.name).toBe('string');
            expect(user.name.length).toBeGreaterThan(0);

            // Verify user type is stored
            expect(user.userType).toBeDefined();
            expect(user.userType).toBe(userInput.userType);
            expect(['vendor', 'buyer']).toContain(user.userType);

            // Step 5: Verify user can be retrieved from repository
            const retrievedUser = await mockUserRepository.findById(user.id);
            expect(retrievedUser).toBeTruthy();

            // Verify retrieved user has complete data
            expect(retrievedUser!.phoneNumber).toBe(phoneNumber);
            expect(retrievedUser!.name).toBe(userInput.name);
            expect(retrievedUser!.userType).toBe(userInput.userType);

            // Step 6: Verify user can be found by phone number
            const userByPhone = await mockUserRepository.findByPhoneNumber(phoneNumber);
            expect(userByPhone).toBeTruthy();
            expect(userByPhone!.id).toBe(user.id);
            expect(userByPhone!.phoneNumber).toBe(phoneNumber);
            expect(userByPhone!.name).toBe(userInput.name);
            expect(userByPhone!.userType).toBe(userInput.userType);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // 1 minute timeout for property test

    it('should maintain data completeness for vendor registrations', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneNumberArb,
          userNameArb,
          languageArb,
          async (phoneNumber, name, language) => {
            // Create vendor-specific registration
            const vendorInput = {
              name,
              userType: 'vendor' as const,
              preferredLanguage: language,
            };

            // Request and verify OTP
            await authService.requestOTP(phoneNumber);
            const stored = otpStore.get(phoneNumber);
            const otp = stored!.otp;

            // Register vendor
            const result = await authService.verifyOTP(
              phoneNumber,
              otp,
              vendorInput
            );

            expect(result.success).toBe(true);
            expect(result.user).toBeTruthy();

            // Verify vendor-specific data completeness
            const user = result.user!;
            expect(user.phoneNumber).toBe(phoneNumber);
            expect(user.name).toBe(name);
            expect(user.userType).toBe('vendor');
            expect(user.preferredLanguage).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);

    it('should maintain data completeness for buyer registrations', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneNumberArb,
          userNameArb,
          languageArb,
          async (phoneNumber, name, language) => {
            // Create buyer-specific registration
            const buyerInput = {
              name,
              userType: 'buyer' as const,
              preferredLanguage: language,
            };

            // Request and verify OTP
            await authService.requestOTP(phoneNumber);
            const stored = otpStore.get(phoneNumber);
            const otp = stored!.otp;

            // Register buyer
            const result = await authService.verifyOTP(
              phoneNumber,
              otp,
              buyerInput
            );

            expect(result.success).toBe(true);
            expect(result.user).toBeTruthy();

            // Verify buyer-specific data completeness
            const user = result.user!;
            expect(user.phoneNumber).toBe(phoneNumber);
            expect(user.name).toBe(name);
            expect(user.userType).toBe('buyer');
            expect(user.preferredLanguage).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);

    it('should reject registration with missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(phoneNumberArb, async (phoneNumber) => {
          // Request OTP
          await authService.requestOTP(phoneNumber);
          const stored = otpStore.get(phoneNumber);
          const otp = stored!.otp;

          // Try to verify OTP without providing user registration data
          const result = await authService.verifyOTP(phoneNumber, otp);

          // Should fail because user doesn't exist and no registration data provided
          expect(result.success).toBe(false);
          expect(result.message).toBe('User not found. Please provide registration details.');
          expect(result.user).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('should preserve data completeness across multiple registrations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              phoneNumber: phoneNumberArb,
              registration: userRegistrationArb,
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (registrations) => {
            // Ensure unique phone numbers
            const uniqueRegistrations = registrations.filter(
              (reg, index, self) =>
                index === self.findIndex((r) => r.phoneNumber === reg.phoneNumber)
            );

            if (uniqueRegistrations.length < 2) {
              return; // Skip if not enough unique phone numbers
            }

            const registeredUsers: User[] = [];

            // Register all users
            for (const { phoneNumber, registration } of uniqueRegistrations) {
              await authService.requestOTP(phoneNumber);
              const stored = otpStore.get(phoneNumber);
              const otp = stored!.otp;

              const result = await authService.verifyOTP(
                phoneNumber,
                otp,
                registration
              );

              expect(result.success).toBe(true);
              expect(result.user).toBeTruthy();
              registeredUsers.push(result.user!);
            }

            // Verify all users have complete data
            for (let i = 0; i < registeredUsers.length; i++) {
              const user = registeredUsers[i];
              const original = uniqueRegistrations[i];

              expect(user.phoneNumber).toBe(original.phoneNumber);
              expect(user.name).toBe(original.registration.name);
              expect(user.userType).toBe(original.registration.userType);
              expect(user.preferredLanguage).toBe(
                original.registration.preferredLanguage
              );

              // Verify user can still be retrieved
              const retrieved = await mockUserRepository.findById(user.id);
              expect(retrieved).toBeTruthy();
              expect(retrieved!.phoneNumber).toBe(original.phoneNumber);
              expect(retrieved!.name).toBe(original.registration.name);
              expect(retrieved!.userType).toBe(original.registration.userType);
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 120000); // 2 minute timeout for this more complex test
  });

  describe('Property 20: OTP Authentication Round-Trip', () => {
    it('should successfully authenticate with valid OTP within expiration window', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneNumberArb,
          userRegistrationArb,
          async (phoneNumber, userInput) => {
            // Step 1: Request OTP
            const requestResult = await authService.requestOTP(phoneNumber);

            // Verify OTP request was successful
            expect(requestResult.success).toBe(true);
            expect(requestResult.message).toBe('OTP sent successfully');
            expect(requestResult.expiresIn).toBeGreaterThan(0);

            // Step 2: Verify that OTP exists
            const otpExists = await mockOTPService.hasOTP(phoneNumber);
            expect(otpExists).toBe(true);

            // Step 3: Get the OTP TTL to ensure it's within expiration window
            const ttl = await mockOTPService.getOTPTTL(phoneNumber);
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(600); // 10 minutes max

            // Step 4: Retrieve the OTP from our store
            const stored = otpStore.get(phoneNumber);
            expect(stored).toBeTruthy();
            expect(stored!.otp).toMatch(/^\d{6}$/); // 6-digit OTP

            // Step 5: Verify OTP and authenticate
            const verifyResult = await authService.verifyOTP(
              phoneNumber,
              stored!.otp,
              userInput
            );

            // Verify authentication was successful
            expect(verifyResult.success).toBe(true);
            expect(verifyResult.message).toBe('Authentication successful');
            expect(verifyResult.token).toBeTruthy();
            expect(verifyResult.user).toBeTruthy();

            // Step 6: Verify user data is correct
            expect(verifyResult.user?.phoneNumber).toBe(phoneNumber);
            expect(verifyResult.user?.name).toBe(userInput.name);
            expect(verifyResult.user?.userType).toBe(userInput.userType);
            expect(verifyResult.user?.preferredLanguage).toBe(
              userInput.preferredLanguage
            );

            // Step 7: Verify JWT token is valid
            const tokenPayload = jwtService.verifyToken(verifyResult.token!);
            expect(tokenPayload).toBeTruthy();
            expect(tokenPayload?.phoneNumber).toBe(phoneNumber);
            expect(tokenPayload?.userType).toBe(userInput.userType);

            // Step 8: Verify OTP is deleted after successful verification
            const otpExistsAfter = await mockOTPService.hasOTP(phoneNumber);
            expect(otpExistsAfter).toBe(false);

            // Step 9: Verify user can be retrieved with token
            const retrievedUser = await authService.verifyToken(
              verifyResult.token!
            );
            expect(retrievedUser).toBeTruthy();
            expect(retrievedUser?.id).toBe(verifyResult.user?.id);
            expect(retrievedUser?.phoneNumber).toBe(phoneNumber);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 1 minute timeout for property test

    it('should reject authentication with invalid OTP', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneNumberArb,
          fc.string({ minLength: 6, maxLength: 6 }).filter((s) => /^\d{6}$/.test(s)),
          async (phoneNumber, invalidOTP) => {
            // Step 1: Request OTP
            const requestResult = await authService.requestOTP(phoneNumber);
            expect(requestResult.success).toBe(true);

            // Step 2: Get the actual OTP
            const stored = otpStore.get(phoneNumber);
            const actualOTP = stored?.otp;

            // Ensure invalidOTP is different from actualOTP
            if (invalidOTP === actualOTP) {
              // Skip this test case if randomly generated invalid OTP matches actual OTP
              return;
            }

            // Step 3: Try to verify with invalid OTP
            const verifyResult = await authService.verifyOTP(
              phoneNumber,
              invalidOTP
            );

            // Verify authentication failed
            expect(verifyResult.success).toBe(false);
            expect(verifyResult.message).toBe('Invalid or expired OTP');
            expect(verifyResult.token).toBeUndefined();
            expect(verifyResult.user).toBeUndefined();

            // Step 4: Verify OTP still exists (not deleted on failed verification)
            const otpExists = await mockOTPService.hasOTP(phoneNumber);
            expect(otpExists).toBe(true);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 1 minute timeout for property test

    it('should reject authentication after OTP expiration', async () => {
      await fc.assert(
        fc.asyncProperty(phoneNumberArb, async (phoneNumber) => {
          // Step 1: Request OTP
          const requestResult = await authService.requestOTP(phoneNumber);
          expect(requestResult.success).toBe(true);

          // Step 2: Get the OTP before it expires
          const stored = otpStore.get(phoneNumber);
          expect(stored).toBeTruthy();
          const storedOTP = stored!.otp;

          // Step 3: Manually expire the OTP by setting expiresAt to past
          otpStore.set(phoneNumber, {
            otp: storedOTP,
            expiresAt: Date.now() - 1000, // 1 second in the past
          });

          // Step 4: Try to verify expired OTP
          const verifyResult = await authService.verifyOTP(
            phoneNumber,
            storedOTP
          );

          // Verify authentication failed due to expiration
          expect(verifyResult.success).toBe(false);
          expect(verifyResult.message).toBe('Invalid or expired OTP');
          expect(verifyResult.token).toBeUndefined();
          expect(verifyResult.user).toBeUndefined();

          // Step 5: Verify OTP no longer exists
          const otpExists = await mockOTPService.hasOTP(phoneNumber);
          expect(otpExists).toBe(false);
        }),
        { numRuns: 5 }
      );
    }, 60000); // 1 minute timeout for property test

    it('should handle multiple OTP requests for same phone number', async () => {
      await fc.assert(
        fc.asyncProperty(phoneNumberArb, async (phoneNumber) => {
          // Step 1: Request first OTP
          const firstRequest = await authService.requestOTP(phoneNumber);
          expect(firstRequest.success).toBe(true);

          const firstStored = otpStore.get(phoneNumber);
          const firstOTP = firstStored?.otp;
          expect(firstOTP).toBeTruthy();

          // Step 2: Request second OTP (should overwrite first)
          const secondRequest = await authService.requestOTP(phoneNumber);
          expect(secondRequest.success).toBe(true);

          const secondStored = otpStore.get(phoneNumber);
          const secondOTP = secondStored?.otp;
          expect(secondOTP).toBeTruthy();

          // Step 3: Verify first OTP no longer works (if different)
          if (firstOTP !== secondOTP) {
            const verifyFirstResult = await authService.verifyOTP(
              phoneNumber,
              firstOTP!
            );
            expect(verifyFirstResult.success).toBe(false);
          }

          // Step 4: Verify second OTP works
          const verifySecondResult = await authService.verifyOTP(
            phoneNumber,
            secondOTP!,
            {
              name: 'Test User',
              userType: 'buyer',
              preferredLanguage: 'en',
            }
          );
          expect(verifySecondResult.success).toBe(true);
          expect(verifySecondResult.token).toBeTruthy();
        }),
        { numRuns: 5 }
      );
    }, 60000); // 1 minute timeout for property test

    it('should maintain OTP isolation between different phone numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneNumberArb,
          phoneNumberArb,
          async (phoneNumber1, phoneNumber2) => {
            // Ensure phone numbers are different
            if (phoneNumber1 === phoneNumber2) {
              return;
            }

            // Step 1: Request OTPs for both phone numbers
            const request1 = await authService.requestOTP(phoneNumber1);
            const request2 = await authService.requestOTP(phoneNumber2);

            expect(request1.success).toBe(true);
            expect(request2.success).toBe(true);

            // Step 2: Get both OTPs
            const stored1 = otpStore.get(phoneNumber1);
            const stored2 = otpStore.get(phoneNumber2);
            const otp1 = stored1?.otp;
            const otp2 = stored2?.otp;

            expect(otp1).toBeTruthy();
            expect(otp2).toBeTruthy();

            // Step 3: Verify OTP1 doesn't work for phoneNumber2
            const crossVerify = await authService.verifyOTP(phoneNumber2, otp1!);
            expect(crossVerify.success).toBe(false);

            // Step 4: Verify each OTP works for its own phone number
            const verify1 = await authService.verifyOTP(phoneNumber1, otp1!, {
              name: 'User 1',
              userType: 'vendor',
              preferredLanguage: 'en',
            });
            const verify2 = await authService.verifyOTP(phoneNumber2, otp2!, {
              name: 'User 2',
              userType: 'buyer',
              preferredLanguage: 'hi',
            });

            expect(verify1.success).toBe(true);
            expect(verify2.success).toBe(true);
            expect(verify1.user?.phoneNumber).toBe(phoneNumber1);
            expect(verify2.user?.phoneNumber).toBe(phoneNumber2);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 1 minute timeout for property test
  });
});
