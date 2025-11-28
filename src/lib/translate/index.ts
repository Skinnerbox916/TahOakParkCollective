import { TranslationProvider, TranslationRequest, TranslationResult, TranslationPair, SupportedLocale } from './types';
import { DeepLProvider } from './deepl';
import { MockProvider } from './mock';
import { TranslationCache } from './cache';

// Re-export types
export { TranslationPair, SupportedLocale } from './types';

// Singleton instance
let translationService: TranslationService | null = null;

// DeepL API Key - free tier
const DEEPL_API_KEY = '2dbbafd3-ac08-4d25-8ca0-230dde061aa9:fx';

export class TranslationService {
  private provider: TranslationProvider;
  private cache: TranslationCache;

  constructor(provider: TranslationProvider, cache?: TranslationCache) {
    this.provider = provider;
    this.cache = cache || new TranslationCache();
  }

  /**
   * Translate text from one locale to another
   */
  async translate(
    text: string,
    targetLocale: SupportedLocale,
    sourceLocale: SupportedLocale = 'en'
  ): Promise<string> {
    if (!text.trim()) return text;
    if (sourceLocale === targetLocale) return text;

    // Check cache first
    const cached = this.cache.get(text, sourceLocale, targetLocale);
    if (cached) return cached;

    try {
      const result = await this.provider.translate({
        text,
        sourceLocale,
        targetLocale,
      });

      // Cache the result
      this.cache.set(text, sourceLocale, targetLocale, result.translatedText);

      return result.translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      // Return original text on failure
      return text;
    }
  }

  /**
   * Generate translations for both locales from a single input
   * Useful for admin forms that need both en/es
   */
  async generatePair(
    text: string,
    inputLocale: SupportedLocale
  ): Promise<TranslationPair> {
    const otherLocale: SupportedLocale = inputLocale === 'en' ? 'es' : 'en';
    const translated = await this.translate(text, otherLocale, inputLocale);

    return inputLocale === 'en'
      ? { en: text, es: translated }
      : { en: translated, es: text };
  }

  /**
   * Batch translate multiple texts (more efficient for APIs that support it)
   */
  async translateBatch(
    texts: string[],
    targetLocale: SupportedLocale,
    sourceLocale: SupportedLocale = 'en'
  ): Promise<string[]> {
    const results: string[] = new Array(texts.length);
    const toTranslate: { index: number; text: string }[] = [];

    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text.trim() || sourceLocale === targetLocale) {
        results[i] = text;
        continue;
      }
      
      const cached = this.cache.get(text, sourceLocale, targetLocale);
      if (cached) {
        results[i] = cached;
      } else {
        toTranslate.push({ index: i, text });
      }
    }

    // Translate uncached texts
    if (toTranslate.length > 0) {
      try {
        const batchResults = await this.provider.translateBatch(
          toTranslate.map(({ text }) => ({
            text,
            sourceLocale,
            targetLocale,
          }))
        );

        // Map results back and cache them
        for (let i = 0; i < toTranslate.length; i++) {
          const { index, text } = toTranslate[i];
          const translated = batchResults[i].translatedText;
          results[index] = translated;
          this.cache.set(text, sourceLocale, targetLocale, translated);
        }
      } catch (error) {
        console.error('Batch translation failed:', error);
        // Fill in originals for failed translations
        for (const { index, text } of toTranslate) {
          if (results[index] === undefined) results[index] = text;
        }
      }
    }

    return results;
  }

  /**
   * Get the name of the current provider
   */
  getProviderName(): string {
    return this.provider.name;
  }
}

/**
 * Get or create the translation service singleton
 */
export function getTranslationService(): TranslationService {
  if (!translationService) {
    const apiKey = process.env.DEEPL_API_KEY || DEEPL_API_KEY;
    
    const provider = apiKey
      ? new DeepLProvider(apiKey)
      : new MockProvider();

    if (!apiKey) {
      console.warn('DEEPL_API_KEY not set, using mock translation provider');
    }

    translationService = new TranslationService(provider);
  }

  return translationService;
}

