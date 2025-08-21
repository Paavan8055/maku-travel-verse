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
  source: 'cache' | 'amadeus' | null;
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
      const { data, error } = await supabase.functions.invoke('amadeus-flight-offers', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Flight search failed');
      }

      setState({
        data: data.data?.data || [],
        loading: false,
        error: null,
        source: data.source,
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
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
      const { data, error } = await supabase.functions.invoke('amadeus-hotel-search', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Hotel search failed');
      }

      setState({
        data: data.data?.data || [],
        loading: false,
        error: null,
        source: data.source,
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
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
      const { data, error } = await supabase.functions.invoke('amadeus-transfer-search', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Transfer search failed');
      }

      setState({
        data: data.data?.data || [],
        loading: false,
        error: null,
        source: data.source,
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
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
      const { data, error } = await supabase.functions.invoke('amadeus-activity-search', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Activity search failed');
      }

      setState({
        data: data.data?.data || [],
        loading: false,
        error: null,
        source: data.source,
      });

      if (data.source === 'cache') {
        toast({
          title: 'Results loaded from cache',
          description: 'Showing previously searched results for faster performance.',
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
