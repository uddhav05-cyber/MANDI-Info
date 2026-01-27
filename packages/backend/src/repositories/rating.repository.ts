/**
 * Rating repository for managing vendor ratings
 * Requirements: 9.5
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Rating, RatingRow, CreateRatingInput, UpdateRatingInput } from '../models/types';
import { mapRowToRating } from '../models/mappers';

export class RatingRepository extends BaseRepository<Rating, RatingRow, CreateRatingInput, UpdateRatingInput> {
  protected tableName = 'ratings';
  protected mapRowToModel = mapRowToRating;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new rating
   */
  async create(input: CreateRatingInput): Promise<Rating> {
    const result = await this.query<RatingRow>(
      `INSERT INTO ratings (vendor_id, buyer_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.vendorId, input.buyerId, input.rating, input.comment || null]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Update an existing rating
   */
  async update(id: string, input: UpdateRatingInput): Promise<Rating | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(input.rating);
    }

    if (input.comment !== undefined) {
      updates.push(`comment = $${paramCount++}`);
      values.push(input.comment);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<RatingRow>(
      `UPDATE ratings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find ratings by vendor ID
   */
  async findByVendorId(vendorId: string, limit?: number, offset?: number): Promise<Rating[]> {
    let queryText = 'SELECT * FROM ratings WHERE vendor_id = $1 ORDER BY created_at DESC';
    const params: any[] = [vendorId];

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await this.query<RatingRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find ratings by buyer ID
   */
  async findByBuyerId(buyerId: string, limit?: number): Promise<Rating[]> {
    const queryText = `
      SELECT * FROM ratings
      WHERE buyer_id = $1
      ORDER BY created_at DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [buyerId, limit] : [buyerId];
    const result = await this.query<RatingRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find rating by vendor and buyer (unique constraint)
   */
  async findByVendorAndBuyer(vendorId: string, buyerId: string): Promise<Rating | null> {
    const result = await this.query<RatingRow>(
      'SELECT * FROM ratings WHERE vendor_id = $1 AND buyer_id = $2',
      [vendorId, buyerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Calculate average rating for a vendor
   */
  async getAverageRating(vendorId: string): Promise<number | null> {
    const result = await this.query<{ avg: string | null }>(
      'SELECT AVG(rating) as avg FROM ratings WHERE vendor_id = $1',
      [vendorId]
    );

    if (result.rows[0].avg === null) {
      return null;
    }

    return parseFloat(result.rows[0].avg);
  }

  /**
   * Count ratings for a vendor
   */
  async countByVendorId(vendorId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM ratings WHERE vendor_id = $1',
      [vendorId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get rating distribution for a vendor
   */
  async getRatingDistribution(vendorId: string): Promise<Record<number, number>> {
    const result = await this.query<{ rating: number; count: string }>(
      `SELECT rating, COUNT(*) as count
       FROM ratings
       WHERE vendor_id = $1
       GROUP BY rating
       ORDER BY rating DESC`,
      [vendorId]
    );

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.rows.forEach((row: { rating: number; count: string }) => {
      distribution[row.rating] = parseInt(row.count, 10);
    });

    return distribution;
  }

  /**
   * Find recent ratings (last N days)
   */
  async findRecent(days: number, limit?: number): Promise<Rating[]> {
    const queryText = `
      SELECT * FROM ratings
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
      ${limit ? `LIMIT $1` : ''}
    `;

    const params = limit ? [limit] : [];
    const result = await this.query<RatingRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }
}
