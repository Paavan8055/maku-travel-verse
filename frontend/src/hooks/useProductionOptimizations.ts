import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

interface OptimizationMetrics {
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  avgResponseTime: number;
}

export const useProductionOptimizations = () => {
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map());
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    avgResponseTime: 0
  });

  // Cache management
  const setCacheEntry = useCallback(<T>(key: string, data: T, ttlMs: number = 300000) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      });
      return newCache;
    });
  }, []);

  const getCacheEntry = useCallback(<T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) {
      setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
      return null;
    }

    setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
    return entry.data as T;
  }, [cache]);

  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      setCache(prev => {
        const newCache = new Map(prev);
        for (const key of newCache.keys()) {
          if (key.includes(pattern)) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  // Paginated data fetching with caching
  const usePaginatedData = (
    tableName: string,
    options: PaginationOptions & {
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      cacheTtl?: number;
    } = { page: 1, limit: 10 }
  ) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const cacheKey = useMemo(() => {
      return `${tableName}_${JSON.stringify(options)}`;
    }, [tableName, options]);

    const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();

      try {
        // Check cache first
        const cachedData = getCacheEntry<{ data: any[]; count: number }>(cacheKey);
        if (cachedData) {
          setData(cachedData.data);
          setTotalCount(cachedData.count);
          setHasMore(cachedData.data.length === options.limit);
          setLoading(false);
          return;
        }

        const { page, limit, filters, orderBy } = options;
        const offset = (page - 1) * limit;

        let query = supabase
          .from(tableName as any)
          .select('*', { count: 'exact' })
          .range(offset, offset + limit - 1);

        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        const { data: responseData, error: responseError, count } = await query;

        if (responseError) {
          throw responseError;
        }

        const resultData = responseData || [];
        const resultCount = count || 0;

        // Cache the result
        setCacheEntry(cacheKey, { data: resultData, count: resultCount }, options.cacheTtl);

        setData(resultData);
        setTotalCount(resultCount);
        setHasMore(resultData.length === limit);

        // Update metrics
        const responseTime = Date.now() - startTime;
        setMetrics(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          avgResponseTime: (prev.avgResponseTime * (prev.totalRequests - 1) + responseTime) / prev.totalRequests
        }));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        secureLogger.error('Paginated data fetch failed', err as Error, {
          component: 'useProductionOptimizations',
          tableName,
          cacheKey,
          options
        });
      } finally {
        setLoading(false);
      }
    }, [cacheKey, getCacheEntry, setCacheEntry, options, tableName]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    const refetch = useCallback(() => {
      clearCache(tableName);
      fetchData();
    }, [clearCache, fetchData, tableName]);

    return {
      data,
      loading,
      error,
      totalCount,
      hasMore,
      refetch,
      currentPage: options.page,
      totalPages: Math.ceil(totalCount / options.limit)
    };
  };

  // Optimized real-time subscriptions with debouncing
  const useOptimizedSubscription = (
    tableName: string,
    callback: (payload: any) => void,
    debounceMs: number = 1000
  ) => {
    useEffect(() => {
      let debounceTimer: NodeJS.Timeout;

      const debouncedCallback = (payload: any) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => callback(payload), debounceMs);
      };

      const channel = supabase
        .channel(`optimized_${tableName}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName },
          debouncedCallback
        )
        .subscribe();

      return () => {
        clearTimeout(debounceTimer);
        supabase.removeChannel(channel);
      };
    }, [tableName, callback, debounceMs]);
  };

  // Performance monitoring
  const trackPerformance = useCallback((operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    
    if (duration > 2000) {
      secureLogger.warn('Slow operation detected', {
        component: 'useProductionOptimizations',
        operation,
        duration,
        threshold: 2000
      });
    }

    // Report to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: operation,
        value: duration,
        event_category: 'Performance'
      });
    }
  }, []);

  // Cleanup expired cache entries
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCache(prev => {
        const newCache = new Map(prev);
        for (const [key, entry] of newCache.entries()) {
          if (now - entry.timestamp > entry.ttl) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // Cache management
    setCacheEntry,
    getCacheEntry,
    clearCache,
    
    // Pagination
    usePaginatedData,
    
    // Real-time optimizations
    useOptimizedSubscription,
    
    // Performance monitoring
    trackPerformance,
    
    // Metrics
    metrics,
    cacheSize: cache.size
  };
};

export default useProductionOptimizations;