/**
 * Market Engine Cache Layer for GoFlazz
 * Handles in-memory & localStorage caching with TTL, fallback retrieval, and rate-limit backoffs.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
  provider: string;
}

export class MarketCacheEngine {
  private static memoryCache = new Map<string, CacheEntry<any>>();
  private static STORAGE_PREFIX = "goflazz_market_cache_";

  /**
   * Set item in cache
   */
  static set<T>(key: string, data: T, ttlMs: number = 60000, provider: string = "coingecko"): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
      provider,
    };

    // Set memory
    this.memoryCache.set(key, entry);

    // Set persistent storage if available
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch (err) {
        // quota limit fallback
      }
    }
  }

  /**
   * Get item from cache if valid (not expired)
   */
  static get<T>(key: string, ignoreExpiration = false): T | null {
    const now = Date.now();

    // 1. Try memory
    const inMem = this.memoryCache.get(key);
    if (inMem) {
      if (ignoreExpiration || now - inMem.timestamp < inMem.ttlMs) {
        return inMem.data as T;
      }
    }

    // 2. Try LocalStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (ignoreExpiration || now - entry.timestamp < entry.ttlMs) {
            // Populate memory cache for fast subsequent hits
            this.memoryCache.set(key, entry);
            return entry.data;
          }
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Get stale or fallback cached data in case of provider rate limits or network offline
   */
  static getFallback<T>(key: string): T | null {
    return this.get<T>(key, true);
  }

  /**
   * Clear cache item
   */
  static invalidate(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    }
  }
}
