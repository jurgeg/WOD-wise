/**
 * Simple in-memory cache with TTL support.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /** Get a cached value, or null if expired/missing. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /** Set a cached value with a TTL in milliseconds (default 5 min). */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /** Remove a specific key. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Remove all keys matching a prefix. */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Clear everything. */
  clear(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();
