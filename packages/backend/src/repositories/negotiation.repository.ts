/**
 * Negotiation repository for managing price negotiations
 * Requirements: 6.2, 6.3
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Negotiation, NegotiationRow, CreateNegotiationInput, UpdateNegotiationInput, NegotiationStatus } from '../models/types';
import { mapRowToNegotiation } from '../models/mappers';

export class NegotiationRepository extends BaseRepository<Negotiation, NegotiationRow, CreateNegotiationInput, UpdateNegotiationInput> {
  protected tableName = 'negotiations';
  protected mapRowToModel = mapRowToNegotiation;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new negotiation
   */
  async create(input: CreateNegotiationInput): Promise<Negotiation> {
    const result = await this.query<NegotiationRow>(
      `INSERT INTO negotiations (product_id, buyer_id, vendor_id, status, initial_price, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.productId,
        input.buyerId,
        input.vendorId,
        'active',
        input.initialPrice,
        input.expiresAt,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Update an existing negotiation
   */
  async update(id: string, input: UpdateNegotiationInput): Promise<Negotiation | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(input.status);
    }

    if (input.finalPrice !== undefined) {
      updates.push(`final_price = $${paramCount++}`);
      values.push(input.finalPrice);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<NegotiationRow>(
      `UPDATE negotiations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find negotiations by buyer ID
   */
  async findByBuyerId(buyerId: string, status?: NegotiationStatus, limit?: number): Promise<Negotiation[]> {
    let queryText = 'SELECT * FROM negotiations WHERE buyer_id = $1';
    const params: any[] = [buyerId];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    const result = await this.query<NegotiationRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find negotiations by vendor ID
   */
  async findByVendorId(vendorId: string, status?: NegotiationStatus, limit?: number): Promise<Negotiation[]> {
    let queryText = 'SELECT * FROM negotiations WHERE vendor_id = $1';
    const params: any[] = [vendorId];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    queryText += ' ORDER BY created_at DESC';

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    const result = await this.query<NegotiationRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find negotiations by product ID
   */
  async findByProductId(productId: string, limit?: number): Promise<Negotiation[]> {
    const queryText = `
      SELECT * FROM negotiations
      WHERE product_id = $1
      ORDER BY created_at DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [productId, limit] : [productId];
    const result = await this.query<NegotiationRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find active negotiations
   */
  async findActive(limit?: number): Promise<Negotiation[]> {
    const queryText = `
      SELECT * FROM negotiations
      WHERE status = 'active'
      ORDER BY created_at DESC
      ${limit ? `LIMIT $1` : ''}
    `;

    const params = limit ? [limit] : [];
    const result = await this.query<NegotiationRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find expired negotiations that need to be marked as expired
   */
  async findExpired(): Promise<Negotiation[]> {
    const result = await this.query<NegotiationRow>(
      `SELECT * FROM negotiations
       WHERE status = 'active'
         AND expires_at < NOW()`
    );

    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Mark expired negotiations
   */
  async markExpired(): Promise<number> {
    const result = await this.query(
      `UPDATE negotiations
       SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'active'
         AND expires_at < NOW()`
    );

    return result.rowCount ?? 0;
  }

  /**
   * Accept a negotiation
   */
  async accept(id: string, finalPrice: number): Promise<Negotiation | null> {
    const result = await this.query<NegotiationRow>(
      `UPDATE negotiations
       SET status = 'accepted', final_price = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [finalPrice, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Reject a negotiation
   */
  async reject(id: string): Promise<Negotiation | null> {
    const result = await this.query<NegotiationRow>(
      `UPDATE negotiations
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }
}
