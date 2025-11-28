import { TranslationProvider, TranslationRequest, TranslationResult } from './types';

export class DeepLProvider implements TranslationProvider {
  private apiKey: string;
  private baseUrl: string;
  name = 'DeepL';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Use free API endpoint for free tier (keys ending in :fx), or pro endpoint for paid
    this.baseUrl = apiKey.endsWith(':fx') || apiKey.includes(':fx')
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2';
  }

  private mapLocale(locale: string): string {
    // DeepL uses specific locale codes
    const mapping: Record<string, string> = {
      en: 'EN',
      es: 'ES',
    };
    return mapping[locale] || locale.toUpperCase();
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [request.text],
        source_lang: this.mapLocale(request.sourceLocale),
        target_lang: this.mapLocale(request.targetLocale),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepL API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      translatedText: data.translations[0].text,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
    };
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    if (requests.length === 0) return [];

    // Group by source/target locale pairs for efficiency
    const grouped = new Map<string, { index: number; request: TranslationRequest }[]>();
    
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const key = `${req.sourceLocale}-${req.targetLocale}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ index: i, request: req });
    }

    const results: TranslationResult[] = new Array(requests.length);
    
    for (const [, group] of grouped) {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: group.map(g => g.request.text),
          source_lang: this.mapLocale(group[0].request.sourceLocale),
          target_lang: this.mapLocale(group[0].request.targetLocale),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepL API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      for (let i = 0; i < group.length; i++) {
        const { index, request } = group[i];
        results[index] = {
          translatedText: data.translations[i].text,
          sourceLocale: request.sourceLocale,
          targetLocale: request.targetLocale,
        };
      }
    }

    return results;
  }
}

