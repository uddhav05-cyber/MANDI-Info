/**
 * Translation API Integration Tests
 * Requirements: 4.2
 * 
 * Tests the translation API endpoints end-to-end
 */

import request from 'supertest';
import express, { Application } from 'express';
import { createTranslationRouter } from '../routes/translation.routes';
import { translationService } from '../services/translation.service';

// Mock the translation service
jest.mock('../services/translation.service', () => ({
  translationService: {
    translate: jest.fn(),
    translateBatch: jest.fn(),
    getSupportedLanguages: jest.fn(),
    detectLanguage: jest.fn(),
    isLanguageSupported: jest.fn(),
  },
}));

describe('Translation API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', createTranslationRouter());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/translate', () => {
    it('should translate text successfully', async () => {
      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
          targetLanguage: 'hi',
        })
        .expect(200);

      expect(response.body).toEqual(translationResult);
      expect(translationService.translate).toHaveBeenCalledWith({
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: undefined,
      });
    });

    it('should translate with source language specified', async () => {
      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
          targetLanguage: 'hi',
          sourceLanguage: 'en',
        })
        .expect(200);

      expect(response.body).toEqual(translationResult);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          targetLanguage: 'hi',
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TEXT');
    });

    it('should return 400 for missing target language', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TARGET_LANGUAGE');
    });

    it('should return 400 for unsupported target language', async () => {
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(false);
      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue([
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
      ]);

      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
          targetLanguage: 'xyz',
        })
        .expect(400);

      expect(response.body.error.code).toBe('UNSUPPORTED_LANGUAGE');
      expect(response.body.error.message).toContain('xyz');
    });

    it('should return 500 on translation service error', async () => {
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockRejectedValue(
        new Error('Translation service unavailable')
      );

      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
          targetLanguage: 'hi',
        })
        .expect(500);

      expect(response.body.error.code).toBe('TRANSLATION_FAILED');
      expect(response.body.error.retryable).toBe(true);
    });
  });

  describe('POST /api/translate/batch', () => {
    it('should translate multiple texts successfully', async () => {
      const translations = [
        {
          sourceLanguage: 'en',
          targetLanguage: 'hi',
          sourceText: 'Hello',
          translatedText: 'नमस्ते',
          confidence: 0.95,
        },
        {
          sourceLanguage: 'en',
          targetLanguage: 'hi',
          sourceText: 'Goodbye',
          translatedText: 'अलविदा',
          confidence: 0.95,
        },
      ];

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translateBatch as jest.Mock).mockResolvedValue(translations);

      const response = await request(app)
        .post('/api/translate/batch')
        .send({
          texts: ['Hello', 'Goodbye'],
          targetLanguage: 'hi',
        })
        .expect(200);

      expect(response.body.translations).toEqual(translations);
      expect(translationService.translateBatch).toHaveBeenCalledWith(
        ['Hello', 'Goodbye'],
        'hi',
        undefined
      );
    });

    it('should return 400 for invalid texts array', async () => {
      const response = await request(app)
        .post('/api/translate/batch')
        .send({
          texts: 'not an array',
          targetLanguage: 'hi',
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TEXTS');
    });

    it('should return 400 for empty texts array', async () => {
      const response = await request(app)
        .post('/api/translate/batch')
        .send({
          texts: [],
          targetLanguage: 'hi',
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TEXTS');
    });
  });

  describe('GET /api/languages', () => {
    it('should return list of supported languages', async () => {
      const languages = [
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
        { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', isRegionalDialect: true },
        { code: 'mwr', name: 'Marwari', nativeName: 'मारवाड़ी', isRegionalDialect: true },
        { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', isRegionalDialect: true },
        { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', isRegionalDialect: true },
        { code: 'mr', name: 'Marathi', nativeName: 'मराठी', isRegionalDialect: true },
        { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRegionalDialect: true },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isRegionalDialect: true },
      ];

      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue(languages);

      const response = await request(app)
        .get('/api/languages')
        .expect(200);

      expect(response.body.languages).toEqual(languages);
      expect(response.body.languages).toHaveLength(9);
      expect(translationService.getSupportedLanguages).toHaveBeenCalled();
    });

    it('should include regional dialects in the response', async () => {
      const languages = [
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
        { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', isRegionalDialect: true },
      ];

      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue(languages);

      const response = await request(app)
        .get('/api/languages')
        .expect(200);

      const regionalDialects = response.body.languages.filter(
        (lang: any) => lang.isRegionalDialect
      );
      expect(regionalDialects.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/translate/detect', () => {
    it('should detect language successfully', async () => {
      const detection = {
        language: 'hi',
        confidence: 0.98,
      };

      (translationService.detectLanguage as jest.Mock).mockResolvedValue(detection);

      const response = await request(app)
        .post('/api/translate/detect')
        .send({
          text: 'नमस्ते',
        })
        .expect(200);

      expect(response.body).toEqual(detection);
      expect(translationService.detectLanguage).toHaveBeenCalledWith('नमस्ते');
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/translate/detect')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TEXT');
    });

    it('should return 500 on detection service error', async () => {
      (translationService.detectLanguage as jest.Mock).mockRejectedValue(
        new Error('Detection service unavailable')
      );

      const response = await request(app)
        .post('/api/translate/detect')
        .send({
          text: 'Hello',
        })
        .expect(500);

      expect(response.body.error.code).toBe('DETECTION_FAILED');
    });
  });

  describe('Error response format', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('retryable');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should mark validation errors as non-retryable', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          targetLanguage: 'hi',
        })
        .expect(400);

      expect(response.body.error.retryable).toBe(false);
    });

    it('should mark service errors as retryable', async () => {
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .post('/api/translate')
        .send({
          text: 'Hello',
          targetLanguage: 'hi',
        })
        .expect(500);

      expect(response.body.error.retryable).toBe(true);
    });
  });

  describe('Content-Type handling', () => {
    it('should accept JSON content type', async () => {
      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      await request(app)
        .post('/api/translate')
        .set('Content-Type', 'application/json')
        .send({
          text: 'Hello',
          targetLanguage: 'hi',
        })
        .expect(200);
    });

    it('should return JSON content type', async () => {
      const languages = [
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
      ];

      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue(languages);

      const response = await request(app)
        .get('/api/languages')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
