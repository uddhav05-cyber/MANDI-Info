import { TranslationService, SUPPORTED_LANGUAGES } from '../translation.service';

// Mock Google Cloud Translate
jest.mock('@google-cloud/translate', () => {
  return {
    v2: {
      Translate: jest.fn().mockImplementation(() => ({
        detect: jest.fn().mockResolvedValue([
          {
            language: 'en',
            confidence: 0.95,
          },
        ]),
        translate: jest.fn().mockImplementation((text: string, options: any) => {
          // Simple mock translation - just add a prefix
          return Promise.resolve([`[${options.to}] ${text}`]);
        }),
      })),
    },
  };
});

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }),
}));

describe('TranslationService', () => {
  let translationService: TranslationService;

  beforeEach(() => {
    // Set environment variable for testing
    process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY = 'test-api-key';
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    translationService = new TranslationService();
  });

  afterEach(async () => {
    await translationService.close();
  });

  describe('Language Support', () => {
    it('should support all required languages', () => {
      const supportedLanguages = translationService.getSupportedLanguages();
      
      expect(supportedLanguages.length).toBeGreaterThanOrEqual(9);
      
      // Check for required languages
      const languageCodes = supportedLanguages.map((lang) => lang.code);
      expect(languageCodes).toContain('en'); // English
      expect(languageCodes).toContain('hi'); // Hindi
      expect(languageCodes).toContain('bho'); // Bhojpuri
      expect(languageCodes).toContain('mwr'); // Marwari
    });

    it('should correctly identify supported languages', () => {
      expect(translationService.isLanguageSupported('en')).toBe(true);
      expect(translationService.isLanguageSupported('hi')).toBe(true);
      expect(translationService.isLanguageSupported('bho')).toBe(true);
      expect(translationService.isLanguageSupported('xyz')).toBe(false);
    });

    it('should return language information for supported languages', () => {
      const hindiInfo = translationService.getLanguageInfo('hi');
      
      expect(hindiInfo).not.toBeNull();
      expect(hindiInfo?.code).toBe('hi');
      expect(hindiInfo?.name).toBe('Hindi');
      expect(hindiInfo?.nativeName).toBe('हिन्दी');
    });

    it('should return null for unsupported languages', () => {
      const info = translationService.getLanguageInfo('xyz');
      expect(info).toBeNull();
    });
  });

  describe('Language Detection', () => {
    it('should detect language of text', async () => {
      const result = await translationService.detectLanguage('Hello world');
      
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.language).toBe('string');
      expect(typeof result.confidence).toBe('number');
    });

    it('should return confidence score', async () => {
      const result = await translationService.detectLanguage('Hello world');
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Translation', () => {
    it('should translate text from one language to another', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'hi',
      });

      expect(result).toHaveProperty('sourceLanguage', 'en');
      expect(result).toHaveProperty('targetLanguage', 'hi');
      expect(result).toHaveProperty('sourceText', 'Hello');
      expect(result).toHaveProperty('translatedText');
      expect(result).toHaveProperty('confidence');
    });

    it('should auto-detect source language if not provided', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        targetLanguage: 'hi',
      });

      expect(result).toHaveProperty('sourceLanguage');
      expect(result.sourceLanguage).toBeTruthy();
    });

    it('should return same text if source and target languages are the same', async () => {
      const result = await translationService.translate({
        text: 'Hello',
        sourceLanguage: 'en',
        targetLanguage: 'en',
      });

      expect(result.translatedText).toBe('Hello');
      expect(result.confidence).toBe(1.0);
    });

    it('should throw error for unsupported target language', async () => {
      await expect(
        translationService.translate({
          text: 'Hello',
          sourceLanguage: 'en',
          targetLanguage: 'xyz',
        })
      ).rejects.toThrow('not supported');
    });
  });

  describe('Batch Translation', () => {
    it('should translate multiple texts', async () => {
      const texts = ['Hello', 'World', 'Test'];
      const results = await translationService.translateBatch(texts, 'hi', 'en');

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('sourceLanguage');
        expect(result).toHaveProperty('targetLanguage');
        expect(result).toHaveProperty('translatedText');
      });
    });

    it('should handle empty array', async () => {
      const results = await translationService.translateBatch([], 'hi', 'en');
      expect(results).toHaveLength(0);
    });
  });

  describe('Object Translation', () => {
    it('should translate string properties of an object', async () => {
      const obj = {
        name: 'Apple',
        description: 'Fresh fruit',
        price: 100,
      };

      const result = await translationService.translateObject(obj, 'hi', 'en');

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result.price).toBe(100); // Numbers should not be translated
    });

    it('should preserve non-string properties', async () => {
      const obj = {
        name: 'Product',
        price: 100,
        available: true,
        tags: ['tag1', 'tag2'],
      };

      const result = await translationService.translateObject(obj, 'hi', 'en');

      expect(result.price).toBe(100);
      expect(result.available).toBe(true);
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });

    it('should skip empty strings', async () => {
      const obj = {
        name: 'Product',
        description: '',
        notes: '   ',
      };

      const result = await translationService.translateObject(obj, 'hi', 'en');

      expect(result.description).toBe('');
      expect(result.notes).toBe('   ');
    });
  });

  describe('Supported Languages Constants', () => {
    it('should have correct structure for each language', () => {
      Object.values(SUPPORTED_LANGUAGES).forEach((lang) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(lang).toHaveProperty('isRegionalDialect');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.nativeName).toBe('string');
        expect(typeof lang.isRegionalDialect).toBe('boolean');
      });
    });

    it('should mark regional dialects correctly', () => {
      expect(SUPPORTED_LANGUAGES.en.isRegionalDialect).toBe(false);
      expect(SUPPORTED_LANGUAGES.hi.isRegionalDialect).toBe(false);
      expect(SUPPORTED_LANGUAGES.bho.isRegionalDialect).toBe(true);
      expect(SUPPORTED_LANGUAGES.mwr.isRegionalDialect).toBe(true);
    });
  });
});
