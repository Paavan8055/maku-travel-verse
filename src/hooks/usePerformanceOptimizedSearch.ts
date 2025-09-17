import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUnifiedTravel } from '@/contexts/UnifiedTravelContext';

interface SearchCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt: number;
  };
}

interface SearchState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  source: 'cache' | 'network' | 'preload';
  lastSearchTime: number;
  requestId: string | null;
}

interface UsePerformanceOptimizedSearchProps<T> {
  searchFunction: (params: any) => Promise<T[]>;
  cacheKey: (params: any) => string;
  cacheDuration?: number; // in milliseconds
  debounceMs?: number;
  preloadStrategy?: 'aggressive' | 'conservative' | 'none';
  deduplicate?: boolean;
}

export function usePerformanceOptimizedSearch<T>({
  searchFunction,
  cacheKey,
  cacheDuration = 5 * 60 * 1000, // 5 minutes default
  debounceMs = 300,
  preloadStrategy = 'conservative',
  deduplicate = true
}: UsePerformanceOptimizedSearchProps<T>) {
  const { state, preloadModuleData } = useUnifiedTravel();
  const [searchState, setSearchState] = useState<SearchState<T>>({
    data: [],
    loading: false,
    error: null,
    source: 'cache',
    lastSearchTime: 0,
    requestId: null
  });

  // Multi-tier caching system
  const browserCache = useRef<SearchCache>({});
  const sessionCache = useRef<Map<string, any>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const activeRequestsRef = useRef<Map<string, Promise<T[]>>>(new Map());

  // Enhanced cache management
  const getCachedData = useCallback((key: string): T[] | null => {
    // Check browser memory cache first
    const browserCached = browserCache.current[key];
    if (browserCached && Date.now() < browserCached.expiresAt) {
      return browserCached.data;
    }

    // Check session storage cache
    try {
      const sessionKey = `search_cache_${key}`;
      const sessionCached = sessionStorage.getItem(sessionKey);
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        if (Date.now() < parsed.expiresAt) {
          // Update browser cache
          browserCache.current[key] = parsed;
          return parsed.data;
        } else {
          sessionStorage.removeItem(sessionKey);
        }
      }
    } catch (error) {
      console.warn('Failed to read from session cache:', error);
    }

    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: T[]) => {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheDuration
    };

    // Update browser cache
    browserCache.current[key] = cacheEntry;

    // Update session storage
    try {
      const sessionKey = `search_cache_${key}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to write to session cache:', error);
    }
  }, [cacheDuration]);

  // Request deduplication
  const executeSearch = useCallback(async (params: any): Promise<T[]> => {
    const key = cacheKey(params);
    const requestId = `${key}_${Date.now()}`;

    // Check for active identical request
    if (deduplicate && activeRequestsRef.current.has(key)) {
      console.log('Deduplicating request for:', key);
      return activeRequestsRef.current.get(key)!;
    }

    // Check cache first
    const cachedData = getCachedData(key);
    if (cachedData) {
      console.log('Serving from cache:', key);
      setSearchState(prev => ({
        ...prev,
        data: cachedData,
        loading: false,
        error: null,
        source: 'cache',
        requestId
      }));
      return cachedData;
    }

    // Create new request
    const searchPromise = searchFunction(params);
    
    if (deduplicate) {
      activeRequestsRef.current.set(key, searchPromise);
    }

    setSearchState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastSearchTime: Date.now(),
      requestId
    }));

    try {
      const results = await searchPromise;
      
      // Cache successful results
      setCachedData(key, results);
      
      setSearchState(prev => ({
        ...prev,
        data: results,
        loading: false,
        error: null,
        source: 'network',
        requestId
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        requestId
      }));
      
      throw error;
    } finally {
      // Clean up active request
      if (deduplicate) {
        activeRequestsRef.current.delete(key);
      }
    }
  }, [searchFunction, cacheKey, getCachedData, setCachedData, deduplicate]);

  // Debounced search function
  const debouncedSearch = useCallback((params: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(params);
    }, debounceMs);
  }, [executeSearch, debounceMs]);

  // Immediate search function (bypasses debounce)
  const immediateSearch = useCallback((params: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    return executeSearch(params);
  }, [executeSearch]);

  // Preloading strategy
  const preloadSearchData = useCallback(async (futureParams: any) => {
    if (preloadStrategy === 'none') return;

    const key = cacheKey(futureParams);
    const cachedData = getCachedData(key);
    
    if (!cachedData) {
      try {
        console.log('Preloading search data for:', key);
        await executeSearch(futureParams);
      } catch (error) {
        console.warn('Preload failed:', error);
      }
    }
  }, [preloadStrategy, cacheKey, getCachedData, executeSearch]);

  // Smart preloading based on travel context
  useEffect(() => {
    if (preloadStrategy === 'none' || !state.destination || !state.checkInDate) return;

    const preloadTimeout = setTimeout(() => {
      // Preload related searches
      const baseParams = {
        destination: state.destination,
        checkIn: state.checkInDate,
        adults: state.adults,
        children: state.children
      };

      // Preload nearby dates (±1-2 days)
      if (preloadStrategy === 'aggressive') {
        const dates = [-2, -1, 1, 2].map(days => {
          const date = new Date(state.checkInDate!);
          date.setDate(date.getDate() + days);
          return date;
        });

        dates.forEach(date => {
          if (date > new Date()) { // Only future dates
            preloadSearchData({
              ...baseParams,
              checkIn: date
            });
          }
        });
      }

      // Preload different party sizes
      if (preloadStrategy === 'conservative' || preloadStrategy === 'aggressive') {
        const partySizes = [
          { adults: state.adults + 1, children: state.children },
          { adults: Math.max(1, state.adults - 1), children: state.children },
        ];

        partySizes.forEach(partySize => {
          preloadSearchData({
            ...baseParams,
            ...partySize
          });
        });
      }
    }, 2000); // Wait 2 seconds before preloading

    return () => clearTimeout(preloadTimeout);
  }, [state.destination, state.checkInDate, state.adults, state.children, preloadStrategy, preloadSearchData]);

  // Performance metrics
  const metrics = useMemo(() => {
    const cacheHitRate = Object.keys(browserCache.current).length > 0 ? 
      Object.values(browserCache.current).filter(entry => Date.now() < entry.expiresAt).length / 
      Object.keys(browserCache.current).length : 0;

    return {
      cacheHitRate: Math.round(cacheHitRate * 100),
      lastSearchTime: searchState.lastSearchTime,
      cacheSize: Object.keys(browserCache.current).length,
      source: searchState.source
    };
  }, [searchState.lastSearchTime, searchState.source]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...searchState,
    search: debouncedSearch,
    searchImmediate: immediateSearch,
    preloadData: preloadSearchData,
    clearCache: () => {
      browserCache.current = {};
      sessionStorage.clear();
    },
    metrics
  };
}

// Specialized hook for activity search
export function useOptimizedActivitySearch() {
  const searchFunction = async (params: any) => {
    // This would call your actual activity search API
    const response = await fetch('/api/activities/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error('Activity search failed');
    }
    
    return response.json();
  };

  const cacheKey = (params: any) => {
    return `activities_${params.destination}_${params.checkIn}_${params.adults}_${params.children}`;
  };

  return usePerformanceOptimizedSearch({
    searchFunction,
    cacheKey,
    cacheDuration: 10 * 60 * 1000, // 10 minutes for activities
    debounceMs: 400, // Slightly longer for activities
    preloadStrategy: 'conservative',
    deduplicate: true
  });
}