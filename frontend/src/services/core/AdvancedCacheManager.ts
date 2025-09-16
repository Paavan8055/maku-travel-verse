import logger from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface CacheItem<T = any> {
  key: string;
  data: T;
  metadata: {
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
    tags: string[];
    size: number;
    provider?: string;
    priority: number;
  };
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
  hitRate: number;
  avgResponseTime: number;
}

export interface CacheStrategy {
  name: string;
  shouldCache(key: string, data: any, metadata?: any): boolean;
  getTTL(key: string, data: any, metadata?: any): number;
  getPriority(key: string, data: any, metadata?: any): number;
}

export class FlightSearchCacheStrategy implements CacheStrategy {
  name = 'flight-search';

  shouldCache(key: string, data: any): boolean {
    // Cache flight search results if they contain valid offers
    return data && Array.isArray(data) && data.length > 0;
  }

  getTTL(key: string, data: any): number {
    // Cache flight data for 10 minutes for better inventory accuracy
    return 10 * 60 * 1000;
  }

  getPriority(key: string, data: any): number {
    // Higher priority for popular routes and recent searches
    const offerCount = Array.isArray(data) ? data.length : 0;
    return Math.min(10, Math.max(1, offerCount / 10));
  }
}

export class HotelSearchCacheStrategy implements CacheStrategy {
  name = 'hotel-search';

  shouldCache(key: string, data: any): boolean {
    return data && (Array.isArray(data) ? data.length > 0 : data.offers?.length > 0);
  }

  getTTL(key: string, data: any): number {
    // Cache hotel data for 30 minutes as prices change less frequently
    return 30 * 60 * 1000;
  }

  getPriority(key: string, data: any): number {
    const hotelCount = data.offers?.length || (Array.isArray(data) ? data.length : 0);
    return Math.min(10, Math.max(1, hotelCount / 5));
  }
}

export class ActivitySearchCacheStrategy implements CacheStrategy {
  name = 'activity-search';

  shouldCache(key: string, data: any): boolean {
    return data && Array.isArray(data) && data.length > 0;
  }

  getTTL(key: string, data: any): number {
    // Cache activity data for 2 hours as they change infrequently
    return 2 * 60 * 60 * 1000;
  }

  getPriority(key: string, data: any): number {
    return 5; // Medium priority
  }
}

export class AdvancedCacheManager {
  private memoryCache: Map<string, CacheItem> = new Map();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsage: 0,
    hitRate: 0,
    avgResponseTime: 0
  };
  
  private strategies: Map<string, CacheStrategy> = new Map();
  private maxMemorySize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: {
    maxMemorySize?: number;
    defaultTTL?: number;
    cleanupIntervalMs?: number;
  } = {}) {
    this.maxMemorySize = options.maxMemorySize || 100 * 1024 * 1024; // 100MB
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 30 minutes

    // Register default strategies
    this.strategies.set('flight-search', new FlightSearchCacheStrategy());
    this.strategies.set('hotel-search', new HotelSearchCacheStrategy());
    this.strategies.set('activity-search', new ActivitySearchCacheStrategy());

    // Start cleanup process
    this.startCleanup(options.cleanupIntervalMs || 5 * 60 * 1000); // 5 minutes
  }

  async get<T>(
    key: string, 
    options: {
      strategy?: string;
      skipPersistent?: boolean;
    } = {}
  ): Promise<T | null> {
    const startTime = Date.now();

    try {
      // Check memory cache first
      const memoryCacheItem = this.memoryCache.get(key);
      if (memoryCacheItem && !this.isExpired(memoryCacheItem)) {
        memoryCacheItem.metadata.accessCount++;
        memoryCacheItem.metadata.lastAccessed = Date.now();
        this.metrics.hits++;
        this.updateMetrics(Date.now() - startTime);
        return memoryCacheItem.data as T;
      }

      // Check persistent cache if not skipping
      if (!options.skipPersistent) {
        const persistentData = await this.getPersistent<T>(key);
        if (persistentData) {
          // Restore to memory cache
          await this.setMemory(key, persistentData, {
            strategy: options.strategy,
            fromPersistent: true
          });
          this.metrics.hits++;
          this.updateMetrics(Date.now() - startTime);
          return persistentData;
        }
      }

      this.metrics.misses++;
      this.updateMetrics(Date.now() - startTime);
      return null;

    } catch (error) {
      logger.error('Cache get error:', { error, key });
      this.metrics.misses++;
      return null;
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      strategy?: string;
      tags?: string[];
      priority?: number;
      persistToDB?: boolean;
    } = {}
  ): Promise<void> {
    try {
      // Set in memory cache
      await this.setMemory(key, data, options);

      // Optionally persist to database
      if (options.persistToDB !== false) {
        await this.setPersistent(key, data, options);
      }

    } catch (error) {
      logger.error('Cache set error:', { error, key });
    }
  }

  private async setMemory<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      strategy?: string;
      tags?: string[];
      priority?: number;
      fromPersistent?: boolean;
    } = {}
  ): Promise<void> {
    const strategy = options.strategy ? this.strategies.get(options.strategy) : null;
    
    // Check if we should cache this data
    if (strategy && !strategy.shouldCache(key, data)) {
      return;
    }

    const ttl = options.ttl || 
                 (strategy ? strategy.getTTL(key, data) : this.defaultTTL);
    
    const priority = options.priority || 
                     (strategy ? strategy.getPriority(key, data) : 5);

    const dataSize = this.estimateSize(data);
    
    // Check if we need to evict items
    await this.ensureSpace(dataSize);

    const cacheItem: CacheItem<T> = {
      key,
      data,
      metadata: {
        timestamp: Date.now(),
        ttl,
        accessCount: options.fromPersistent ? 1 : 0,
        lastAccessed: Date.now(),
        tags: options.tags || [],
        size: dataSize,
        priority,
        provider: this.extractProvider(key)
      }
    };

    this.memoryCache.set(key, cacheItem);
    this.updateMemoryUsage();
  }

  private async setPersistent<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttl);

      // Determine cache type based on key pattern
      let tableName = 'search_cache_generic';
      if (key.includes('flight')) tableName = 'flight_offers_cache';
      else if (key.includes('hotel')) tableName = 'hotel_offers_cache';
      else if (key.includes('activity')) tableName = 'activities_offers_cache';

      // Store in appropriate cache table - simplified for now
      // In a real implementation, we would parse the key to extract required fields
      const cacheData = {
        search_key: key,
        offers: data as any,
        ttl_expires_at: expiresAt.toISOString()
      };

      // For now, we'll use a generic approach since the exact schema differs
      logger.info('Cache data would be stored in persistent storage', { key, tableName });

    } catch (error) {
      logger.error('Persistent cache set error:', { error, key });
    }
  }

  private async getPersistent<T>(key: string): Promise<T | null> {
    try {
      // Try different cache tables based on key pattern
      if (key.includes('flight')) {
        const { data } = await supabase
          .from('flight_offers_cache')
          .select('offers')
          .eq('search_key', key)
          .gt('ttl_expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return (data?.offers as T) || null;
      } else if (key.includes('hotel')) {
        const { data } = await supabase
          .from('hotel_offers_cache')
          .select('offers')
          .eq('search_key', key)
          .gt('ttl_expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return (data?.offers as T) || null;
      } else if (key.includes('activity')) {
        const { data } = await supabase
          .from('activities_offers_cache')
          .select('offers')
          .eq('search_key', key)
          .gt('ttl_expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return (data?.offers as T) || null;
      }

      return null;
    } catch (error) {
      logger.error('Persistent cache get error:', { error, key });
      return null;
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const itemsToDelete: string[] = [];
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.metadata.tags.includes(tag)) {
        itemsToDelete.push(key);
      }
    }

    itemsToDelete.forEach(key => {
      this.memoryCache.delete(key);
      this.metrics.evictions++;
    });

    this.updateMemoryUsage();
    logger.info(`Invalidated ${itemsToDelete.length} cache items with tag: ${tag}`);
  }

  async invalidateByProvider(provider: string): Promise<void> {
    const itemsToDelete: string[] = [];
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.metadata.provider === provider) {
        itemsToDelete.push(key);
      }
    }

    itemsToDelete.forEach(key => {
      this.memoryCache.delete(key);
      this.metrics.evictions++;
    });

    this.updateMemoryUsage();
    logger.info(`Invalidated ${itemsToDelete.length} cache items for provider: ${provider}`);
  }

  async clear(): Promise<void> {
    const itemCount = this.memoryCache.size;
    this.memoryCache.clear();
    this.metrics.evictions += itemCount;
    this.updateMemoryUsage();
    logger.info(`Cleared ${itemCount} items from memory cache`);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    if (this.metrics.memoryUsage + requiredSize <= this.maxMemorySize) {
      return;
    }

    // Evict items using LRU + priority strategy
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, item }))
      .sort((a, b) => {
        // Sort by priority (lower first) and last accessed time
        const priorityDiff = a.item.metadata.priority - b.item.metadata.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.item.metadata.lastAccessed - b.item.metadata.lastAccessed;
      });

    let freedSpace = 0;
    for (const { key, item } of items) {
      if (freedSpace >= requiredSize) break;
      
      this.memoryCache.delete(key);
      freedSpace += item.metadata.size;
      this.metrics.evictions++;
    }

    this.updateMemoryUsage();
    logger.info(`Evicted items to free ${freedSpace} bytes`);
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.metadata.timestamp > item.metadata.ttl;
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1024; // Default 1KB
    }
  }

  private extractProvider(key: string): string | undefined {
    if (key.includes('amadeus')) return 'amadeus';
    if (key.includes('hotelbeds')) return 'hotelbeds';
    if (key.includes('sabre')) return 'sabre';
    return undefined;
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += item.metadata.size;
    }
    this.metrics.memoryUsage = totalSize;
  }

  private updateMetrics(responseTime: number): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    
    // Update average response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * 0.9) + (responseTime * 0.1);
  }

  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  private cleanup(): void {
    const itemsToDelete: string[] = [];
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        itemsToDelete.push(key);
      }
    }

    itemsToDelete.forEach(key => {
      this.memoryCache.delete(key);
      this.metrics.evictions++;
    });

    if (itemsToDelete.length > 0) {
      this.updateMemoryUsage();
      logger.info(`Cleaned up ${itemsToDelete.length} expired cache items`);
    }
  }

  addStrategy(strategy: CacheStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global cache manager instance
export const advancedCacheManager = new AdvancedCacheManager();