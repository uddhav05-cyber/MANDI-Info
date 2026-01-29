/**
 * WhatsApp Service Usage Examples
 * 
 * This file demonstrates various use cases for the WhatsApp service
 */

import {
  generateWhatsAppLink,
  formatWhatsAppMessage,
  validateWhatsAppOptions,
  WhatsAppProduct,
  WhatsAppMessageOptions
} from '../services/whatsapp.service';

/**
 * Example 1: Share a single product in English
 */
function shareSingleProductEnglish() {
  console.log('=== Example 1: Share Single Product (English) ===');
  
  const result = generateWhatsAppLink({
    products: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Tomatoes',
      price: 50,
      unit: 'kg'
    }],
    language: 'en',
    baseUrl: 'https://multilingual-mandi.com'
  });

  console.log('WhatsApp Link:', result.link);
  console.log('\nMessage Preview:');
  console.log(result.message);
  console.log();
}

/**
 * Example 2: Share a single product in Hindi
 */
function shareSingleProductHindi() {
  console.log('=== Example 2: Share Single Product (Hindi) ===');
  
  const result = generateWhatsAppLink({
    products: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'ताजा मार्ट',
      productName: 'ताजा टमाटर',
      price: 50,
      unit: 'kg'
    }],
    language: 'hi',
    baseUrl: 'https://multilingual-mandi.com'
  });

  console.log('WhatsApp Link:', result.link);
  console.log('\nMessage Preview:');
  console.log(result.message);
  console.log();
}

/**
 * Example 3: Share multiple products
 */
function shareMultipleProducts() {
  console.log('=== Example 3: Share Multiple Products ===');
  
  const products: WhatsAppProduct[] = [
    {
      productId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Tomatoes',
      price: 50,
      unit: 'kg'
    },
    {
      productId: '223e4567-e89b-12d3-a456-426614174001',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Potatoes',
      price: 30,
      unit: 'kg'
    },
    {
      productId: '323e4567-e89b-12d3-a456-426614174002',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Onions',
      price: 40,
      unit: 'kg'
    }
  ];

  const result = generateWhatsAppLink({
    products,
    language: 'en',
    baseUrl: 'https://multilingual-mandi.com'
  });

  console.log('WhatsApp Link:', result.link);
  console.log('\nMessage Preview:');
  console.log(result.message);
  console.log();
}

/**
 * Example 4: Share to a specific contact
 */
function shareToSpecificContact() {
  console.log('=== Example 4: Share to Specific Contact ===');
  
  const result = generateWhatsAppLink({
    products: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'Green Grocers',
      productName: 'Organic Carrots',
      price: 60,
      unit: 'kg'
    }],
    language: 'en',
    phoneNumber: '919876543210' // Recipient's phone number
  });

  console.log('WhatsApp Link (with phone):', result.link);
  console.log('\nThis link will open WhatsApp with the specific contact');
  console.log();
}

/**
 * Example 5: Share in different regional languages
 */
function shareInRegionalLanguages() {
  console.log('=== Example 5: Share in Regional Languages ===');
  
  const product: WhatsAppProduct = {
    productId: '123e4567-e89b-12d3-a456-426614174000',
    vendorName: 'Local Vendor',
    productName: 'Fresh Mangoes',
    price: 80,
    unit: 'kg'
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' }
  ];

  languages.forEach(lang => {
    const message = formatWhatsAppMessage(
      [product],
      lang.code,
      'https://multilingual-mandi.com'
    );
    
    console.log(`\n${lang.name} (${lang.code}):`);
    console.log(message.split('\n')[0]); // Just show the greeting line
  });
  
  console.log();
}

/**
 * Example 6: Validate options before generating
 */
function validateBeforeGenerating() {
  console.log('=== Example 6: Validate Options ===');
  
  const validOptions: WhatsAppMessageOptions = {
    products: [{
      productId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Tomatoes',
      price: 50,
      unit: 'kg'
    }]
  };

  const invalidOptions: WhatsAppMessageOptions = {
    products: [{
      productId: '',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Tomatoes',
      price: -10,
      unit: 'kg'
    }]
  };

  try {
    validateWhatsAppOptions(validOptions);
    console.log('✓ Valid options passed validation');
  } catch (error) {
    console.log('✗ Valid options failed:', (error as Error).message);
  }

  try {
    validateWhatsAppOptions(invalidOptions);
    console.log('✗ Invalid options passed validation (should not happen)');
  } catch (error) {
    console.log('✓ Invalid options caught:', (error as Error).message);
  }
  
  console.log();
}

/**
 * Example 7: Handle edge cases
 */
function handleEdgeCases() {
  console.log('=== Example 7: Handle Edge Cases ===');
  
  // Product with special characters
  const specialProduct: WhatsAppProduct = {
    productId: '123e4567-e89b-12d3-a456-426614174000',
    vendorName: 'Ram & Sons',
    productName: 'Tomatoes & Onions (Fresh!)',
    price: 45.50,
    unit: 'kg'
  };

  const result1 = generateWhatsAppLink({
    products: [specialProduct],
    language: 'en'
  });

  console.log('Product with special characters:');
  console.log(result1.message.split('\n')[2]); // Product line
  
  // Product with decimal price
  console.log('\nDecimal price handling:');
  console.log(result1.message.split('\n')[3]); // Price line
  
  // Free product (price = 0)
  const freeProduct: WhatsAppProduct = {
    productId: '223e4567-e89b-12d3-a456-426614174001',
    vendorName: 'Sample Store',
    productName: 'Free Sample',
    price: 0,
    unit: 'piece'
  };

  const result2 = generateWhatsAppLink({
    products: [freeProduct],
    language: 'en'
  });

  console.log('\nFree product (price = 0):');
  console.log(result2.message.split('\n')[3]); // Price line
  
  console.log();
}

/**
 * Example 8: Generate links for different scenarios
 */
function generateLinksForScenarios() {
  console.log('=== Example 8: Different Link Scenarios ===');
  
  const product: WhatsAppProduct = {
    productId: '123e4567-e89b-12d3-a456-426614174000',
    vendorName: 'Fresh Mart',
    productName: 'Fresh Tomatoes',
    price: 50,
    unit: 'kg'
  };

  // Scenario 1: General share (no phone number)
  const generalShare = generateWhatsAppLink({
    products: [product]
  });
  console.log('General share link:');
  console.log(generalShare.link.substring(0, 50) + '...');

  // Scenario 2: Share to specific contact
  const specificShare = generateWhatsAppLink({
    products: [product],
    phoneNumber: '919876543210'
  });
  console.log('\nShare to specific contact:');
  console.log(specificShare.link.substring(0, 50) + '...');

  // Scenario 3: Custom base URL
  const customUrlShare = generateWhatsAppLink({
    products: [product],
    baseUrl: 'https://custom-domain.com'
  });
  console.log('\nWith custom base URL:');
  console.log('Product URL in message:', customUrlShare.message.match(/https:\/\/[^\s]+/)?.[0]);
  
  console.log();
}

/**
 * Example 9: Format messages for comparison
 */
function formatMessagesComparison() {
  console.log('=== Example 9: Message Format Comparison ===');
  
  const singleProduct: WhatsAppProduct = {
    productId: '123e4567-e89b-12d3-a456-426614174000',
    vendorName: 'Fresh Mart',
    productName: 'Fresh Tomatoes',
    price: 50,
    unit: 'kg'
  };

  const multipleProducts: WhatsAppProduct[] = [
    singleProduct,
    {
      productId: '223e4567-e89b-12d3-a456-426614174001',
      vendorName: 'Fresh Mart',
      productName: 'Fresh Potatoes',
      price: 30,
      unit: 'kg'
    }
  ];

  console.log('Single Product Format:');
  console.log('─'.repeat(50));
  const singleMessage = formatWhatsAppMessage([singleProduct], 'en', 'https://test.com');
  console.log(singleMessage);
  
  console.log('\n\nMultiple Products Format:');
  console.log('─'.repeat(50));
  const multiMessage = formatWhatsAppMessage(multipleProducts, 'en', 'https://test.com');
  console.log(multiMessage);
  
  console.log();
}

/**
 * Example 10: Real-world vendor scenario
 */
function realWorldVendorScenario() {
  console.log('=== Example 10: Real-World Vendor Scenario ===');
  console.log('A vendor wants to share their daily fresh produce with customers\n');
  
  const dailyProduce: WhatsAppProduct[] = [
    {
      productId: 'prod-001',
      vendorName: 'राम की सब्जी मंडी',
      productName: 'ताजा टमाटर',
      price: 45,
      unit: 'kg'
    },
    {
      productId: 'prod-002',
      vendorName: 'राम की सब्जी मंडी',
      productName: 'ताजा आलू',
      price: 28,
      unit: 'kg'
    },
    {
      productId: 'prod-003',
      vendorName: 'राम की सब्जी मंडी',
      productName: 'ताजा प्याज',
      price: 35,
      unit: 'kg'
    },
    {
      productId: 'prod-004',
      vendorName: 'राम की सब्जी मंडी',
      productName: 'हरी मिर्च',
      price: 60,
      unit: 'kg'
    }
  ];

  const result = generateWhatsAppLink({
    products: dailyProduce,
    language: 'hi',
    baseUrl: 'https://multilingual-mandi.com'
  });

  console.log('Generated WhatsApp Link:');
  console.log(result.link.substring(0, 80) + '...\n');
  
  console.log('Message that will be sent:');
  console.log('─'.repeat(60));
  console.log(result.message);
  console.log('─'.repeat(60));
  
  console.log('\nThe vendor can now:');
  console.log('1. Click the link to open WhatsApp');
  console.log('2. Select customers from their contact list');
  console.log('3. Send the pre-filled message');
  console.log('4. Customers receive product details with direct links');
  console.log();
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('WhatsApp Service Usage Examples');
  console.log('='.repeat(70) + '\n');

  try {
    shareSingleProductEnglish();
    shareSingleProductHindi();
    shareMultipleProducts();
    shareToSpecificContact();
    shareInRegionalLanguages();
    validateBeforeGenerating();
    handleEdgeCases();
    generateLinksForScenarios();
    formatMessagesComparison();
    realWorldVendorScenario();

    console.log('='.repeat(70));
    console.log('All examples completed successfully!');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use in other modules
export {
  shareSingleProductEnglish,
  shareSingleProductHindi,
  shareMultipleProducts,
  shareToSpecificContact,
  shareInRegionalLanguages,
  validateBeforeGenerating,
  handleEdgeCases,
  generateLinksForScenarios,
  formatMessagesComparison,
  realWorldVendorScenario
};
