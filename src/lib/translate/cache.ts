import { SupportedLocale } from './types';

interface CacheEntry {
  text: string;
  timestamp: number;
}

/**
 * Simple in-memory cache for translations
 * For a small project, this is sufficient
 * Could be upgraded to Redis or database for persistence
 */
export class TranslationCache {
  private cache = new Map<string, CacheEntry>();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 60 * 24 * 7) { // Default: 1 week
    this.ttl = ttlMinutes * 60 * 1000;
  }

  private getKey(text: string, source: SupportedLocale, target: SupportedLocale): string {
    return `${source}:${target}:${text}`;
  }

  get(text: string, source: SupportedLocale, target: SupportedLocale): string | null {
    const key = this.getKey(text, source, target);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.text;
  }

  set(text: string, source: SupportedLocale, target: SupportedLocale, translated: string): void {
    const key = this.getKey(text, source, target);
    this.cache.set(key, {
      text: translated,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

