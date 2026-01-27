/**
 * Product Repository Property-Based Tests
 * Feature: multilingual-mandi, Property 23: Product CRUD Operations
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3**
 * 
 * Property 23: Product CRUD Operations
 * For any product, the following operations should maintain data integrity:
 * (1) creating a product stores all required fields,
 * (2) updating a product modifies only specified fields,
 * (3) marking as unavailable changes only the availability status.
 */

import * as fc from 'fast-check';
import { Pool } from 'pg';
import { ProductRepository } from '../product.repository';
import { UpdateProductInput } from '../../models/types';

describe('Product Repository - Property-Based Tests', () => {
  let pool: Pool;
  let productRepo: ProductRepository;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'multilingual_mandi',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    productRepo = new ProductRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  // Helper function to clean up test data
  async function cleanupProduct(productId: string): Promise<void> {
    try {
      await productRepo.deleteById(productId);
    } catch (error) {
      // Ignore errors during cleanup
    }
  }

  // Arbitrary for generating valid product names
  const productNameArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

  // Arbitrary for generating valid prices (positive numbers with 2 decimal places)
  const priceArb = fc.double({ min: 0.01, max: 100000, noNaN: true }).map(n => Math.round(n * 100) / 100);

  // Arbitrary for generating valid quantities
  const quantityArb = fc.double({ min: 0.01, max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100);

  // Arbitrary for generating valid units
  const unitArb = fc.constantFrom('kg', 'piece', 'dozen', 'liter', 'gram', 'bundle');

  // Arbitrary for generating name translations
  const nameTranslationsArb = fc.record({
    en: productNameArb,
    hi: productNameArb,
    bho: productNameArb,
  });

  // Arbitrary for generating CreateProductInput
  const createProductInputArb = fc.record({
    vendorId: fc.uuid(),
    name: productNameArb,
    nameTranslations: nameTranslationsArb,
    categoryId: fc.option(fc.uuid(), { nil: undefined }),
    price: priceArb,
    unit: unitArb,
    quantity: quantityArb,
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    qrCode: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
    isAvailable: fc.option(fc.boolean(), { nil: undefined }),
  });

  describe('Property 23: Product CRUD Operations', () => {
    it('should store all required fields when creating a product', async () => {
      await fc.assert(
        fc.asyncProperty(createProductInputArb, async (input) => {
          let createdProduct;
          try {
            // Create the product
            createdProduct = await productRepo.create(input);

            // Verify all required fields are stored correctly
            expect(createdProduct.id).toBeDefined();
            expect(typeof createdProduct.id).toBe('string');
            expect(createdProduct.vendorId).toBe(input.vendorId);
            expect(createdProduct.name).toBe(input.name);
            expect(createdProduct.nameTranslations).toEqual(input.nameTranslations);
            expect(createdProduct.categoryId).toBe(input.categoryId || null);
            expect(createdProduct.price).toBe(input.price);
            expect(createdProduct.unit).toBe(input.unit);
            expect(createdProduct.quantity).toBe(input.quantity);
            expect(createdProduct.imageUrl).toBe(input.imageUrl || null);
            expect(createdProduct.qrCode).toBe(input.qrCode || null);
            expect(createdProduct.isAvailable).toBe(input.isAvailable !== undefined ? input.isAvailable : true);
            expect(createdProduct.createdAt).toBeInstanceOf(Date);
            expect(createdProduct.updatedAt).toBeInstanceOf(Date);
          } finally {
            // Cleanup
            if (createdProduct) {
              await cleanupProduct(createdProduct.id);
            }
          }
        }),
        { numRuns: 100 }
      );
    }, 60000); // Increase timeout for property test

    it('should modify only specified fields when updating a product', async () => {
      await fc.assert(
        fc.asyncProperty(
          createProductInputArb,
          fc.record({
            name: fc.option(productNameArb, { nil: undefined }),
            price: fc.option(priceArb, { nil: undefined }),
            quantity: fc.option(quantityArb, { nil: undefined }),
            unit: fc.option(unitArb, { nil: undefined }),
            isAvailable: fc.option(fc.boolean(), { nil: undefined }),
          }),
          async (createInput, updateInput) => {
            let createdProduct;
            try {
              // Create a product first
              createdProduct = await productRepo.create(createInput);
              const originalProduct = { ...createdProduct };

              // Update the product with partial data
              const updatedProduct = await productRepo.update(createdProduct.id, updateInput);

              // Verify the update was successful
              expect(updatedProduct).not.toBeNull();
              if (!updatedProduct) return;

              // Verify only specified fields were modified
              if (updateInput.name !== undefined) {
                expect(updatedProduct.name).toBe(updateInput.name);
              } else {
                expect(updatedProduct.name).toBe(originalProduct.name);
              }

              if (updateInput.price !== undefined) {
                expect(updatedProduct.price).toBe(updateInput.price);
              } else {
                expect(updatedProduct.price).toBe(originalProduct.price);
              }

              if (updateInput.quantity !== undefined) {
                expect(updatedProduct.quantity).toBe(updateInput.quantity);
              } else {
                expect(updatedProduct.quantity).toBe(originalProduct.quantity);
              }

              if (updateInput.unit !== undefined) {
                expect(updatedProduct.unit).toBe(updateInput.unit);
              } else {
                expect(updatedProduct.unit).toBe(originalProduct.unit);
              }

              if (updateInput.isAvailable !== undefined) {
                expect(updatedProduct.isAvailable).toBe(updateInput.isAvailable);
              } else {
                expect(updatedProduct.isAvailable).toBe(originalProduct.isAvailable);
              }

              // Verify unmodified fields remain the same
              expect(updatedProduct.id).toBe(originalProduct.id);
              expect(updatedProduct.vendorId).toBe(originalProduct.vendorId);
              expect(updatedProduct.nameTranslations).toEqual(originalProduct.nameTranslations);
              expect(updatedProduct.categoryId).toBe(originalProduct.categoryId);
              expect(updatedProduct.imageUrl).toBe(originalProduct.imageUrl);
              expect(updatedProduct.qrCode).toBe(originalProduct.qrCode);
              expect(updatedProduct.createdAt).toEqual(originalProduct.createdAt);
            } finally {
              // Cleanup
              if (createdProduct) {
                await cleanupProduct(createdProduct.id);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // Increase timeout for property test

    it('should change only availability status when marking as unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(
          createProductInputArb,
          fc.boolean(),
          async (createInput, newAvailability) => {
            let createdProduct;
            try {
              // Create a product first
              createdProduct = await productRepo.create(createInput);
              const originalProduct = { ...createdProduct };

              // Update availability
              const updatedProduct = await productRepo.updateAvailability(
                createdProduct.id,
                newAvailability
              );

              // Verify the update was successful
              expect(updatedProduct).not.toBeNull();
              if (!updatedProduct) return;

              // Verify only availability changed
              expect(updatedProduct.isAvailable).toBe(newAvailability);

              // Verify all other fields remain unchanged
              expect(updatedProduct.id).toBe(originalProduct.id);
              expect(updatedProduct.vendorId).toBe(originalProduct.vendorId);
              expect(updatedProduct.name).toBe(originalProduct.name);
              expect(updatedProduct.nameTranslations).toEqual(originalProduct.nameTranslations);
              expect(updatedProduct.categoryId).toBe(originalProduct.categoryId);
              expect(updatedProduct.price).toBe(originalProduct.price);
              expect(updatedProduct.unit).toBe(originalProduct.unit);
              expect(updatedProduct.quantity).toBe(originalProduct.quantity);
              expect(updatedProduct.imageUrl).toBe(originalProduct.imageUrl);
              expect(updatedProduct.qrCode).toBe(originalProduct.qrCode);
              expect(updatedProduct.createdAt).toEqual(originalProduct.createdAt);
            } finally {
              // Cleanup
              if (createdProduct) {
                await cleanupProduct(createdProduct.id);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // Increase timeout for property test

    it('should maintain data integrity across create-read-update-delete cycle', async () => {
      await fc.assert(
        fc.asyncProperty(createProductInputArb, async (input) => {
          let createdProduct;
          try {
            // CREATE: Create a product
            createdProduct = await productRepo.create(input);
            expect(createdProduct.id).toBeDefined();

            // READ: Retrieve the product
            const retrievedProduct = await productRepo.findById(createdProduct.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct?.id).toBe(createdProduct.id);
            expect(retrievedProduct?.name).toBe(input.name);
            expect(retrievedProduct?.price).toBe(input.price);

            // UPDATE: Update the product
            const updateData: UpdateProductInput = {
              price: input.price * 1.1, // Increase price by 10%
            };
            const updatedProduct = await productRepo.update(createdProduct.id, updateData);
            expect(updatedProduct).not.toBeNull();
            expect(updatedProduct?.price).toBe(updateData.price);
            expect(updatedProduct?.name).toBe(input.name); // Name should remain unchanged

            // DELETE: Delete the product
            const deleteResult = await productRepo.deleteById(createdProduct.id);
            expect(deleteResult).toBe(true);

            // Verify deletion
            const deletedProduct = await productRepo.findById(createdProduct.id);
            expect(deletedProduct).toBeNull();

            // Mark as cleaned up to avoid double deletion
            createdProduct = undefined as any;
          } finally {
            // Cleanup (in case test failed before deletion)
            if (createdProduct) {
              await cleanupProduct(createdProduct.id);
            }
          }
        }),
        { numRuns: 50 } // Fewer runs for this comprehensive test
      );
    }, 60000); // Increase timeout for property test
  });
});
