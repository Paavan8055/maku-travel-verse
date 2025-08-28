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
  isDemo?: boolean;
  correlationId?: string;
  warnings?: string[];
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
      const correlationId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Try enhanced provider rotation first, fallback to standard
      const functionName = 'enhanced-provider-rotation';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          ...rotationParams,
          correlationId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Enhanced status handling
      if (data.isDemo) {
        toast({
          title: "Demo Mode",
          description: "Showing demo data while our providers are being updated. All functionality is available for testing.",
          variant: "default"
        });
      } else if (data.fallbackUsed) {
        toast({
          title: "Limited Service",
          description: "Search completed with reduced provider availability. Results may be limited.",
          variant: "default"
        });
      } else if (data.provider && data.responseTime) {
        console.log(`Enhanced search completed using ${data.provider} in ${data.responseTime}ms (Correlation: ${correlationId})`);
      }

      // Always return success for UI consistency, even with demo data
      return {
        success: true,
        data: data.data,
        provider: data.provider,
        providerId: data.providerId,
        responseTime: data.responseTime,
        fallbackUsed: data.fallbackUsed || false,
        isDemo: data.isDemo || false,
        correlationId: data.correlationId || correlationId,
        warnings: data.warnings
      };
    } catch (error) {
      console.error('Enhanced provider rotation failed:', error);
      
      // Try fallback to standard provider rotation
      try {
        console.log('Falling back to standard provider rotation...');
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('provider-rotation', {
          body: rotationParams
        });

        if (fallbackError) {
          throw fallbackError;
        }

        toast({
          title: "Search Completed",
          description: "Search completed using backup systems. Some features may be limited.",
          variant: "default"
        });

        return fallbackData;
      } catch (fallbackError) {
        console.error('All provider systems failed:', fallbackError);
        
        // Return demo data for better UX
        const demoData = getDemoData(rotationParams.searchType);
        
        toast({
          title: "Demo Mode",
          description: "All search providers are temporarily unavailable. Showing demo data for testing.",
          variant: "default"
        });

        return {
          success: true,
          data: demoData,
          provider: 'Demo Data',
          providerId: 'demo',
          fallbackUsed: true,
          isDemo: true,
          error: 'Providers temporarily unavailable'
        };
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Demo data generator
  const getDemoData = (searchType: string) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (searchType) {
      case 'flight':
        return {
          flights: [
            {
              id: 'demo-flight-1',
              airline: 'Demo Airlines',
              flightNumber: 'DM123',
              price: 299,
              currency: 'AUD',
              departure: { airport: 'SYD', time: '09:00', date: futureDate },
              arrival: { airport: 'MEL', time: '10:30', date: futureDate },
              duration: '1h 30m',
              stops: 0,
              cabin: 'Economy',
              provider: 'Demo',
              isDemo: true
            }
          ]
        };
      case 'hotel':
        return {
          hotels: [
            {
              id: 'demo-hotel-1',
              name: 'Demo Grand Hotel',
              location: 'Sydney CBD',
              rating: 4.5,
              price: 150,
              currency: 'AUD',
              provider: 'Demo',
              isDemo: true
            }
          ]
        };
      case 'activity':
        return {
          activities: [
            {
              id: 'demo-activity-1',
              title: 'Demo Sydney Harbour Tour',
              price: 65,
              currency: 'AUD',
              provider: 'Demo',
              isDemo: true
            }
          ]
        };
      default:
        return { data: [] };
    }
  };

  return {
    searchWithRotation,
    isLoading
  };
};