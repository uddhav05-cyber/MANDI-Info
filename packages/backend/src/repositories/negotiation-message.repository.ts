/**
 * Negotiation Message repository for managing negotiation messages
 * Requirements: 6.2, 6.4
 */

import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { NegotiationMessage, NegotiationMessageRow, CreateNegotiationMessageInput } from '../models/types';
import { mapRowToNegotiationMessage } from '../models/mappers';

export class NegotiationMessageRepository extends BaseRepository<NegotiationMessage, NegotiationMessageRow, CreateNegotiationMessageInput, never> {
  protected tableName = 'negotiation_messages';
  protected mapRowToModel = mapRowToNegotiationMessage;

  constructor(pool?: Pool) {
    super(pool);
  }

  /**
   * Create a new negotiation message
   */
  async create(input: CreateNegotiationMessageInput): Promise<NegotiationMessage> {
    const result = await this.query<NegotiationMessageRow>(
      `INSERT INTO negotiation_messages (
        negotiation_id, sender_id, sender_type, message_type, price, text
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        input.negotiationId,
        input.senderId,
        input.senderType,
        input.messageType,
        input.price || null,
        input.text || null,
      ]
    );

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Find messages by negotiation ID
   */
  async findByNegotiationId(negotiationId: string, limit?: number): Promise<NegotiationMessage[]> {
    const queryText = `
      SELECT * FROM negotiation_messages
      WHERE negotiation_id = $1
      ORDER BY created_at ASC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [negotiationId, limit] : [negotiationId];
    const result = await this.query<NegotiationMessageRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Find messages by sender ID
   */
  async findBySenderId(senderId: string, limit?: number): Promise<NegotiationMessage[]> {
    const queryText = `
      SELECT * FROM negotiation_messages
      WHERE sender_id = $1
      ORDER BY created_at DESC
      ${limit ? `LIMIT $2` : ''}
    `;

    const params = limit ? [senderId, limit] : [senderId];
    const result = await this.query<NegotiationMessageRow>(queryText, params);
    return result.rows.map(this.mapRowToModel);
  }

  /**
   * Get latest message for a negotiation
   */
  async getLatestMessage(negotiationId: string): Promise<NegotiationMessage | null> {
    const result = await this.query<NegotiationMessageRow>(
      `SELECT * FROM negotiation_messages
       WHERE negotiation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [negotiationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToModel(result.rows[0]);
  }

  /**
   * Count messages in a negotiation
   */
  async countByNegotiationId(negotiationId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM negotiation_messages
       WHERE negotiation_id = $1`,
      [negotiationId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Find offer messages in a negotiation
   */
  async findOffers(negotiationId: string): Promise<NegotiationMessage[]> {
    const result = await this.query<NegotiationMessageRow>(
      `SELECT * FROM negotiation_messages
       WHERE negotiation_id = $1
         AND message_type IN ('offer', 'counter')
       ORDER BY created_at ASC`,
      [negotiationId]
    );

    return result.rows.map(this.mapRowToModel);
  }
}
