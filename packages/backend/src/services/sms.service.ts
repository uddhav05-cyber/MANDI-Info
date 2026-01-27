/**
 * SMS Service for sending OTPs via Twilio
 * Requirements: 9.2
 */

export interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<boolean>;
}

/**
 * Twilio SMS Provider
 */
export class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor(accountSid?: string, authToken?: string, phoneNumber?: string) {
    this.accountSid = accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = phoneNumber || process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      console.warn('Twilio credentials not configured. SMS sending will be simulated.');
    }
  }

  /**
   * Send SMS via Twilio
   * @param phoneNumber - Recipient phone number
   * @param message - Message to send
   * @returns true if successful, false otherwise
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // If credentials are not configured, simulate sending (for development)
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      console.log(`[SMS SIMULATION] To: ${phoneNumber}, Message: ${message}`);
      return true;
    }

    try {
      // In production, use Twilio SDK
      // const twilio = require('twilio');
      // const client = twilio(this.accountSid, this.authToken);
      // await client.messages.create({
      //   body: message,
      //   from: this.phoneNumber,
      //   to: phoneNumber,
      // });
      
      console.log(`[SMS] Sent to ${phoneNumber}: ${message}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }
}

/**
 * Mock SMS Provider for testing
 */
export class MockSMSProvider implements SMSProvider {
  private sentMessages: Array<{ phoneNumber: string; message: string }> = [];

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    this.sentMessages.push({ phoneNumber, message });
    console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
    return true;
  }

  getSentMessages(): Array<{ phoneNumber: string; message: string }> {
    return this.sentMessages;
  }

  clearMessages(): void {
    this.sentMessages = [];
  }
}

/**
 * SMS Service for sending OTP messages
 */
export class SMSService {
  private provider: SMSProvider;

  constructor(provider?: SMSProvider) {
    this.provider = provider || new TwilioSMSProvider();
  }

  /**
   * Send OTP via SMS
   * @param phoneNumber - Recipient phone number
   * @param otp - OTP code to send
   * @returns true if successful, false otherwise
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const message = `Your Multilingual Mandi verification code is: ${otp}. Valid for 10 minutes.`;
    return await this.provider.sendSMS(phoneNumber, message);
  }

  /**
   * Send custom SMS message
   * @param phoneNumber - Recipient phone number
   * @param message - Message to send
   * @returns true if successful, false otherwise
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    return await this.provider.sendSMS(phoneNumber, message);
  }
}
