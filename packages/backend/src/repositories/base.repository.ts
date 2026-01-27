/**
 * Base repository class providing common database operations
 * Implements the repository pattern for data access abstraction
 */

import { Pool, QueryResult } from 'pg';
import { pool as defaultPool } from '../config/database';

export abstract class BaseRepository<TModel, TRow extends Record<string, any>, _TCreateInput, _TUpdateInput> {
  protected pool: Pool;
  protected abstract tableName: string;
  protected abstract mapRowToModel: (row: TRow) => TModel;

  constructor(pool?: Pool) {
    this.pool = pool || defaultPool;
  }

  /**
   * Execute a query and return the result
   */
  protected async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (> 500ms)
      if (duration > 500) {
        console.warn(`Slow query detected (${duration}ms):`, text);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<TModel | null> {
    const result = await this.query<TRow>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find all records with optional limit and offset
   */
  async findAll(limit?: number, offset?: number): Promise<TModel[]> {
    let queryText = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    
    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }
    
    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }
    
    const result = await this.query<TRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count total records
   */
  async count(): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1) as exists`,
      [id]
    );
    
    return result.rows[0].exists;
  }
}
