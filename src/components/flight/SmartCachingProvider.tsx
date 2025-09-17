import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  popularity: number;
  compressionRatio?: number;
}

interface PredictiveCache {
  predictedSearches: string[];
  userPattern: 'explorer' | 'focused' | 'price_sensitive';
  lastUpdated: number;
}

interface SmartCacheConfig {
  defaultTTL: number;
  maxEntries: number;
  compressionThreshold: number;
  predictionWindow: number;
}

interface SmartCachingContextType {
  getFromCache: <T>(key: string) => T | null;
  setToCache: <T>(key: string, data: T, customTTL?: number) => void;
  invalidateCache: (pattern?: string) => void;
  getCacheStats: () => { hits: number; misses: number; hitRate: number };
  prefetchData: (keys: string[]) => Promise<void>;
  isLoading: boolean;
  networkStatus: 'online' | 'offline' | 'slow';
}

const SmartCachingContext = createContext<SmartCachingContextType | null>(null);

interface SmartCachingProviderProps {
  children: ReactNode;
  config?: Partial<SmartCacheConfig>;
}

export const SmartCachingProvider = ({ 
  children, 
  config 
}: SmartCachingProviderProps) => {
  const defaultConfig: SmartCacheConfig = {
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    maxEntries: 100,
    compressionThreshold: 50 * 1024, // 50KB
    predictionWindow: 30 * 60 * 1000, // 30 minutes
    ...config
  };

  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map());
  const [stats, setStats] = useState({ hits: 0, misses: 0 });
  const [predictiveCache, setPredictiveCache] = useState<PredictiveCache>({
    predictedSearches: [],
    userPattern: 'focused',
    lastUpdated: Date.now()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');

  // Network status detection
  useEffect(() => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus('offline');
        return;
      }

      // Detect slow connection using Network Information API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
          setNetworkStatus('slow');
        } else {
          setNetworkStatus('online');
        }
      } else {
        setNetworkStatus('online');
      }
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Intelligent cache eviction based on popularity and age
  const evictLeastUseful = useCallback(() => {
    if (cache.size <= defaultConfig.maxEntries) return;

    const entries = Array.from(cache.entries());
    
    // Score entries based on age, popularity, and size
    const scoredEntries = entries.map(([key, entry]) => {
      const age = Date.now() - entry.timestamp;
      const ageScore = age / entry.ttl; // Higher is worse
      const popularityScore = 1 / (entry.popularity + 1); // Higher popularity = lower score
      const sizeScore = entry.compressionRatio ? 1 / entry.compressionRatio : 1;
      
      return {
        key,
        score: ageScore + popularityScore + sizeScore
      };
    });

    // Remove the worst 20% when evicting
    const toRemove = Math.ceil(entries.length * 0.2);
    scoredEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, toRemove)
      .forEach(({ key }) => {
        cache.delete(key);
      });

    setCache(new Map(cache));
  }, [cache, defaultConfig.maxEntries]);

  // Smart data compression for large payloads
  const compressData = useCallback((data: any) => {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length > defaultConfig.compressionThreshold) {
      try {
        // Simple compression using LZ-style algorithm simulation
        const compressed = jsonString.replace(/(.{3,}?)\1+/g, (match, group) => {
          const count = Math.floor(match.length / group.length);
          return `${group}*${count}`;
        });
        
        return {
          compressed: compressed,
          original: jsonString,
          ratio: compressed.length / jsonString.length
        };
      } catch (error) {
        return { compressed: jsonString, original: jsonString, ratio: 1 };
      }
    }
    
    return { compressed: jsonString, original: jsonString, ratio: 1 };
  }, [defaultConfig.compressionThreshold]);

  const decompressData = useCallback((compressed: string) => {
    try {
      const decompressed = compressed.replace(/(.+?)\*(\d+)/g, (match, group, count) => {
        return group.repeat(parseInt(count));
      });
      return JSON.parse(decompressed);
    } catch (error) {
      return JSON.parse(compressed);
    }
  }, []);

  // Predictive prefetching based on user patterns
  const updateUserPattern = useCallback((searchKey: string) => {
    const searchParams = new URLSearchParams(searchKey);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    
    if (origin && destination) {
      setPredictiveCache(prev => {
        const route = `${origin}-${destination}`;
        const updatedSearches = [...prev.predictedSearches, route].slice(-10);
        
        // Analyze pattern frequency
        const routeFrequency = updatedSearches.filter(r => r === route).length;
        let pattern: 'explorer' | 'focused' | 'price_sensitive' = 'focused';
        
        if (updatedSearches.length > 5) {
          const uniqueRoutes = new Set(updatedSearches).size;
          if (uniqueRoutes / updatedSearches.length > 0.8) {
            pattern = 'explorer';
          } else if (routeFrequency > 3) {
            pattern = 'price_sensitive';
          }
        }
        
        return {
          predictedSearches: updatedSearches,
          userPattern: pattern,
          lastUpdated: Date.now()
        };
      });
    }
  }, []);

  const getFromCache = useCallback(<T,>(key: string): T | null => {
    const entry = cache.get(key);
    
    if (!entry) {
      setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      setCache(new Map(cache));
      setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    // Update popularity and hit stats
    entry.popularity += 1;
    setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    
    updateUserPattern(key);
    
    return entry.compressionRatio ? decompressData(entry.data) : entry.data;
  }, [cache, decompressData, updateUserPattern]);

  const setToCache = useCallback(<T,>(key: string, data: T, customTTL?: number) => {
    const { compressed, ratio } = compressData(data);
    
    const entry: CacheEntry<any> = {
      data: ratio < 0.9 ? compressed : data,
      timestamp: Date.now(),
      ttl: customTTL || defaultConfig.defaultTTL,
      popularity: 1,
      compressionRatio: ratio < 0.9 ? ratio : undefined
    };

    cache.set(key, entry);
    setCache(new Map(cache));
    
    // Trigger eviction if needed
    if (cache.size > defaultConfig.maxEntries) {
      evictLeastUseful();
    }
  }, [cache, compressData, defaultConfig.defaultTTL, defaultConfig.maxEntries, evictLeastUseful]);

  const invalidateCache = useCallback((pattern?: string) => {
    if (!pattern) {
      cache.clear();
      setCache(new Map());
      return;
    }

    const regex = new RegExp(pattern);
    Array.from(cache.keys())
      .filter(key => regex.test(key))
      .forEach(key => cache.delete(key));
    
    setCache(new Map(cache));
  }, [cache]);

  const prefetchData = useCallback(async (keys: string[]) => {
    setIsLoading(true);
    
    try {
      // Only prefetch if network is good and data isn't already cached
      if (networkStatus === 'online') {
        const uncachedKeys = keys.filter(key => !cache.has(key));
        
        // Simulate prefetch API calls - in reality, these would be actual API calls
        for (const key of uncachedKeys.slice(0, 3)) { // Limit concurrent prefetches
          // This would be replaced with actual API calls
          console.log(`Prefetching data for: ${key}`);
        }
      }
    } catch (error) {
      console.error('Prefetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cache, networkStatus]);

  const getCacheStats = useCallback(() => {
    const hitRate = stats.hits + stats.misses > 0 
      ? stats.hits / (stats.hits + stats.misses) 
      : 0;
    
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }, [stats]);

  // Auto-prefetch based on user patterns
  useEffect(() => {
    if (predictiveCache.userPattern === 'price_sensitive' && predictiveCache.predictedSearches.length > 0) {
      const recentRoute = predictiveCache.predictedSearches[predictiveCache.predictedSearches.length - 1];
      const variations = [
        `${recentRoute}&flexible=true`,
        `${recentRoute}&nearby=true`,
        `${recentRoute}&cabin=business`
      ];
      
      prefetchData(variations);
    }
  }, [predictiveCache, prefetchData]);

  const contextValue: SmartCachingContextType = {
    getFromCache,
    setToCache,
    invalidateCache,
    getCacheStats,
    prefetchData,
    isLoading,
    networkStatus
  };

  return (
    <SmartCachingContext.Provider value={contextValue}>
      {children}
    </SmartCachingContext.Provider>
  );
};

export const useSmartCache = () => {
  const context = useContext(SmartCachingContext);
  if (!context) {
    throw new Error('useSmartCache must be used within a SmartCachingProvider');
  }
  return context;
};