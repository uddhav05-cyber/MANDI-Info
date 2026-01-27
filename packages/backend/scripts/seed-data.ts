/**
 * Database Seed Script
 * 
 * This script populates the database with sample data for development and testing.
 * It creates sample users, vendors, categories, products, and other entities.
 */

import { Pool } from 'pg';

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'multilingual_mandi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Sample data definitions
 */
const sampleCategories = [
  {
    name: 'Vegetables',
    translations: { en: 'Vegetables', hi: 'सब्जियां', bho: 'तरकारी', mr: 'भाज्या' },
    icon: '🥬',
  },
  {
    name: 'Fruits',
    translations: { en: 'Fruits', hi: 'फल', bho: 'फर', mr: 'फळे' },
    icon: '🍎',
  },
  {
    name: 'Grains',
    translations: { en: 'Grains', hi: 'अनाज', bho: 'अनाज', mr: 'धान्य' },
    icon: '🌾',
  },
  {
    name: 'Spices',
    translations: { en: 'Spices', hi: 'मसाले', bho: 'मसाला', mr: 'मसाले' },
    icon: '🌶️',
  },
  {
    name: 'Dairy',
    translations: { en: 'Dairy', hi: 'डेयरी', bho: 'दूध उत्पाद', mr: 'दुग्धशाळा' },
    icon: '🥛',
  },
];

const sampleVendors = [
  {
    phone: '+919876543210',
    name: 'Rajesh Kumar',
    shopName: 'Kumar Vegetables',
    shopTranslations: { en: 'Kumar Vegetables', hi: 'कुमार सब्जी भंडार', bho: 'कुमार तरकारी दुकान' },
    description: 'Fresh vegetables daily from local farms',
    location: { lat: 28.6139, lng: 77.2090, address: 'Chandni Chowk, Delhi' },
  },
  {
    phone: '+919876543211',
    name: 'Priya Sharma',
    shopName: 'Sharma Fruits',
    shopTranslations: { en: 'Sharma Fruits', hi: 'शर्मा फल भंडार', bho: 'शर्मा फर दुकान' },
    description: 'Premium quality fruits',
    location: { lat: 28.6129, lng: 77.2295, address: 'Connaught Place, Delhi' },
  },
  {
    phone: '+919876543212',
    name: 'Mohammed Ali',
    shopName: 'Ali Spices',
    shopTranslations: { en: 'Ali Spices', hi: 'अली मसाला भंडार', bho: 'अली मसाला दुकान' },
    description: 'Authentic Indian spices',
    location: { lat: 28.6517, lng: 77.2219, address: 'Kashmere Gate, Delhi' },
  },
];

const sampleProducts = [
  { name: 'Tomato', translations: { en: 'Tomato', hi: 'टमाटर', bho: 'टमाटर', mr: 'टोमॅटो' }, category: 'Vegetables', price: 40, unit: 'kg' },
  { name: 'Potato', translations: { en: 'Potato', hi: 'आलू', bho: 'आलू', mr: 'बटाटा' }, category: 'Vegetables', price: 30, unit: 'kg' },
  { name: 'Onion', translations: { en: 'Onion', hi: 'प्याज', bho: 'पियाज', mr: 'कांदा' }, category: 'Vegetables', price: 35, unit: 'kg' },
  { name: 'Apple', translations: { en: 'Apple', hi: 'सेब', bho: 'सेब', mr: 'सफरचंद' }, category: 'Fruits', price: 120, unit: 'kg' },
  { name: 'Banana', translations: { en: 'Banana', hi: 'केला', bho: 'केला', mr: 'केळी' }, category: 'Fruits', price: 50, unit: 'dozen' },
  { name: 'Mango', translations: { en: 'Mango', hi: 'आम', bho: 'आम', mr: 'आंबा' }, category: 'Fruits', price: 80, unit: 'kg' },
  { name: 'Rice', translations: { en: 'Rice', hi: 'चावल', bho: 'चाउर', mr: 'तांदूळ' }, category: 'Grains', price: 60, unit: 'kg' },
  { name: 'Wheat', translations: { en: 'Wheat', hi: 'गेहूं', bho: 'गेहूं', mr: 'गहू' }, category: 'Grains', price: 40, unit: 'kg' },
  { name: 'Turmeric', translations: { en: 'Turmeric', hi: 'हल्दी', bho: 'हरदी', mr: 'हळद' }, category: 'Spices', price: 200, unit: 'kg' },
  { name: 'Chili Powder', translations: { en: 'Chili Powder', hi: 'लाल मिर्च', bho: 'मिरचाई', mr: 'लाल मिरची' }, category: 'Spices', price: 150, unit: 'kg' },
];

/**
 * Seed categories
 */
async function seedCategories(): Promise<Map<string, string>> {
  console.log('📦 Seeding categories...');
  const categoryMap = new Map<string, string>();

  for (const category of sampleCategories) {
    const result = await pool.query(
      `INSERT INTO categories (name, name_translations, icon)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [category.name, JSON.stringify(category.translations), category.icon]
    );
    categoryMap.set(category.name, result.rows[0].id);
    console.log(`  ✅ Created category: ${category.name}`);
  }

  return categoryMap;
}

/**
 * Seed vendors and users
 */
async function seedVendors(): Promise<string[]> {
  console.log('👥 Seeding vendors...');
  const vendorIds: string[] = [];

  for (const vendor of sampleVendors) {
    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (phone_number, name, user_type, preferred_language, location_latitude, location_longitude, location_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [vendor.phone, vendor.name, 'vendor', 'hi', vendor.location.lat, vendor.location.lng, vendor.location.address]
    );
    const userId = userResult.rows[0].id;

    // Create vendor profile
    const vendorResult = await pool.query(
      `INSERT INTO vendors (user_id, shop_name, shop_name_translations, description, verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, vendor.shopName, JSON.stringify(vendor.shopTranslations), vendor.description, true]
    );
    vendorIds.push(vendorResult.rows[0].id);
    console.log(`  ✅ Created vendor: ${vendor.shopName}`);
  }

  return vendorIds;
}

/**
 * Seed products
 */
async function seedProducts(vendorIds: string[], categoryMap: Map<string, string>): Promise<void> {
  console.log('🛒 Seeding products...');

  for (const product of sampleProducts) {
    // Randomly assign to a vendor
    const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)];
    const categoryId = categoryMap.get(product.category);

    await pool.query(
      `INSERT INTO products (vendor_id, category_id, name, name_translations, price, unit, quantity, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [vendorId, categoryId, product.name, JSON.stringify(product.translations), product.price, product.unit, 100, true]
    );
    console.log(`  ✅ Created product: ${product.name}`);
  }
}

/**
 * Seed sample buyers
 */
async function seedBuyers(): Promise<string[]> {
  console.log('🛍️  Seeding buyers...');
  const buyerIds: string[] = [];

  const buyers = [
    { phone: '+919876543220', name: 'Amit Patel' },
    { phone: '+919876543221', name: 'Sneha Gupta' },
    { phone: '+919876543222', name: 'Rahul Singh' },
  ];

  for (const buyer of buyers) {
    const result = await pool.query(
      `INSERT INTO users (phone_number, name, user_type, preferred_language)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [buyer.phone, buyer.name, 'buyer', 'hi']
    );
    buyerIds.push(result.rows[0].id);
    console.log(`  ✅ Created buyer: ${buyer.name}`);
  }

  return buyerIds;
}

/**
 * Seed sample ratings
 */
async function seedRatings(vendorIds: string[], buyerIds: string[]): Promise<void> {
  console.log('⭐ Seeding ratings...');

  for (const vendorId of vendorIds) {
    // Each vendor gets 2-3 ratings
    const numRatings = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numRatings && i < buyerIds.length; i++) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3-5 stars
      const comments = [
        'Great quality products!',
        'Good service and fresh items',
        'Reasonable prices',
        'Very satisfied with the purchase',
      ];
      const comment = comments[Math.floor(Math.random() * comments.length)];

      await pool.query(
        `INSERT INTO ratings (vendor_id, buyer_id, rating, comment)
         VALUES ($1, $2, $3, $4)`,
        [vendorId, buyerIds[i], rating, comment]
      );
    }
    console.log(`  ✅ Created ratings for vendor`);
  }
}

/**
 * Main seed function
 */
async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if data already exists
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      console.log('💡 Run migrate:rollback and migrate again to reseed.\n');
      return;
    }

    const categoryMap = await seedCategories();
    console.log('');

    const vendorIds = await seedVendors();
    console.log('');

    await seedProducts(vendorIds, categoryMap);
    console.log('');

    const buyerIds = await seedBuyers();
    console.log('');

    await seedRatings(vendorIds, buyerIds);
    console.log('');

    console.log('✨ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${sampleCategories.length} categories`);
    console.log(`   - ${sampleVendors.length} vendors`);
    console.log(`   - ${sampleProducts.length} products`);
    console.log(`   - ${buyerIds.length} buyers`);
    console.log(`   - Multiple ratings`);

  } catch (error) {
    console.error('❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main execution
(async () => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
