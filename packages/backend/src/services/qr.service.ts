import QRCode from 'qrcode';

/**
 * QR Code Service
 * Handles QR code generation and decoding for product information
 */

export interface QRCodeData {
  productId: string;
  name: string;
  price: number;
  vendorId: string;
}

export class QRService {
  /**
   * Generate a QR code from product data
   * @param data Product information to encode
   * @returns Base64-encoded QR code image
   */
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      // Encode product data as JSON string
      const jsonData = JSON.stringify(data);
      
      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(jsonData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decode QR code data
   * Note: QR code decoding typically happens on the client side using camera/scanner.
   * This method validates and parses the JSON data that was encoded in the QR code.
   * 
   * @param encodedData The JSON string that was encoded in the QR code
   * @returns Parsed product data
   */
  decodeQRCode(encodedData: string): QRCodeData {
    try {
      const data = JSON.parse(encodedData);
      
      // Validate required fields
      if (!data.productId || !data.name || typeof data.price !== 'number' || !data.vendorId) {
        throw new Error('Invalid QR code data: missing required fields');
      }
      
      return {
        productId: data.productId,
        name: data.name,
        price: data.price,
        vendorId: data.vendorId,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid QR code data: not valid JSON');
      }
      throw error;
    }
  }

  /**
   * Generate QR code and return both the image and the encoded data
   * @param data Product information to encode
   * @returns Object containing QR code image and encoded data
   */
  async generateQRCodeWithData(data: QRCodeData): Promise<{ qrCode: string; encodedData: string }> {
    const encodedData = JSON.stringify(data);
    const qrCode = await this.generateQRCode(data);
    
    return {
      qrCode,
      encodedData,
    };
  }
}

// Export singleton instance
export const qrService = new QRService();
