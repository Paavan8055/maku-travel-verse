import { useState, useCallback, useRef, useEffect } from 'react';
import { advancedProviderRotation, type AdvancedRotationResult } from '@/services/core/AdvancedProviderRotation';
import { useToast } from '@/hooks/use-toast';
import type { ProviderStatus } from '@/components/search/RealTimeSearchProgress';

export interface AdvancedSearchParams {
  searchType: 'flight' | 'hotel' | 'activity';
  params: any;
  userContext?: {
    tier?: string;
    preferences?: any;
    history?: any[];
  };
  options?: {
    enableMultiProvider?: boolean;
    maxProviders?: number;
    enableRealTimeProgress?: boolean;
    qualityThreshold?: number;
  };
}

export interface AdvancedSearchState {
  isLoading: boolean;
  progress: number;
  providers: ProviderStatus[];
  estimatedTimeRemaining?: number;
  result?: AdvancedRotationResult;
  multiProviderResults?: AdvancedRotationResult[];
  error?: string;
}

export const useAdvancedProviderRotation = () => {
  const [searchState, setSearchState] = useState<AdvancedSearchState>({
    isLoading: false,
    progress: 0,
    providers: [],
  });
  
  const { toast } = useToast();
  const searchAbortController = useRef<AbortController | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const simulateProviderProgress = useCallback((providers: ProviderStatus[]) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    let currentProgress = 0;
    const totalDuration = 8000; // 8 seconds estimated
    const updateInterval = 100; // Update every 100ms
    const progressIncrement = 100 / (totalDuration / updateInterval);

    progressInterval.current = setInterval(() => {
      currentProgress += progressIncrement;
      
      setSearchState(prev => {
        const updatedProviders = prev.providers.map(provider => {
          // Simulate different provider speeds
          const baseSpeed = provider.providerId.includes('duffel') ? 1.2 : 
                           provider.providerId.includes('amadeus') ? 1.0 : 0.8;
          
          let newProgress = Math.min(100, provider.progress + (progressIncrement * baseSpeed));
          let newStatus = provider.status;
          
          // Simulate completion at different times
          if (newProgress >= 100 && provider.status === 'searching') {
            newStatus = Math.random() > 0.1 ? 'completed' : 'failed'; // 90% success rate
            newProgress = 100;
          } else if (newProgress > 20 && provider.status === 'pending') {
            newStatus = 'searching';
          }

          return {
            ...provider,
            progress: newProgress,
            status: newStatus,
            responseTime: newStatus === 'completed' ? Math.round(800 + Math.random() * 3000) : undefined,
            resultCount: newStatus === 'completed' ? Math.round(Math.random() * 50 + 5) : undefined,
            quality: newStatus === 'completed' ? Math.round(60 + Math.random() * 40) : undefined
          };
        });

        const overallProgress = updatedProviders.reduce((sum, p) => sum + p.progress, 0) / updatedProviders.length;
        const completedCount = updatedProviders.filter(p => p.status === 'completed' || p.status === 'failed').length;
        
        // Stop when all providers are done
        if (completedCount === updatedProviders.length && progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }

        return {
          ...prev,
          progress: overallProgress,
          providers: updatedProviders,
          estimatedTimeRemaining: completedCount === updatedProviders.length ? 0 : 
            Math.max(0, totalDuration - (currentProgress / progressIncrement * updateInterval))
        };
      });

      if (currentProgress >= 100) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }
    }, updateInterval);
  }, []);

  const searchWithAdvancedRotation = useCallback(async (
    searchParams: AdvancedSearchParams
  ): Promise<AdvancedRotationResult | AdvancedRotationResult[]> => {
    // Cancel any existing search
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    
    searchAbortController.current = new AbortController();
    
    setSearchState({
      isLoading: true,
      progress: 0,
      providers: [],
      estimatedTimeRemaining: 8000
    });

    try {
      // Initialize provider status
      const mockProviders: ProviderStatus[] = [
        {
          providerId: 'duffel-flight',
          providerName: 'Duffel',
          status: 'pending',
          progress: 0
        },
        {
          providerId: 'amadeus-flight',
          providerName: 'Amadeus',
          status: 'pending',
          progress: 0
        },
        {
          providerId: 'sabre-flight',
          providerName: 'Sabre',
          status: 'pending',
          progress: 0
        }
      ];

      setSearchState(prev => ({
        ...prev,
        providers: mockProviders
      }));

      // Start progress simulation if real-time progress is enabled
      if (searchParams.options?.enableRealTimeProgress) {
        simulateProviderProgress(mockProviders);
      }

      let result: AdvancedRotationResult | AdvancedRotationResult[];

      if (searchParams.options?.enableMultiProvider) {
        // Multi-provider search
        result = await advancedProviderRotation.executeMultiProviderSearch(
          searchParams.searchType,
          searchParams.params,
          searchParams.options.maxProviders || 3
        );
        
        setSearchState(prev => ({
          ...prev,
          multiProviderResults: result as AdvancedRotationResult[],
          result: (result as AdvancedRotationResult[])[0] // Best result
        }));
      } else {
        // Single best provider search
        result = await advancedProviderRotation.selectProviderWithML(
          searchParams.searchType,
          searchParams.params,
          searchParams.userContext
        );
        
        setSearchState(prev => ({
          ...prev,
          result: result as AdvancedRotationResult
        }));
      }

      // Handle results
      const mainResult = Array.isArray(result) ? result[0] : result;
      
      if (mainResult.success) {
        // Show success notification with provider info
        if (mainResult.provider && mainResult.mlScore) {
          toast({
            title: "Search Completed",
            description: `Found results using ${mainResult.provider} (ML Score: ${Math.round(mainResult.mlScore * 100)}%)`,
            variant: "default"
          });
        }
        
        // Show advanced insights if available
        if (mainResult.prediction && mainResult.alternativeProviders?.length) {
          console.log('Search completed with ML insights:', {
            selectedProvider: mainResult.provider,
            confidenceScore: mainResult.prediction.confidenceScore,
            alternativeProviders: mainResult.alternativeProviders,
            riskFactors: mainResult.prediction.riskFactors
          });
        }
      } else {
        // Enhanced error handling
        const errorMessage = mainResult.error?.includes('Provider') 
          ? "Our advanced search system tried multiple providers but none are currently available. Please try again in a moment."
          : mainResult.error || "Search failed with unknown error";
          
        toast({
          title: "Advanced Search Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        setSearchState(prev => ({
          ...prev,
          error: errorMessage
        }));
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.error('Advanced provider rotation failed:', error);
      
      toast({
        title: "Search System Error",
        description: "Our intelligent search system encountered an error. Please try again.",
        variant: "destructive"
      });

      setSearchState(prev => ({
        ...prev,
        error: errorMessage
      }));

      throw error;
    } finally {
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100
      }));
    }
  }, [toast, simulateProviderProgress]);

  const retryProvider = useCallback(async (providerId: string) => {
    setSearchState(prev => ({
      ...prev,
      providers: prev.providers.map(p => 
        p.providerId === providerId 
          ? { ...p, status: 'pending', progress: 0, error: undefined }
          : p
      )
    }));

    // Here you would implement actual provider retry logic
    toast({
      title: "Retrying Provider",
      description: `Attempting to retry search with ${providerId}`,
      variant: "default"
    });
  }, [toast]);

  const getProviderInsights = useCallback(async (providerId: string) => {
    try {
      return await advancedProviderRotation.getProviderInsights(providerId);
    } catch (error) {
      console.error('Failed to get provider insights:', error);
      return null;
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    setSearchState(prev => ({
      ...prev,
      isLoading: false,
      progress: 0,
      providers: prev.providers.map(p => ({ ...p, status: 'pending', progress: 0 }))
    }));

    toast({
      title: "Search Cancelled",
      description: "Your search has been cancelled",
      variant: "default"
    });
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, []);

  return {
    searchState,
    searchWithAdvancedRotation,
    retryProvider,
    getProviderInsights,
    cancelSearch,
    // Convenience getters
    isLoading: searchState.isLoading,
    progress: searchState.progress,
    providers: searchState.providers,
    result: searchState.result,
    multiProviderResults: searchState.multiProviderResults,
    error: searchState.error
  };
};