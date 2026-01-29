import { Request, Response } from 'express';
import { qrService } from '../services/qr.service';
import { productRepository } from '../repositories/product.repository';

/**
 * QR Code Controller
 * Handles QR code generation for products
 */

export class QRController {
  /**
   * Generate QR code for a product
   * GET /api/products/:id/qr-code
   */
  async generateProductQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Fetch product from database
      const product = await productRepository.findById(id);

      if (!product) {
        res.status(404).json({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
            retryable: false,
            timestamp: new Date(),
          },
        });
        return;
      }

      // Generate QR code with product data
      const qrCodeData = {
        productId: product.id,
        name: product.name,
        price: product.price,
        vendorId: product.vendorId,
      };

      const { qrCode, encodedData } = await qrService.generateQRCodeWithData(qrCodeData);

      // Update product with QR code if not already set
      if (!product.qrCode) {
        await productRepository.update(id, { qrCode });
      }

      res.status(200).json({
        qrCode,
        encodedData,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          vendorId: product.vendorId,
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({
        error: {
          code: 'QR_GENERATION_FAILED',
          message: 'Failed to generate QR code',
          retryable: true,
          timestamp: new Date(),
        },
      });
    }
  }

  /**
   * Decode QR code data
   * POST /api/qr/decode
   */
  async decodeQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { encodedData } = req.body;

      if (!encodedData || typeof encodedData !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'encodedData is required and must be a string',
            retryable: false,
            timestamp: new Date(),
          },
        });
        return;
      }

      const decodedData = qrService.decodeQRCode(encodedData);

      // Optionally fetch full product details
      const product = await productRepository.findById(decodedData.productId);

      res.status(200).json({
        decodedData,
        product: product || null,
      });
    } catch (error) {
      console.error('Error decoding QR code:', error);
      res.status(400).json({
        error: {
          code: 'QR_DECODE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to decode QR code',
          retryable: false,
          timestamp: new Date(),
        },
      });
    }
  }
}

// Export singleton instance
export const qrController = new QRController();
