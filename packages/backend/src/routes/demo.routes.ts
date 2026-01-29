/**
 * Demo Routes
 * Provides mock API endpoints for demo mode
 */

import { Router } from 'express';
import { mockDb } from '../mock/mockDatabase';
import { generateWhatsAppLink } from '../services/whatsapp.service';
import { qrService } from '../services/qr.service';

const router = Router();

// Get all products
router.get('/products', async (_req, res) => {
  try {
    const products = await mockDb.findAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await mockDb.findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Generate QR code for product
router.get('/products/:id/qr-code', async (req, res) => {
  try {
    const product = await mockDb.findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const qrCodeData = {
      productId: product.id,
      name: product.name,
      price: product.price,
      vendorId: product.vendorId,
    };

    const { qrCode, encodedData } = await qrService.generateQRCodeWithData(qrCodeData);

    res.json({
      qrCode,
      encodedData,
      product,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate WhatsApp share link
router.post('/whatsapp/share', async (req, res) => {
  try {
    const { productIds, language = 'en' } = req.body;

    const products = await Promise.all(
      productIds.map((id: string) => mockDb.findProductById(id))
    );

    const validProducts = products.filter(p => p !== null);

    if (validProducts.length === 0) {
      return res.status(404).json({ error: 'No valid products found' });
    }

    const whatsappProducts = validProducts.map(p => ({
      productId: p!.id,
      vendorName: 'Demo Vendor',
      productName: p!.name,
      price: p!.price,
      unit: p!.unit,
    }));

    const result = generateWhatsAppLink({
      products: whatsappProducts,
      language,
      baseUrl: 'http://localhost:5174',
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate WhatsApp link' });
  }
});

// Get all vendors
router.get('/vendors', async (_req, res) => {
  try {
    const vendors = await mockDb.findAllVendors();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get all categories
router.get('/categories', async (_req, res) => {
  try {
    const categories = await mockDb.findAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get supported languages
router.get('/languages', (_req, res) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isRegionalDialect: true },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRegionalDialect: true },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isRegionalDialect: true },
  ];
  res.json({ languages });
});

export default router;
