/**
 * Translation Controller
 * Requirements: 4.2
 * 
 * Handles translation API endpoints:
 * - POST /api/translate - Translate text between languages
 * - GET /api/languages - Get list of supported languages
 */

import { Request, Response } from 'express';
import { translationService } from '../services/translation.service';

export class TranslationController {
  /**
   * POST /api/translate
   * Translate text from one language to another
   * 
   * Request body:
   * {
   *   text: string;
   *   targetLanguage: string;
   *   sourceLanguage?: string; // Optional, will auto-detect if not provided
   * }
   * 
   * Response:
   * {
   *   sourceLanguage: string;
   *   targetLanguage: string;
   *   sourceText: string;
   *   translatedText: string;
   *   confidence: number;
   * }
   */
  async translate(req: Request, res: Response): Promise<void> {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;

      // Validate required fields
      if (!text || typeof text !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_TEXT',
            message: 'Text is required and must be a string',
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!targetLanguage || typeof targetLanguage !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_TARGET_LANGUAGE',
            message: 'Target language is required and must be a string',
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate target language is supported
      if (!translationService.isLanguageSupported(targetLanguage)) {
        res.status(400).json({
          error: {
            code: 'UNSUPPORTED_LANGUAGE',
            message: `Target language '${targetLanguage}' is not supported`,
            details: {
              supportedLanguages: translationService.getSupportedLanguages().map(l => l.code),
            },
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate source language if provided
      if (sourceLanguage && !translationService.isLanguageSupported(sourceLanguage)) {
        res.status(400).json({
          error: {
            code: 'UNSUPPORTED_LANGUAGE',
            message: `Source language '${sourceLanguage}' is not supported`,
            details: {
              supportedLanguages: translationService.getSupportedLanguages().map(l => l.code),
            },
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Perform translation
      const translation = await translationService.translate({
        text,
        targetLanguage,
        sourceLanguage,
      });

      res.status(200).json(translation);
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({
        error: {
          code: 'TRANSLATION_FAILED',
          message: 'Failed to translate text',
          retryable: true,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * POST /api/translate/batch
   * Translate multiple texts in batch
   * 
   * Request body:
   * {
   *   texts: string[];
   *   targetLanguage: string;
   *   sourceLanguage?: string;
   * }
   * 
   * Response:
   * {
   *   translations: Translation[];
   * }
   */
  async translateBatch(req: Request, res: Response): Promise<void> {
    try {
      const { texts, targetLanguage, sourceLanguage } = req.body;

      // Validate required fields
      if (!Array.isArray(texts) || texts.length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_TEXTS',
            message: 'Texts must be a non-empty array',
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!targetLanguage || typeof targetLanguage !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_TARGET_LANGUAGE',
            message: 'Target language is required and must be a string',
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate target language is supported
      if (!translationService.isLanguageSupported(targetLanguage)) {
        res.status(400).json({
          error: {
            code: 'UNSUPPORTED_LANGUAGE',
            message: `Target language '${targetLanguage}' is not supported`,
            details: {
              supportedLanguages: translationService.getSupportedLanguages().map(l => l.code),
            },
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Perform batch translation
      const translations = await translationService.translateBatch(
        texts,
        targetLanguage,
        sourceLanguage
      );

      res.status(200).json({ translations });
    } catch (error) {
      console.error('Batch translation error:', error);
      res.status(500).json({
        error: {
          code: 'TRANSLATION_FAILED',
          message: 'Failed to translate texts',
          retryable: true,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/languages
   * Get list of all supported languages
   * 
   * Response:
   * {
   *   languages: SupportedLanguage[];
   * }
   */
  async getLanguages(_req: Request, res: Response): Promise<void> {
    try {
      const languages = translationService.getSupportedLanguages();
      res.status(200).json({ languages });
    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({
        error: {
          code: 'FETCH_LANGUAGES_FAILED',
          message: 'Failed to fetch supported languages',
          retryable: true,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * POST /api/translate/detect
   * Detect the language of the given text
   * 
   * Request body:
   * {
   *   text: string;
   * }
   * 
   * Response:
   * {
   *   language: string;
   *   confidence: number;
   * }
   */
  async detectLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;

      // Validate required fields
      if (!text || typeof text !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_TEXT',
            message: 'Text is required and must be a string',
            retryable: false,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Detect language
      const detection = await translationService.detectLanguage(text);

      res.status(200).json(detection);
    } catch (error) {
      console.error('Language detection error:', error);
      res.status(500).json({
        error: {
          code: 'DETECTION_FAILED',
          message: 'Failed to detect language',
          retryable: true,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
