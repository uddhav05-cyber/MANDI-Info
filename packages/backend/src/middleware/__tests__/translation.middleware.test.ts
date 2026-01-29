/**
 * Translation Middleware Unit Tests
 * Requirements: 4.2
 */

import { Request, Response, NextFunction } from 'express';
import { translationMiddleware, translationHelper } from '../translation.middleware';
import { translationService } from '../../services/translation.service';

// Mock the translation service
jest.mock('../../services/translation.service', () => ({
  translationService: {
    translate: jest.fn(),
    isLanguageSupported: jest.fn(),
  },
}));

describe('Translation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnThis();
    
    mockRequest = {
      query: {},
      headers: {},
    };
    
    mockResponse = {
      json: jsonMock,
      status: statusMock,
      statusCode: 200,
    };

    nextFunction = jest.fn();

    jest.clearAllMocks();
  });

  describe('translationMiddleware', () => {
    it('should extract target language from query parameter', async () => {
      mockRequest.query = { lang: 'hi' };

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('hi');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should extract target language from Accept-Language header', async () => {
      mockRequest.headers = { 'accept-language': 'hi-IN,hi;q=0.9,en;q=0.8' };
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('hi');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use default language if no preference specified', async () => {
      const middleware = translationMiddleware({ defaultLanguage: 'hi' });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('hi');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fallback to English if no language specified', async () => {
      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('en');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should skip translation for English target language', async () => {
      mockRequest.query = { lang: 'en' };

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      // Original json should not be modified
      expect(mockResponse.json).toBe(jsonMock);
    });

    it('should not translate error responses', async () => {
      mockRequest.query = { lang: 'hi' };
      mockResponse.statusCode = 400;

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Call the intercepted json method
      const responseBody = { error: 'Bad request' };
      (mockResponse.json as any)(responseBody);

      // Should not attempt translation for error responses
      expect(translationService.translate).not.toHaveBeenCalled();
    });

    it('should handle translation errors gracefully when optional', async () => {
      mockRequest.query = { lang: 'hi' };
      mockResponse.statusCode = 200;

      (translationService.translate as jest.Mock).mockRejectedValue(
        new Error('Translation failed')
      );

      const middleware = translationMiddleware({ optional: true });
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('translationHelper', () => {
    it('should add translate function to request', () => {
      const middleware = translationHelper();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).translate).toBeDefined();
      expect(typeof (mockRequest as any).translate).toBe('function');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should add targetLanguage to request', () => {
      mockRequest.query = { lang: 'hi' };

      const middleware = translationHelper();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('hi');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should translate text using the helper function', async () => {
      mockRequest.query = { lang: 'hi' };

      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      const middleware = translationHelper();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      const translated = await (mockRequest as any).translate('Hello');

      expect(translationService.translate).toHaveBeenCalledWith({
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: undefined,
      });
      expect(translated).toBe('नमस्ते');
    });

    it('should skip translation for English target language', async () => {
      mockRequest.query = { lang: 'en' };

      const middleware = translationHelper();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      const translated = await (mockRequest as any).translate('Hello');

      expect(translationService.translate).not.toHaveBeenCalled();
      expect(translated).toBe('Hello');
    });

    it('should return original text on translation error', async () => {
      mockRequest.query = { lang: 'hi' };

      (translationService.translate as jest.Mock).mockRejectedValue(
        new Error('Translation failed')
      );

      const middleware = translationHelper();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      const translated = await (mockRequest as any).translate('Hello');

      expect(translated).toBe('Hello');
    });

    it('should support source language parameter', async () => {
      mockRequest.query = { lang: 'hi' };

      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      const middleware = translationHelper();
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      await (mockRequest as any).translate('Hello', 'en');

      expect(translationService.translate).toHaveBeenCalledWith({
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: 'en',
      });
    });
  });

  describe('Accept-Language header parsing', () => {
    it('should parse simple Accept-Language header', async () => {
      mockRequest.headers = { 'accept-language': 'hi' };
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('hi');
    });

    it('should parse Accept-Language with quality values', async () => {
      mockRequest.headers = { 'accept-language': 'en;q=0.8,hi;q=0.9' };
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Should pick first supported language (en in this case)
      expect((mockRequest as any).targetLanguage).toBe('en');
    });

    it('should parse Accept-Language with region codes', async () => {
      mockRequest.headers = { 'accept-language': 'hi-IN' };
      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Should extract primary language code
      expect((mockRequest as any).targetLanguage).toBe('hi');
    });

    it('should find first supported language in Accept-Language list', async () => {
      mockRequest.headers = { 'accept-language': 'fr,de,hi,en' };
      (translationService.isLanguageSupported as jest.Mock)
        .mockReturnValueOnce(false) // fr
        .mockReturnValueOnce(false) // de
        .mockReturnValueOnce(true);  // hi

      const middleware = translationMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect((mockRequest as any).targetLanguage).toBe('hi');
    });
  });
});
