# QR Code Service Documentation

## Overview

The QR Code Service provides functionality for generating and decoding QR codes containing product information. This enables vendors to create scannable codes for their products that buyers can use to quickly access product details.

## Features

- **QR Code Generation**: Create QR codes from product data (ID, name, price, vendor ID)
- **QR Code Decoding**: Parse and validate QR code data
- **Round-Trip Integrity**: Ensure data encoded in QR codes can be accurately decoded
- **Error Handling**: Comprehensive validation and error messages

## Service API

### `generateQRCode(data: QRCodeData): Promise<string>`

Generates a QR code image from product data.

**Parameters:**
- `data`: Object containing:
  - `productId`: Unique product identifier (UUID)
  - `name`: Product name
  - `price`: Product price (number)
  - `vendorId`: Vendor identifier (UUID)

**Returns:**
- Base64-encoded PNG image as a data URL (e.g., `data:image/png;base64,...`)

**Example:**
```typescript
const qrCode = await qrService.generateQRCode({
  productId: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Tomatoes',
  price: 50.00,
  vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
});
```

### `decodeQRCode(encodedData: string): QRCodeData`

Decodes and validates QR code data.

**Parameters:**
- `encodedData`: JSON string containing product data

**Returns:**
- Parsed and validated `QRCodeData` object

**Throws:**
- Error if JSON is invalid
- Error if required fields are missing

**Example:**
```typescript
const data = qrService.decodeQRCode('{"productId":"...","name":"Tomatoes","price":50,"vendorId":"..."}');
```

### `generateQRCodeWithData(data: QRCodeData): Promise<{ qrCode: string; encodedData: string }>`

Generates both the QR code image and the encoded data string.

**Parameters:**
- `data`: Product data object

**Returns:**
- Object containing:
  - `qrCode`: Base64-encoded QR code image
  - `encodedData`: JSON string of the product data

**Example:**
```typescript
const { qrCode, encodedData } = await qrService.generateQRCodeWithData({
  productId: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Tomatoes',
  price: 50.00,
  vendorId: '987fcdeb-51a2-43f7-8765-123456789abc',
});
```

## API Endpoints

### Generate QR Code for Product

**Endpoint:** `GET /api/products/:id/qr-code`

**Description:** Generates a QR code for a specific product and stores it in the database.

**Response:**
```json
{
  "qrCode": "data:image/png;base64,...",
  "encodedData": "{\"productId\":\"...\",\"name\":\"Tomatoes\",\"price\":50,\"vendorId\":\"...\"}",
  "product": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Tomatoes",
    "price": 50.00,
    "vendorId": "987fcdeb-51a2-43f7-8765-123456789abc"
  }
}
```

**Error Responses:**
- `404`: Product not found
- `500`: QR code generation failed

### Decode QR Code

**Endpoint:** `POST /api/qr/decode`

**Description:** Decodes QR code data and optionally fetches full product details.

**Request Body:**
```json
{
  "encodedData": "{\"productId\":\"...\",\"name\":\"Tomatoes\",\"price\":50,\"vendorId\":\"...\"}"
}
```

**Response:**
```json
{
  "decodedData": {
    "productId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Tomatoes",
    "price": 50.00,
    "vendorId": "987fcdeb-51a2-43f7-8765-123456789abc"
  },
  "product": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "vendorId": "987fcdeb-51a2-43f7-8765-123456789abc",
    "name": "Tomatoes",
    "nameTranslations": {
      "en": "Tomatoes",
      "hi": "टमाटर"
    },
    "price": 50.00,
    "unit": "kg",
    "quantity": 100,
    "isAvailable": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid request (missing or invalid encodedData)
- `400`: QR decode failed (invalid JSON or missing fields)

## QR Code Format

QR codes contain JSON-encoded product data with the following structure:

```json
{
  "productId": "UUID",
  "name": "string",
  "price": number,
  "vendorId": "UUID"
}
```

## Usage Examples

### Frontend: Generate and Display QR Code

```typescript
// Fetch QR code for a product
const response = await fetch(`/api/products/${productId}/qr-code`);
const { qrCode } = await response.json();

// Display in an image element
<img src={qrCode} alt="Product QR Code" />

// Or provide download link
<a href={qrCode} download={`product-${productId}-qr.png`}>
  Download QR Code
</a>
```

### Frontend: Scan and Decode QR Code

```typescript
// After scanning QR code with camera (using a QR scanner library)
const scannedData = "..."; // JSON string from QR code

// Decode on backend
const response = await fetch('/api/qr/decode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ encodedData: scannedData }),
});

const { decodedData, product } = await response.json();

// Display product information in user's preferred language
console.log(product.nameTranslations[userLanguage]);
```

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 1.1
✅ **WHEN a vendor provides product name and price, THE Platform SHALL generate a unique QR code containing this information**
- Implemented in `generateQRCode()` method
- Encodes productId, name, price, and vendorId

### Requirement 1.2
✅ **WHEN a QR code is generated, THE Platform SHALL display it for download or printing**
- QR code returned as base64 data URL
- Can be displayed in `<img>` tag or downloaded

### Requirement 1.3
✅ **WHEN a buyer scans a QR code, THE Platform SHALL display the product information in the buyer's preferred language**
- Decode endpoint returns full product with `nameTranslations`
- Frontend can display appropriate translation

### Requirement 1.4
✅ **THE Platform SHALL encode product ID, name, price, and vendor ID in each QR code**
- All four fields included in `QRCodeData` interface
- Validated during decoding

### Requirement 1.5
✅ **WHEN a vendor updates product information, THE Platform SHALL allow regeneration of the QR code with updated data**
- QR code endpoint can be called multiple times
- Always generates QR code with current product data

## Testing

### Unit Tests
- ✅ QR code generation from product data
- ✅ Different QR codes for different data
- ✅ Special characters in product names
- ✅ Decimal price handling
- ✅ Valid QR code decoding
- ✅ Invalid JSON error handling
- ✅ Missing field validation
- ✅ Round-trip encoding/decoding

### Integration Tests
- ✅ Generate QR code for existing product
- ✅ 404 for non-existent product
- ✅ Product update with QR code
- ✅ Decode valid QR code data
- ✅ Invalid JSON handling
- ✅ Missing encodedData handling
- ✅ Incomplete QR data handling
- ✅ Non-existent product handling
- ✅ Complete round-trip test

## Technical Details

### QR Code Configuration
- **Error Correction Level**: M (Medium - 15% recovery)
- **Image Format**: PNG
- **Image Size**: 300x300 pixels
- **Margin**: 1 module
- **Encoding**: UTF-8 (supports multilingual text)

### Data Storage
- QR codes are stored in the `products` table in the `qr_code` column
- Stored as base64 data URLs for easy retrieval and display
- Generated on-demand if not already stored

## Future Enhancements

1. **Batch QR Code Generation**: Generate QR codes for multiple products at once
2. **Custom Styling**: Allow vendors to customize QR code colors and branding
3. **Analytics**: Track QR code scans and usage statistics
4. **Expiration**: Add optional expiration dates to QR codes
5. **Dynamic QR Codes**: QR codes that redirect to URLs with current product data
