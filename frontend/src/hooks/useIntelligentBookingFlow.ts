import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProviderMetrics {
  providerId: string;
  successRate: number;
  responseTime: number;
  revenuePerBooking: number;
  currentLoad: number;
  availability: boolean;
}

interface BookingOptimization {
  recommendedProvider: string;
  fallbackProviders: string[];
  priceOptimization: {
    currentPrice: number;
    recommendedPrice: number;
    expectedConversion: number;
  };
  riskFactors: string[];
  confidenceScore: number;
}

interface IntelligentBookingConfig {
  enableProviderRotation: boolean;
  enablePriceOptimization: boolean;
  enableFailoverRouting: boolean;
  maxRetryAttempts: number;
  responseTimeThreshold: number;
}

export const useIntelligentBookingFlow = () => {
  const [providers, setProviders] = useState<ProviderMetrics[]>([]);
  const [optimization, setOptimization] = useState<BookingOptimization | null>(null);
  const [config, setConfig] = useState<IntelligentBookingConfig>({
    enableProviderRotation: true,
    enablePriceOptimization: true,
    enableFailoverRouting: true,
    maxRetryAttempts: 3,
    responseTimeThreshold: 2000
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProviderMetrics();
    
    // Set up real-time provider monitoring
    const interval = setInterval(fetchProviderMetrics, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProviderMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-booking', {
        body: { action: 'get_provider_metrics' }
      });

      if (error) throw error;

      // Mock enhanced provider metrics
      const mockMetrics: ProviderMetrics[] = [
        {
          providerId: 'amadeus-flight',
          successRate: 97.2,
          responseTime: 450,
          revenuePerBooking: 450,
          currentLoad: 65,
          availability: true
        },
        {
          providerId: 'sabre-flight',
          successRate: 94.5,
          responseTime: 680,
          revenuePerBooking: 420,
          currentLoad: 85,
          availability: true
        },
        {
          providerId: 'duffel-flight',
          successRate: 91.8,
          responseTime: 320,
          revenuePerBooking: 380,
          currentLoad: 45,
          availability: true
        },
        {
          providerId: 'hotelbeds-hotel',
          successRate: 98.1,
          responseTime: 380,
          revenuePerBooking: 520,
          currentLoad: 70,
          availability: true
        },
        {
          providerId: 'sabre-hotel',
          successRate: 95.3,
          responseTime: 520,
          revenuePerBooking: 480,
          currentLoad: 90,
          availability: false // Simulating outage
        }
      ];

      setProviders(mockMetrics);
    } catch (error) {
      console.error('Error fetching provider metrics:', error);
    }
  };

  const optimizeBookingFlow = useCallback(async (
    searchType: 'flight' | 'hotel' | 'activity',
    searchParams: any
  ): Promise<BookingOptimization> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-booking', {
        body: { 
          action: 'optimize_booking_flow',
          searchType,
          searchParams,
          config
        }
      });

      if (error) throw error;

      // Generate intelligent optimization based on current metrics
      const availableProviders = providers
        .filter(p => p.availability && p.providerId.includes(searchType))
        .sort((a, b) => {
          // Score based on success rate, response time, and current load
          const scoreA = (a.successRate * 0.4) + ((2000 - a.responseTime) / 20 * 0.3) + ((100 - a.currentLoad) * 0.3);
          const scoreB = (b.successRate * 0.4) + ((2000 - b.responseTime) / 20 * 0.3) + ((100 - b.currentLoad) * 0.3);
          return scoreB - scoreA;
        });

      if (availableProviders.length === 0) {
        throw new Error('No available providers for this search type');
      }

      const bestProvider = availableProviders[0];
      const fallbacks = availableProviders.slice(1, 4).map(p => p.providerId);

      const optimization: BookingOptimization = {
        recommendedProvider: bestProvider.providerId,
        fallbackProviders: fallbacks,
        priceOptimization: {
          currentPrice: searchParams.basePrice || 0,
          recommendedPrice: (searchParams.basePrice || 0) * (1 + (bestProvider.successRate - 90) / 100),
          expectedConversion: bestProvider.successRate / 100
        },
        riskFactors: [
          ...(bestProvider.currentLoad > 80 ? ['High provider load'] : []),
          ...(bestProvider.responseTime > config.responseTimeThreshold ? ['Slow response time'] : []),
          ...(availableProviders.length < 2 ? ['Limited failover options'] : [])
        ],
        confidenceScore: Math.min(95, bestProvider.successRate + (100 - bestProvider.currentLoad) * 0.1)
      };

      setOptimization(optimization);
      return optimization;

    } catch (error) {
      console.error('Error optimizing booking flow:', error);
      toast({
        title: "Optimization Error",
        description: "Failed to optimize booking flow",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [providers, config, toast]);

  const executeBookingWithFailover = useCallback(async (
    searchType: 'flight' | 'hotel' | 'activity',
    searchParams: any,
    optimization?: BookingOptimization
  ) => {
    if (!optimization) {
      optimization = await optimizeBookingFlow(searchType, searchParams);
    }

    const providers = [optimization.recommendedProvider, ...optimization.fallbackProviders];
    let lastError: Error | null = null;

    for (let i = 0; i < providers.length && i < config.maxRetryAttempts; i++) {
      const providerId = providers[i];
      
      try {
        console.log(`Attempting booking with provider: ${providerId} (attempt ${i + 1})`);
        
        const { data, error } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType,
            searchParams: {
              ...searchParams,
              providerId,
              timeout: config.responseTimeThreshold
            }
          }
        });

        if (error) throw error;

        if (data && data.success) {
          // Log successful booking
          await supabase.functions.invoke('enhanced-logging', {
            body: {
              level: 'info',
              message: `Successful booking via ${providerId}`,
              metadata: {
                providerId,
                attemptNumber: i + 1,
                searchType,
                optimization: optimization.confidenceScore
              }
            }
          });

          return {
            success: true,
            data: data.data,
            providerId,
            attemptNumber: i + 1
          };
        }

        throw new Error('Provider returned unsuccessful response');

      } catch (error) {
        lastError = error as Error;
        console.warn(`Provider ${providerId} failed:`, error);

        // Log failed attempt
        await supabase.functions.invoke('enhanced-logging', {
          body: {
            level: 'warn',
            message: `Provider ${providerId} failed (attempt ${i + 1})`,
            metadata: {
              providerId,
              attemptNumber: i + 1,
              error: lastError.message,
              searchType
            }
          }
        });

        // Update provider metrics for real-time adjustment
        setProviders(prev => prev.map(p => 
          p.providerId === providerId 
            ? { ...p, availability: false, successRate: Math.max(0, p.successRate - 5) }
            : p
        ));

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    toast({
      title: "Booking Failed",
      description: "All providers are currently unavailable. Please try again later.",
      variant: "destructive",
    });

    return {
      success: false,
      error: lastError?.message || 'All providers failed',
      attemptedProviders: providers.slice(0, config.maxRetryAttempts)
    };
  }, [optimizeBookingFlow, config, toast]);

  const updateConfig = useCallback((newConfig: Partial<IntelligentBookingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getProviderRecommendation = useCallback((searchType: 'flight' | 'hotel' | 'activity') => {
    const relevantProviders = providers.filter(p => 
      p.availability && p.providerId.includes(searchType)
    );

    if (relevantProviders.length === 0) return null;

    return relevantProviders.reduce((best, current) => {
      const bestScore = (best.successRate * 0.5) + ((2000 - best.responseTime) / 20 * 0.3) + ((100 - best.currentLoad) * 0.2);
      const currentScore = (current.successRate * 0.5) + ((2000 - current.responseTime) / 20 * 0.3) + ((100 - current.currentLoad) * 0.2);
      
      return currentScore > bestScore ? current : best;
    });
  }, [providers]);

  const getHealthStatus = useCallback(() => {
    const totalProviders = providers.length;
    const healthyProviders = providers.filter(p => p.availability && p.successRate > 90).length;
    const averageResponseTime = providers.reduce((sum, p) => sum + p.responseTime, 0) / totalProviders;
    
    return {
      healthyProviders,
      totalProviders,
      healthPercentage: (healthyProviders / totalProviders) * 100,
      averageResponseTime,
      status: healthyProviders / totalProviders > 0.8 ? 'healthy' : 
              healthyProviders / totalProviders > 0.5 ? 'degraded' : 'critical'
    };
  }, [providers]);

  return {
    providers,
    optimization,
    config,
    loading,
    optimizeBookingFlow,
    executeBookingWithFailover,
    updateConfig,
    getProviderRecommendation,
    getHealthStatus,
    fetchProviderMetrics
  };
};