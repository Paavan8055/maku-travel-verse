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

      // Show specific provider status messages
      if (data.fallbackUsed) {
        toast({
          title: "Service Notice",
          description: `Search completed with limited providers available. Results may be fewer than usual.`,
          variant: "default"
        });
      } else if (data.provider) {
        console.log(`Search completed using ${data.provider} provider in ${data.responseTime}ms`);
      }

      return data;
    } catch (error) {
      console.error('Provider rotation failed:', error);
      
      // More specific error messages based on error type
      const errorMessage = error instanceof Error && error.message.includes('Provider') 
        ? "Search providers are temporarily unavailable. Our team has been notified and is working to resolve this issue."
        : "Unable to complete search. Please verify your search criteria and try again.";
        
      toast({
        title: "Search Error",
        description: errorMessage,
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