import request from 'supertest';
import app from '../index';
import { pool } from '../config/database';

describe('QR Code API Integration Tests', () => {
  let testVendorId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Create a test vendor
    const vendorResult = await pool.query(
      `INSERT INTO users (phone_number, name, user_type, preferred_language)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['+919876543210', 'Test Vendor', 'vendor', 'en']
    );
    testVendorId = vendorResult.rows[0].id;

    await pool.query(
      `INSERT INTO vendors (user_id, shop_name, shop_name_translations)
       VALUES ($1, $2, $3)`,
      [testVendorId, 'Test Shop', JSON.stringify({ en: 'Test Shop', hi: 'टेस्ट दुकान' })]
    );

    // Create a test product
    const productResult = await pool.query(
      `INSERT INTO products (vendor_id, name, name_translations, price, unit, quantity, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        testVendorId,
        'Test Tomatoes',
        JSON.stringify({ en: 'Test Tomatoes', hi: 'टेस्ट टमाटर' }),
        50.00,
        'kg',
        100,
        true,
      ]
    );
    testProductId = productResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM products WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM vendors WHERE user_id = $1', [testVendorId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testVendorId]);
    await pool.end();
  });

  describe('GET /api/products/:id/qr-code', () => {
    it('should generate QR code for existing product', async () => {
      const response = await request(app)
        .get(`/api/products/${testProductId}/qr-code`)
        .expect(200);

      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('encodedData');
      expect(response.body).toHaveProperty('product');

      // Verify QR code is a base64 data URL
      expect(response.body.qrCode).toMatch(/^data:image\/png;base64,/);

      // Verify encoded data is valid JSON
      const encodedData = JSON.parse(response.body.encodedData);
      expect(encodedData).toHaveProperty('productId', testProductId);
      expect(encodedData).toHaveProperty('name', 'Test Tomatoes');
      expect(encodedData).toHaveProperty('price', 50.00);
      expect(encodedData).toHaveProperty('vendorId', testVendorId);

      // Verify product info
      expect(response.body.product.id).toBe(testProductId);
      expect(response.body.product.name).toBe('Test Tomatoes');
      expect(response.body.product.price).toBe(50.00);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/products/${fakeId}/qr-code`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should update product with QR code on first generation', async () => {
      // Generate QR code
      await request(app)
        .get(`/api/products/${testProductId}/qr-code`)
        .expect(200);

      // Verify product was updated with QR code
      const productResult = await pool.query(
        'SELECT qr_code FROM products WHERE id = $1',
        [testProductId]
      );

      expect(productResult.rows[0].qr_code).toBeTruthy();
      expect(productResult.rows[0].qr_code).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('POST /api/qr/decode', () => {
    it('should decode valid QR code data', async () => {
      const qrData = {
        productId: testProductId,
        name: 'Test Tomatoes',
        price: 50.00,
        vendorId: testVendorId,
      };

      const encodedData = JSON.stringify(qrData);

      const response = await request(app)
        .post('/api/qr/decode')
        .send({ encodedData })
        .expect(200);

      expect(response.body).toHaveProperty('decodedData');
      expect(response.body).toHaveProperty('product');

      expect(response.body.decodedData).toEqual(qrData);
      expect(response.body.product).toBeTruthy();
      expect(response.body.product.id).toBe(testProductId);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await request(app)
        .post('/api/qr/decode')
        .send({ encodedData: 'not valid json' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('QR_DECODE_FAILED');
    });

    it('should return 400 for missing encodedData', async () => {
      const response = await request(app)
        .post('/api/qr/decode')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for incomplete QR data', async () => {
      const incompleteData = JSON.stringify({
        productId: testProductId,
        name: 'Test Tomatoes',
        // Missing price and vendorId
      });

      const response = await request(app)
        .post('/api/qr/decode')
        .send({ encodedData: incompleteData })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('QR_DECODE_FAILED');
    });

    it('should handle QR code for non-existent product', async () => {
      const qrData = {
        productId: '00000000-0000-0000-0000-000000000000',
        name: 'Non-existent Product',
        price: 100.00,
        vendorId: testVendorId,
      };

      const encodedData = JSON.stringify(qrData);

      const response = await request(app)
        .post('/api/qr/decode')
        .send({ encodedData })
        .expect(200);

      expect(response.body.decodedData).toEqual(qrData);
      expect(response.body.product).toBeNull();
    });
  });

  describe('QR Code Round-Trip', () => {
    it('should successfully encode and decode product data', async () => {
      // Generate QR code
      const generateResponse = await request(app)
        .get(`/api/products/${testProductId}/qr-code`)
        .expect(200);

      const { encodedData } = generateResponse.body;

      // Decode QR code
      const decodeResponse = await request(app)
        .post('/api/qr/decode')
        .send({ encodedData })
        .expect(200);

      // Verify round-trip integrity
      expect(decodeResponse.body.decodedData.productId).toBe(testProductId);
      expect(decodeResponse.body.decodedData.name).toBe('Test Tomatoes');
      expect(decodeResponse.body.decodedData.price).toBe(50.00);
      expect(decodeResponse.body.decodedData.vendorId).toBe(testVendorId);
    });
  });
});
