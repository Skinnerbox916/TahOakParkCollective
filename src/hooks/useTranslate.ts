import { useState, useCallback } from 'react';

type SupportedLocale = 'en' | 'es';

interface UseTranslateReturn {
  translate: (text: string, targetLocale: SupportedLocale, sourceLocale?: SupportedLocale) => Promise<string>;
  isTranslating: boolean;
  error: string | null;
}

export function useTranslate(): UseTranslateReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (
    text: string,
    targetLocale: SupportedLocale,
    sourceLocale: SupportedLocale = 'en'
  ): Promise<string> => {
    if (!text.trim()) return text;
    if (sourceLocale === targetLocale) return text;

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLocale, sourceLocale }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      return data.data.translated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed';
      setError(message);
      return text; // Return original on failure
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translate, isTranslating, error };
}

