import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuotaStatus {
  provider: string;
  service: string;
  quotaUsed: number;
  quotaLimit: number;
  percentageUsed: number;
  resetTime?: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  lastChecked: number;
}

interface QuotaMonitorData {
  quotas: QuotaStatus[];
  warnings: string[];
  criticalProviders: string[];
  recommendedActions: string[];
  lastUpdated: Date | null;
}

export const useQuotaMonitor = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showToasts?: boolean;
} = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    showToasts = true
  } = options;

  const [data, setData] = useState<QuotaMonitorData>({
    quotas: [],
    warnings: [],
    criticalProviders: [],
    recommendedActions: [],
    lastUpdated: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkQuotas = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: response, error: functionError } = await supabase.functions.invoke('provider-quota-monitor');

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!response.success) {
        throw new Error(response.error || 'Quota check failed');
      }

      // Check for new critical providers
      const newCriticalProviders = response.criticalProviders.filter(
        (provider: string) => !data.criticalProviders.includes(provider)
      );

      setData({
        quotas: response.quotas,
        warnings: response.warnings,
        criticalProviders: response.criticalProviders,
        recommendedActions: response.recommendedActions,
        lastUpdated: new Date()
      });

      // Show toast notifications for critical issues
      if (showToasts && newCriticalProviders.length > 0) {
        toast({
          title: "Provider Quota Alert",
          description: `${newCriticalProviders.join(', ')} provider(s) have quota issues`,
          variant: "destructive"
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check quotas';
      setError(errorMessage);
      
      if (showToasts) {
        toast({
          title: "Quota Monitor Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loading, data.criticalProviders, showToasts, toast]);

  // Get quota status for a specific provider
  const getProviderQuota = useCallback((provider: string): QuotaStatus | null => {
    return data.quotas.find(q => q.provider === provider) || null;
  }, [data.quotas]);

  // Check if a provider is available (not exceeded)
  const isProviderAvailable = useCallback((provider: string): boolean => {
    const quota = getProviderQuota(provider);
    return quota ? quota.status !== 'exceeded' : true;
  }, [getProviderQuota]);

  // Get provider priority based on quota status
  const getProviderPriority = useCallback((provider: string): number => {
    const quota = getProviderQuota(provider);
    if (!quota) return 1;

    switch (quota.status) {
      case 'healthy': return 1;
      case 'warning': return 2;
      case 'critical': return 3;
      case 'exceeded': return 999;
      default: return 1;
    }
  }, [getProviderQuota]);

  // Get overall system quota health
  const getOverallQuotaHealth = useCallback((): 'healthy' | 'warning' | 'critical' => {
    if (data.quotas.length === 0) return 'healthy';

    const hasExceeded = data.quotas.some(q => q.status === 'exceeded');
    const hasCritical = data.quotas.some(q => q.status === 'critical');
    const hasWarning = data.quotas.some(q => q.status === 'warning');

    if (hasExceeded || hasCritical) return 'critical';
    if (hasWarning) return 'warning';
    return 'healthy';
  }, [data.quotas]);

  // Get quota statistics
  const getQuotaStats = useCallback(() => {
    const totalProviders = data.quotas.length;
    const healthyProviders = data.quotas.filter(q => q.status === 'healthy').length;
    const warningProviders = data.quotas.filter(q => q.status === 'warning').length;
    const criticalProviders = data.quotas.filter(q => q.status === 'critical').length;
    const exceededProviders = data.quotas.filter(q => q.status === 'exceeded').length;

    return {
      total: totalProviders,
      healthy: healthyProviders,
      warning: warningProviders,
      critical: criticalProviders,
      exceeded: exceededProviders,
      availabilityPercentage: totalProviders > 0 ? 
        ((healthyProviders + warningProviders + criticalProviders) / totalProviders) * 100 : 100
    };
  }, [data.quotas]);

  // Force refresh quotas
  const refreshQuotas = useCallback(async () => {
    await checkQuotas();
  }, [checkQuotas]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial check
    checkQuotas();

    // Set up interval
    const interval = setInterval(checkQuotas, refreshInterval);

    return () => clearInterval(interval);
  }, [checkQuotas, autoRefresh, refreshInterval]);

  return {
    // Data
    quotas: data.quotas,
    warnings: data.warnings,
    criticalProviders: data.criticalProviders,
    recommendedActions: data.recommendedActions,
    lastUpdated: data.lastUpdated,
    
    // State
    loading,
    error,
    
    // Functions
    refreshQuotas,
    getProviderQuota,
    isProviderAvailable,
    getProviderPriority,
    getOverallQuotaHealth,
    getQuotaStats,
    
    // Computed values
    isHealthy: getOverallQuotaHealth() === 'healthy',
    hasWarnings: getOverallQuotaHealth() === 'warning',
    hasCriticalIssues: getOverallQuotaHealth() === 'critical'
  };
};