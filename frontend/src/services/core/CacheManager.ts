/**
 * Enhanced Cache Manager with Retry Logic for MAKU.Travel
 * 
 * Provides intelligent caching, retry mechanisms, and offline support
 * for search results, photos, and API responses.
 */

import logger from '@/utils/logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  source: string;
  retryCount?: number;
  lastRetry?: number;
  correlationId?: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxRetries: number;
  retryDelay: number; // Base retry delay in milliseconds
  maxSize: number; // Maximum cache size in entries
  enablePersistence: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

/**
 * Enhanced Cache Manager with Retry Logic
 */
export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    retries: 0,
    errors: 0
  };

  private readonly configs: Record<string, CacheConfig> = {
    'hotel-search': {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxRetries: 3,
      retryDelay: 1000,
      maxSize: 100,
      enablePersistence: true
    },
    'flight-search': {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxRetries: 3,
      retryDelay: 1000,
      maxSize: 100,
      enablePersistence: true
    },
    'activity-search': {
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      maxRetries: 2,
      retryDelay: 2000,
      maxSize: 50,
      enablePersistence: true
    },
    'hotel-photos': {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxRetries: 2,
      retryDelay: 500,
      maxSize: 200,
      enablePersistence: true
    },
    'api-responses': {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
      maxSize: 50,
      enablePersistence: false
    }
  };

  /**
   * Get data from cache with automatic retry logic
   */
  async get<T>(key: string, category: string = 'api-responses'): Promise<T | null> {
    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isEntryValid(memoryEntry)) {
        this.cacheStats.hits++;
        return memoryEntry.data;
      }

      // Try persistent cache if enabled
      const config = this.getConfig(category);
      if (config.enablePersistence) {
        const persistentEntry = await this.getPersistentEntry<T>(key);
        if (persistentEntry && this.isEntryValid(persistentEntry)) {
          // Restore to memory cache
          this.memoryCache.set(key, persistentEntry);
          this.cacheStats.hits++;
          return persistentEntry.data;
        }
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      this.cacheStats.errors++;
      return null;
    }
  }

  /**
   * Set data in cache with expiration and persistence
   */
  async set<T>(
    key: string, 
    data: T, 
    category: string = 'api-responses',
    options: { 
      source?: string; 
      correlationId?: string;
      customTTL?: number;
    } = {}
  ): Promise<void> {
    try {
      const config = this.getConfig(category);
      const ttl = options.customTTL || config.ttl;
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        source: options.source || 'unknown',
        correlationId: options.correlationId
      };

      // Set in memory cache
      this.memoryCache.set(key, entry);

      // Persist if enabled
      if (config.enablePersistence) {
        await this.setPersistentEntry(key, entry);
      }

      // Cleanup if cache is too large
      await this.cleanupCache(category);

    } catch (error) {
      logger.error('Cache set error:', error);
      this.cacheStats.errors++;
    }
  }

  /**
   * Get data with retry logic for failed API calls
   */
  async getWithRetry<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    category: string = 'api-responses',
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    // Try cache first
    const cachedData = await this.get<T>(key, category);
    if (cachedData) {
      return cachedData;
    }

    // Configure retry parameters
    const config: RetryConfig = {
      maxRetries: this.getConfig(category).maxRetries,
      baseDelay: this.getConfig(category).retryDelay,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      ...retryConfig
    };

    let lastError: Error;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      try {
        logger.info(`Attempt ${attempt + 1}/${config.maxRetries + 1} for key: ${key}`);
        
        const data = await fetchFunction();
        
        // Cache successful result
        await this.set(key, data, category, {
          source: 'api',
          correlationId: this.generateCorrelationId()
        });

        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        attempt++;
        this.cacheStats.retries++;

        if (attempt <= config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt, config);
          logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed, check for stale cache data
    const staleData = await this.getStaleData<T>(key);
    if (staleData) {
      logger.warn(`Using stale cache data for key: ${key}`);
      return staleData;
    }

    throw lastError;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      // Invalidate memory cache
      const keysToRemove = Array.from(this.memoryCache.keys()).filter(key => 
        key.includes(pattern)
      );
      
      keysToRemove.forEach(key => this.memoryCache.delete(key));

      // Invalidate persistent cache
      await this.invalidatePersistentCache(pattern);

      logger.info(`Invalidated ${keysToRemove.length} cache entries matching pattern: ${pattern}`);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      
      // Clear persistent storage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('maku-cache-')) {
          localStorage.removeItem(key);
        }
      });

      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : '0.00';

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      memoryEntries: this.memoryCache.size,
      persistentEntries: this.countPersistentEntries()
    };
  }

  /**
   * Private helper methods
   */
  private getConfig(category: string): CacheConfig {
    return this.configs[category] || this.configs['api-responses'];
  }

  private isEntryValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiresAt;
  }

  private async getPersistentEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const data = localStorage.getItem(`maku-cache-${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  private async setPersistentEntry<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(`maku-cache-${key}`, JSON.stringify(entry));
    } catch (error) {
      logger.warn('Failed to persist cache entry:', error);
    }
  }

  private async getStaleData<T>(key: string): Promise<T | null> {
    try {
      const entry = this.memoryCache.get(key) || await this.getPersistentEntry<T>(key);
      return entry ? entry.data : null;
    } catch (error) {
      return null;
    }
  }

  private async cleanupCache(category: string): Promise<void> {
    const config = this.getConfig(category);
    
    if (this.memoryCache.size > config.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const entriesToRemove = entries.slice(0, entries.length - config.maxSize);
      entriesToRemove.forEach(([key]) => {
        this.memoryCache.delete(key);
        this.cacheStats.evictions++;
      });
    }
  }

  private async invalidatePersistentCache(pattern: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('maku-cache-') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.warn('Failed to invalidate persistent cache:', error);
    }
  }

  private countPersistentEntries(): number {
    try {
      return Object.keys(localStorage).filter(key => 
        key.startsWith('maku-cache-')
      ).length;
    } catch (error) {
      return 0;
    }
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      delay += Math.random() * 1000; // Add up to 1 second jitter
    }
    
    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateCorrelationId(): string {
    return `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
export default cacheManager;