import { Router } from 'express';
import { qrController } from '../controllers/qr.controller';

const router = Router();

/**
 * QR Code Routes
 */

// Generate QR code for a product
router.get('/products/:id/qr-code', (req, res) => qrController.generateProductQRCode(req, res));

// Decode QR code data
router.post('/qr/decode', (req, res) => qrController.decodeQRCode(req, res));

export default router;
