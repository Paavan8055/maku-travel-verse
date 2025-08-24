import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

export interface HotelBedsDestination {
  id: string;
  name: string;
  type: 'city' | 'hotel';
  code?: string;
  country?: string;
  displayName?: string;
}

export interface HotelBedsAutocompleteResult {
  success: boolean;
  suggestions: HotelBedsDestination[];
  error?: string;
}

export const useHotelBedsAutocomplete = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchDestinations = useCallback(async (
    query: string,
    limit: number = 10
  ): Promise<HotelBedsAutocompleteResult> => {
    if (!query || query.length < 2) {
      return { success: true, suggestions: [] };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hotelbeds-autocomplete', {
        body: { query, limit }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && Array.isArray(data.suggestions)) {
        const suggestions: HotelBedsDestination[] = data.suggestions.map((item: any) => ({
          id: item.code || item.id,
          name: item.name,
          type: item.type || 'city',
          code: item.code,
          country: item.country,
          displayName: item.displayName || item.name
        }));

        return { success: true, suggestions };
      }

      return { success: false, suggestions: [], error: 'Invalid response format' };
    } catch (error) {
      logger.error('HotelBeds autocomplete failed:', error);
      
      toast({
        title: "Search Error",
        description: "Unable to fetch HotelBeds destinations. Please try again.",
        variant: "destructive"
      });

      return {
        success: false,
        suggestions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    searchDestinations,
    isLoading
  };
};