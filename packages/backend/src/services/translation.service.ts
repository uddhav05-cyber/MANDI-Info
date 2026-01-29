import { v2 } from '@google-cloud/translate';
import { createClient, RedisClientType } from 'redis';

/**
 * Supported languages for the Multilingual Mandi platform
 * Includes Hindi, English, Bhojpuri, Marwari, and 5 other regional dialects
 */
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
  bho: { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', isRegionalDialect: true },
  mwr: { code: 'mwr', name: 'Marwari', nativeName: 'मारवाड़ी', isRegionalDialect: true },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isRegionalDialect: true },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isRegionalDialect: true },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isRegionalDialect: true },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRegionalDialect: true },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isRegionalDialect: true },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  isRegionalDialect: boolean;
}

export interface Translation {
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  confidence: number;
}

export interface TranslationOptions {
  sourceLanguage?: string; // If not provided, will auto-detect
  targetLanguage: string;
  text: string;
}

/**
 * Translation Service
 * 
 * Provides translation capabilities using Google Cloud Translation API
 * with Redis caching for improved performance and reduced API costs.
 * 
 * Features:
 * - Automatic language detection
 * - Translation caching in Redis
 * - Support for 9 languages including regional dialects
 * - Preserves numerical values and product names
 */
export class TranslationService {
  private translateClient: v2.Translate;
  private redisClient: RedisClientType | null = null;
  private readonly CACHE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
  private readonly CACHE_PREFIX = 'translation:';

  constructor() {
    // Initialize Google Cloud Translation client
    const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;
    
    if (!apiKey) {
      console.warn('GOOGLE_CLOUD_TRANSLATION_API_KEY not set. Translation service will not work.');
    }

    this.translateClient = new v2.Translate({
      key: apiKey,
    });

    // Initialize Redis client for caching
    this.initializeRedis();
  }

  /**
   * Initialize Redis client for translation caching
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });

      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await this.redisClient.connect();
      console.log('Translation service: Redis cache connected');
    } catch (error) {
      console.error('Failed to connect to Redis for translation caching:', error);
      this.redisClient = null;
    }
  }

  /**
   * Generate cache key for a translation
   */
  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    // Create a simple hash of the text for the cache key
    const textHash = Buffer.from(text).toString('base64').substring(0, 50);
    return `${this.CACHE_PREFIX}${sourceLang}:${targetLang}:${textHash}`;
  }

  /**
   * Get translation from cache
   */
  private async getFromCache(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<Translation | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
      const cached = await this.redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as Translation;
      }
    } catch (error) {
      console.error('Error reading from translation cache:', error);
    }

    return null;
  }

  /**
   * Store translation in cache
   */
  private async storeInCache(translation: Translation): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(
        translation.sourceText,
        translation.sourceLanguage,
        translation.targetLanguage
      );

      await this.redisClient.setEx(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(translation)
      );
    } catch (error) {
      console.error('Error storing translation in cache:', error);
    }
  }

  /**
   * Detect the language of the given text
   * 
   * @param text - Text to detect language for
   * @returns Detected language code and confidence
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      const [detection] = await this.translateClient.detect(text);
      
      // Handle both single detection and array of detections
      const result = Array.isArray(detection) ? detection[0] : detection;
      
      return {
        language: result.language,
        confidence: result.confidence || 1.0,
      };
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error('Failed to detect language');
    }
  }

  /**
   * Translate text from one language to another
   * 
   * @param options - Translation options
   * @returns Translation result with source and target text
   */
  async translate(options: TranslationOptions): Promise<Translation> {
    const { text, targetLanguage } = options;
    let { sourceLanguage } = options;

    // Validate target language is supported
    if (!this.isLanguageSupported(targetLanguage)) {
      throw new Error(`Target language '${targetLanguage}' is not supported`);
    }

    // Auto-detect source language if not provided
    if (!sourceLanguage) {
      const detection = await this.detectLanguage(text);
      sourceLanguage = detection.language;
    }

    // Check if source and target are the same
    if (sourceLanguage === targetLanguage) {
      return {
        sourceLanguage,
        targetLanguage,
        sourceText: text,
        translatedText: text,
        confidence: 1.0,
      };
    }

    // Check cache first
    const cached = await this.getFromCache(text, sourceLanguage, targetLanguage);
    if (cached) {
      return cached;
    }

    // Perform translation
    try {
      const [translation] = await this.translateClient.translate(text, {
        from: sourceLanguage,
        to: targetLanguage,
      });

      const result: Translation = {
        sourceLanguage,
        targetLanguage,
        sourceText: text,
        translatedText: translation,
        confidence: 0.95, // Google Translate doesn't provide confidence, using default
      };

      // Store in cache
      await this.storeInCache(result);

      return result;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Translate multiple texts in batch
   * 
   * @param texts - Array of texts to translate
   * @param targetLanguage - Target language code
   * @param sourceLanguage - Optional source language code
   * @returns Array of translations
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Translation[]> {
    const translations = await Promise.all(
      texts.map((text) =>
        this.translate({
          text,
          targetLanguage,
          sourceLanguage,
        })
      )
    );

    return translations;
  }

  /**
   * Translate an object's string properties
   * Useful for translating product names, descriptions, etc.
   * 
   * @param obj - Object with string properties to translate
   * @param targetLanguage - Target language code
   * @param sourceLanguage - Optional source language code
   * @returns Object with translated properties
   */
  async translateObject<T extends Record<string, any>>(
    obj: T,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<T> {
    const translatedObj: Record<string, any> = { ...obj };

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        const translation = await this.translate({
          text: value,
          targetLanguage,
          sourceLanguage,
        });
        translatedObj[key] = translation.translatedText;
      }
    }

    return translatedObj as T;
  }

  /**
   * Check if a language code is supported
   * 
   * @param languageCode - Language code to check
   * @returns True if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return languageCode in SUPPORTED_LANGUAGES;
  }

  /**
   * Get list of all supported languages
   * 
   * @returns Array of supported language objects
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Get language information by code
   * 
   * @param languageCode - Language code
   * @returns Language information or null if not found
   */
  getLanguageInfo(languageCode: string): SupportedLanguage | null {
    if (this.isLanguageSupported(languageCode)) {
      return SUPPORTED_LANGUAGES[languageCode as LanguageCode];
    }
    return null;
  }

  /**
   * Close Redis connection
   * Should be called when shutting down the service
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

// Export singleton instance
export const translationService = new TranslationService();
