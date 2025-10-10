import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: string;
  errorCount: number;
}

interface UseProviderHealthOptions {
  enabled?: boolean;
}

export const useProviderHealth = (options: UseProviderHealthOptions = {}) => {
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { enabled = true } = options;

  const getHealthStatus = (
    status: string | null | undefined,
    responseTime: number | null | undefined,
    errorCount: number | null | undefined
  ): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' => {
    const safeStatus = status || 'unknown';
    const safeResponseTime = responseTime || 0;
    const safeErrorCount = errorCount || 0;

    if (safeStatus === 'unhealthy' || safeErrorCount > 5) return 'unhealthy';
    if (safeResponseTime > 5000 || safeErrorCount > 2) return 'degraded';
    if (safeStatus === 'healthy' && safeResponseTime < 3000) return 'healthy';
    return 'unknown';
  };

  const fetchProviderHealth = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_health')
        .select('provider, status, response_time_ms, last_checked, error_count')
        .order('last_checked', { ascending: false });

      if (error) throw error;

      // Handle null/undefined data safely
      const healthData = (data || []).map((item: any) => ({
        provider: item?.provider || 'unknown',
        status: getHealthStatus(
          item?.status || 'unknown', 
          item?.response_time_ms || 0, 
          item?.error_count || 0
        ),
        responseTime: item?.response_time_ms || 0,
        lastChecked: item?.last_checked || new Date().toISOString(),
        errorCount: item?.error_count || 0
      }));

      setProviderHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch provider health:', error);
      // Set empty array instead of leaving undefined
      setProviderHealth([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getProvidersByType = (searchType: 'flight' | 'hotel' | 'activity') => {
    const providerMap = {
      flight: ['sabre-flight', 'amadeus-flight'],
      hotel: ['hotelbeds-hotel', 'sabre-hotel', 'amadeus-hotel'],
      activity: ['hotelbeds-activity', 'sabre-activity', 'amadeus-activity']
    };

    return providerHealth.filter(p => 
      providerMap[searchType].includes(p.provider)
    );
  };

  const getOverallHealth = () => {
    if (providerHealth.length === 0) return 'unknown';
    
    const unhealthyCount = providerHealth.filter(p => p.status === 'unhealthy').length;
    const degradedCount = providerHealth.filter(p => p.status === 'degraded').length;
    
    if (unhealthyCount > providerHealth.length / 2) return 'unhealthy';
    if (degradedCount > 0 || unhealthyCount > 0) return 'degraded';
    return 'healthy';
  };

  useEffect(() => {
    if (!enabled) {
      setProviderHealth([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchProviderHealth();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchProviderHealth, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  return {
    providerHealth,
    isLoading,
    getProvidersByType,
    getOverallHealth,
    refresh: fetchProviderHealth
  };
};