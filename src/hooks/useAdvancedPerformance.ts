import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUnifiedTravel } from '@/contexts/UnifiedTravelContext';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkLatency: number;
  errorRate: number;
  lastUpdated: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface SearchOptimization<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  source: 'cache' | 'network' | 'preload' | 'background';
  metrics: PerformanceMetrics;
  suggestions: string[];
}

interface UseAdvancedPerformanceProps<T> {
  searchFunction: (params: any) => Promise<T[]>;
  cacheKey: (params: any) => string;
  cacheDuration?: number;
  virtualScrollThreshold?: number;
  preloadStrategy?: 'aggressive' | 'conservative' | 'smart';
  enableOfflineMode?: boolean;
  maxCacheSize?: number;
}

export function useAdvancedPerformance<T>({
  searchFunction,
  cacheKey,
  cacheDuration = 10 * 60 * 1000, // 10 minutes
  virtualScrollThreshold = 50,
  preloadStrategy = 'smart',
  enableOfflineMode = true,
  maxCacheSize = 100
}: UseAdvancedPerformanceProps<T>) {
  const { state, preloadModuleData } = useUnifiedTravel();
  
  // Advanced state management
  const [searchState, setSearchState] = useState<SearchOptimization<T>>({
    data: [],
    loading: false,
    error: null,
    source: 'cache',
    metrics: {
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      networkLatency: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    },
    suggestions: []
  });

  // Multi-tier caching system
  const advancedCache = useRef<Map<string, CacheEntry<T[]>>>(new Map());
  const backgroundCache = useRef<Map<string, CacheEntry<T[]>>>(new Map());
  const offlineCache = useRef<Map<string, CacheEntry<T[]>>>(new Map());
  const activeRequests = useRef<Map<string, Promise<T[]>>>(new Map());
  
  // Performance tracking
  const performanceTracker = useRef({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    averageLatency: 0,
    startTime: 0
  });

  // Cache management with LRU eviction
  const manageCacheSize = useCallback((cache: Map<string, CacheEntry<T[]>>) => {
    if (cache.size <= maxCacheSize) return;

    // LRU eviction - remove least recently accessed items
    const entries = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    const itemsToRemove = entries.slice(0, cache.size - maxCacheSize);
    itemsToRemove.forEach(([key]) => cache.delete(key));
  }, [maxCacheSize]);

  // Advanced cache retrieval with tier checking
  const getFromCache = useCallback((key: string): T[] | null => {
    const now = Date.now();
    
    // Check primary cache first
    const primary = advancedCache.current.get(key);
    if (primary && primary.expiresAt > now) {
      primary.accessCount++;
      primary.lastAccessed = now;
      performanceTracker.current.cacheHits++;
      return primary.data;
    }

    // Check background cache
    const background = backgroundCache.current.get(key);
    if (background && background.expiresAt > now) {
      background.accessCount++;
      background.lastAccessed = now;
      performanceTracker.current.cacheHits++;
      return background.data;
    }

    // Check offline cache if enabled
    if (enableOfflineMode) {
      const offline = offlineCache.current.get(key);
      if (offline) {
        offline.accessCount++;
        offline.lastAccessed = now;
        performanceTracker.current.cacheHits++;
        return offline.data;
      }
    }

    performanceTracker.current.cacheMisses++;
    return null;
  }, [enableOfflineMode]);

  // Smart cache storage with tier routing
  const storeInCache = useCallback((key: string, data: T[], source: 'network' | 'background' | 'preload') => {
    const now = Date.now();
    const entry: CacheEntry<T[]> = {
      data,
      timestamp: now,
      expiresAt: now + cacheDuration,
      accessCount: 1,
      lastAccessed: now
    };

    switch (source) {
      case 'network':
        advancedCache.current.set(key, entry);
        manageCacheSize(advancedCache.current);
        break;
      case 'background':
        backgroundCache.current.set(key, entry);
        manageCacheSize(backgroundCache.current);
        break;
      case 'preload':
        backgroundCache.current.set(key, entry);
        break;
    }

    // Store in offline cache for offline access
    if (enableOfflineMode && source === 'network') {
      offlineCache.current.set(key, { ...entry, expiresAt: now + (7 * 24 * 60 * 60 * 1000) }); // 7 days
    }
  }, [cacheDuration, enableOfflineMode, manageCacheSize]);

  // Performance-optimized search with advanced features
  const performSearch = useCallback(async (params: any): Promise<T[]> => {
    const key = cacheKey(params);
    const startTime = performance.now();
    performanceTracker.current.startTime = startTime;
    performanceTracker.current.totalRequests++;

    setSearchState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check cache first
      const cached = getFromCache(key);
      if (cached) {
        const renderTime = performance.now() - startTime;
        setSearchState(prev => ({
          ...prev,
          data: cached,
          loading: false,
          source: 'cache',
          metrics: {
            ...prev.metrics,
            renderTime,
            cacheHitRate: (performanceTracker.current.cacheHits / performanceTracker.current.totalRequests) * 100,
            lastUpdated: Date.now()
          }
        }));
        return cached;
      }

      // Check for existing request to avoid duplicates
      if (activeRequests.current.has(key)) {
        const result = await activeRequests.current.get(key)!;
        return result;
      }

      // Create new request
      const requestPromise = searchFunction(params);
      activeRequests.current.set(key, requestPromise);

      const result = await requestPromise;
      const endTime = performance.now();
      const networkLatency = endTime - startTime;

      // Store in cache
      storeInCache(key, result, 'network');
      
      // Update performance metrics
      performanceTracker.current.averageLatency = 
        (performanceTracker.current.averageLatency + networkLatency) / 2;

      setSearchState(prev => ({
        ...prev,
        data: result,
        loading: false,
        source: 'network',
        metrics: {
          ...prev.metrics,
          renderTime: networkLatency,
          networkLatency,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          cacheHitRate: (performanceTracker.current.cacheHits / performanceTracker.current.totalRequests) * 100,
          errorRate: (performanceTracker.current.errors / performanceTracker.current.totalRequests) * 100,
          lastUpdated: Date.now()
        },
        suggestions: generateSmartSuggestions(params, result)
      }));

      // Cleanup active request
      activeRequests.current.delete(key);

      // Trigger smart preloading
      triggerSmartPreload(params, result);

      return result;

    } catch (error) {
      performanceTracker.current.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        metrics: {
          ...prev.metrics,
          errorRate: (performanceTracker.current.errors / performanceTracker.current.totalRequests) * 100,
          lastUpdated: Date.now()
        }
      }));

      // Cleanup active request
      activeRequests.current.delete(key);

      // Try to return offline data if available
      if (enableOfflineMode) {
        const offline = offlineCache.current.get(key);
        if (offline) {
          return offline.data;
        }
      }

      throw error;
    }
  }, [searchFunction, cacheKey, getFromCache, storeInCache, enableOfflineMode]);

  // Smart preloading based on user behavior and patterns
  const triggerSmartPreload = useCallback((searchParams: any, results: T[]) => {
    if (preloadStrategy === 'conservative' || !preloadModuleData) return;

    // Analyze search patterns and preload related queries
    const preloadQueries = generatePreloadQueries(searchParams, results);
    
    preloadQueries.forEach(async (query) => {
      const key = cacheKey(query);
      if (!getFromCache(key) && !activeRequests.current.has(key)) {
        try {
          const preloadPromise = searchFunction(query);
          activeRequests.current.set(key, preloadPromise);
          const preloadData = await preloadPromise;
          storeInCache(key, preloadData, 'preload');
          activeRequests.current.delete(key);
        } catch (error) {
          activeRequests.current.delete(key);
          // Silent fail for preload
        }
      }
    });
  }, [preloadStrategy, preloadModuleData, searchFunction, cacheKey, getFromCache, storeInCache]);

  // Generate smart suggestions based on search results and patterns
  const generateSmartSuggestions = useCallback((params: any, results: T[]): string[] => {
    const suggestions: string[] = [];
    
    // Add destination-based suggestions
    if (params.destination) {
      suggestions.push(`Explore hotels in ${params.destination}`);
      suggestions.push(`Find transfers for ${params.destination}`);
    }

    // Add time-based suggestions
    if (params.date) {
      const date = new Date(params.date);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        suggestions.push('Consider weekday alternatives for better prices');
      }
    }

    // Add group-based suggestions
    if (params.participants > 4) {
      suggestions.push('Look for group discounts and private tours');
    }

    return suggestions;
  }, []);

  // Generate preload queries based on search patterns
  const generatePreloadQueries = useCallback((params: any, results: T[]) => {
    const queries: any[] = [];
    
    if (preloadStrategy === 'aggressive') {
      // Preload nearby dates
      if (params.date) {
        const date = new Date(params.date);
        for (let i = 1; i <= 3; i++) {
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + i);
          queries.push({ ...params, date: nextDate.toISOString().split('T')[0] });
        }
      }

      // Preload different group sizes
      if (params.participants) {
        queries.push({ ...params, participants: params.participants + 1 });
        if (params.participants > 1) {
          queries.push({ ...params, participants: params.participants - 1 });
        }
      }
    }

    return queries;
  }, [preloadStrategy]);

  // Virtual scrolling support for large datasets
  const useVirtualScrolling = useMemo(() => {
    return searchState.data.length > virtualScrollThreshold;
  }, [searchState.data.length, virtualScrollThreshold]);

  // Performance analytics
  const getPerformanceAnalytics = useCallback(() => {
    return {
      ...performanceTracker.current,
      cacheSize: {
        primary: advancedCache.current.size,
        background: backgroundCache.current.size,
        offline: offlineCache.current.size
      },
      cacheHitRate: performanceTracker.current.totalRequests > 0 
        ? (performanceTracker.current.cacheHits / performanceTracker.current.totalRequests) * 100 
        : 0,
      errorRate: performanceTracker.current.totalRequests > 0
        ? (performanceTracker.current.errors / performanceTracker.current.totalRequests) * 100
        : 0
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRequests.current.clear();
    };
  }, []);

  return {
    ...searchState,
    search: performSearch,
    useVirtualScrolling,
    clearCache: () => {
      advancedCache.current.clear();
      backgroundCache.current.clear();
    },
    getPerformanceAnalytics,
    isOfflineMode: enableOfflineMode && !navigator.onLine
  };
}