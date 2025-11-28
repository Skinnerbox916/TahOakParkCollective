export type SupportedLocale = 'en' | 'es';

export interface TranslationRequest {
  text: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
}

export interface TranslationResult {
  translatedText: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  cached?: boolean;
}

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<TranslationResult>;
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]>;
  name: string;
}

export interface TranslationPair {
  en: string;
  es: string;
}

