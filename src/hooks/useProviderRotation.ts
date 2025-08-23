import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProviderRotationResult {
  success: boolean;
  data?: any;
  provider?: string;
  providerId?: string;
  responseTime?: number;
  fallbackUsed?: boolean;
  error?: string;
}

export interface ProviderRotationParams {
  searchType: 'flight' | 'hotel' | 'activity';
  params: any;
  excludedProviders?: string[];
}

export const useProviderRotation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchWithRotation = useCallback(async (
    rotationParams: ProviderRotationParams
  ): Promise<ProviderRotationResult> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: rotationParams
      });

      if (error) {
        throw new Error(error.message);
      }

      // Show user-friendly message if fallback data is used
      if (data.fallbackUsed) {
        toast({
          title: "Service Notice",
          description: `We're experiencing temporary issues with our search providers. Showing sample data while we restore full service.`,
          variant: "default"
        });
      }

      return data;
    } catch (error) {
      console.error('Provider rotation failed:', error);
      
      toast({
        title: "Search Error",
        description: "Unable to search at this time. Please try again later.",
        variant: "destructive"
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    searchWithRotation,
    isLoading
  };
};