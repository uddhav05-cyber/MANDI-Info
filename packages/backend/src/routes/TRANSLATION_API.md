# Translation API Documentation

## Overview

The Translation API provides endpoints for translating text between multiple languages, including regional Indian dialects. It supports automatic language detection, batch translation, and automatic content translation via middleware.

**Requirements:** 4.2

## Supported Languages

The API supports 9 languages including:
- English (en)
- Hindi (hi)
- Bhojpuri (bho) - Regional dialect
- Marwari (mwr) - Regional dialect
- Punjabi (pa) - Regional dialect
- Gujarati (gu) - Regional dialect
- Marathi (mr) - Regional dialect
- Bengali (bn) - Regional dialect
- Tamil (ta) - Regional dialect

## Endpoints

### POST /api/translate

Translate text from one language to another.

**Request Body:**
```json
{
  "text": "Hello, world!",
  "targetLanguage": "hi",
  "sourceLanguage": "en"  // Optional, will auto-detect if not provided
}
```

**Response (200 OK):**
```json
{
  "sourceLanguage": "en",
  "targetLanguage": "hi",
  "sourceText": "Hello, world!",
  "translatedText": "नमस्ते दुनिया!",
  "confidence": 0.95
}
```

**Error Responses:**
- `400 INVALID_TEXT` - Text is missing or not a string
- `400 INVALID_TARGET_LANGUAGE` - Target language is missing or not a string
- `400 UNSUPPORTED_LANGUAGE` - Language code is not supported
- `500 TRANSLATION_FAILED` - Translation service error (retryable)

**Example:**
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello",
    "targetLanguage": "hi"
  }'
```

---

### POST /api/translate/batch

Translate multiple texts in a single request.

**Request Body:**
```json
{
  "texts": ["Hello", "Goodbye", "Thank you"],
  "targetLanguage": "hi",
  "sourceLanguage": "en"  // Optional
}
```

**Response (200 OK):**
```json
{
  "translations": [
    {
      "sourceLanguage": "en",
      "targetLanguage": "hi",
      "sourceText": "Hello",
      "translatedText": "नमस्ते",
      "confidence": 0.95
    },
    {
      "sourceLanguage": "en",
      "targetLanguage": "hi",
      "sourceText": "Goodbye",
      "translatedText": "अलविदा",
      "confidence": 0.95
    },
    {
      "sourceLanguage": "en",
      "targetLanguage": "hi",
      "sourceText": "Thank you",
      "translatedText": "धन्यवाद",
      "confidence": 0.95
    }
  ]
}
```

**Error Responses:**
- `400 INVALID_TEXTS` - Texts is not a non-empty array
- `400 INVALID_TARGET_LANGUAGE` - Target language is missing or not a string
- `400 UNSUPPORTED_LANGUAGE` - Language code is not supported
- `500 TRANSLATION_FAILED` - Translation service error (retryable)

**Example:**
```bash
curl -X POST http://localhost:3000/api/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Goodbye"],
    "targetLanguage": "hi"
  }'
```

---

### GET /api/languages

Get list of all supported languages.

**Response (200 OK):**
```json
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English",
      "isRegionalDialect": false
    },
    {
      "code": "hi",
      "name": "Hindi",
      "nativeName": "हिन्दी",
      "isRegionalDialect": false
    },
    {
      "code": "bho",
      "name": "Bhojpuri",
      "nativeName": "भोजपुरी",
      "isRegionalDialect": true
    }
    // ... more languages
  ]
}
```

**Error Responses:**
- `500 FETCH_LANGUAGES_FAILED` - Service error (retryable)

**Example:**
```bash
curl http://localhost:3000/api/languages
```

---

### POST /api/translate/detect

Detect the language of the given text.

**Request Body:**
```json
{
  "text": "नमस्ते"
}
```

**Response (200 OK):**
```json
{
  "language": "hi",
  "confidence": 0.98
}
```

**Error Responses:**
- `400 INVALID_TEXT` - Text is missing or not a string
- `500 DETECTION_FAILED` - Detection service error (retryable)

**Example:**
```bash
curl -X POST http://localhost:3000/api/translate/detect \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते"
  }'
```

---

## Translation Middleware

The Translation API includes middleware for automatic content translation based on client language preferences.

### translationMiddleware

Automatically translates response content based on the client's language preference.

**Usage:**
```typescript
import { translationMiddleware } from './middleware/translation.middleware';

// Apply to specific routes
router.get('/products', 
  translationMiddleware({ fields: ['name', 'description'] }),
  productController.getProducts
);

// Apply globally
app.use(translationMiddleware({ optional: true }));
```

**Options:**
- `fields` - Array of field names to translate (optional, translates all string fields if not specified)
- `deep` - Whether to translate nested objects (default: false)
- `defaultLanguage` - Default target language if not specified in request (default: 'en')
- `optional` - Whether translation is optional (don't fail if translation fails) (default: true)

**Language Detection:**
The middleware detects the target language in the following order:
1. Query parameter: `?lang=hi`
2. Accept-Language header: `Accept-Language: hi-IN,hi;q=0.9,en;q=0.8`
3. Default language from options
4. Fallback to 'en'

**Example:**
```bash
# Using query parameter
curl http://localhost:3000/api/products?lang=hi

# Using Accept-Language header
curl http://localhost:3000/api/products \
  -H "Accept-Language: hi-IN,hi;q=0.9"
```

---

### translationHelper

Adds a `translate` function to the request object for use in controllers.

**Usage:**
```typescript
import { translationHelper } from './middleware/translation.middleware';

// Apply middleware
app.use(translationHelper());

// Use in controller
async function getProduct(req: Request, res: Response) {
  const product = await productService.getProduct(req.params.id);
  
  // Translate product name based on client's language preference
  const translatedName = await req.translate(product.name);
  
  res.json({
    ...product,
    name: translatedName,
  });
}
```

**Request Properties:**
- `req.translate(text, sourceLanguage?)` - Translate text to client's preferred language
- `req.targetLanguage` - Client's preferred language code

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},  // Optional additional details
    "retryable": true,  // Whether the operation can be retried
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Codes:**
- `INVALID_TEXT` - Text parameter is invalid
- `INVALID_TARGET_LANGUAGE` - Target language parameter is invalid
- `INVALID_TEXTS` - Texts array is invalid
- `UNSUPPORTED_LANGUAGE` - Language code is not supported
- `TRANSLATION_FAILED` - Translation service error
- `DETECTION_FAILED` - Language detection error
- `FETCH_LANGUAGES_FAILED` - Failed to fetch supported languages

---

## Caching

The translation service uses Redis caching to improve performance and reduce API costs:

- **Cache TTL:** 7 days
- **Cache Key Format:** `translation:{sourceLanguage}:{targetLanguage}:{textHash}`
- **Cache Strategy:** Check cache first, then call translation API if not found

---

## Rate Limiting

Consider implementing rate limiting for translation endpoints to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const translationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many translation requests, please try again later.',
});

app.use('/api/translate', translationLimiter);
```

---

## Best Practices

1. **Use Batch Translation:** When translating multiple texts, use the batch endpoint to reduce API calls
2. **Specify Source Language:** When known, specify the source language to improve translation accuracy
3. **Cache Translations:** The service automatically caches translations, but consider client-side caching for frequently used translations
4. **Handle Errors Gracefully:** Always provide fallback content when translation fails
5. **Use Middleware:** For automatic content translation, use the translation middleware instead of manual translation calls
6. **Language Detection:** Use language detection sparingly as it adds latency; prefer explicit language specification

---

## Examples

### Translating Product Names

```typescript
// Controller
async function getProducts(req: Request, res: Response) {
  const products = await productService.getProducts();
  
  // Translate product names if target language is not English
  if (req.targetLanguage && req.targetLanguage !== 'en') {
    const translatedProducts = await Promise.all(
      products.map(async (product) => ({
        ...product,
        name: (await translationService.translate({
          text: product.name,
          targetLanguage: req.targetLanguage!,
        })).translatedText,
      }))
    );
    
    res.json(translatedProducts);
  } else {
    res.json(products);
  }
}
```

### Using Translation Middleware

```typescript
// Automatic translation of all string fields
router.get('/products', 
  translationMiddleware({ deep: true }),
  productController.getProducts
);

// Translation of specific fields only
router.get('/vendors', 
  translationMiddleware({ fields: ['shopName', 'description'] }),
  vendorController.getVendors
);
```

### Detecting Language Before Translation

```typescript
async function translateUserInput(req: Request, res: Response) {
  const { text } = req.body;
  
  // Detect source language
  const detection = await translationService.detectLanguage(text);
  
  // Translate to Hindi if not already in Hindi
  if (detection.language !== 'hi') {
    const translation = await translationService.translate({
      text,
      targetLanguage: 'hi',
      sourceLanguage: detection.language,
    });
    
    res.json(translation);
  } else {
    res.json({
      sourceLanguage: 'hi',
      targetLanguage: 'hi',
      sourceText: text,
      translatedText: text,
      confidence: 1.0,
    });
  }
}
```

---

## Testing

The Translation API includes comprehensive tests:

- **Unit Tests:** Test individual controller methods and middleware functions
- **Integration Tests:** Test API endpoints end-to-end
- **Property Tests:** Test translation invariants (coming in task 5.3)

Run tests:
```bash
npm test -- translation
```

---

## Configuration

Required environment variables:

```env
# Google Cloud Translation API Key
GOOGLE_CLOUD_TRANSLATION_API_KEY=your_api_key_here

# Redis URL for caching
REDIS_URL=redis://localhost:6379
```

---

## Performance Considerations

- **Caching:** Translations are cached in Redis for 7 days
- **Batch Operations:** Use batch translation for multiple texts to reduce latency
- **Async Operations:** All translation operations are asynchronous
- **Connection Pooling:** Redis client uses connection pooling for optimal performance

---

## Security Considerations

- **Input Validation:** All inputs are validated before processing
- **Rate Limiting:** Consider implementing rate limiting to prevent abuse
- **API Key Security:** Store API keys in environment variables, never in code
- **Error Handling:** Errors are logged but sensitive information is not exposed to clients
