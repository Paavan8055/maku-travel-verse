import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { advancedCacheManager } from '@/features/search/lib/AdvancedCacheManager';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface GlobalSearchParams {
  destination: string;
  searchType: 'unified' | 'flight' | 'hotel' | 'activity';
  dates?: {
    checkIn: Date;
    checkOut?: Date;
  };
  travelers?: {
    adults: number;
    children: number;
  };
}

interface SearchResult {
  flights?: any[];
  hotels?: any[];
  activities?: any[];
  unified?: any[];
  metadata: {
    searchTime: number;
    resultCounts: Record<string, number>;
    providers: string[];
    cacheHit: boolean;
  };
}

export const useGlobalSearch = () => {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (params: GlobalSearchParams): Promise<void> => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      logger.info('[GLOBAL-SEARCH] Starting search', params);

      const cacheKey = generateCacheKey(params);
      
      // Try cache first
      const cachedResult = await advancedCacheManager.get(
        cacheKey,
        params.searchType
      );

      if (cachedResult && !shouldBypassCache(params)) {
        const searchTime = Date.now() - startTime;
        setResults({
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            searchTime,
            cacheHit: true
          }
        });
        
        toast({
          title: "Search Completed",
          description: `Found cached results in ${searchTime}ms`,
        });

        logger.info('[GLOBAL-SEARCH] Cache hit', { searchTime, cacheKey });
        setLoading(false);
        return;
      }

      // Perform actual search
      const searchPromises = await buildSearchPromises(params);
      const searchResults = await Promise.allSettled(searchPromises);
      
      const consolidatedResults = consolidateResults(searchResults, params.searchType);
      const searchTime = Date.now() - startTime;

      const finalResults: SearchResult = {
        ...consolidatedResults,
        metadata: {
          searchTime,
          resultCounts: calculateResultCounts(consolidatedResults),
          providers: extractProviders(searchResults),
          cacheHit: false
        }
      };

      // Cache the results
      await advancedCacheManager.set(
        cacheKey,
        params.searchType,
        finalResults,
        { 
          ttl: calculateTTL(params.searchType),
          priority: determinePriority(params)
        }
      );

      setResults(finalResults);

      // Log search performance metrics
      await logSearchMetrics(params, finalResults, searchTime);

      toast({
        title: "Search Completed",
        description: `Found ${getTotalResultCount(finalResults)} results in ${searchTime}ms`,
      });

      logger.info('[GLOBAL-SEARCH] Search completed', {
        searchTime,
        totalResults: getTotalResultCount(finalResults),
        providers: finalResults.metadata.providers
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Search failed';
      setError(errorMessage);
      logger.error('[GLOBAL-SEARCH] Search failed', { error: err, params });
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const buildSearchPromises = async (params: GlobalSearchParams): Promise<Promise<any>[]> => {
    const promises: Promise<any>[] = [];

    if (params.searchType === 'unified' || params.searchType === 'flight') {
      promises.push(searchFlights(params));
    }

    if (params.searchType === 'unified' || params.searchType === 'hotel') {
      promises.push(searchHotels(params));
    }

    if (params.searchType === 'unified' || params.searchType === 'activity') {
      promises.push(searchActivities(params));
    }

    return promises;
  };

  const searchFlights = async (params: GlobalSearchParams): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'flight',
          params: {
            originLocationCode: 'SYD', // Would be determined from user location
            destinationLocationCode: params.destination.toUpperCase(),
            departureDate: params.dates?.checkIn ? formatDate(params.dates.checkIn) : undefined,
            returnDate: params.dates?.checkOut ? formatDate(params.dates.checkOut) : undefined,
            adults: params.travelers?.adults || 1,
            children: params.travelers?.children || 0,
            travelClass: 'ECONOMY',
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;

      return {
        type: 'flight',
        success: data?.success || false,
        data: data?.data || [],
        provider: data?.provider || 'unknown',
        responseTime: data?.responseTime || 0
      };
    } catch (error) {
      logger.warn('[GLOBAL-SEARCH] Flight search failed', { error });
      return {
        type: 'flight',
        success: false,
        data: [],
        error: error.message
      };
    }
  };

  const searchHotels = async (params: GlobalSearchParams): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            destination: params.destination,
            checkIn: params.dates?.checkIn ? formatDate(params.dates.checkIn) : undefined,
            checkOut: params.dates?.checkOut ? formatDate(params.dates.checkOut) : undefined,
            adults: params.travelers?.adults || 2,
            children: params.travelers?.children || 0,
            rooms: 1,
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;

      return {
        type: 'hotel',
        success: data?.success || false,
        data: data?.data || [],
        provider: data?.provider || 'unknown',
        responseTime: data?.responseTime || 0
      };
    } catch (error) {
      logger.warn('[GLOBAL-SEARCH] Hotel search failed', { error });
      return {
        type: 'hotel',
        success: false,
        data: [],
        error: error.message
      };
    }
  };

  const searchActivities = async (params: GlobalSearchParams): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'activity',
          params: {
            destination: params.destination,
            date: params.dates?.checkIn ? formatDate(params.dates.checkIn) : undefined,
            participants: (params.travelers?.adults || 0) + (params.travelers?.children || 0) || 2
          }
        }
      });

      if (error) throw error;

      return {
        type: 'activity',
        success: data?.success || false,
        data: data?.data || [],
        provider: data?.provider || 'unknown',
        responseTime: data?.responseTime || 0
      };
    } catch (error) {
      logger.warn('[GLOBAL-SEARCH] Activity search failed', { error });
      return {
        type: 'activity',
        success: false,
        data: [],
        error: error.message
      };
    }
  };

  // Helper functions
  const generateCacheKey = (params: GlobalSearchParams): string => {
    const keyParts = [
      params.destination.toLowerCase(),
      params.searchType,
      params.dates?.checkIn ? formatDate(params.dates.checkIn) : '',
      params.dates?.checkOut ? formatDate(params.dates.checkOut) : '',
      `${params.travelers?.adults || 0}a${params.travelers?.children || 0}c`
    ];
    return keyParts.join(':');
  };

  const consolidateResults = (searchResults: PromiseSettledResult<any>[], searchType: string): Partial<SearchResult> => {
    const consolidated: Partial<SearchResult> = {};

    searchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { type, data } = result.value;
        
        if (type === 'flight') {
          consolidated.flights = data;
        } else if (type === 'hotel') {
          consolidated.hotels = data;
        } else if (type === 'activity') {
          consolidated.activities = data;
        }
      }
    });

    // For unified search, combine all results
    if (searchType === 'unified') {
      consolidated.unified = [
        ...(consolidated.flights || []).slice(0, 5),
        ...(consolidated.hotels || []).slice(0, 5),
        ...(consolidated.activities || []).slice(0, 5)
      ];
    }

    return consolidated;
  };

  const calculateResultCounts = (results: Partial<SearchResult>): Record<string, number> => {
    return {
      flights: results.flights?.length || 0,
      hotels: results.hotels?.length || 0,
      activities: results.activities?.length || 0,
      unified: results.unified?.length || 0
    };
  };

  const extractProviders = (searchResults: PromiseSettledResult<any>[]): string[] => {
    const providers: string[] = [];
    searchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.provider) {
        providers.push(result.value.provider);
      }
    });
    return [...new Set(providers)];
  };

  const getTotalResultCount = (results: SearchResult): number => {
    return Object.values(results.metadata.resultCounts).reduce((sum, count) => sum + count, 0);
  };

  const shouldBypassCache = (params: GlobalSearchParams): boolean => {
    // Bypass cache for searches within the last 5 minutes for real-time pricing
    return false; // Implement your bypass logic here
  };

  const calculateTTL = (searchType: string): number => {
    switch (searchType) {
      case 'flight': return 300; // 5 minutes for flights (pricing changes)
      case 'hotel': return 1800; // 30 minutes for hotels
      case 'activity': return 3600; // 1 hour for activities
      case 'unified': return 900; // 15 minutes for unified
      default: return 3600;
    }
  };

  const determinePriority = (params: GlobalSearchParams): 'low' | 'medium' | 'high' => {
    // Near-future travel gets higher priority
    if (params.dates?.checkIn && params.dates.checkIn <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return 'high';
    }
    return 'medium';
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const logSearchMetrics = async (
    params: GlobalSearchParams,
    results: SearchResult,
    responseTime: number
  ): Promise<void> => {
    try {
      await supabase.from('search_performance_metrics').insert({
        search_type: params.searchType,
        provider_id: 'global_search',
        response_time_ms: responseTime,
        result_count: getTotalResultCount(results),
        success: true,
        search_params: params as any
      });
    } catch (error) {
      logger.warn('[GLOBAL-SEARCH] Could not log metrics', { error });
    }
  };

  return {
    search,
    results,
    loading,
    error,
    clearResults: () => setResults(null),
    clearError: () => setError(null)
  };
};