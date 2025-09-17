import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface CacheEntry {
  id: string;
  searchQuery: string;
  searchType: string;
  destinationData: any;
  unifiedResults: any;
  metadata: any;
  expiresAt: string;
  userId?: string;
  sessionId?: string;
}

interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
  priority?: 'low' | 'medium' | 'high';
  predictive?: boolean;
}

interface SearchPattern {
  query: string;
  frequency: number;
  lastAccessed: string;
  resultQuality: number;
}

export class AdvancedCacheManager {
  private static instance: AdvancedCacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private searchPatterns: Map<string, SearchPattern> = new Map();
  private readonly maxMemoryEntries = 100;
  private readonly defaultTTL = 3600;

  private constructor() {
    this.initializePredictiveCache();
    this.startCleanupTimer();
  }

  public static getInstance(): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager();
    }
    return AdvancedCacheManager.instance;
  }

  async get(searchQuery: string, searchType: string, options: CacheOptions = {}): Promise<any | null> {
    const cacheKey = this.generateCacheKey(searchQuery, searchType);
    
    try {
      const memoryResult = this.getFromMemory(cacheKey);
      if (memoryResult && !options.forceRefresh) {
        logger.info('[CACHE] Memory cache hit', { searchQuery, searchType });
        this.updateSearchPattern(cacheKey, true);
        return memoryResult.unifiedResults;
      }

      const { data: dbResult, error } = await supabase
        .from('global_search_cache')
        .select('*')
        .eq('search_query', searchQuery)
        .eq('search_type', searchType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && dbResult && !options.forceRefresh) {
        logger.info('[CACHE] Database cache hit', { searchQuery, searchType });
        const mappedResult = this.mapDbResultToCacheEntry(dbResult);
        this.setInMemory(cacheKey, mappedResult);
        this.updateSearchPattern(cacheKey, true);
        return dbResult.unified_results;
      }

      logger.info('[CACHE] Cache miss', { searchQuery, searchType });
      this.updateSearchPattern(cacheKey, false);
      return null;

    } catch (error) {
      logger.error('[CACHE] Error retrieving cache', { error, searchQuery, searchType });
      return null;
    }
  }

  async set(searchQuery: string, searchType: string, results: any, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateCacheKey(searchQuery, searchType);
    const ttl = options.ttl || this.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    try {
      const dbEntry = {
        search_query: searchQuery,
        search_type: searchType,
        unified_results: results,
        metadata: {
          priority: options.priority || 'medium',
          resultCount: Array.isArray(results) ? results.length : 1,
          cacheTime: new Date().toISOString(),
          predictive: options.predictive || false
        },
        expires_at: expiresAt,
        user_id: await this.getCurrentUserId(),
        session_id: this.getSessionId()
      };

      const { error: dbError } = await supabase
        .from('global_search_cache')
        .upsert(dbEntry);

      if (dbError) {
        logger.error('[CACHE] Database cache storage failed', { error: dbError });
      } else {
        logger.info('[CACHE] Stored in database cache', { searchQuery, searchType, ttl });
      }

      const cacheEntry: CacheEntry = {
        id: cacheKey,
        searchQuery,
        searchType,
        destinationData: null,
        unifiedResults: results,
        metadata: dbEntry.metadata,
        expiresAt,
        userId: dbEntry.user_id || undefined,
        sessionId: dbEntry.session_id || undefined
      };

      this.setInMemory(cacheKey, cacheEntry);
      this.updateSearchPatternSuccess(cacheKey, results);

    } catch (error) {
      logger.error('[CACHE] Error storing cache', { error, searchQuery, searchType });
    }
  }

  async cleanup(): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('global_search_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (dbError) {
        logger.error('[CACHE] Database cleanup failed', { error: dbError });
      }

      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (new Date(entry.expiresAt).getTime() < now) {
          this.memoryCache.delete(key);
        }
      }

      if (this.memoryCache.size > this.maxMemoryEntries) {
        const entries = Array.from(this.memoryCache.entries());
        const toDelete = entries.slice(0, entries.length - this.maxMemoryEntries);
        toDelete.forEach(([key]) => this.memoryCache.delete(key));
      }

      logger.info('[CACHE] Cleanup completed', { memoryEntries: this.memoryCache.size });

    } catch (error) {
      logger.error('[CACHE] Cleanup failed', { error });
    }
  }

  async getStats(): Promise<{ memoryEntries: number; dbEntries: number; hitRate: number; popularQueries: string[] }> {
    try {
      const { count: dbCount } = await supabase
        .from('global_search_cache')
        .select('*', { count: 'exact', head: true });

      const totalRequests = Array.from(this.searchPatterns.values())
        .reduce((sum, pattern) => sum + pattern.frequency, 0);
      
      const successfulRequests = Array.from(this.searchPatterns.values())
        .reduce((sum, pattern) => sum + (pattern.resultQuality > 0 ? pattern.frequency : 0), 0);

      const hitRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      const popularQueries = Array.from(this.searchPatterns.entries())
        .sort(([, a], [, b]) => b.frequency - a.frequency)
        .slice(0, 10)
        .map(([query]) => query);

      return {
        memoryEntries: this.memoryCache.size,
        dbEntries: dbCount || 0,
        hitRate: Math.round(hitRate * 100) / 100,
        popularQueries
      };
    } catch (error) {
      logger.error('[CACHE] Failed to get stats', { error });
      return { memoryEntries: this.memoryCache.size, dbEntries: 0, hitRate: 0, popularQueries: [] };
    }
  }

  async preloadPopularSearches(): Promise<void> {
    try {
      logger.info('[CACHE] Predictive caching initialized');
    } catch (error) {
      logger.error('[CACHE] Predictive caching failed', { error });
    }
  }

  private mapDbResultToCacheEntry(dbResult: any): CacheEntry {
    return {
      id: dbResult.id,
      searchQuery: dbResult.search_query,
      searchType: dbResult.search_type,
      destinationData: dbResult.destination_data,
      unifiedResults: dbResult.unified_results,
      metadata: dbResult.metadata,
      expiresAt: dbResult.expires_at,
      userId: dbResult.user_id,
      sessionId: dbResult.session_id
    };
  }

  private generateCacheKey(searchQuery: string, searchType: string): string {
    return `${searchType}:${searchQuery.toLowerCase().trim()}`;
  }

  private getFromMemory(cacheKey: string): CacheEntry | null {
    const entry = this.memoryCache.get(cacheKey);
    if (entry && new Date(entry.expiresAt).getTime() > Date.now()) {
      return entry;
    }
    if (entry) {
      this.memoryCache.delete(cacheKey);
    }
    return null;
  }

  private setInMemory(cacheKey: string, entry: CacheEntry): void {
    this.memoryCache.set(cacheKey, entry);
  }

  private updateSearchPattern(cacheKey: string, hit: boolean): void {
    const existing = this.searchPatterns.get(cacheKey) || {
      query: cacheKey,
      frequency: 0,
      lastAccessed: new Date().toISOString(),
      resultQuality: 0
    };

    existing.frequency += 1;
    existing.lastAccessed = new Date().toISOString();
    if (hit) {
      existing.resultQuality = Math.min(existing.resultQuality + 0.1, 1.0);
    }

    this.searchPatterns.set(cacheKey, existing);
  }

  private updateSearchPatternSuccess(cacheKey: string, results: any): void {
    const quality = Array.isArray(results) ? Math.min(results.length / 10, 1.0) : 0.5;
    const existing = this.searchPatterns.get(cacheKey);
    if (existing) {
      existing.resultQuality = quality;
      this.searchPatterns.set(cacheKey, existing);
    }
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('search_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('search_session_id', sessionId);
      }
      return sessionId;
    }
    return `server_session_${Date.now()}`;
  }

  private initializePredictiveCache(): void {
    setTimeout(() => {
      this.preloadPopularSearches().catch(console.error);
    }, 5000);
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup().catch(console.error);
    }, 15 * 60 * 1000);
  }
}

export const advancedCacheManager = AdvancedCacheManager.getInstance();