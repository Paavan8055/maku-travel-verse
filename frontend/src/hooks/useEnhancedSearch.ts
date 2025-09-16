/**
 * Enhanced Search Hook with Parameter Mapping and Caching
 * 
 * Integrates ParameterMapper, PhotoRetriever, and CacheManager for
 * intelligent search with retry logic and fallback handling.
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ParameterMapper, { UnifiedSearchParams } from '@/services/core/ParameterMapper';
import PhotoRetriever from '@/services/core/PhotoRetriever';
import cacheManager from '@/services/core/CacheManager';
import logger from '@/utils/logger';

export interface EnhancedSearchResult {
  success: boolean;
  data?: any[];
  provider?: string;
  source: 'cache' | 'api' | 'fallback';
  responseTime?: number;
  correlationId?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface SearchHookResult {
  results: any[];
  loading: boolean;
  error: string | null;
  searchWithMapping: (params: UnifiedSearchParams, searchType: 'hotel' | 'flight' | 'activity') => Promise<EnhancedSearchResult>;
  clearResults: () => void;
  retrySearch: () => Promise<void>;
}

export const useEnhancedSearch = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<{
    params: UnifiedSearchParams;
    searchType: 'hotel' | 'flight' | 'activity';
  } | null>(null);
  
  const { toast } = useToast();

  const searchWithMapping = useCallback(async (
    params: UnifiedSearchParams,
    searchType: 'hotel' | 'flight' | 'activity'
  ): Promise<EnhancedSearchResult> => {
    const startTime = Date.now();
    const correlationId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setLoading(true);
    setError(null);
    setLastSearchParams({ params, searchType });

    try {
      // Validate parameters using ParameterMapper
      const validation = ParameterMapper.validateParams(params, searchType);
      if (!validation.isValid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Generate cache key based on search parameters
      const cacheKey = generateCacheKey(params, searchType);
      
      // Try to get cached results first
      const cachedResult = await cacheManager.get<any>(cacheKey, `${searchType}-search`);
      if (cachedResult) {
        const resultData = (cachedResult as any)?.data || [];
        setResults(resultData);
        
        // Enhance hotel results with photos asynchronously
        if (searchType === 'hotel' && resultData?.length > 0) {
          enhanceHotelResults(resultData);
        }
        
        return {
          success: true,
          data: resultData,
          provider: (cachedResult as any)?.provider,
          source: 'cache',
          responseTime: Date.now() - startTime,
          correlationId
        };
      }

      // Prepare provider-specific parameters
      let providerParams: any;
      try {
        providerParams = prepareProviderParams(params, searchType);
      } catch (paramError) {
        throw new Error(`Parameter mapping failed: ${paramError instanceof Error ? paramError.message : 'Unknown error'}`);
      }

      // Search with retry logic using cache manager
      const searchFunction = () => performProviderSearch(providerParams, searchType, correlationId);
      const result = await cacheManager.getWithRetry(
        cacheKey,
        searchFunction,
        `${searchType}-search`
      );

      if (result.success) {
        setResults(result.data || []);
        
        // Enhance hotel results with photos
        if (searchType === 'hotel' && result.data?.length > 0) {
          enhanceHotelResults(result.data);
        }

        // Show success message if fallback was used
        if (result.fallbackUsed) {
          toast({
            title: "Search Notice",
            description: "Search completed with limited providers. Some results may be unavailable.",
            variant: "default"
          });
        }

        return {
          success: true,
          data: result.data,
          provider: result.provider,
          source: 'api',
          responseTime: Date.now() - startTime,
          correlationId,
          fallbackUsed: result.fallbackUsed
        };
      } else {
        throw new Error(result.error || 'Search failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      setResults([]);

      logger.error('Enhanced search failed:', error);
      
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        source: 'fallback',
        responseTime: Date.now() - startTime,
        correlationId,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const retrySearch = useCallback(async () => {
    if (lastSearchParams) {
      await searchWithMapping(lastSearchParams.params, lastSearchParams.searchType);
    }
  }, [lastSearchParams, searchWithMapping]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setLastSearchParams(null);
  }, []);

  // Helper function to prepare provider-specific parameters
  const prepareProviderParams = (params: UnifiedSearchParams, searchType: string) => {
    switch (searchType) {
      case 'hotel':
        return {
          searchType: 'hotel',
          params: {
            destination: params.destination,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            rooms: params.rooms || 1,
            adults: params.adults || 2,
            children: params.children || 0,
            currency: params.currency || 'AUD'
          }
        };
      case 'flight':
        return {
          searchType: 'flight',
          params: {
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            passengers: params.passengers || params.adults || 1,
            cabin: params.cabin || 'ECONOMY',
            currency: params.currency || 'AUD'
          }
        };
      case 'activity':
        return {
          searchType: 'activity',
          params: {
            destination: params.location || params.destination,
            date: params.date,
            participants: params.participants || 1,
            currency: params.currency || 'AUD'
          }
        };
      default:
        throw new Error(`Unsupported search type: ${searchType}`);
    }
  };

  // Helper function to perform provider search
  const performProviderSearch = async (params: any, searchType: string, correlationId: string) => {
    const { data, error } = await supabase.functions.invoke('provider-rotation', {
      body: {
        ...params,
        correlationId
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  // Helper function to enhance hotel results with photos
  const enhanceHotelResults = async (hotels: any[]) => {
    try {
      const hotelIds = hotels.slice(0, 5).map(hotel => hotel.id || hotel.hotelId).filter(Boolean);
      
      if (hotelIds.length > 0) {
        // Preload photos for first 5 hotels
        PhotoRetriever.preloadPhotos(hotelIds);
      }
    } catch (error) {
      logger.warn('Photo enhancement failed:', error);
    }
  };

  // Helper function to generate cache key
  const generateCacheKey = (params: UnifiedSearchParams, searchType: string): string => {
    const keyParts = [searchType];
    
    if (searchType === 'hotel') {
      keyParts.push(params.destination || '', params.checkIn || '', params.checkOut || '');
    } else if (searchType === 'flight') {
      keyParts.push(params.origin || '', params.destination || '', params.departureDate || '');
    } else if (searchType === 'activity') {
      keyParts.push(params.location || params.destination || '', params.date || '');
    }
    
    return keyParts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  };

  return {
    results,
    loading,
    error,
    searchWithMapping,
    clearResults,
    retrySearch
  };
};

export default useEnhancedSearch;