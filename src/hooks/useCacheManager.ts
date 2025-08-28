import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  storage?: 'memory' | 'sessionStorage' | 'localStorage';
  keyPrefix?: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export const useCacheManager = <T = any>(options: CacheOptions = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    storage = 'memory',
    keyPrefix = 'maku_cache_'
  } = options;

  const memoryCache = useRef<Map<string, CacheItem<T>>>(new Map());
  const cleanupInterval = useRef<NodeJS.Timeout>();

  // Get storage adapter
  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    switch (storage) {
      case 'localStorage':
        return localStorage;
      case 'sessionStorage':
        return sessionStorage;
      default:
        return null;
    }
  }, [storage]);

  // Serialize data for storage
  const serialize = useCallback((item: CacheItem<T>): string => {
    return JSON.stringify(item);
  }, []);

  // Deserialize data from storage
  const deserialize = useCallback((data: string): CacheItem<T> | null => {
    try {
      return JSON.parse(data) as CacheItem<T>;
    } catch {
      return null;
    }
  }, []);

  // Generate cache key
  const getCacheKey = useCallback((key: string): string => {
    return `${keyPrefix}${key}`;
  }, [keyPrefix]);

  // Check if item is expired
  const isExpired = useCallback((item: CacheItem<T>): boolean => {
    return Date.now() > item.expiresAt;
  }, []);

  // Get item from cache
  const get = useCallback((key: string): T | null => {
    const cacheKey = getCacheKey(key);
    let item: CacheItem<T> | null = null;

    if (storage === 'memory') {
      item = memoryCache.current.get(cacheKey) || null;
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        const stored = storageAdapter.getItem(cacheKey);
        if (stored) {
          item = deserialize(stored);
        }
      }
    }

    if (!item || isExpired(item)) {
      // Remove expired item
      remove(key);
      return null;
    }

    // Update access statistics
    item.accessCount += 1;
    item.lastAccessed = Date.now();

    // Update in storage
    if (storage === 'memory') {
      memoryCache.current.set(cacheKey, item);
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        storageAdapter.setItem(cacheKey, serialize(item));
      }
    }

    return item.data;
  }, [getCacheKey, storage, getStorage, deserialize, isExpired, serialize]);

  // Set item in cache
  const set = useCallback((key: string, data: T, customTtl?: number): void => {
    const cacheKey = getCacheKey(key);
    const effectiveTtl = customTtl || ttl;
    const now = Date.now();

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + effectiveTtl,
      accessCount: 0,
      lastAccessed: now
    };

    if (storage === 'memory') {
      // Check size limit
      if (memoryCache.current.size >= maxSize) {
        // Remove least recently used item
        let oldestKey = '';
        let oldestTime = Infinity;
        
        for (const [k, v] of memoryCache.current.entries()) {
          if (v.lastAccessed < oldestTime) {
            oldestTime = v.lastAccessed;
            oldestKey = k;
          }
        }
        
        if (oldestKey) {
          memoryCache.current.delete(oldestKey);
        }
      }
      
      memoryCache.current.set(cacheKey, item);
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        try {
          storageAdapter.setItem(cacheKey, serialize(item));
        } catch (error) {
          // Storage full, try to clear some space
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            clearExpired();
            try {
              storageAdapter.setItem(cacheKey, serialize(item));
            } catch {
              console.warn('Cache storage quota exceeded, unable to store item');
            }
          }
        }
      }
    }
  }, [getCacheKey, ttl, storage, getStorage, serialize, maxSize]);

  // Remove item from cache
  const remove = useCallback((key: string): void => {
    const cacheKey = getCacheKey(key);

    if (storage === 'memory') {
      memoryCache.current.delete(cacheKey);
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        storageAdapter.removeItem(cacheKey);
      }
    }
  }, [getCacheKey, storage, getStorage]);

  // Clear all cache
  const clear = useCallback((): void => {
    if (storage === 'memory') {
      memoryCache.current.clear();
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        const keys = Object.keys(storageAdapter);
        keys.forEach(key => {
          if (key.startsWith(keyPrefix)) {
            storageAdapter.removeItem(key);
          }
        });
      }
    }
  }, [storage, getStorage, keyPrefix]);

  // Clear expired items
  const clearExpired = useCallback((): void => {
    const now = Date.now();

    if (storage === 'memory') {
      for (const [key, item] of memoryCache.current.entries()) {
        if (now > item.expiresAt) {
          memoryCache.current.delete(key);
        }
      }
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        const keys = Object.keys(storageAdapter);
        keys.forEach(key => {
          if (key.startsWith(keyPrefix)) {
            const stored = storageAdapter.getItem(key);
            if (stored) {
              const item = deserialize(stored);
              if (item && now > item.expiresAt) {
                storageAdapter.removeItem(key);
              }
            }
          }
        });
      }
    }
  }, [storage, getStorage, keyPrefix, deserialize]);

  // Get cache statistics
  const getStats = useCallback(() => {
    let size = 0;
    let totalAccessCount = 0;
    let oldestItem = Date.now();
    let newestItem = 0;

    if (storage === 'memory') {
      size = memoryCache.current.size;
      for (const item of memoryCache.current.values()) {
        totalAccessCount += item.accessCount;
        oldestItem = Math.min(oldestItem, item.timestamp);
        newestItem = Math.max(newestItem, item.timestamp);
      }
    } else {
      const storageAdapter = getStorage();
      if (storageAdapter) {
        const keys = Object.keys(storageAdapter);
        keys.forEach(key => {
          if (key.startsWith(keyPrefix)) {
            size++;
            const stored = storageAdapter.getItem(key);
            if (stored) {
              const item = deserialize(stored);
              if (item) {
                totalAccessCount += item.accessCount;
                oldestItem = Math.min(oldestItem, item.timestamp);
                newestItem = Math.max(newestItem, item.timestamp);
              }
            }
          }
        });
      }
    }

    return {
      size,
      maxSize,
      totalAccessCount,
      oldestItemAge: size > 0 ? Date.now() - oldestItem : 0,
      newestItemAge: size > 0 ? Date.now() - newestItem : 0,
      hitRate: 0 // Could be tracked with additional state
    };
  }, [storage, getStorage, keyPrefix, deserialize, maxSize]);

  // Cached fetch function
  const cachedFetch = useCallback(async <R = T>(
    key: string,
    fetcher: () => Promise<R>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<R> => {
    const { ttl: customTtl, forceRefresh = false } = options || {};

    if (!forceRefresh) {
      const cached = get(key) as unknown as R | null;
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const data = await fetcher();
      set(key, data as unknown as T, customTtl);
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      const cached = storage === 'memory' 
        ? memoryCache.current.get(getCacheKey(key))?.data as unknown as R | null
        : null;
      
      if (cached !== null) {
        console.warn('Using stale cache data due to fetch error:', error);
        return cached;
      }
      
      throw error;
    }
  }, [get, set, storage, getCacheKey]);

  // Setup cleanup interval
  useEffect(() => {
    cleanupInterval.current = setInterval(() => {
      clearExpired();
    }, ttl); // Clean up at TTL intervals

    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [ttl, clearExpired]);

  return {
    get,
    set,
    remove,
    clear,
    clearExpired,
    getStats,
    cachedFetch
  };
};