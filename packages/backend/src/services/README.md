# Authentication Services

This directory contains the authentication services for the Multilingual Mandi platform, implementing phone-based OTP authentication as specified in Requirement 9.2.

## Overview

The authentication system uses a phone-based OTP (One-Time Password) flow with JWT tokens for session management. The system is designed to be secure, scalable, and user-friendly for vendors and buyers in Indian markets.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Request OTP
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Auth     │────▶│     OTP     │────▶│    Redis    │
│  Service    │     │   Service   │     │   (Store)   │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │                    │
       │ 2. Send OTP        │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│     SMS     │────▶│   Twilio    │
│   Service   │     │     API     │
└─────────────┘     └─────────────┘
       │
       │ 3. Verify OTP
       ▼
┌─────────────┐     ┌─────────────┐
│     JWT     │────▶│    User     │
│   Service   │     │ Repository  │
└─────────────┘     └─────────────┘
```

## Services

### 1. AuthService (`auth.service.ts`)

Main authentication service that orchestrates the OTP flow.

**Key Methods:**
- `requestOTP(phoneNumber: string)`: Generate and send OTP to phone number
- `verifyOTP(phoneNumber: string, otp: string, userInput?)`: Verify OTP and authenticate user
- `verifyToken(token: string)`: Verify JWT token and get user
- `refreshToken(token: string)`: Refresh an existing JWT token

**Example Usage:**
```typescript
const authService = new AuthService();

// Request OTP
const result = await authService.requestOTP('+919876543210');
// { success: true, message: 'OTP sent successfully', expiresIn: 600 }

// Verify OTP and register new user
const verifyResult = await authService.verifyOTP(
  '+919876543210',
  '123456',
  { name: 'John Doe', userType: 'vendor', preferredLanguage: 'hi' }
);
// { success: true, token: 'eyJhbGc...', user: {...} }

// Verify token
const user = await authService.verifyToken(token);
```

### 2. OTPService (`otp.service.ts`)

Manages OTP generation and storage in Redis.

**Key Methods:**
- `createOTP(phoneNumber: string)`: Generate 6-digit OTP and store in Redis
- `verifyOTP(phoneNumber: string, otp: string)`: Verify OTP and delete if valid
- `deleteOTP(phoneNumber: string)`: Manually delete OTP
- `hasOTP(phoneNumber: string)`: Check if OTP exists
- `getOTPTTL(phoneNumber: string)`: Get remaining time for OTP

**Configuration:**
- OTP Length: 6 digits
- Expiry Time: 10 minutes (configurable via `OTP_EXPIRY_MINUTES`)
- Storage: Redis with automatic TTL

**Example Usage:**
```typescript
const otpService = new OTPService();

// Generate OTP
const otp = await otpService.createOTP('+919876543210');
// '123456'

// Verify OTP
const isValid = await otpService.verifyOTP('+919876543210', '123456');
// true (and OTP is deleted)

// Check TTL
const ttl = await otpService.getOTPTTL('+919876543210');
// 540 (seconds remaining)
```

### 3. SMSService (`sms.service.ts`)

Handles SMS delivery via Twilio or mock provider.

**Providers:**
- `TwilioSMSProvider`: Production SMS via Twilio API
- `MockSMSProvider`: Testing provider that logs messages

**Key Methods:**
- `sendOTP(phoneNumber: string, otp: string)`: Send OTP message
- `sendMessage(phoneNumber: string, message: string)`: Send custom message

**Configuration:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

**Example Usage:**
```typescript
const smsService = new SMSService();

// Send OTP
await smsService.sendOTP('+919876543210', '123456');
// Sends: "Your Multilingual Mandi verification code is: 123456. Valid for 10 minutes."

// Send custom message
await smsService.sendMessage('+919876543210', 'Welcome to Multilingual Mandi!');
```

### 4. JWTService (`jwt.service.ts`)

Manages JWT token generation and verification.

**Key Methods:**
- `generateToken(payload: JWTPayload)`: Generate JWT token
- `verifyToken(token: string)`: Verify and decode token
- `decodeToken(token: string)`: Decode without verification (debugging)
- `refreshToken(token: string)`: Generate new token with same payload

**Token Payload:**
```typescript
interface JWTPayload {
  userId: string;
  phoneNumber: string;
  userType: 'vendor' | 'buyer';
}
```

**Configuration:**
```env
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

**Example Usage:**
```typescript
const jwtService = new JWTService();

// Generate token
const token = jwtService.generateToken({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  phoneNumber: '+919876543210',
  userType: 'vendor'
});

// Verify token
const payload = jwtService.verifyToken(token);
// { userId: '...', phoneNumber: '...', userType: 'vendor', iat: ..., exp: ... }

// Refresh token
const newToken = jwtService.refreshToken(token);
```

## API Endpoints

The authentication routes are defined in `routes/auth.routes.ts`:

### POST /api/auth/request-otp
Request OTP for phone number.

**Request:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

### POST /api/auth/verify-otp
Verify OTP and authenticate user.

**Request (Existing User):**
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Request (New User):**
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456",
  "name": "John Doe",
  "userType": "vendor",
  "preferredLanguage": "hi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "phoneNumber": "+919876543210",
    "name": "John Doe",
    "userType": "vendor",
    "preferredLanguage": "hi",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/auth/refresh-token
Refresh JWT token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
Get current authenticated user (requires Authorization header).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "phoneNumber": "+919876543210",
    "name": "John Doe",
    "userType": "vendor",
    "preferredLanguage": "hi",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Middleware

### authMiddleware
Protects routes by verifying JWT token.

**Usage:**
```typescript
import { authMiddleware } from '../middleware/auth.middleware';

router.get('/protected', authMiddleware(), (req, res) => {
  const user = req.user; // User attached by middleware
  res.json({ user });
});
```

### optionalAuthMiddleware
Attaches user if token provided, but doesn't fail if missing.

**Usage:**
```typescript
import { optionalAuthMiddleware } from '../middleware/auth.middleware';

router.get('/public', optionalAuthMiddleware(), (req, res) => {
  const user = req.user; // May be undefined
  res.json({ user: user || null });
});
```

## Security Features

1. **OTP Expiry**: OTPs expire after 10 minutes
2. **Single Use**: OTPs are deleted after successful verification
3. **JWT Expiry**: Tokens expire after 7 days (configurable)
4. **Phone Validation**: Basic phone number format validation
5. **Redis Storage**: OTPs stored in Redis with automatic TTL
6. **Secure Tokens**: JWT signed with secret key
7. **HTTPS Only**: All authentication endpoints should use HTTPS in production

## Testing

### Unit Tests
Located in `__tests__/` directories:
- `otp.service.test.ts`: OTP generation and verification
- `sms.service.test.ts`: SMS sending with mock provider
- `jwt.service.test.ts`: Token generation and verification
- `auth.service.test.ts`: Complete authentication flow

Run tests:
```bash
npm test -- --testPathPattern="services/__tests__"
```

### Integration Tests
Located in `src/__tests__/auth.integration.test.ts`:
- Complete OTP flow for new users
- Authentication for existing users
- Invalid OTP rejection
- OTP single-use enforcement

Run integration tests:
```bash
npm test -- --testPathPattern="auth.integration"
```

## Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# Twilio Configuration (for production)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Development vs Production

### Development
- Uses `MockSMSProvider` if Twilio credentials not configured
- OTPs logged to console
- Default JWT secret (with warning)

### Production
- Requires Twilio credentials
- OTPs sent via SMS
- Must set secure JWT secret
- Use HTTPS for all endpoints
- Consider rate limiting on OTP requests

## Error Handling

All services return structured error responses:

```typescript
{
  success: false,
  message: "Error description"
}
```

Common errors:
- Invalid phone number format
- Failed to send OTP
- Invalid or expired OTP
- User not found
- Invalid token
- Expired token

## Future Enhancements

1. **Rate Limiting**: Limit OTP requests per phone number
2. **Brute Force Protection**: Lock account after failed attempts
3. **Multi-Factor Authentication**: Add additional security layers
4. **Session Management**: Track active sessions
5. **Audit Logging**: Log all authentication events
6. **Phone Number Verification**: Verify phone ownership
7. **Backup Codes**: Provide backup authentication method
