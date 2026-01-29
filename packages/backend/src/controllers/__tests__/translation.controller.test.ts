/**
 * Translation Controller Unit Tests
 * Requirements: 4.2
 */

import { Request, Response } from 'express';
import { TranslationController } from '../translation.controller';
import { translationService } from '../../services/translation.service';

// Mock the translation service
jest.mock('../../services/translation.service', () => ({
  translationService: {
    translate: jest.fn(),
    translateBatch: jest.fn(),
    getSupportedLanguages: jest.fn(),
    detectLanguage: jest.fn(),
    isLanguageSupported: jest.fn(),
  },
}));

describe('TranslationController', () => {
  let controller: TranslationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    controller = new TranslationController();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      body: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('translate', () => {
    it('should translate text successfully', async () => {
      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      mockRequest.body = {
        text: 'Hello',
        targetLanguage: 'hi',
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(translationService.translate).toHaveBeenCalledWith({
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: undefined,
      });
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(translationResult);
    });

    it('should translate with source language specified', async () => {
      const translationResult = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
        sourceText: 'Hello',
        translatedText: 'नमस्ते',
        confidence: 0.95,
      };

      mockRequest.body = {
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: 'en',
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockResolvedValue(translationResult);

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(translationService.translate).toHaveBeenCalledWith({
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: 'en',
      });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 400 if text is missing', async () => {
      mockRequest.body = {
        targetLanguage: 'hi',
      };

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TEXT',
            message: 'Text is required and must be a string',
          }),
        })
      );
    });

    it('should return 400 if text is not a string', async () => {
      mockRequest.body = {
        text: 123,
        targetLanguage: 'hi',
      };

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TEXT',
          }),
        })
      );
    });

    it('should return 400 if targetLanguage is missing', async () => {
      mockRequest.body = {
        text: 'Hello',
      };

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TARGET_LANGUAGE',
            message: 'Target language is required and must be a string',
          }),
        })
      );
    });

    it('should return 400 if targetLanguage is not supported', async () => {
      mockRequest.body = {
        text: 'Hello',
        targetLanguage: 'xyz',
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(false);
      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue([
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
      ]);

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'UNSUPPORTED_LANGUAGE',
            message: "Target language 'xyz' is not supported",
          }),
        })
      );
    });

    it('should return 400 if sourceLanguage is not supported', async () => {
      mockRequest.body = {
        text: 'Hello',
        targetLanguage: 'hi',
        sourceLanguage: 'xyz',
      };

      (translationService.isLanguageSupported as jest.Mock)
        .mockReturnValueOnce(true) // targetLanguage check
        .mockReturnValueOnce(false); // sourceLanguage check
      
      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue([
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
      ]);

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'UNSUPPORTED_LANGUAGE',
            message: "Source language 'xyz' is not supported",
          }),
        })
      );
    });

    it('should return 500 if translation service fails', async () => {
      mockRequest.body = {
        text: 'Hello',
        targetLanguage: 'hi',
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translate as jest.Mock).mockRejectedValue(new Error('Translation failed'));

      await controller.translate(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'TRANSLATION_FAILED',
            message: 'Failed to translate text',
            retryable: true,
          }),
        })
      );
    });
  });

  describe('translateBatch', () => {
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

      mockRequest.body = {
        texts: ['Hello', 'Goodbye'],
        targetLanguage: 'hi',
      };

      (translationService.isLanguageSupported as jest.Mock).mockReturnValue(true);
      (translationService.translateBatch as jest.Mock).mockResolvedValue(translations);

      await controller.translateBatch(mockRequest as Request, mockResponse as Response);

      expect(translationService.translateBatch).toHaveBeenCalledWith(
        ['Hello', 'Goodbye'],
        'hi',
        undefined
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ translations });
    });

    it('should return 400 if texts is not an array', async () => {
      mockRequest.body = {
        texts: 'not an array',
        targetLanguage: 'hi',
      };

      await controller.translateBatch(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TEXTS',
            message: 'Texts must be a non-empty array',
          }),
        })
      );
    });

    it('should return 400 if texts is empty', async () => {
      mockRequest.body = {
        texts: [],
        targetLanguage: 'hi',
      };

      await controller.translateBatch(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TEXTS',
          }),
        })
      );
    });
  });

  describe('getLanguages', () => {
    it('should return list of supported languages', async () => {
      const languages = [
        { code: 'en', name: 'English', nativeName: 'English', isRegionalDialect: false },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRegionalDialect: false },
        { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', isRegionalDialect: true },
      ];

      (translationService.getSupportedLanguages as jest.Mock).mockReturnValue(languages);

      await controller.getLanguages(mockRequest as Request, mockResponse as Response);

      expect(translationService.getSupportedLanguages).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ languages });
    });

    it('should return 500 if service fails', async () => {
      (translationService.getSupportedLanguages as jest.Mock).mockImplementation(() => {
        throw new Error('Service error');
      });

      await controller.getLanguages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'FETCH_LANGUAGES_FAILED',
          }),
        })
      );
    });
  });

  describe('detectLanguage', () => {
    it('should detect language successfully', async () => {
      const detection = {
        language: 'hi',
        confidence: 0.98,
      };

      mockRequest.body = {
        text: 'नमस्ते',
      };

      (translationService.detectLanguage as jest.Mock).mockResolvedValue(detection);

      await controller.detectLanguage(mockRequest as Request, mockResponse as Response);

      expect(translationService.detectLanguage).toHaveBeenCalledWith('नमस्ते');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(detection);
    });

    it('should return 400 if text is missing', async () => {
      mockRequest.body = {};

      await controller.detectLanguage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_TEXT',
          }),
        })
      );
    });

    it('should return 500 if detection fails', async () => {
      mockRequest.body = {
        text: 'Hello',
      };

      (translationService.detectLanguage as jest.Mock).mockRejectedValue(
        new Error('Detection failed')
      );

      await controller.detectLanguage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'DETECTION_FAILED',
          }),
        })
      );
    });
  });
});
