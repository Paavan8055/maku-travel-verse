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
      // Try unified API client first (uses multiple providers)
      try {
        const unifiedResults = await unifiedApiClient.searchFlights(params);
        setResults({
          data: unifiedResults,
          source: 'api',
          provider: 'unified',
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Search completed",
          description: `Found ${unifiedResults.length} flight options`,
        });
        
        return;
      } catch (unifiedError) {
        logger.warn('Unified API failed, falling back to direct calls', unifiedError);
      }

      // Fallback to direct Amadeus search
      const { data: amadeusData, error: amadeusError } = await supabase.functions.invoke(
        'amadeus-flight-search',
        {
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
        }
      );

      if (amadeusError) throw amadeusError;

      if (amadeusData?.success && amadeusData?.flights) {
        setResults({
          data: amadeusData.flights,
          source: amadeusData.source || 'api',
          provider: 'amadeus',
          timestamp: new Date().toISOString()
        });

        toast({
          title: "Flight search completed",
          description: `Found ${amadeusData.flights.length} flights`,
        });
      } else {
        throw new Error('No flight results found');
      }

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
      // Try unified API client first
      try {
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
      } catch (unifiedError) {
        logger.warn('Unified API failed, falling back to direct calls', unifiedError);
      }

      // Fallback to direct Amadeus hotel search
      const { data: amadeusData, error: amadeusError } = await supabase.functions.invoke(
        'amadeus-hotel-search',
        {
          body: {
            destination: params.destination || params.cityCode,
            checkInDate: params.checkIn,
            checkOutDate: params.checkOut,
            adults: params.adults || 2,
            children: params.children || 0,
            rooms: params.rooms || 1,
            currency: 'AUD'
          }
        }
      );

      if (amadeusError) throw amadeusError;

      if (amadeusData?.success && amadeusData?.hotels) {
        setResults({
          data: amadeusData.hotels,
          source: amadeusData.source || 'api',
          provider: 'amadeus',
          timestamp: new Date().toISOString()
        });

        toast({
          title: "Hotel search completed",
          description: `Found ${amadeusData.hotels.length} hotels`,
        });
      } else {
        throw new Error('No hotel results found');
      }

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