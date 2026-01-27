/**
 * Core type definitions for the Multilingual Mandi platform
 * These interfaces match the database schema defined in migrations
 */

// User types
export type UserType = 'vendor' | 'buyer';

// Negotiation status types
export type NegotiationStatus = 'active' | 'accepted' | 'rejected' | 'expired';

// Negotiation message types
export type SenderType = 'buyer' | 'vendor';
export type MessageType = 'offer' | 'counter' | 'accept' | 'reject' | 'message';

/**
 * User model
 * Represents both vendors and buyers in the system
 * Requirements: 9.1
 */
export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  userType: UserType;
  preferredLanguage: string;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationAddress?: string | null;
  rating?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database representation of User (snake_case)
 */
export interface UserRow {
  id: string;
  phone_number: string;
  name: string;
  user_type: UserType;
  preferred_language: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  location_address?: string | null;
  rating?: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Vendor model
 * Extended profile information for vendor users
 * Requirements: 9.4
 */
export interface Vendor {
  id: string;
  userId: string;
  shopName: string;
  shopNameTranslations?: Record<string, string> | null;
  description?: string | null;
  businessHours?: Record<string, any> | null;
  verified: boolean;
  createdAt: Date;
}

/**
 * Database representation of Vendor (snake_case)
 */
export interface VendorRow {
  id: string;
  user_id: string;
  shop_name: string;
  shop_name_translations?: any | null;
  description?: string | null;
  business_hours?: any | null;
  verified: boolean;
  created_at: Date;
}

/**
 * Category model
 * Product categories with multilingual support
 * Requirements: 10.1, 10.4
 */
export interface Category {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  icon?: string | null;
  parentId?: string | null;
  createdAt: Date;
}

/**
 * Database representation of Category (snake_case)
 */
export interface CategoryRow {
  id: string;
  name: string;
  name_translations: any;
  icon?: string | null;
  parent_id?: string | null;
  created_at: Date;
}

/**
 * Product model
 * Core product catalog with multilingual support
 * Requirements: 10.1, 10.2, 10.3
 */
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  nameTranslations: Record<string, string>;
  categoryId?: string | null;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string | null;
  qrCode?: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database representation of Product (snake_case)
 */
export interface ProductRow {
  id: string;
  vendor_id: string;
  name: string;
  name_translations: any;
  category_id?: string | null;
  price: string; // DECIMAL comes as string from pg
  unit: string;
  quantity: string; // DECIMAL comes as string from pg
  image_url?: string | null;
  qr_code?: string | null;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Price History model
 * Track historical price changes for products
 * Requirements: 12.1
 */
export interface PriceHistory {
  id: string;
  productId: string;
  vendorId: string;
  price: number;
  recordedAt: Date;
}

/**
 * Database representation of PriceHistory (snake_case)
 */
export interface PriceHistoryRow {
  id: string;
  product_id: string;
  vendor_id: string;
  price: string; // DECIMAL comes as string from pg
  recorded_at: Date;
}

/**
 * Negotiation model
 * Price negotiation sessions between buyers and vendors
 * Requirements: 6.2, 6.3
 */
export interface Negotiation {
  id: string;
  productId: string;
  buyerId: string;
  vendorId: string;
  status: NegotiationStatus;
  initialPrice: number;
  finalPrice?: number | null;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

/**
 * Database representation of Negotiation (snake_case)
 */
export interface NegotiationRow {
  id: string;
  product_id: string;
  buyer_id: string;
  vendor_id: string;
  status: NegotiationStatus;
  initial_price: string; // DECIMAL comes as string from pg
  final_price?: string | null; // DECIMAL comes as string from pg
  created_at: Date;
  expires_at: Date;
  updated_at: Date;
}

/**
 * Negotiation Message model
 * Messages and offers exchanged during negotiations
 * Requirements: 6.2, 6.4
 */
export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderType: SenderType;
  messageType: MessageType;
  price?: number | null;
  text?: string | null;
  createdAt: Date;
}

/**
 * Database representation of NegotiationMessage (snake_case)
 */
export interface NegotiationMessageRow {
  id: string;
  negotiation_id: string;
  sender_id: string;
  sender_type: SenderType;
  message_type: MessageType;
  price?: string | null; // DECIMAL comes as string from pg
  text?: string | null;
  created_at: Date;
}

/**
 * Rating model
 * Buyer ratings and reviews for vendors
 * Requirements: 9.5
 */
export interface Rating {
  id: string;
  vendorId: string;
  buyerId: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database representation of Rating (snake_case)
 */
export interface RatingRow {
  id: string;
  vendor_id: string;
  buyer_id: string;
  rating: number;
  comment?: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input types for creating new records (without auto-generated fields)
 */

export interface CreateUserInput {
  phoneNumber: string;
  name: string;
  userType: UserType;
  preferredLanguage?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
}

export interface UpdateUserInput {
  name?: string;
  preferredLanguage?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  rating?: number;
}

export interface CreateVendorInput {
  userId: string;
  shopName: string;
  shopNameTranslations?: Record<string, string>;
  description?: string;
  businessHours?: Record<string, any>;
}

export interface UpdateVendorInput {
  shopName?: string;
  shopNameTranslations?: Record<string, string>;
  description?: string;
  businessHours?: Record<string, any>;
  verified?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  nameTranslations: Record<string, string>;
  icon?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  nameTranslations?: Record<string, string>;
  icon?: string;
  parentId?: string;
}

export interface CreateProductInput {
  vendorId: string;
  name: string;
  nameTranslations: Record<string, string>;
  categoryId?: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  qrCode?: string;
  isAvailable?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  nameTranslations?: Record<string, string>;
  categoryId?: string;
  price?: number;
  unit?: string;
  quantity?: number;
  imageUrl?: string;
  qrCode?: string;
  isAvailable?: boolean;
}

export interface CreatePriceHistoryInput {
  productId: string;
  vendorId: string;
  price: number;
}

export interface CreateNegotiationInput {
  productId: string;
  buyerId: string;
  vendorId: string;
  initialPrice: number;
  expiresAt: Date;
}

export interface UpdateNegotiationInput {
  status?: NegotiationStatus;
  finalPrice?: number;
}

export interface CreateNegotiationMessageInput {
  negotiationId: string;
  senderId: string;
  senderType: SenderType;
  messageType: MessageType;
  price?: number;
  text?: string;
}

export interface CreateRatingInput {
  vendorId: string;
  buyerId: string;
  rating: number;
  comment?: string;
}

export interface UpdateRatingInput {
  rating?: number;
  comment?: string;
}
