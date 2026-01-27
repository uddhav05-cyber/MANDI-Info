/**
 * Unit tests for SMS Service
 * Requirements: 9.2
 */

import { SMSService, MockSMSProvider, TwilioSMSProvider } from '../sms.service';

describe('SMSService', () => {
  describe('with MockSMSProvider', () => {
    let smsService: SMSService;
    let mockProvider: MockSMSProvider;

    beforeEach(() => {
      mockProvider = new MockSMSProvider();
      smsService = new SMSService(mockProvider);
    });

    describe('sendOTP', () => {
      it('should send OTP message', async () => {
        const phoneNumber = '+919876543210';
        const otp = '123456';

        const result = await smsService.sendOTP(phoneNumber, otp);

        expect(result).toBe(true);

        const sentMessages = mockProvider.getSentMessages();
        expect(sentMessages).toHaveLength(1);
        expect(sentMessages[0].phoneNumber).toBe(phoneNumber);
        expect(sentMessages[0].message).toContain(otp);
        expect(sentMessages[0].message).toContain('Multilingual Mandi');
        expect(sentMessages[0].message).toContain('10 minutes');
      });

      it('should format OTP message correctly', async () => {
        const phoneNumber = '+919876543210';
        const otp = '654321';

        await smsService.sendOTP(phoneNumber, otp);

        const sentMessages = mockProvider.getSentMessages();
        const message = sentMessages[0].message;

        expect(message).toBe(
          `Your Multilingual Mandi verification code is: ${otp}. Valid for 10 minutes.`
        );
      });
    });

    describe('sendMessage', () => {
      it('should send custom message', async () => {
        const phoneNumber = '+919876543210';
        const customMessage = 'Welcome to Multilingual Mandi!';

        const result = await smsService.sendMessage(phoneNumber, customMessage);

        expect(result).toBe(true);

        const sentMessages = mockProvider.getSentMessages();
        expect(sentMessages).toHaveLength(1);
        expect(sentMessages[0].phoneNumber).toBe(phoneNumber);
        expect(sentMessages[0].message).toBe(customMessage);
      });
    });

    describe('MockSMSProvider', () => {
      it('should track multiple messages', async () => {
        await mockProvider.sendSMS('+919876543210', 'Message 1');
        await mockProvider.sendSMS('+919876543211', 'Message 2');
        await mockProvider.sendSMS('+919876543212', 'Message 3');

        const sentMessages = mockProvider.getSentMessages();
        expect(sentMessages).toHaveLength(3);
      });

      it('should clear messages', async () => {
        await mockProvider.sendSMS('+919876543210', 'Message 1');
        await mockProvider.sendSMS('+919876543211', 'Message 2');

        expect(mockProvider.getSentMessages()).toHaveLength(2);

        mockProvider.clearMessages();

        expect(mockProvider.getSentMessages()).toHaveLength(0);
      });
    });
  });

  describe('with TwilioSMSProvider', () => {
    let twilioProvider: TwilioSMSProvider;

    beforeEach(() => {
      // Create provider without credentials (will simulate)
      twilioProvider = new TwilioSMSProvider('', '', '');
    });

    it('should simulate sending when credentials not configured', async () => {
      const phoneNumber = '+919876543210';
      const message = 'Test message';

      // Should not throw and return true (simulated)
      const result = await twilioProvider.sendSMS(phoneNumber, message);
      expect(result).toBe(true);
    });
  });
});
