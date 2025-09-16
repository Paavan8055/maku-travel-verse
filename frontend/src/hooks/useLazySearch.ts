import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface SearchState {
  isSearchReady: boolean;
  searchParams: SearchParams | null;
  results: any[] | null;
  loading: boolean;
  error: string | null;
  provider: string;
  source: 'cache' | 'api';
  timestamp: string | null;
}

interface SearchValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const initialState: SearchState = {
  isSearchReady: false,
  searchParams: null,
  results: null,
  loading: false,
  error: null,
  provider: 'amadeus',
  source: 'api',
  timestamp: null
};

export const useLazyFlightSearch = () => {
  const [state, setState] = useState<SearchState>(initialState);
  const { toast } = useToast();

  const validateSearch = useCallback((params: SearchParams): SearchValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.origin) errors.push('Origin airport is required');
    if (!params.destination) errors.push('Destination airport is required');
    if (!params.departureDate) errors.push('Departure date is required');
    if (params.adults && params.adults < 1) errors.push('At least 1 adult passenger is required');

    if (params.returnDate && new Date(params.returnDate) <= new Date(params.departureDate!)) {
      errors.push('Return date must be after departure date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  const prepareSearch = useCallback((params: SearchParams) => {
    const validation = validateSearch(params);
    
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.errors.join(', '), searchParams: null, isSearchReady: false }));
      toast({
        title: "Search validation failed",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      searchParams: params,
      isSearchReady: true,
      error: null,
      results: null
    }));

    if (validation.warnings.length > 0) {
      toast({
        title: "Search ready with notes",
        description: validation.warnings.join(', '),
        variant: "default"
      });
    } else {
      toast({
        title: "Flight search prepared",
        description: "Click 'Search Flights' to get results",
        variant: "default"
      });
    }
    
    return true;
  }, [validateSearch, toast]);

  const executeSearch = useCallback(async () => {
    if (!state.searchParams || !state.isSearchReady) {
      toast({
        title: "No search prepared",
        description: "Please prepare your search first",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'flight',
          params: {
            originLocationCode: state.searchParams.origin?.toUpperCase(),
            destinationLocationCode: state.searchParams.destination?.toUpperCase(),
            departureDate: state.searchParams.departureDate,
            returnDate: state.searchParams.returnDate,
            adults: state.searchParams.adults || 1,
            children: state.searchParams.children || 0,
            infants: state.searchParams.infants || 0,
            travelClass: 'ECONOMY',
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.flights) {
        setState(prev => ({
          ...prev,
          results: data.flights,
          source: data.source || 'api',
          provider: data.provider || 'amadeus',
          timestamp: new Date().toISOString(),
          loading: false
        }));

        toast({
          title: "Flight search completed",
          description: `Found ${data.flights.length} flights via Amadeus`,
        });
      } else {
        throw new Error(data?.error || 'No flights found');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Flight search failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      logger.error('Flight search error:', err);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.searchParams, state.isSearchReady, toast]);

  const clearSearch = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    prepareSearch,
    executeSearch,
    clearSearch,
    validateSearch
  };
};

export const useLazyHotelSearch = () => {
  const [state, setState] = useState<SearchState>(initialState);
  const { toast } = useToast();

  const validateSearch = useCallback((params: SearchParams): SearchValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.destination && !params.cityCode) errors.push('Destination is required');
    if (!params.checkIn) errors.push('Check-in date is required');
    if (!params.checkOut) errors.push('Check-out date is required');
    if (params.guests && params.guests < 1) errors.push('At least 1 guest is required');

    if (params.checkIn && params.checkOut && new Date(params.checkOut) <= new Date(params.checkIn)) {
      errors.push('Check-out date must be after check-in date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  const prepareSearch = useCallback((params: SearchParams) => {
    const validation = validateSearch(params);
    
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.errors.join(', '), searchParams: null, isSearchReady: false }));
      toast({
        title: "Search validation failed",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      searchParams: params,
      isSearchReady: true,
      error: null,
      results: null
    }));

    toast({
      title: "Hotel search prepared",
      description: "Click 'Search Hotels' to get results",
      variant: "default"
    });
    
    return true;
  }, [validateSearch, toast]);

  const executeSearch = useCallback(async () => {
    if (!state.searchParams || !state.isSearchReady) {
      toast({
        title: "No search prepared",
        description: "Please prepare your search first",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            destination: state.searchParams.destination || state.searchParams.cityCode,
            checkIn: state.searchParams.checkIn,
            checkOut: state.searchParams.checkOut,
            adults: state.searchParams.adults || 2,
            children: state.searchParams.children || 0,
            rooms: state.searchParams.rooms || 1,
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.hotels) {
        setState(prev => ({
          ...prev,
          results: data.hotels,
          source: data.source || 'api',
          provider: data.provider || 'amadeus',
          timestamp: new Date().toISOString(),
          loading: false
        }));

        toast({
          title: "Hotel search completed",
          description: `Found ${data.hotels.length} hotels via Amadeus`,
        });
      } else {
        throw new Error(data?.error || 'No hotels found');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Hotel search failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      logger.error('Hotel search error:', err);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.searchParams, state.isSearchReady, toast]);

  const clearSearch = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    prepareSearch,
    executeSearch,
    clearSearch,
    validateSearch
  };
};

export const useLazyActivitySearch = () => {
  const [state, setState] = useState<SearchState>(initialState);
  const { toast } = useToast();

  const validateSearch = useCallback((params: SearchParams): SearchValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!params.destination && !params.cityCode) errors.push('Destination is required');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  const prepareSearch = useCallback((params: SearchParams) => {
    const validation = validateSearch(params);
    
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.errors.join(', '), searchParams: null, isSearchReady: false }));
      toast({
        title: "Search validation failed",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({
      ...prev,
      searchParams: params,
      isSearchReady: true,
      error: null,
      results: null
    }));

    toast({
      title: "Activity search prepared",
      description: "Click 'Search Activities' to get results",
      variant: "default"
    });
    
    return true;
  }, [validateSearch, toast]);

  const executeSearch = useCallback(async () => {
    if (!state.searchParams || !state.isSearchReady) {
      toast({
        title: "No search prepared",
        description: "Please prepare your search first",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'activity',
          params: {
            destination: state.searchParams.destination || state.searchParams.cityCode,
            dateFrom: state.searchParams.checkIn,
            dateTo: state.searchParams.checkOut,
            currency: 'AUD'
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setState(prev => ({
          ...prev,
          results: data.data,
          source: data.source || 'api',
          provider: data.provider || 'amadeus',
          timestamp: new Date().toISOString(),
          loading: false
        }));

        toast({
          title: "Activity search completed",
          description: `Found ${data.data.length} activities via Amadeus`,
        });
      } else {
        throw new Error(data?.error || 'No activities found');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Activity search failed';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      logger.error('Activity search error:', err);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.searchParams, state.isSearchReady, toast]);

  const clearSearch = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    prepareSearch,
    executeSearch,
    clearSearch,
    validateSearch
  };
};