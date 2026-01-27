/**
 * Category repository for managing product categories
 * Requirements: 10.1, 10.4
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Category, CategoryRow, CreateCategoryInput, UpdateCategoryInput } from '../models/types';
import { mapRowToCategory } from '../models/mappers';

export class CategoryRepository extends BaseRepository<Category, CategoryRow, CreateCategoryInput, UpdateCategoryInput> {
  protected tableName = 'categories';
  protected mapRowToModel = mapRowToCategory;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new category
   */
  async create(input: CreateCategoryInput): Promise<Category> {
    const result = await this.query<CategoryRow>(
      `INSERT INTO categories (name, name_translations, icon, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        input.name,
        JSON.stringify(input.nameTranslations),
        input.icon || null,
        input.parentId || null,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Update an existing category
   */
  async update(id: string, input: UpdateCategoryInput): Promise<Category | null> {
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

    if (input.icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(input.icon);
    }

    if (input.parentId !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(input.parentId);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.query<CategoryRow>(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find top-level categories (no parent)
   */
  async findTopLevel(): Promise<Category[]> {
    const result = await this.query<CategoryRow>(
      'SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name'
    );

    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find subcategories by parent ID
   */
  async findByParentId(parentId: string): Promise<Category[]> {
    const result = await this.query<CategoryRow>(
      'SELECT * FROM categories WHERE parent_id = $1 ORDER BY name',
      [parentId]
    );

    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Search categories by name
   */
  async searchByName(searchTerm: string, limit?: number): Promise<Category[]> {
    const queryText = `
      SELECT * FROM categories
      WHERE name ILIKE $1
      ORDER BY name
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [`%${searchTerm}%`, limit] : [`%${searchTerm}%`];
    const result = await this.query<CategoryRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }
}
