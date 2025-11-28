import { TranslationProvider, TranslationRequest, TranslationResult } from './types';

/**
 * Mock provider for development/testing when no API key is available
 * Simply prefixes text with target locale indicator
 */
export class MockProvider implements TranslationProvider {
  name = 'Mock';

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    // Simple mock: prefix with locale indicator
    const prefix = request.targetLocale === 'es' ? '[ES] ' : '[EN] ';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      translatedText: `${prefix}${request.text}`,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
    };
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map(r => this.translate(r)));
  }
}

