# WhatsApp Service Documentation

## Overview

The WhatsApp Service provides functionality to generate shareable WhatsApp links with pre-filled messages containing product information. This service supports multiple languages and can handle both single and multiple product sharing.

## Requirements Addressed

- **Requirement 2.1**: Generate shareable WhatsApp message links
- **Requirement 2.2**: Open WhatsApp with pre-filled message containing product details and price
- **Requirement 2.3**: Format WhatsApp messages in the recipient's preferred language
- **Requirement 2.4**: Include a link back to the product page
- **Requirement 2.5**: Support sharing multiple products in a single WhatsApp message

## API Reference

### Types

#### `WhatsAppProduct`
```typescript
interface WhatsAppProduct {
  productId: string;      // Unique product identifier
  vendorName: string;     // Name of the vendor
  productName: string;    // Name of the product
  price: number;          // Product price (must be >= 0)
  unit: string;           // Unit of measurement (e.g., 'kg', 'piece')
}
```

#### `WhatsAppMessageOptions`
```typescript
interface WhatsAppMessageOptions {
  products: WhatsAppProduct[];  // Array of products to share (required, min 1)
  language?: string;            // Language code (default: 'en')
  baseUrl?: string;             // Base URL for product links (default: 'https://multilingual-mandi.com')
  phoneNumber?: string;         // Optional recipient phone number (digits only)
}
```

#### `WhatsAppLinkResult`
```typescript
interface WhatsAppLinkResult {
  link: string;     // Complete WhatsApp URL with encoded message
  message: string;  // Formatted message text
}
```

### Functions

#### `generateWhatsAppLink(options: WhatsAppMessageOptions): WhatsAppLinkResult`

Generates a WhatsApp share link with a pre-filled message.

**Parameters:**
- `options`: WhatsApp message options

**Returns:**
- Object containing the WhatsApp link and formatted message

**Throws:**
- Error if no products are provided

**Example:**
```typescript
import { generateWhatsAppLink } from './services/whatsapp.service';

const result = generateWhatsAppLink({
  products: [{
    productId: '123',
    vendorName: 'Fresh Mart',
    productName: 'Tomatoes',
    price: 50,
    unit: 'kg'
  }],
  language: 'hi',
  baseUrl: 'https://mandi.com',
  phoneNumber: '919876543210'
});

console.log(result.link);
// https://wa.me/919876543210?text=...
```

#### `formatWhatsAppMessage(products: WhatsAppProduct[], language: string, baseUrl: string): string`

Formats a WhatsApp message in the specified language.

**Parameters:**
- `products`: Array of products to include
- `language`: Target language code
- `baseUrl`: Base URL for product links

**Returns:**
- Formatted message text

**Example:**
```typescript
import { formatWhatsAppMessage } from './services/whatsapp.service';

const message = formatWhatsAppMessage(
  [{ productId: '123', vendorName: 'Fresh Mart', productName: 'Tomatoes', price: 50, unit: 'kg' }],
  'en',
  'https://mandi.com'
);

console.log(message);
// 🛒 Check out this product!
// 
// Product: Tomatoes
// Price: ₹50/kg
// Vendor: Fresh Mart
// 
// View details: https://mandi.com/products/123
// 
// 📱 Shop on Multilingual Mandi
```

#### `validateWhatsAppOptions(options: WhatsAppMessageOptions): void`

Validates WhatsApp message options.

**Parameters:**
- `options`: Options to validate

**Throws:**
- Error if validation fails

**Example:**
```typescript
import { validateWhatsAppOptions } from './services/whatsapp.service';

try {
  validateWhatsAppOptions({
    products: [{ /* valid product */ }],
    phoneNumber: '919876543210'
  });
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

## Supported Languages

The service supports the following languages with localized message templates:

- **English** (`en`)
- **Hindi** (`hi`)
- **Marathi** (`mr`)
- **Bengali** (`bn`)
- **Tamil** (`ta`)
- **Telugu** (`te`)
- **Gujarati** (`gu`)
- **Kannada** (`kn`)

If an unsupported language is provided, the service defaults to English.

## Message Format

### Single Product Message

```
🛒 [Greeting]

[Product Label]: [Product Name]
[Price Label]: ₹[Price]/[Unit]
[Vendor Label]: [Vendor Name]

[View Details Label]: [Product URL]

📱 [Footer]
```

### Multiple Products Message

```
🛒 [Greeting]

[Multiple Products Header]:

1. [Product 1 Name]
   [Price Label]: ₹[Price]/[Unit]
   [Vendor Label]: [Vendor Name]
   [Link Label]: [Product URL]

2. [Product 2 Name]
   [Price Label]: ₹[Price]/[Unit]
   [Vendor Label]: [Vendor Name]
   [Link Label]: [Product URL]

📱 [Footer]
```

## WhatsApp Link Format

The service generates links in the following formats:

**With phone number:**
```
https://wa.me/[phone]?text=[encoded_message]
```

**Without phone number (general share):**
```
https://wa.me/?text=[encoded_message]
```

## Validation Rules

The service validates the following:

1. **Products Array**: Must be a non-empty array
2. **Product ID**: Required, non-empty string
3. **Product Name**: Required, non-empty string
4. **Price**: Required, must be a number >= 0
5. **Unit**: Required, non-empty string
6. **Vendor Name**: Required, non-empty string
7. **Phone Number**: Optional, must contain only digits if provided

## Usage Examples

### Example 1: Share Single Product in English

```typescript
import { generateWhatsAppLink } from './services/whatsapp.service';

const result = generateWhatsAppLink({
  products: [{
    productId: 'prod-001',
    vendorName: 'Green Grocers',
    productName: 'Fresh Tomatoes',
    price: 45,
    unit: 'kg'
  }],
  language: 'en'
});

// Open WhatsApp with the link
window.open(result.link, '_blank');
```

### Example 2: Share Multiple Products in Hindi

```typescript
import { generateWhatsAppLink } from './services/whatsapp.service';

const result = generateWhatsAppLink({
  products: [
    {
      productId: 'prod-001',
      vendorName: 'ग्रीन ग्रोसर्स',
      productName: 'ताजा टमाटर',
      price: 45,
      unit: 'kg'
    },
    {
      productId: 'prod-002',
      vendorName: 'ग्रीन ग्रोसर्स',
      productName: 'ताजा आलू',
      price: 30,
      unit: 'kg'
    }
  ],
  language: 'hi',
  baseUrl: 'https://mandi.com'
});

console.log(result.message);
```

### Example 3: Share to Specific Contact

```typescript
import { generateWhatsAppLink } from './services/whatsapp.service';

const result = generateWhatsAppLink({
  products: [{
    productId: 'prod-001',
    vendorName: 'Fresh Mart',
    productName: 'Onions',
    price: 35,
    unit: 'kg'
  }],
  phoneNumber: '919876543210', // Recipient's phone number
  language: 'en'
});

// This will open WhatsApp with the specific contact
window.open(result.link, '_blank');
```

### Example 4: Validate Before Generating

```typescript
import { generateWhatsAppLink, validateWhatsAppOptions } from './services/whatsapp.service';

const options = {
  products: [{
    productId: 'prod-001',
    vendorName: 'Fresh Mart',
    productName: 'Carrots',
    price: 40,
    unit: 'kg'
  }]
};

try {
  validateWhatsAppOptions(options);
  const result = generateWhatsAppLink(options);
  console.log('Link generated:', result.link);
} catch (error) {
  console.error('Invalid options:', error.message);
}
```

## Integration with Translation Service

The WhatsApp service can be integrated with the Translation Service for dynamic product name translation:

```typescript
import { generateWhatsAppLink } from './services/whatsapp.service';
import { translateText } from './services/translation.service';

async function shareProductInLanguage(product, targetLanguage) {
  // Translate product name if needed
  const translatedName = await translateText({
    text: product.name,
    targetLanguage,
    sourceLanguage: 'en'
  });

  const result = generateWhatsAppLink({
    products: [{
      productId: product.id,
      vendorName: product.vendorName,
      productName: translatedName.translatedText,
      price: product.price,
      unit: product.unit
    }],
    language: targetLanguage
  });

  return result;
}
```

## Testing

The service includes comprehensive unit tests covering:

- Link generation with and without phone numbers
- Message formatting in multiple languages
- Single and multiple product messages
- Validation of all input parameters
- Edge cases (special characters, long names, decimal prices, etc.)

Run tests with:
```bash
npm test whatsapp.service
```

## Notes

- All messages include the Indian Rupee symbol (₹) for prices
- Product URLs are automatically generated using the format: `{baseUrl}/products/{productId}`
- Messages are URL-encoded for WhatsApp compatibility
- The service preserves numerical values (prices, product IDs) across all languages
- Special characters in product names are properly handled and encoded
