/**
 * Vendor repository for managing vendor data
 * Requirements: 9.4
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Vendor, VendorRow, CreateVendorInput, UpdateVendorInput } from '../models/types';
import { mapRowToVendor } from '../models/mappers';

export class VendorRepository extends BaseRepository<Vendor, VendorRow, CreateVendorInput, UpdateVendorInput> {
  protected tableName = 'vendors';
  protected mapRowToModel = mapRowToVendor;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new vendor
   */
  async create(input: CreateVendorInput): Promise<Vendor> {
    const result = await this.query<VendorRow>(
      `INSERT INTO vendors (
        user_id, shop_name, shop_name_translations, description, business_hours
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        input.userId,
        input.shopName,
        input.shopNameTranslations ? JSON.stringify(input.shopNameTranslations) : null,
        input.description || null,
        input.businessHours ? JSON.stringify(input.businessHours) : null,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Update an existing vendor
   */
  async update(id: string, input: UpdateVendorInput): Promise<Vendor | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.shopName !== undefined) {
      updates.push(`shop_name = $${paramCount++}`);
      values.push(input.shopName);
    }

    if (input.shopNameTranslations !== undefined) {
      updates.push(`shop_name_translations = $${paramCount++}`);
      values.push(JSON.stringify(input.shopNameTranslations));
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(input.description);
    }

    if (input.businessHours !== undefined) {
      updates.push(`business_hours = $${paramCount++}`);
      values.push(JSON.stringify(input.businessHours));
    }

    if (input.verified !== undefined) {
      updates.push(`verified = $${paramCount++}`);
      values.push(input.verified);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.query<VendorRow>(
      `UPDATE vendors SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find vendor by user ID
   */
  async findByUserId(userId: string): Promise<Vendor | null> {
    const result = await this.query<VendorRow>(
      'SELECT * FROM vendors WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find verified vendors
   */
  async findVerified(limit?: number, offset?: number): Promise<Vendor[]> {
    let queryText = 'SELECT * FROM vendors WHERE verified = true';
    const params: any[] = [];

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await this.query<VendorRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Search vendors by shop name
   */
  async searchByShopName(searchTerm: string, limit?: number): Promise<Vendor[]> {
    const queryText = `
      SELECT * FROM vendors
      WHERE shop_name ILIKE $1
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [`%${searchTerm}%`, limit] : [`%${searchTerm}%`];
    const result = await this.query<VendorRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }
}
