import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from "@/utils/logger";
import type {
  FlightSearchParams,
  HotelSearchParams,
  TransferSearchParams,
  ActivitySearchParams,
  AmadeusFlightOffer,
  AmadeusHotelOffer,
  AmadeusTransferOffer,
  AmadeusActivity
} from '@/types/amadeus';

interface SearchState<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  source: 'cache' | 'amadeus' | 'hotelbeds' | 'sabre' | 'rotation' | null;
  provider?: string;
}

export const useFlightSearch = () => {
  const [state, setState] = useState<SearchState<AmadeusFlightOffer>>({
    data: null,
    loading: false,
    error: null,
    source: null,
  });
  const { toast } = useToast();

  const search = useCallback(async (params: FlightSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'flight',
          params: {
            originLocationCode: (params as any).originLocationCode || (params as any).origin,
            destinationLocationCode: (params as any).destinationLocationCode || (params as any).destination,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.adults || 1,
            children: params.children || 0,
            infants: params.infants || 0,
            travelClass: params.travelClass || 'ECONOMY',
            currencyCode: params.currencyCode || 'AUD'
          }
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Flight search failed');
      }

      setState({
        data: data.data?.flights || data.data?.data || [],
        loading: false,
        error: null,
        source: 'rotation',
        provider: data.provider
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
        });
      } else if (data.provider && data.provider !== 'amadeus') {
        toast({
          title: `Results from ${data.provider}`,
          description: 'Using alternative provider for best availability.',
        });
      }

    } catch (error) {
      logger.error('Flight search error:', error);
      setState({
        data: null,
        loading: false,
        error: error.message || 'Failed to search flights',
        source: null,
      });
      
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to search flights',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return { ...state, search };
};

export const useHotelSearch = () => {
  const [state, setState] = useState<SearchState<AmadeusHotelOffer>>({
    data: null,
    loading: false,
    error: null,
    source: null,
  });
  const { toast } = useToast();

  const search = useCallback(async (params: HotelSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            cityCode: params.cityCode || params.destination,
            checkInDate: params.checkInDate || params.checkIn,
            checkOutDate: params.checkOutDate || params.checkOut,
            adults: params.adults || 1,
            roomQuantity: params.roomQuantity || params.rooms || 1,
            currency: params.currency || 'AUD'
          }
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Hotel search failed');
      }

      setState({
        data: data.data?.hotels || data.data?.data || [],
        loading: false,
        error: null,
        source: 'rotation',
        provider: data.provider
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
        });
      } else if (data.provider && data.provider !== 'amadeus') {
        toast({
          title: `Results from ${data.provider}`,
          description: 'Using alternative provider for best availability.',
        });
      }

    } catch (error) {
      logger.error('Hotel search error:', error);
      setState({
        data: null,
        loading: false,
        error: error.message || 'Failed to search hotels',
        source: null,
      });
      
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to search hotels',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return { ...state, search };
};

export const useTransferSearch = () => {
  const [state, setState] = useState<SearchState<AmadeusTransferOffer>>({
    data: null,
    loading: false,
    error: null,
    source: null,
  });
  const { toast } = useToast();

  const search = useCallback(async (params: TransferSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'transfer',
          params
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Transfer search failed');
      }

      setState({
        data: data.data?.transfers || data.data?.data || [],
        loading: false,
        error: null,
        source: 'rotation',
        provider: data.provider
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
        });
      } else if (data.provider && data.provider !== 'amadeus') {
        toast({
          title: `Results from ${data.provider}`,
          description: 'Using alternative provider for best availability.',
        });
      }

    } catch (error) {
      logger.error('Transfer search error:', error);
      setState({
        data: null,
        loading: false,
        error: error.message || 'Failed to search transfers',
        source: null,
      });
      
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to search transfers',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return { ...state, search };
};

export const useActivitySearch = () => {
  const [state, setState] = useState<SearchState<AmadeusActivity>>({
    data: null,
    loading: false,
    error: null,
    source: null,
  });
  const { toast } = useToast();

  const search = useCallback(async (params: ActivitySearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'activity',
          params: {
            latitude: params.latitude,
            longitude: params.longitude,
            radius: params.radius || 20,
            destination: params.cityIata || params.destination,
            date: params.from || params.date,
            participants: params.participants || 2
          }
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Activity search failed');
      }

      setState({
        data: data.data?.activities || data.data?.data || [],
        loading: false,
        error: null,
        source: 'rotation',
        provider: data.provider
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
        });
      } else if (data.provider && data.provider !== 'amadeus') {
        toast({
          title: `Results from ${data.provider}`,
          description: 'Using alternative provider for best availability.',
        });
      }

    } catch (error) {
      logger.error('Activity search error:', error);
      setState({
        data: null,
        loading: false,
        error: error.message || 'Failed to search activities',
        source: null,
      });
      
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to search activities',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return { ...state, search };
};