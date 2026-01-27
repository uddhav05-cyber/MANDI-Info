/**
 * Repository Usage Examples
 * This file demonstrates how to use the repository pattern for data access
 */

import {
  UserRepository,
  VendorRepository,
  ProductRepository,
  CategoryRepository,
  PriceHistoryRepository,
  NegotiationRepository,
  NegotiationMessageRepository,
  RatingRepository,
} from '../repositories';
import { pool } from '../config/database';

/**
 * Example 1: User Management
 */
async function userManagementExample() {
  const userRepo = new UserRepository(pool);

  // Create a new vendor user
  const vendor = await userRepo.create({
    phoneNumber: '+919876543210',
    name: 'Rajesh Kumar',
    userType: 'vendor',
    preferredLanguage: 'hi',
    locationLatitude: 28.6139,
    locationLongitude: 77.2090,
    locationAddress: 'Chandni Chowk, Delhi',
  });

  console.log('Created vendor:', vendor);

  // Find user by phone number (for authentication)
  const foundUser = await userRepo.findByPhoneNumber('+919876543210');
  console.log('Found user:', foundUser);

  // Update user profile
  const updatedUser = await userRepo.update(vendor.id, {
    name: 'Rajesh Kumar Singh',
    preferredLanguage: 'en',
  });
  console.log('Updated user:', updatedUser);

  // Find nearby users (within 5km)
  const nearbyUsers = await userRepo.findNearby(28.6139, 77.2090, 5, 10);
  console.log('Nearby users:', nearbyUsers);
}

/**
 * Example 2: Vendor Profile Management
 */
async function vendorManagementExample() {
  const userRepo = new UserRepository(pool);
  const vendorRepo = new VendorRepository(pool);

  // First create a user
  const user = await userRepo.create({
    phoneNumber: '+919876543211',
    name: 'Priya Sharma',
    userType: 'vendor',
    preferredLanguage: 'hi',
  });

  // Create vendor profile
  const vendor = await vendorRepo.create({
    userId: user.id,
    shopName: 'Sharma Fresh Vegetables',
    shopNameTranslations: {
      hi: 'शर्मा ताज़ी सब्जियाँ',
      en: 'Sharma Fresh Vegetables',
    },
    description: 'Fresh vegetables from local farms',
    businessHours: {
      monday: { open: '06:00', close: '20:00' },
      tuesday: { open: '06:00', close: '20:00' },
      // ... other days
    },
  });

  console.log('Created vendor profile:', vendor);

  // Find vendor by user ID
  const foundVendor = await vendorRepo.findByUserId(user.id);
  console.log('Found vendor:', foundVendor);

  // Search vendors by shop name
  const searchResults = await vendorRepo.searchByShopName('Sharma', 10);
  console.log('Search results:', searchResults);
}

/**
 * Example 3: Product Catalog Management
 */
async function productManagementExample() {
  const productRepo = new ProductRepository(pool);
  const categoryRepo = new CategoryRepository(pool);

  // Create a category
  const category = await categoryRepo.create({
    name: 'Vegetables',
    nameTranslations: {
      hi: 'सब्जियाँ',
      en: 'Vegetables',
      mr: 'भाज्या',
    },
    icon: '🥬',
  });

  // Create a product
  const product = await productRepo.create({
    vendorId: 'vendor-uuid-here',
    name: 'Fresh Tomatoes',
    nameTranslations: {
      hi: 'ताज़ा टमाटर',
      en: 'Fresh Tomatoes',
      mr: 'ताजे टोमॅटो',
    },
    categoryId: category.id,
    price: 40.0,
    unit: 'kg',
    quantity: 100,
    imageUrl: 'https://example.com/tomatoes.jpg',
    isAvailable: true,
  });

  console.log('Created product:', product);

  // Search products by name
  const searchResults = await productRepo.searchByName('tomato', 10);
  console.log('Search results:', searchResults);

  // Find products in price range
  const affordableProducts = await productRepo.findByPriceRange(10, 50, 20);
  console.log('Affordable products:', affordableProducts);

  // Update product availability
  const updatedProduct = await productRepo.updateAvailability(product.id, false);
  console.log('Updated product:', updatedProduct);

  // Bulk create products (for CSV upload)
  const bulkProducts = await productRepo.bulkCreate([
    {
      vendorId: 'vendor-uuid-here',
      name: 'Onions',
      nameTranslations: { hi: 'प्याज', en: 'Onions' },
      categoryId: category.id,
      price: 30.0,
      unit: 'kg',
      quantity: 50,
    },
    {
      vendorId: 'vendor-uuid-here',
      name: 'Potatoes',
      nameTranslations: { hi: 'आलू', en: 'Potatoes' },
      categoryId: category.id,
      price: 25.0,
      unit: 'kg',
      quantity: 75,
    },
  ]);

  console.log('Bulk created products:', bulkProducts);
}

/**
 * Example 4: Price History Tracking
 */
async function priceHistoryExample() {
  const priceHistoryRepo = new PriceHistoryRepository(pool);

  // Record a price change
  const priceRecord = await priceHistoryRepo.create({
    productId: 'product-uuid-here',
    vendorId: 'vendor-uuid-here',
    price: 45.0,
  });

  console.log('Recorded price:', priceRecord);

  // Get price history for a product
  const history = await priceHistoryRepo.findByProductId('product-uuid-here', 30);
  console.log('Price history:', history);

  // Get average price over last 7 days
  const avgPrice = await priceHistoryRepo.getAveragePrice('product-uuid-here', 7);
  console.log('Average price (7 days):', avgPrice);

  // Get price history within date range
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');
  const rangeHistory = await priceHistoryRepo.findByDateRange(
    'product-uuid-here',
    startDate,
    endDate
  );
  console.log('Price history (date range):', rangeHistory);
}

/**
 * Example 5: Negotiation Management
 */
async function negotiationExample() {
  const negotiationRepo = new NegotiationRepository(pool);
  const messageRepo = new NegotiationMessageRepository(pool);

  // Create a negotiation
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

  const negotiation = await negotiationRepo.create({
    productId: 'product-uuid-here',
    buyerId: 'buyer-uuid-here',
    vendorId: 'vendor-uuid-here',
    initialPrice: 100.0,
    expiresAt,
  });

  console.log('Created negotiation:', negotiation);

  // Add messages to negotiation
  const message1 = await messageRepo.create({
    negotiationId: negotiation.id,
    senderId: 'buyer-uuid-here',
    senderType: 'buyer',
    messageType: 'counter',
    price: 90.0,
    text: 'Can you do 90 rupees?',
  });

  const message2 = await messageRepo.create({
    negotiationId: negotiation.id,
    senderId: 'vendor-uuid-here',
    senderType: 'vendor',
    messageType: 'counter',
    price: 95.0,
    text: 'How about 95?',
  });

  console.log('Messages:', [message1, message2]);

  // Get all messages in negotiation
  const allMessages = await messageRepo.findByNegotiationId(negotiation.id);
  console.log('All messages:', allMessages);

  // Accept negotiation
  const acceptedNegotiation = await negotiationRepo.accept(negotiation.id, 95.0);
  console.log('Accepted negotiation:', acceptedNegotiation);

  // Find buyer's negotiations
  const buyerNegotiations = await negotiationRepo.findByBuyerId('buyer-uuid-here', 'accepted');
  console.log('Buyer negotiations:', buyerNegotiations);

  // Mark expired negotiations
  const expiredCount = await negotiationRepo.markExpired();
  console.log('Marked expired:', expiredCount);
}

/**
 * Example 6: Rating System
 */
async function ratingExample() {
  const ratingRepo = new RatingRepository(pool);

  // Create a rating
  const rating = await ratingRepo.create({
    vendorId: 'vendor-uuid-here',
    buyerId: 'buyer-uuid-here',
    rating: 5,
    comment: 'Excellent quality vegetables and great service!',
  });

  console.log('Created rating:', rating);

  // Get all ratings for a vendor
  const vendorRatings = await ratingRepo.findByVendorId('vendor-uuid-here', 10);
  console.log('Vendor ratings:', vendorRatings);

  // Calculate average rating
  const avgRating = await ratingRepo.getAverageRating('vendor-uuid-here');
  console.log('Average rating:', avgRating);

  // Get rating distribution
  const distribution = await ratingRepo.getRatingDistribution('vendor-uuid-here');
  console.log('Rating distribution:', distribution);
  // Output: { 1: 0, 2: 1, 3: 5, 4: 10, 5: 20 }

  // Update a rating
  const updatedRating = await ratingRepo.update(rating.id, {
    rating: 4,
    comment: 'Good quality, but slightly expensive',
  });
  console.log('Updated rating:', updatedRating);
}

/**
 * Example 7: Complex Query - Find Products with Vendor Info
 */
async function complexQueryExample() {
  const productRepo = new ProductRepository(pool);

  // This is a simple example. For complex joins, you might want to
  // add custom methods to repositories or use raw queries

  // Find products by vendor
  const vendorProducts = await productRepo.findByVendorId('vendor-uuid-here', 20);
  console.log('Vendor products:', vendorProducts);

  // Find available products in a category
  const categoryProducts = await productRepo.findByCategoryId('category-uuid-here', 50);
  const availableProducts = categoryProducts.filter((p) => p.isAvailable);
  console.log('Available category products:', availableProducts);
}

/**
 * Example 8: Transaction Example (using pg Pool)
 */
async function transactionExample() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (phone_number, name, user_type, preferred_language)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ['+919876543212', 'Test User', 'vendor', 'hi']
    );

    const userId = userResult.rows[0].id;

    // Create vendor profile
    await client.query(
      `INSERT INTO vendors (user_id, shop_name, shop_name_translations)
       VALUES ($1, $2, $3)`,
      [userId, 'Test Shop', JSON.stringify({ hi: 'टेस्ट दुकान', en: 'Test Shop' })]
    );

    await client.query('COMMIT');
    console.log('Transaction completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export examples for use in other files
export {
  userManagementExample,
  vendorManagementExample,
  productManagementExample,
  priceHistoryExample,
  negotiationExample,
  ratingExample,
  complexQueryExample,
  transactionExample,
};
