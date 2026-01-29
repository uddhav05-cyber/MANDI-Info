/**
 * WhatsApp Service Tests
 * Tests for WhatsApp message generation and link formatting
 */

import {
  generateWhatsAppLink,
  formatWhatsAppMessage,
  validateWhatsAppOptions,
  WhatsAppProduct,
  WhatsAppMessageOptions
} from '../whatsapp.service';

describe('WhatsApp Service', () => {
  const mockProduct: WhatsAppProduct = {
    productId: '123e4567-e89b-12d3-a456-426614174000',
    vendorName: 'Test Vendor',
    productName: 'Fresh Tomatoes',
    price: 50,
    unit: 'kg'
  };

  const mockProduct2: WhatsAppProduct = {
    productId: '223e4567-e89b-12d3-a456-426614174001',
    vendorName: 'Another Vendor',
    productName: 'Fresh Potatoes',
    price: 30,
    unit: 'kg'
  };

  describe('generateWhatsAppLink', () => {
    it('should generate a valid WhatsApp link for a single product', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct],
        language: 'en',
        baseUrl: 'https://test.com'
      };

      const result = generateWhatsAppLink(options);

      expect(result.link).toContain('https://wa.me/?text=');
      expect(result.link).toContain(encodeURIComponent('Fresh Tomatoes'));
      expect(result.message).toContain('Fresh Tomatoes');
      expect(result.message).toContain('₹50/kg');
      expect(result.message).toContain('Test Vendor');
      expect(result.message).toContain('https://test.com/products/123e4567-e89b-12d3-a456-426614174000');
    });

    it('should generate a WhatsApp link with phone number when provided', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct],
        phoneNumber: '919876543210'
      };

      const result = generateWhatsAppLink(options);

      expect(result.link).toContain('https://wa.me/919876543210?text=');
    });

    it('should generate a WhatsApp link without phone number', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct]
      };

      const result = generateWhatsAppLink(options);

      expect(result.link).toContain('https://wa.me/?text=');
      expect(result.link).not.toContain('https://wa.me/91');
    });

    it('should throw error when no products provided', () => {
      const options: WhatsAppMessageOptions = {
        products: []
      };

      expect(() => generateWhatsAppLink(options)).toThrow('At least one product is required');
    });

    it('should URL encode the message properly', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct]
      };

      const result = generateWhatsAppLink(options);

      // Check that special characters are encoded
      expect(result.link).not.toContain(' ');
      expect(result.link).not.toContain('\n');
      expect(result.link).toContain('%');
    });
  });

  describe('formatWhatsAppMessage', () => {
    it('should format a single product message in English', () => {
      const message = formatWhatsAppMessage(
        [mockProduct],
        'en',
        'https://test.com'
      );

      expect(message).toContain('Check out this product!');
      expect(message).toContain('Product: Fresh Tomatoes');
      expect(message).toContain('Price: ₹50/kg');
      expect(message).toContain('Vendor: Test Vendor');
      expect(message).toContain('View details: https://test.com/products/123e4567-e89b-12d3-a456-426614174000');
      expect(message).toContain('Shop on Multilingual Mandi');
    });

    it('should format a single product message in Hindi', () => {
      const message = formatWhatsAppMessage(
        [mockProduct],
        'hi',
        'https://test.com'
      );

      expect(message).toContain('इस उत्पाद को देखें!');
      expect(message).toContain('उत्पाद: Fresh Tomatoes');
      expect(message).toContain('मूल्य: ₹50/kg');
      expect(message).toContain('विक्रेता: Test Vendor');
      expect(message).toContain('मल्टीलिंगुअल मंडी पर खरीदें');
    });

    it('should format multiple products message in English', () => {
      const message = formatWhatsAppMessage(
        [mockProduct, mockProduct2],
        'en',
        'https://test.com'
      );

      expect(message).toContain('Check out these products');
      expect(message).toContain('1. Fresh Tomatoes');
      expect(message).toContain('Price: ₹50/kg');
      expect(message).toContain('2. Fresh Potatoes');
      expect(message).toContain('Price: ₹30/kg');
      expect(message).toContain('https://test.com/products/123e4567-e89b-12d3-a456-426614174000');
      expect(message).toContain('https://test.com/products/223e4567-e89b-12d3-a456-426614174001');
    });

    it('should format multiple products message in Hindi', () => {
      const message = formatWhatsAppMessage(
        [mockProduct, mockProduct2],
        'hi',
        'https://test.com'
      );

      expect(message).toContain('इन उत्पादों को देखें');
      expect(message).toContain('1. Fresh Tomatoes');
      expect(message).toContain('2. Fresh Potatoes');
    });

    it('should default to English for unsupported languages', () => {
      const message = formatWhatsAppMessage(
        [mockProduct],
        'unsupported',
        'https://test.com'
      );

      expect(message).toContain('Check out this product!');
      expect(message).toContain('Product: Fresh Tomatoes');
    });

    it('should preserve numerical values in all languages', () => {
      const languages = ['en', 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'kn'];

      languages.forEach(lang => {
        const message = formatWhatsAppMessage(
          [mockProduct],
          lang,
          'https://test.com'
        );

        // Price should be preserved
        expect(message).toContain('50');
        // Product ID in URL should be preserved
        expect(message).toContain('123e4567-e89b-12d3-a456-426614174000');
      });
    });

    it('should include product URLs for all products', () => {
      const message = formatWhatsAppMessage(
        [mockProduct, mockProduct2],
        'en',
        'https://test.com'
      );

      expect(message).toContain('https://test.com/products/123e4567-e89b-12d3-a456-426614174000');
      expect(message).toContain('https://test.com/products/223e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('validateWhatsAppOptions', () => {
    it('should validate valid options', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct]
      };

      expect(() => validateWhatsAppOptions(options)).not.toThrow();
    });

    it('should throw error when products is not an array', () => {
      const options = {
        products: 'not an array'
      } as any;

      expect(() => validateWhatsAppOptions(options)).toThrow('Products must be an array');
    });

    it('should throw error when products array is empty', () => {
      const options: WhatsAppMessageOptions = {
        products: []
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('At least one product is required');
    });

    it('should throw error when product ID is missing', () => {
      const options: WhatsAppMessageOptions = {
        products: [{
          ...mockProduct,
          productId: ''
        }]
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('Product ID is required');
    });

    it('should throw error when product name is missing', () => {
      const options: WhatsAppMessageOptions = {
        products: [{
          ...mockProduct,
          productName: ''
        }]
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('Product name is required');
    });

    it('should throw error when price is invalid', () => {
      const options: WhatsAppMessageOptions = {
        products: [{
          ...mockProduct,
          price: -10
        }]
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('Valid product price is required');
    });

    it('should throw error when unit is missing', () => {
      const options: WhatsAppMessageOptions = {
        products: [{
          ...mockProduct,
          unit: ''
        }]
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('Product unit is required');
    });

    it('should throw error when vendor name is missing', () => {
      const options: WhatsAppMessageOptions = {
        products: [{
          ...mockProduct,
          vendorName: ''
        }]
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('Vendor name is required');
    });

    it('should throw error when phone number contains non-digits', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct],
        phoneNumber: '+91-9876543210'
      };

      expect(() => validateWhatsAppOptions(options)).toThrow('Phone number must contain only digits');
    });

    it('should accept valid phone number with only digits', () => {
      const options: WhatsAppMessageOptions = {
        products: [mockProduct],
        phoneNumber: '919876543210'
      };

      expect(() => validateWhatsAppOptions(options)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with special characters in names', () => {
      const specialProduct: WhatsAppProduct = {
        ...mockProduct,
        productName: 'Tomatoes & Onions (Fresh!)'
      };

      const result = generateWhatsAppLink({
        products: [specialProduct]
      });

      expect(result.message).toContain('Tomatoes & Onions (Fresh!)');
      expect(result.link).toContain(encodeURIComponent('Tomatoes & Onions (Fresh!)'));
    });

    it('should handle very long product names', () => {
      const longNameProduct: WhatsAppProduct = {
        ...mockProduct,
        productName: 'A'.repeat(200)
      };

      const result = generateWhatsAppLink({
        products: [longNameProduct]
      });

      expect(result.message).toContain('A'.repeat(200));
    });

    it('should handle decimal prices', () => {
      const decimalProduct: WhatsAppProduct = {
        ...mockProduct,
        price: 49.99
      };

      const message = formatWhatsAppMessage(
        [decimalProduct],
        'en',
        'https://test.com'
      );

      expect(message).toContain('49.99');
    });

    it('should handle zero price', () => {
      const freeProduct: WhatsAppProduct = {
        ...mockProduct,
        price: 0
      };

      const message = formatWhatsAppMessage(
        [freeProduct],
        'en',
        'https://test.com'
      );

      expect(message).toContain('₹0/kg');
    });

    it('should handle many products', () => {
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        ...mockProduct,
        productId: `product-${i}`,
        productName: `Product ${i + 1}`
      }));

      const message = formatWhatsAppMessage(
        manyProducts,
        'en',
        'https://test.com'
      );

      expect(message).toContain('1. Product 1');
      expect(message).toContain('10. Product 10');
    });
  });
});
