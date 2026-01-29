# Translation Service

## Overview

The Translation Service provides multilingual support for the Multilingual Mandi platform, enabling seamless communication across 9 languages including regional Indian dialects. It integrates with Google Cloud Translation API and implements Redis caching for improved performance and reduced API costs.

## Features

- **Multi-language Support**: Supports Hindi, English, Bhojpuri, Marwari, Punjabi, Gujarati, Marathi, Bengali, and Tamil
- **Automatic Language Detection**: Detects the source language automatically if not provided
- **Redis Caching**: Caches translations for 7 days to reduce API calls and improve response times
- **Batch Translation**: Translate multiple texts in a single operation
- **Object Translation**: Translate all string properties of an object while preserving other data types
- **Regional Dialect Support**: Special support for regional Indian dialects

## Supported Languages

| Code | Language | Native Name | Regional Dialect |
|------|----------|-------------|------------------|
| en   | English  | English     | No               |
| hi   | Hindi    | हिन्दी      | No               |
| bho  | Bhojpuri | भोजपुरी     | Yes              |
| mwr  | Marwari  | मारवाड़ी    | Yes              |
| pa   | Punjabi  | ਪੰਜਾਬੀ     | Yes              |
| gu   | Gujarati | ગુજરાતી     | Yes              |
| mr   | Marathi  | मराठी       | Yes              |
| bn   | Bengali  | বাংলা       | Yes              |
| ta   | Tamil    | தமிழ்       | Yes              |

## Setup

### Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLOUD_TRANSLATION_API_KEY=your-api-key-here
REDIS_URL=redis://localhost:6379
```

### Installation

The service is automatically initialized as a singleton. Import it in your code:

```typescript
import { translationService } from './services/translation.service';
```

## Usage

### Basic Translation

```typescript
// Translate with explicit source language
const result = await translationService.translate({
  text: 'Hello, how are you?',
  sourceLanguage: 'en',
  targetLanguage: 'hi',
});

console.log(result.translatedText); // नमस्ते, आप कैसे हैं?
```

### Auto-detect Source Language

```typescript
// Let the service detect the source language
const result = await translationService.translate({
  text: 'Hello, how are you?',
  targetLanguage: 'hi',
});

console.log(result.sourceLanguage); // 'en' (detected)
console.log(result.translatedText); // नमस्ते, आप कैसे हैं?
```

### Language Detection

```typescript
const detection = await translationService.detectLanguage('नमस्ते');

console.log(detection.language); // 'hi'
console.log(detection.confidence); // 0.95
```

### Batch Translation

```typescript
const texts = [
  'Apple',
  'Banana',
  'Orange'
];

const translations = await translationService.translateBatch(
  texts,
  'hi',
  'en'
);

translations.forEach((t) => {
  console.log(`${t.sourceText} -> ${t.translatedText}`);
});
```

### Object Translation

Useful for translating product information:

```typescript
const product = {
  name: 'Fresh Apples',
  description: 'Crisp and sweet apples from Kashmir',
  price: 150,
  unit: 'kg',
};

const translatedProduct = await translationService.translateObject(
  product,
  'hi',
  'en'
);

console.log(translatedProduct);
// {
//   name: 'ताज़ा सेब',
//   description: 'कश्मीर से कुरकुरा और मीठा सेब',
//   price: 150,  // Numbers preserved
//   unit: 'kg',  // Short strings translated
// }
```

### Check Language Support

```typescript
// Check if a language is supported
if (translationService.isLanguageSupported('hi')) {
  console.log('Hindi is supported');
}

// Get all supported languages
const languages = translationService.getSupportedLanguages();
languages.forEach((lang) => {
  console.log(`${lang.name} (${lang.code}): ${lang.nativeName}`);
});

// Get specific language info
const hindiInfo = translationService.getLanguageInfo('hi');
console.log(hindiInfo?.nativeName); // 'हिन्दी'
```

## API Reference

### `translate(options: TranslationOptions): Promise<Translation>`

Translates text from one language to another.

**Parameters:**
- `options.text` (string): Text to translate
- `options.targetLanguage` (string): Target language code
- `options.sourceLanguage` (string, optional): Source language code (auto-detected if not provided)

**Returns:** Promise<Translation>
- `sourceLanguage`: Detected or provided source language
- `targetLanguage`: Target language
- `sourceText`: Original text
- `translatedText`: Translated text
- `confidence`: Translation confidence score (0-1)

### `detectLanguage(text: string): Promise<{ language: string; confidence: number }>`

Detects the language of the given text.

**Parameters:**
- `text` (string): Text to detect language for

**Returns:** Promise with language code and confidence score

### `translateBatch(texts: string[], targetLanguage: string, sourceLanguage?: string): Promise<Translation[]>`

Translates multiple texts in batch.

**Parameters:**
- `texts` (string[]): Array of texts to translate
- `targetLanguage` (string): Target language code
- `sourceLanguage` (string, optional): Source language code

**Returns:** Promise<Translation[]>

### `translateObject<T>(obj: T, targetLanguage: string, sourceLanguage?: string): Promise<T>`

Translates all string properties of an object.

**Parameters:**
- `obj` (T): Object with string properties to translate
- `targetLanguage` (string): Target language code
- `sourceLanguage` (string, optional): Source language code

**Returns:** Promise<T> - Object with translated string properties

### `isLanguageSupported(languageCode: string): boolean`

Checks if a language code is supported.

### `getSupportedLanguages(): SupportedLanguage[]`

Returns array of all supported languages.

### `getLanguageInfo(languageCode: string): SupportedLanguage | null`

Returns information about a specific language.

## Caching

The service implements a Redis-based caching layer:

- **Cache Key Format**: `translation:{sourceLang}:{targetLang}:{textHash}`
- **TTL**: 7 days (604,800 seconds)
- **Cache Strategy**: Check cache first, then call API if not found
- **Automatic Storage**: Successful translations are automatically cached

### Cache Benefits

1. **Reduced API Costs**: Repeated translations are served from cache
2. **Improved Performance**: Cache hits return instantly without API calls
3. **Offline Resilience**: Cached translations available even if API is down

## Error Handling

The service handles various error scenarios:

```typescript
try {
  const result = await translationService.translate({
    text: 'Hello',
    targetLanguage: 'xyz', // Invalid language
  });
} catch (error) {
  console.error(error.message); // "Target language 'xyz' is not supported"
}
```

Common errors:
- **Unsupported Language**: Thrown when target language is not in supported list
- **API Error**: Thrown when Google Cloud Translation API fails
- **Detection Error**: Thrown when language detection fails

## Performance Considerations

1. **Use Batch Translation**: When translating multiple texts, use `translateBatch()` instead of multiple `translate()` calls
2. **Cache Warming**: Pre-translate common phrases during application startup
3. **Language Detection**: Avoid unnecessary detection by providing source language when known
4. **Object Translation**: Be mindful of the number of string properties when using `translateObject()`

## Testing

The service includes comprehensive unit tests:

```bash
npm test -- translation.service.test.ts
```

Tests cover:
- Language support validation
- Language detection
- Translation with and without source language
- Batch translation
- Object translation
- Error handling
- Caching behavior

## Integration Example

Example of integrating translation service in a product API:

```typescript
import { translationService } from '../services/translation.service';

// In your product controller
async function getProduct(req, res) {
  const { id } = req.params;
  const { lang } = req.query; // User's preferred language
  
  const product = await productRepository.findById(id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // Translate product if language preference is provided
  if (lang && lang !== 'en') {
    const translatedProduct = await translationService.translateObject(
      {
        name: product.name,
        description: product.description,
      },
      lang,
      'en'
    );
    
    product.name = translatedProduct.name;
    product.description = translatedProduct.description;
  }
  
  return res.json(product);
}
```

## Cleanup

When shutting down the application, close the Redis connection:

```typescript
process.on('SIGTERM', async () => {
  await translationService.close();
  process.exit(0);
});
```

## Future Enhancements

Potential improvements for the translation service:

1. **Custom Translation Models**: Train custom models for better regional dialect support
2. **Translation Memory**: Build a translation memory database for domain-specific terms
3. **Glossary Support**: Implement glossaries for product names and technical terms
4. **Quality Scoring**: Add translation quality assessment
5. **Fallback Strategy**: Implement fallback to alternative translation services
6. **Analytics**: Track translation usage and cache hit rates
