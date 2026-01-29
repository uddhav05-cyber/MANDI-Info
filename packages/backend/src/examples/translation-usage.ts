/**
 * Translation Service Usage Examples
 * 
 * This file demonstrates how to use the translation service
 * in various scenarios within the Multilingual Mandi platform.
 */

import { translationService } from '../services/translation.service';

/**
 * Example 1: Basic Translation
 * Translate a simple greeting from English to Hindi
 */
async function basicTranslation() {
  console.log('=== Example 1: Basic Translation ===');
  
  const result = await translationService.translate({
    text: 'Welcome to Multilingual Mandi',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
  });
  
  console.log('Original:', result.sourceText);
  console.log('Translated:', result.translatedText);
  console.log('Confidence:', result.confidence);
  console.log();
}

/**
 * Example 2: Auto-detect Language
 * Let the service detect the source language automatically
 */
async function autoDetectLanguage() {
  console.log('=== Example 2: Auto-detect Language ===');
  
  const result = await translationService.translate({
    text: 'नमस्ते, आप कैसे हैं?',
    targetLanguage: 'en',
  });
  
  console.log('Detected Language:', result.sourceLanguage);
  console.log('Original:', result.sourceText);
  console.log('Translated:', result.translatedText);
  console.log();
}

/**
 * Example 3: Translate Product Information
 * Translate product details for a vendor
 */
async function translateProductInfo() {
  console.log('=== Example 3: Translate Product Information ===');
  
  const product = {
    name: 'Fresh Tomatoes',
    description: 'Locally grown organic tomatoes',
    category: 'Vegetables',
  };
  
  const translatedProduct = await translationService.translateObject(
    product,
    'hi',
    'en'
  );
  
  console.log('Original Product:', product);
  console.log('Translated Product:', translatedProduct);
  console.log();
}

/**
 * Example 4: Batch Translation
 * Translate multiple product names at once
 */
async function batchTranslation() {
  console.log('=== Example 4: Batch Translation ===');
  
  const productNames = [
    'Apples',
    'Bananas',
    'Oranges',
    'Mangoes',
    'Grapes',
  ];
  
  const translations = await translationService.translateBatch(
    productNames,
    'hi',
    'en'
  );
  
  console.log('Batch Translation Results:');
  translations.forEach((t, index) => {
    console.log(`${index + 1}. ${t.sourceText} -> ${t.translatedText}`);
  });
  console.log();
}

/**
 * Example 5: Language Detection
 * Detect the language of user input
 */
async function detectUserLanguage() {
  console.log('=== Example 5: Language Detection ===');
  
  const texts = [
    'Hello, how are you?',
    'नमस्ते, आप कैसे हैं?',
    'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    'வணக்கம்',
  ];
  
  for (const text of texts) {
    const detection = await translationService.detectLanguage(text);
    const langInfo = translationService.getLanguageInfo(detection.language);
    
    console.log(`Text: "${text}"`);
    console.log(`Detected: ${detection.language} (${langInfo?.name || 'Unknown'})`);
    console.log(`Confidence: ${detection.confidence}`);
    console.log();
  }
}

/**
 * Example 6: Get Supported Languages
 * Display all supported languages for language selector UI
 */
function getSupportedLanguages() {
  console.log('=== Example 6: Supported Languages ===');
  
  const languages = translationService.getSupportedLanguages();
  
  console.log('Available Languages:');
  languages.forEach((lang) => {
    const dialectLabel = lang.isRegionalDialect ? ' (Regional Dialect)' : '';
    console.log(`- ${lang.name} (${lang.code}): ${lang.nativeName}${dialectLabel}`);
  });
  console.log();
}

/**
 * Example 7: Translate Negotiation Messages
 * Translate messages between buyer and vendor in real-time
 */
async function translateNegotiationMessage() {
  console.log('=== Example 7: Translate Negotiation Message ===');
  
  // Vendor sends message in Hindi
  const vendorMessage = 'मैं ₹100 प्रति किलो दे सकता हूं';
  
  // Translate to English for buyer
  const translatedForBuyer = await translationService.translate({
    text: vendorMessage,
    sourceLanguage: 'hi',
    targetLanguage: 'en',
  });
  
  console.log('Vendor (Hindi):', vendorMessage);
  console.log('Buyer sees (English):', translatedForBuyer.translatedText);
  
  // Buyer responds in English
  const buyerMessage = 'Can you do ₹90 per kg?';
  
  // Translate to Hindi for vendor
  const translatedForVendor = await translationService.translate({
    text: buyerMessage,
    sourceLanguage: 'en',
    targetLanguage: 'hi',
  });
  
  console.log('Buyer (English):', buyerMessage);
  console.log('Vendor sees (Hindi):', translatedForVendor.translatedText);
  console.log();
}

/**
 * Example 8: Check Language Support
 * Validate user's language preference
 */
function checkLanguageSupport() {
  console.log('=== Example 8: Check Language Support ===');
  
  const languagesToCheck = ['en', 'hi', 'bho', 'xyz', 'fr'];
  
  languagesToCheck.forEach((lang) => {
    const isSupported = translationService.isLanguageSupported(lang);
    console.log(`${lang}: ${isSupported ? '✓ Supported' : '✗ Not Supported'}`);
  });
  console.log();
}

/**
 * Example 9: Translate WhatsApp Message
 * Generate translated WhatsApp message for product sharing
 */
async function translateWhatsAppMessage() {
  console.log('=== Example 9: Translate WhatsApp Message ===');
  
  const message = {
    vendorName: 'Ram\'s Fresh Produce',
    productName: 'Fresh Tomatoes',
    price: '₹50',
    unit: 'per kg',
  };
  
  const messageText = `${message.vendorName}\n${message.productName}\nPrice: ${message.price} ${message.unit}`;
  
  // Translate to Hindi
  const translatedMessage = await translationService.translate({
    text: messageText,
    sourceLanguage: 'en',
    targetLanguage: 'hi',
  });
  
  console.log('Original WhatsApp Message:');
  console.log(messageText);
  console.log('\nTranslated WhatsApp Message (Hindi):');
  console.log(translatedMessage.translatedText);
  console.log();
}

/**
 * Example 10: Handle Translation Errors
 * Demonstrate error handling for unsupported languages
 */
async function handleTranslationErrors() {
  console.log('=== Example 10: Handle Translation Errors ===');
  
  try {
    await translationService.translate({
      text: 'Hello',
      sourceLanguage: 'en',
      targetLanguage: 'xyz', // Invalid language code
    });
  } catch (error) {
    console.log('Error caught:', (error as Error).message);
  }
  
  console.log();
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Translation Service Usage Examples                   ║');
  console.log('║   Multilingual Mandi Platform                          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();
  
  try {
    // Note: These examples use mocked translation in tests
    // In production, they will use actual Google Cloud Translation API
    
    await basicTranslation();
    await autoDetectLanguage();
    await translateProductInfo();
    await batchTranslation();
    await detectUserLanguage();
    getSupportedLanguages();
    await translateNegotiationMessage();
    checkLanguageSupport();
    await translateWhatsAppMessage();
    await handleTranslationErrors();
    
    console.log('✓ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    // Clean up
    await translationService.close();
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicTranslation,
  autoDetectLanguage,
  translateProductInfo,
  batchTranslation,
  detectUserLanguage,
  getSupportedLanguages,
  translateNegotiationMessage,
  checkLanguageSupport,
  translateWhatsAppMessage,
  handleTranslationErrors,
};
