/**
 * Translation Routes
 * Requirements: 4.2
 * 
 * Provides endpoints for translation services:
 * - POST /api/translate - Translate text
 * - POST /api/translate/batch - Translate multiple texts
 * - POST /api/translate/detect - Detect language
 * - GET /api/languages - Get supported languages
 */

import { Router } from 'express';
import { TranslationController } from '../controllers/translation.controller';

export const createTranslationRouter = (translationController?: TranslationController): Router => {
  const router = Router();
  const controller = translationController || new TranslationController();

  // POST /api/translate - Translate text
  router.post('/translate', controller.translate.bind(controller));

  // POST /api/translate/batch - Translate multiple texts
  router.post('/translate/batch', controller.translateBatch.bind(controller));

  // POST /api/translate/detect - Detect language
  router.post('/translate/detect', controller.detectLanguage.bind(controller));

  // GET /api/languages - Get supported languages
  router.get('/languages', controller.getLanguages.bind(controller));

  return router;
};
