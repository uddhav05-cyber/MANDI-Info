/**
 * Mapper functions to convert between database rows (snake_case) and application models (camelCase)
 */

import {
  User,
  UserRow,
  Vendor,
  VendorRow,
  Category,
  CategoryRow,
  Product,
  ProductRow,
  PriceHistory,
  PriceHistoryRow,
  Negotiation,
  NegotiationRow,
  NegotiationMessage,
  NegotiationMessageRow,
  Rating,
  RatingRow,
} from './types';

/**
 * Convert database row to User model
 */
export function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    name: row.name,
    userType: row.user_type,
    preferredLanguage: row.preferred_language,
    locationLatitude: row.location_latitude,
    locationLongitude: row.location_longitude,
    locationAddress: row.location_address,
    rating: row.rating,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to Vendor model
 */
export function mapRowToVendor(row: VendorRow): Vendor {
  return {
    id: row.id,
    userId: row.user_id,
    shopName: row.shop_name,
    shopNameTranslations: row.shop_name_translations,
    description: row.description,
    businessHours: row.business_hours,
    verified: row.verified,
    createdAt: row.created_at,
  };
}

/**
 * Convert database row to Category model
 */
export function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    nameTranslations: row.name_translations,
    icon: row.icon,
    parentId: row.parent_id,
    createdAt: row.created_at,
  };
}

/**
 * Convert database row to Product model
 */
export function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    nameTranslations: row.name_translations,
    categoryId: row.category_id,
    price: parseFloat(row.price),
    unit: row.unit,
    quantity: parseFloat(row.quantity),
    imageUrl: row.image_url,
    qrCode: row.qr_code,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to PriceHistory model
 */
export function mapRowToPriceHistory(row: PriceHistoryRow): PriceHistory {
  return {
    id: row.id,
    productId: row.product_id,
    vendorId: row.vendor_id,
    price: parseFloat(row.price),
    recordedAt: row.recorded_at,
  };
}

/**
 * Convert database row to Negotiation model
 */
export function mapRowToNegotiation(row: NegotiationRow): Negotiation {
  return {
    id: row.id,
    productId: row.product_id,
    buyerId: row.buyer_id,
    vendorId: row.vendor_id,
    status: row.status,
    initialPrice: parseFloat(row.initial_price),
    finalPrice: row.final_price ? parseFloat(row.final_price) : null,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to NegotiationMessage model
 */
export function mapRowToNegotiationMessage(row: NegotiationMessageRow): NegotiationMessage {
  return {
    id: row.id,
    negotiationId: row.negotiation_id,
    senderId: row.sender_id,
    senderType: row.sender_type,
    messageType: row.message_type,
    price: row.price ? parseFloat(row.price) : null,
    text: row.text,
    createdAt: row.created_at,
  };
}

/**
 * Convert database row to Rating model
 */
export function mapRowToRating(row: RatingRow): Rating {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    buyerId: row.buyer_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
