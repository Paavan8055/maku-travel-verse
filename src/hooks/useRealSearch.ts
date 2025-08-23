import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { unifiedApiClient } from '@/services/core/UnifiedApiClient';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface SearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  cityCode?: string;
  hotelId?: string;
}

interface SearchResult {
  data: any[];
  source: 'cache' | 'api';
  provider: string;
  timestamp: string;
}

export const useRealFlightSearch = () => {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Multi-provider rotation with fallback
      const providers = ['unified', 'amadeus', 'sabre'];
      let lastError: any = null;

      for (const provider of providers) {
        try {
          if (provider === 'unified') {
            const unifiedResults = await unifiedApiClient.searchFlights(params);
            setResults({
              data: unifiedResults,
              source: 'api',
              provider: 'unified',
              timestamp: new Date().toISOString()
            });
            
            toast({
              title: "Flight search completed",
              description: `Found ${unifiedResults.length} flight options`,
            });
            return;
          }

          // Direct provider calls with error handling
          const functionName = provider === 'amadeus' ? 'amadeus-flight-search' : 'sabre-flight-search';
          
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: {
              origin: params.origin,
              destination: params.destination,
              departureDate: params.departureDate,
              returnDate: params.returnDate,
              adults: params.adults || 1,
              children: params.children || 0,
              infants: params.infants || 0,
              cabin: 'ECONOMY',
              currency: 'AUD'
            }
          });

          if (error) throw error;

          if (data?.success && data?.flights) {
            setResults({
              data: data.flights,
              source: data.source || 'api',
              provider,
              timestamp: new Date().toISOString()
            });

            toast({
              title: "Flight search completed",
              description: `Found ${data.flights.length} flights via ${provider}`,
            });
            return;
          }
        } catch (providerError) {
          logger.warn(`${provider} flight search failed, trying next provider`, providerError);
          lastError = providerError;
          continue;
        }
      }

      // If all providers failed
      throw lastError || new Error('All flight search providers failed');

    } catch (err: any) {
      const errorMessage = err.message || 'Flight search failed';
      setError(errorMessage);
      logger.error('Flight search error:', err);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { results, loading, error, search };
};

export const useRealHotelSearch = () => {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Multi-provider rotation with fallback
      const providers = ['unified', 'amadeus', 'sabre', 'hotelbeds'];
      let lastError: any = null;

      for (const provider of providers) {
        try {
          if (provider === 'unified') {
            const unifiedResults = await unifiedApiClient.searchHotels(params);
            setResults({
              data: unifiedResults,
              source: 'api',
              provider: 'unified',
              timestamp: new Date().toISOString()
            });
            
            toast({
              title: "Hotel search completed",
              description: `Found ${unifiedResults.length} hotel options`,
            });
            return;
          }

          // Direct provider calls with error handling
          const functionName = provider === 'amadeus' ? 'amadeus-hotel-search' :
                              provider === 'sabre' ? 'sabre-hotel-search' :
                              'hotelbeds-search';
          
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: {
              destination: params.destination || params.cityCode,
              checkInDate: params.checkIn,
              checkOutDate: params.checkOut,
              adults: params.adults || 2,
              children: params.children || 0,
              rooms: params.rooms || 1,
              currency: 'AUD'
            }
          });

          if (error) throw error;

          if (data?.success && data?.hotels) {
            setResults({
              data: data.hotels,
              source: data.source || 'api',
              provider,
              timestamp: new Date().toISOString()
            });

            toast({
              title: "Hotel search completed",
              description: `Found ${data.hotels.length} hotels via ${provider}`,
            });
            return;
          }
        } catch (providerError) {
          logger.warn(`${provider} hotel search failed, trying next provider`, providerError);
          lastError = providerError;
          continue;
        }
      }

      // If all providers failed
      throw lastError || new Error('All hotel search providers failed');

    } catch (err: any) {
      const errorMessage = err.message || 'Hotel search failed';
      setError(errorMessage);
      logger.error('Hotel search error:', err);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { results, loading, error, search };
};

export const useRealActivitySearch = () => {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Call HotelBeds activities API via edge function
      const { data: hotelBedsData, error: hotelBedsError } = await supabase.functions.invoke(
        'hotelbeds-activities',
        {
          body: {
            destination: params.destination || params.cityCode,
            dateFrom: params.checkIn,
            dateTo: params.checkOut,
            currency: 'AUD'
          }
        }
      );

      if (hotelBedsError) throw hotelBedsError;

      if (hotelBedsData?.success && hotelBedsData?.activities) {
        setResults({
          data: hotelBedsData.activities,
          source: hotelBedsData.source || 'api',
          provider: 'hotelbeds',
          timestamp: new Date().toISOString()
        });

        toast({
          title: "Activity search completed",
          description: `Found ${hotelBedsData.activities.length} activities`,
        });
      } else {
        throw new Error('No activities found');
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Activity search failed';
      setError(errorMessage);
      logger.error('Activity search error:', err);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { results, loading, error, search };
};