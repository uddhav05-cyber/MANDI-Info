/**
 * Price History repository for tracking product price changes
 * Requirements: 12.1
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { PriceHistory, PriceHistoryRow, CreatePriceHistoryInput } from '../models/types';
import { mapRowToPriceHistory } from '../models/mappers';

export class PriceHistoryRepository extends BaseRepository<PriceHistory, PriceHistoryRow, CreatePriceHistoryInput, never> {
  protected tableName = 'price_history';
  protected mapRowToModel = mapRowToPriceHistory;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new price history record
   */
  async create(input: CreatePriceHistoryInput): Promise<PriceHistory> {
    const result = await this.query<PriceHistoryRow>(
      `INSERT INTO price_history (product_id, vendor_id, price)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.productId, input.vendorId, input.price]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find price history for a product
   */
  async findByProductId(productId: string, limit?: number): Promise<PriceHistory[]> {
    const queryText = `
      SELECT * FROM price_history
      WHERE product_id = $1
      ORDER BY recorded_at DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [productId, limit] : [productId];
    const result = await this.query<PriceHistoryRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find price history for a vendor
   */
  async findByVendorId(vendorId: string, limit?: number): Promise<PriceHistory[]> {
    const queryText = `
      SELECT * FROM price_history
      WHERE vendor_id = $1
      ORDER BY recorded_at DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [vendorId, limit] : [vendorId];
    const result = await this.query<PriceHistoryRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find price history within a date range
   */
  async findByDateRange(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceHistory[]> {
    const result = await this.query<PriceHistoryRow>(
      `SELECT * FROM price_history
       WHERE product_id = $1
         AND recorded_at >= $2
         AND recorded_at <= $3
       ORDER BY recorded_at ASC`,
      [productId, startDate, endDate]
    );

    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Get latest price for a product
   */
  async getLatestPrice(productId: string): Promise<PriceHistory | null> {
    const result = await this.query<PriceHistoryRow>(
      `SELECT * FROM price_history
       WHERE product_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Get average price for a product over a time period
   */
  async getAveragePrice(productId: string, days: number): Promise<number | null> {
    const result = await this.query<{ avg: string | null }>(
      `SELECT AVG(price) as avg
       FROM price_history
       WHERE product_id = $1
         AND recorded_at >= NOW() - INTERVAL '${days} days'`,
      [productId]
    );

    if (result.rows[0].avg === null) {
      return null;
    }

    return parseFloat(result.rows[0].avg);
  }

  /**
   * Delete old price history records (older than specified days)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const result = await this.query(
      `DELETE FROM price_history
       WHERE recorded_at < NOW() - INTERVAL '${days} days'`
    );

    return result.rowCount ?? 0;
  }
}
