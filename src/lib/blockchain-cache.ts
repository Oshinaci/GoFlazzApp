interface CacheItem<T> {
  data: T;
  expiry: number;
}

class BlockchainCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttlMs: number = 15000) {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data as T;
  }

  clear() {
    this.cache.clear();
  }
}

export const blockchainCache = new BlockchainCache();
