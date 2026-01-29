/**
 * WhatsApp Service
 * Handles WhatsApp message generation and link formatting
 * 
 * Requirements:
 * - 2.1: Generate shareable WhatsApp message links
 * - 2.2: Open WhatsApp with pre-filled message
 * - 2.3: Format messages in recipient's preferred language
 * - 2.4: Include link back to product page
 * - 2.5: Support sharing multiple products in a single message
 */

export interface WhatsAppProduct {
  productId: string;
  vendorName: string;
  productName: string;
  price: number;
  unit: string;
}

export interface WhatsAppMessageOptions {
  products: WhatsAppProduct[];
  language?: string;
  baseUrl?: string;
  phoneNumber?: string;
}

export interface WhatsAppLinkResult {
  link: string;
  message: string;
}

/**
 * Generate a WhatsApp share link with pre-filled message
 * 
 * @param options - WhatsApp message options
 * @returns WhatsApp link and formatted message
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */
export function generateWhatsAppLink(options: WhatsAppMessageOptions): WhatsAppLinkResult {
  const { products, language = 'en', baseUrl = 'https://multilingual-mandi.com', phoneNumber } = options;

  if (!products || products.length === 0) {
    throw new Error('At least one product is required');
  }

  // Format the message based on language
  const message = formatWhatsAppMessage(products, language, baseUrl);

  // Generate WhatsApp link
  // Format: https://wa.me/<phone>?text=<message>
  // If no phone number, use general link: https://wa.me/?text=<message>
  const encodedMessage = encodeURIComponent(message);
  const link = phoneNumber 
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  return {
    link,
    message
  };
}

/**
 * Format WhatsApp message in the specified language
 * 
 * @param products - Array of products to include in message
 * @param language - Target language code
 * @param baseUrl - Base URL for product links
 * @returns Formatted message text
 * 
 * Requirements: 2.3, 2.4, 2.5
 */
export function formatWhatsAppMessage(
  products: WhatsAppProduct[],
  language: string,
  baseUrl: string
): string {
  // Get localized strings based on language
  const strings = getLocalizedStrings(language);

  // Single product message
  if (products.length === 1) {
    const product = products[0];
    return formatSingleProductMessage(product, strings, baseUrl);
  }

  // Multiple products message
  return formatMultipleProductsMessage(products, strings, baseUrl);
}

/**
 * Format message for a single product
 */
function formatSingleProductMessage(
  product: WhatsAppProduct,
  strings: LocalizedStrings,
  baseUrl: string
): string {
  const productUrl = `${baseUrl}/products/${product.productId}`;
  
  return `${strings.greeting}

${strings.productLabel}: ${product.productName}
${strings.priceLabel}: ${strings.currencySymbol}${product.price}/${product.unit}
${strings.vendorLabel}: ${product.vendorName}

${strings.viewDetails}: ${productUrl}

${strings.footer}`;
}

/**
 * Format message for multiple products
 */
function formatMultipleProductsMessage(
  products: WhatsAppProduct[],
  strings: LocalizedStrings,
  baseUrl: string
): string {
  const productList = products.map((product, index) => {
    const productUrl = `${baseUrl}/products/${product.productId}`;
    return `${index + 1}. ${product.productName}
   ${strings.priceLabel}: ${strings.currencySymbol}${product.price}/${product.unit}
   ${strings.vendorLabel}: ${product.vendorName}
   ${strings.link}: ${productUrl}`;
  }).join('\n\n');

  return `${strings.greeting}

${strings.multipleProductsHeader}:

${productList}

${strings.footer}`;
}

/**
 * Localized strings interface
 */
interface LocalizedStrings {
  greeting: string;
  productLabel: string;
  priceLabel: string;
  vendorLabel: string;
  viewDetails: string;
  link: string;
  footer: string;
  currencySymbol: string;
  multipleProductsHeader: string;
}

/**
 * Get localized strings for WhatsApp messages
 * 
 * @param language - Language code
 * @returns Localized strings
 * 
 * Requirement: 2.3
 */
function getLocalizedStrings(language: string): LocalizedStrings {
  const strings: Record<string, LocalizedStrings> = {
    en: {
      greeting: '🛒 Check out this product!',
      productLabel: 'Product',
      priceLabel: 'Price',
      vendorLabel: 'Vendor',
      viewDetails: 'View details',
      link: 'Link',
      footer: '📱 Shop on Multilingual Mandi',
      currencySymbol: '₹',
      multipleProductsHeader: 'Check out these products'
    },
    hi: {
      greeting: '🛒 इस उत्पाद को देखें!',
      productLabel: 'उत्पाद',
      priceLabel: 'मूल्य',
      vendorLabel: 'विक्रेता',
      viewDetails: 'विवरण देखें',
      link: 'लिंक',
      footer: '📱 मल्टीलिंगुअल मंडी पर खरीदें',
      currencySymbol: '₹',
      multipleProductsHeader: 'इन उत्पादों को देखें'
    },
    mr: {
      greeting: '🛒 हे उत्पादन पहा!',
      productLabel: 'उत्पादन',
      priceLabel: 'किंमत',
      vendorLabel: 'विक्रेता',
      viewDetails: 'तपशील पहा',
      link: 'दुवा',
      footer: '📱 मल्टीलिंग्वल मंडी वर खरेदी करा',
      currencySymbol: '₹',
      multipleProductsHeader: 'ही उत्पादने पहा'
    },
    bn: {
      greeting: '🛒 এই পণ্যটি দেখুন!',
      productLabel: 'পণ্য',
      priceLabel: 'মূল্য',
      vendorLabel: 'বিক্রেতা',
      viewDetails: 'বিস্তারিত দেখুন',
      link: 'লিংক',
      footer: '📱 মাল্টিলিঙ্গুয়াল মান্ডিতে কেনাকাটা করুন',
      currencySymbol: '₹',
      multipleProductsHeader: 'এই পণ্যগুলি দেখুন'
    },
    ta: {
      greeting: '🛒 இந்த தயாரிப்பைப் பார்க்கவும்!',
      productLabel: 'தயாரிப்பு',
      priceLabel: 'விலை',
      vendorLabel: 'விற்பனையாளர்',
      viewDetails: 'விவரங்களைக் காண்க',
      link: 'இணைப்பு',
      footer: '📱 மல்டிலிங்குவல் மண்டியில் வாங்கவும்',
      currencySymbol: '₹',
      multipleProductsHeader: 'இந்த தயாரிப்புகளைப் பார்க்கவும்'
    },
    te: {
      greeting: '🛒 ఈ ఉత్పత్తిని చూడండి!',
      productLabel: 'ఉత్పత్తి',
      priceLabel: 'ధర',
      vendorLabel: 'విక్రేత',
      viewDetails: 'వివరాలు చూడండి',
      link: 'లింక్',
      footer: '📱 మల్టీలింగ్వల్ మండిలో షాపింగ్ చేయండి',
      currencySymbol: '₹',
      multipleProductsHeader: 'ఈ ఉత్పత్తులను చూడండి'
    },
    gu: {
      greeting: '🛒 આ ઉત્પાદન જુઓ!',
      productLabel: 'ઉત્પાદન',
      priceLabel: 'કિંમત',
      vendorLabel: 'વિક્રેતા',
      viewDetails: 'વિગતો જુઓ',
      link: 'લિંક',
      footer: '📱 મલ્ટીલિંગ્વલ મંડી પર ખરીદી કરો',
      currencySymbol: '₹',
      multipleProductsHeader: 'આ ઉત્પાદનો જુઓ'
    },
    kn: {
      greeting: '🛒 ಈ ಉತ್ಪನ್ನವನ್ನು ನೋಡಿ!',
      productLabel: 'ಉತ್ಪನ್ನ',
      priceLabel: 'ಬೆಲೆ',
      vendorLabel: 'ಮಾರಾಟಗಾರ',
      viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
      link: 'ಲಿಂಕ್',
      footer: '📱 ಮಲ್ಟಿಲಿಂಗ್ವಲ್ ಮಂಡಿಯಲ್ಲಿ ಶಾಪಿಂಗ್ ಮಾಡಿ',
      currencySymbol: '₹',
      multipleProductsHeader: 'ಈ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಿ'
    }
  };

  // Default to English if language not supported
  return strings[language] || strings.en;
}

/**
 * Validate WhatsApp message options
 * 
 * @param options - Options to validate
 * @throws Error if validation fails
 */
export function validateWhatsAppOptions(options: WhatsAppMessageOptions): void {
  if (!options.products || !Array.isArray(options.products)) {
    throw new Error('Products must be an array');
  }

  if (options.products.length === 0) {
    throw new Error('At least one product is required');
  }

  for (const product of options.products) {
    if (!product.productId) {
      throw new Error('Product ID is required');
    }
    if (!product.productName) {
      throw new Error('Product name is required');
    }
    if (typeof product.price !== 'number' || product.price < 0) {
      throw new Error('Valid product price is required');
    }
    if (!product.unit) {
      throw new Error('Product unit is required');
    }
    if (!product.vendorName) {
      throw new Error('Vendor name is required');
    }
  }

  if (options.phoneNumber && !/^\d+$/.test(options.phoneNumber)) {
    throw new Error('Phone number must contain only digits');
  }
}
