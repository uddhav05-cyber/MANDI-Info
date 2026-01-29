import { QRService, QRCodeData } from '../qr.service';

describe('QRService', () => {
  let qrService: QRService;

  beforeEach(() => {
    qrService = new QRService();
  });

  describe('generateQRCode', () => {
    it('should generate a QR code from product data', async () => {
      const data: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const qrCode = await qrService.generateQRCode(data);

      // QR code should be a base64 data URL
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
      expect(qrCode.length).toBeGreaterThan(100);
    });

    it('should generate different QR codes for different data', async () => {
      const data1: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const data2: QRCodeData = {
        productId: '223e4567-e89b-12d3-a456-426614174001',
        name: 'Potatoes',
        price: 30.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const qrCode1 = await qrService.generateQRCode(data1);
      const qrCode2 = await qrService.generateQRCode(data2);

      expect(qrCode1).not.toBe(qrCode2);
    });

    it('should handle special characters in product name', async () => {
      const data: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'टमाटर (Tomatoes)',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const qrCode = await qrService.generateQRCode(data);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle decimal prices', async () => {
      const data: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.75,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const qrCode = await qrService.generateQRCode(data);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('decodeQRCode', () => {
    it('should decode valid QR code data', () => {
      const originalData: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const encodedData = JSON.stringify(originalData);
      const decodedData = qrService.decodeQRCode(encodedData);

      expect(decodedData).toEqual(originalData);
    });

    it('should throw error for invalid JSON', () => {
      const invalidData = 'not valid json';

      expect(() => qrService.decodeQRCode(invalidData)).toThrow('Invalid QR code data: not valid JSON');
    });

    it('should throw error for missing productId', () => {
      const invalidData = JSON.stringify({
        name: 'Tomatoes',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      });

      expect(() => qrService.decodeQRCode(invalidData)).toThrow('Invalid QR code data: missing required fields');
    });

    it('should throw error for missing name', () => {
      const invalidData = JSON.stringify({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      });

      expect(() => qrService.decodeQRCode(invalidData)).toThrow('Invalid QR code data: missing required fields');
    });

    it('should throw error for missing price', () => {
      const invalidData = JSON.stringify({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      });

      expect(() => qrService.decodeQRCode(invalidData)).toThrow('Invalid QR code data: missing required fields');
    });

    it('should throw error for missing vendorId', () => {
      const invalidData = JSON.stringify({
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.00,
      });

      expect(() => qrService.decodeQRCode(invalidData)).toThrow('Invalid QR code data: missing required fields');
    });

    it('should handle special characters in decoded data', () => {
      const originalData: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'टमाटर (Tomatoes)',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const encodedData = JSON.stringify(originalData);
      const decodedData = qrService.decodeQRCode(encodedData);

      expect(decodedData).toEqual(originalData);
    });
  });

  describe('generateQRCodeWithData', () => {
    it('should generate QR code and return encoded data', async () => {
      const data: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const result = await qrService.generateQRCodeWithData(data);

      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(result.encodedData).toBe(JSON.stringify(data));
    });

    it('should allow round-trip encoding and decoding', async () => {
      const originalData: QRCodeData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Tomatoes',
        price: 50.00,
        vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
      };

      const { encodedData } = await qrService.generateQRCodeWithData(originalData);
      const decodedData = qrService.decodeQRCode(encodedData);

      expect(decodedData).toEqual(originalData);
    });
  });
});
