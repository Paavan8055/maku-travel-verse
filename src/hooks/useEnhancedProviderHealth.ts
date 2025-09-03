import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedProviderHealth {
  providerId: string;
  providerName: string;
  status: 'healthy' | 'degraded' | 'outage';
  responseTime: number;
  errorCount: number;
  lastChecked: string;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  credentialsValid: boolean;
  serviceEndpoints: Record<string, boolean>;
  quotaStatus: string;
  quotaPercentage: number;
  serviceTypes: string[];
}

interface HealthSummary {
  totalProviders: number;
  healthyProviders: number;
  degradedProviders: number;
  outageProviders: number;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  lastUpdate: Date;
  criticalIssues: string[];
  recommendations: string[];
}

export const useEnhancedProviderHealth = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<EnhancedProviderHealth[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchProviderHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('enhanced-provider-health');
      
      if (error) throw error;

      // Process provider data
      const providerData: EnhancedProviderHealth[] = data.providers?.map((provider: any) => ({
        providerId: provider.providerId,
        providerName: provider.providerName || provider.providerId,
        status: provider.status,
        responseTime: provider.responseTime,
        errorCount: provider.errorCount,
        lastChecked: provider.lastChecked,
        circuitBreakerState: provider.circuitBreakerState,
        credentialsValid: provider.credentialsValid,
        serviceEndpoints: provider.serviceEndpoints || {},
        quotaStatus: provider.quotaStatus || 'healthy',
        quotaPercentage: provider.quotaPercentage || 0,
        serviceTypes: getServiceTypes(provider.providerId)
      })) || [];

      setProviders(providerData);

      // Process summary data
      const summaryData: HealthSummary = {
        totalProviders: data.totalProviders || 0,
        healthyProviders: data.healthyProviders || 0,
        degradedProviders: data.degradedProviders || 0,
        outageProviders: data.outageProviders || 0,
        overallStatus: data.overallStatus || 'unknown',
        lastUpdate: new Date(),
        criticalIssues: extractCriticalIssues(providerData),
        recommendations: data.recommendations || []
      };

      setSummary(summaryData);

      // Show toast for critical issues
      if (summaryData.criticalIssues.length > 0) {
        toast({
          title: "Critical Issues Detected",
          description: `${summaryData.criticalIssues.length} critical issue(s) found in provider health.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Failed to fetch enhanced provider health:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to fetch provider health data. Using cached data if available.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resetCircuitBreaker = useCallback(async (providerId: string) => {
    try {
      const { error } = await supabase.functions.invoke('enhanced-provider-health', {
        body: {
          action: 'reset-circuit-breaker',
          providerId: providerId
        }
      });

      if (error) throw error;

      toast({
        title: "Circuit Breaker Reset",
        description: `Circuit breaker for ${providerId} has been reset successfully.`,
      });

      // Refresh data
      await fetchProviderHealth();

    } catch (error) {
      console.error('Failed to reset circuit breaker:', error);
      toast({
        title: "Reset Failed",
        description: `Failed to reset circuit breaker for ${providerId}.`,
        variant: "destructive",
      });
    }
  }, [fetchProviderHealth, toast]);

  const forceHealthCheck = useCallback(async (providerId?: string) => {
    try {
      const { error } = await supabase.functions.invoke('enhanced-provider-health', {
        body: {
          action: 'force-health-check',
          providerId: providerId
        }
      });

      if (error) throw error;

      toast({
        title: "Health Check Initiated",
        description: providerId ? 
          `Forced health check for ${providerId}` : 
          "Forced health check for all providers",
      });

      // Refresh data after a short delay
      setTimeout(() => fetchProviderHealth(), 2000);

    } catch (error) {
      console.error('Failed to force health check:', error);
      toast({
        title: "Health Check Failed",
        description: "Failed to initiate forced health check.",
        variant: "destructive",
      });
    }
  }, [fetchProviderHealth, toast]);

  const getProvidersByType = useCallback((serviceType: 'flight' | 'hotel' | 'activity') => {
    return providers.filter(provider => 
      provider.serviceTypes.includes(serviceType)
    );
  }, [providers]);

  const getProvidersByStatus = useCallback((status: 'healthy' | 'degraded' | 'outage') => {
    return providers.filter(provider => provider.status === status);
  }, [providers]);

  const getCircuitBreakerStats = useCallback(() => {
    const openBreakers = providers.filter(p => p.circuitBreakerState === 'open');
    const halfOpenBreakers = providers.filter(p => p.circuitBreakerState === 'half-open');
    const closedBreakers = providers.filter(p => p.circuitBreakerState === 'closed');

    return {
      open: openBreakers.length,
      halfOpen: halfOpenBreakers.length,
      closed: closedBreakers.length,
      openProviders: openBreakers.map(p => p.providerId)
    };
  }, [providers]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchProviderHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchProviderHealth, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchProviderHealth, autoRefresh]);

  // Real-time updates subscription
  useEffect(() => {
    const subscription = supabase
      .channel('provider-health-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'provider_health'
      }, () => {
        // Refresh data when provider health changes
        fetchProviderHealth();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchProviderHealth]);

  return {
    providers,
    summary,
    isLoading,
    autoRefresh,
    setAutoRefresh,
    
    // Actions
    refreshHealth: fetchProviderHealth,
    resetCircuitBreaker,
    forceHealthCheck,
    
    // Getters
    getProvidersByType,
    getProvidersByStatus,
    getCircuitBreakerStats,
    
    // Utils
    getProviderHealth: (providerId: string) => 
      providers.find(p => p.providerId === providerId),
    isProviderHealthy: (providerId: string) => 
      providers.find(p => p.providerId === providerId)?.status === 'healthy',
    hasOpenCircuitBreakers: () => 
      providers.some(p => p.circuitBreakerState === 'open')
  };
};

// Helper functions
function getServiceTypes(providerId: string): string[] {
  const serviceMap: Record<string, string[]> = {
    'amadeus-flight': ['flight'],
    'amadeus-hotel': ['hotel'],
    'amadeus-activity': ['activity'],
    'sabre-flight': ['flight'],
    'sabre-hotel': ['hotel'],
    'sabre-activity': ['activity'],
    'hotelbeds-hotel': ['hotel'],
    'hotelbeds-activity': ['activity']
  };

  return serviceMap[providerId] || ['unknown'];
}

function extractCriticalIssues(providers: EnhancedProviderHealth[]): string[] {
  const issues: string[] = [];

  // Check for outages
  const outageProviders = providers.filter(p => p.status === 'outage');
  if (outageProviders.length > 0) {
    issues.push(`${outageProviders.length} provider(s) experiencing outages: ${outageProviders.map(p => p.providerId).join(', ')}`);
  }

  // Check for open circuit breakers
  const openCircuitBreakers = providers.filter(p => p.circuitBreakerState === 'open');
  if (openCircuitBreakers.length > 0) {
    issues.push(`${openCircuitBreakers.length} circuit breaker(s) open: ${openCircuitBreakers.map(p => p.providerId).join(', ')}`);
  }

  // Check for invalid credentials
  const invalidCredentials = providers.filter(p => !p.credentialsValid);
  if (invalidCredentials.length > 0) {
    issues.push(`${invalidCredentials.length} provider(s) with invalid credentials: ${invalidCredentials.map(p => p.providerId).join(', ')}`);
  }

  // Check for high error counts
  const highErrorProviders = providers.filter(p => p.errorCount > 5);
  if (highErrorProviders.length > 0) {
    issues.push(`${highErrorProviders.length} provider(s) with high error counts: ${highErrorProviders.map(p => p.providerId).join(', ')}`);
  }

  return issues;
}