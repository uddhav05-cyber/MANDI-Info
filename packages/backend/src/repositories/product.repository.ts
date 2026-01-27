/**
 * Product repository for managing product data
 * Requirements: 10.1, 10.2, 10.3
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Product, ProductRow, CreateProductInput, UpdateProductInput } from '../models/types';
import { mapRowToProduct } from '../models/mappers';

export class ProductRepository extends BaseRepository<Product, ProductRow, CreateProductInput, UpdateProductInput> {
  protected tableName = 'products';
  protected mapRowToModel = mapRowToProduct;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new product
   */
  async create(input: CreateProductInput): Promise<Product> {
    const result = await this.query<ProductRow>(
      `INSERT INTO products (
        vendor_id, name, name_translations, category_id, price, unit, quantity,
        image_url, qr_code, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.vendorId,
        input.name,
        JSON.stringify(input.nameTranslations),
        input.categoryId || null,
        input.price,
        input.unit,
        input.quantity,
        input.imageUrl || null,
        input.qrCode || null,
        input.isAvailable !== undefined ? input.isAvailable : true,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Update an existing product
   */
  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name);
    }

    if (input.nameTranslations !== undefined) {
      updates.push(`name_translations = $${paramCount++}`);
      values.push(JSON.stringify(input.nameTranslations));
    }

    if (input.categoryId !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(input.categoryId);
    }

    if (input.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(input.price);
    }

    if (input.unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(input.unit);
    }

    if (input.quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(input.quantity);
    }

    if (input.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(input.imageUrl);
    }

    if (input.qrCode !== undefined) {
      updates.push(`qr_code = $${paramCount++}`);
      values.push(input.qrCode);
    }

    if (input.isAvailable !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(input.isAvailable);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<ProductRow>(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find products by vendor ID
   */
  async findByVendorId(vendorId: string, limit?: number, offset?: number): Promise<Product[]> {
    let queryText = 'SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC';
    const params: any[] = [vendorId];

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await this.query<ProductRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find products by category ID
   */
  async findByCategoryId(categoryId: string, limit?: number, offset?: number): Promise<Product[]> {
    let queryText = 'SELECT * FROM products WHERE category_id = $1 ORDER BY created_at DESC';
    const params: any[] = [categoryId];

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await this.query<ProductRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find available products
   */
  async findAvailable(limit?: number, offset?: number): Promise<Product[]> {
    let queryText = 'SELECT * FROM products WHERE is_available = true ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await this.query<ProductRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Search products by name (supports fuzzy matching)
   */
  async searchByName(searchTerm: string, limit?: number): Promise<Product[]> {
    const queryText = `
      SELECT * FROM products
      WHERE name ILIKE $1
      ORDER BY created_at DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [`%${searchTerm}%`, limit] : [`%${searchTerm}%`];
    const result = await this.query<ProductRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find products within a price range
   */
  async findByPriceRange(minPrice: number, maxPrice: number, limit?: number): Promise<Product[]> {
    const queryText = `
      SELECT * FROM products
      WHERE price >= $1 AND price <= $2
      ORDER BY price ASC
      ${limit ? `LIMIT $3` : ''}
    `;

    const params = limit ? [minPrice, maxPrice, limit] : [minPrice, maxPrice];
    const result = await this.query<ProductRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Update product availability
   */
  async updateAvailability(id: string, isAvailable: boolean): Promise<Product | null> {
    const result = await this.query<ProductRow>(
      'UPDATE products SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isAvailable, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Bulk create products
   */
  async bulkCreate(inputs: CreateProductInput[]): Promise<Product[]> {
    if (inputs.length === 0) {
      return [];
    }

    const values: any[] = [];
    const valuePlaceholders: string[] = [];
    let paramCount = 1;

    inputs.forEach((input) => {
      const placeholders = [];
      for (let i = 0; i < 10; i++) {
        placeholders.push(`$${paramCount++}`);
      }
      valuePlaceholders.push(`(${placeholders.join(', ')})`);

      values.push(
        input.vendorId,
        input.name,
        JSON.stringify(input.nameTranslations),
        input.categoryId || null,
        input.price,
        input.unit,
        input.quantity,
        input.imageUrl || null,
        input.qrCode || null,
        input.isAvailable !== undefined ? input.isAvailable : true
      );
    });

    const result = await this.query<ProductRow>(
      `INSERT INTO products (
        vendor_id, name, name_translations, category_id, price, unit, quantity,
        image_url, qr_code, is_available
      ) VALUES ${valuePlaceholders.join(', ')}
      RETURNING *`,
      values
    );

    return result.rows.map(this.mapRowToModel);
  }
}
