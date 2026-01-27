/**
 * User repository for managing user data
 * Requirements: 9.1
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { User, UserRow, CreateUserInput, UpdateUserInput } from '../models/types';
import { mapRowToUser } from '../models/mappers';

export class UserRepository extends BaseRepository<User, UserRow, CreateUserInput, UpdateUserInput> {
  protected tableName = 'users';
  protected mapRowToModel = mapRowToUser;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    const result = await this.query<UserRow>(
      `INSERT INTO users (
        phone_number, name, user_type, preferred_language,
        location_latitude, location_longitude, location_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.phoneNumber,
        input.name,
        input.userType,
        input.preferredLanguage || 'hi',
        input.locationLatitude || null,
        input.locationLongitude || null,
        input.locationAddress || null,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Update an existing user
   */
  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name);
    }

    if (input.preferredLanguage !== undefined) {
      updates.push(`preferred_language = $${paramCount++}`);
      values.push(input.preferredLanguage);
    }

    if (input.locationLatitude !== undefined) {
      updates.push(`location_latitude = $${paramCount++}`);
      values.push(input.locationLatitude);
    }

    if (input.locationLongitude !== undefined) {
      updates.push(`location_longitude = $${paramCount++}`);
      values.push(input.locationLongitude);
    }

    if (input.locationAddress !== undefined) {
      updates.push(`location_address = $${paramCount++}`);
      values.push(input.locationAddress);
    }

    if (input.rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(input.rating);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<UserRow>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find user by phone number
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const result = await this.query<UserRow>(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find users by type (vendor or buyer)
   */
  async findByType(userType: 'vendor' | 'buyer', limit?: number, offset?: number): Promise<User[]> {
    let queryText = 'SELECT * FROM users WHERE user_type = $1';
    const params: any[] = [userType];

    if (limit !== undefined) {
      params.push(limit);
      queryText += ` LIMIT $${params.length}`;
    }

    if (offset !== undefined) {
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await this.query<UserRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find users within a geographic radius (in kilometers)
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit?: number
  ): Promise<User[]> {
    // Using Haversine formula for distance calculation
    const queryText = `
      SELECT *,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(location_latitude)) *
            cos(radians(location_longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(location_latitude))
          )
        ) AS distance
      FROM users
      WHERE location_latitude IS NOT NULL
        AND location_longitude IS NOT NULL
      HAVING distance < $3
      ORDER BY distance
      ${limit ? `LIMIT $4` : ''}
    `;

    const params = limit ? [latitude, longitude, radiusKm, limit] : [latitude, longitude, radiusKm];
    const result = await this.query<UserRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Update user rating (typically for vendors)
   */
  async updateRating(id: string, rating: number): Promise<User | null> {
    const result = await this.query<UserRow>(
      'UPDATE users SET rating = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [rating, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }
}
