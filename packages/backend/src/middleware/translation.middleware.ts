/**
 * Translation Middleware
 * Requirements: 4.2
 * 
 * Provides automatic content translation for API responses
 * based on the Accept-Language header or query parameter
 */

import { Request, Response, NextFunction } from 'express';
import { translationService } from '../services/translation.service';

/**
 * Fields that should be translated in responses
 * Can be customized per route
 */
export interface TranslatableFields {
  [key: string]: string | string[] | TranslatableFields;
}

/**
 * Options for translation middleware
 */
export interface TranslationMiddlewareOptions {
  /**
   * Fields to translate in the response
   * Can be a simple array of field names or a nested object structure
   */
  fields?: string[];
  
  /**
   * Whether to translate nested objects
   */
  deep?: boolean;
  
  /**
   * Default target language if not specified in request
   */
  defaultLanguage?: string;
  
  /**
   * Whether translation is optional (don't fail if translation fails)
   */
  optional?: boolean;
}

/**
 * Get target language from request
 * Checks in order:
 * 1. Query parameter: ?lang=hi
 * 2. Accept-Language header
 * 3. Default language from options
 * 4. Fallback to 'en'
 */
function getTargetLanguage(req: Request, defaultLanguage?: string): string {
  // Check query parameter
  if (req.query.lang && typeof req.query.lang === 'string') {
    return req.query.lang;
  }

  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,hi;q=0.8")
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split(';');
      return code.split('-')[0]; // Get primary language code
    });

    // Find first supported language
    for (const lang of languages) {
      if (translationService.isLanguageSupported(lang)) {
        return lang;
      }
    }
  }

  // Use default or fallback
  return defaultLanguage || 'en';
}

/**
 * Recursively translate string fields in an object
 */
async function translateObject(
  obj: any,
  targetLanguage: string,
  fields?: string[],
  deep: boolean = false
): Promise<any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(
      obj.map(item => translateObject(item, targetLanguage, fields, deep))
    );
  }

  const translated: any = { ...obj };

  for (const [key, value] of Object.entries(obj)) {
    // Skip if fields are specified and this field is not in the list
    if (fields && fields.length > 0 && !fields.includes(key)) {
      continue;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const translation = await translationService.translate({
          text: value,
          targetLanguage,
        });
        translated[key] = translation.translatedText;
      } catch (error) {
        console.error(`Failed to translate field '${key}':`, error);
        // Keep original value on error
        translated[key] = value;
      }
    } else if (deep && typeof value === 'object' && value !== null) {
      translated[key] = await translateObject(value, targetLanguage, fields, deep);
    }
  }

  return translated;
}

/**
 * Translation middleware factory
 * 
 * Creates middleware that automatically translates response content
 * based on the client's language preference
 * 
 * Usage:
 * ```typescript
 * router.get('/products', 
 *   translationMiddleware({ fields: ['name', 'description'] }),
 *   productController.getProducts
 * );
 * ```
 * 
 * @param options - Translation options
 * @returns Express middleware function
 */
export function translationMiddleware(options: TranslationMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { fields, deep = false, defaultLanguage, optional = true } = options;

    // Get target language from request
    const targetLanguage = getTargetLanguage(req, defaultLanguage);

    // Store target language in request for use by controllers
    (req as any).targetLanguage = targetLanguage;

    // If target language is English, skip translation
    if (targetLanguage === 'en') {
      next();
      return;
    }

    // Intercept res.json to translate before sending
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any): Response {
      // Don't translate error responses
      if (res.statusCode >= 400) {
        return originalJson(body);
      }

      // Translate the response body
      translateObject(body, targetLanguage, fields, deep)
        .then(translatedBody => {
          return originalJson(translatedBody);
        })
        .catch(error => {
          console.error('Translation middleware error:', error);
          
          if (optional) {
            // Send original response if translation fails and it's optional
            return originalJson(body);
          } else {
            // Send error response if translation is required
            res.status(500);
            return originalJson({
              error: {
                code: 'TRANSLATION_FAILED',
                message: 'Failed to translate response',
                retryable: true,
                timestamp: new Date().toISOString(),
              },
            });
          }
        });

      return res;
    };

    next();
  };
}

/**
 * Middleware to add translation helper to request
 * 
 * Adds a `translate` function to the request object that controllers can use
 * to translate content based on the client's language preference
 * 
 * Usage in controller:
 * ```typescript
 * const translated = await req.translate('Hello, world!');
 * ```
 */
export function translationHelper() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const targetLanguage = getTargetLanguage(req);

    // Add translate function to request
    (req as any).translate = async (text: string, sourceLanguage?: string) => {
      if (targetLanguage === 'en' && !sourceLanguage) {
        return text;
      }

      try {
        const translation = await translationService.translate({
          text,
          targetLanguage,
          sourceLanguage,
        });
        return translation.translatedText;
      } catch (error) {
        console.error('Translation helper error:', error);
        return text; // Return original text on error
      }
    };

    // Add target language to request
    (req as any).targetLanguage = targetLanguage;

    next();
  };
}

/**
 * Extend Express Request type to include translation helpers
 */
declare global {
  namespace Express {
    interface Request {
      translate?: (text: string, sourceLanguage?: string) => Promise<string>;
      targetLanguage?: string;
    }
  }
}
