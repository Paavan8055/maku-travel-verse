import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: string;
  errorCount: number;
}

export const useProviderHealth = () => {
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProviderHealth = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_health')
        .select('provider, status, response_time_ms, last_checked, error_count')
        .order('last_checked', { ascending: false });

      if (error) throw error;

      const healthData = data.map((item: any) => ({
        provider: item.provider,
        status: getHealthStatus(item.status, item.response_time_ms, item.error_count),
        responseTime: item.response_time_ms || 0,
        lastChecked: item.last_checked,
        errorCount: item.error_count || 0
      }));

      setProviderHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch provider health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatus = (
    status: string, 
    responseTime: number, 
    errorCount: number
  ): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' => {
    if (status === 'unhealthy' || errorCount > 5) return 'unhealthy';
    if (responseTime > 5000 || errorCount > 2) return 'degraded';
    if (status === 'healthy' && responseTime < 3000) return 'healthy';
    return 'unknown';
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
    fetchProviderHealth();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchProviderHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    providerHealth,
    isLoading,
    getProvidersByType,
    getOverallHealth,
    refresh: fetchProviderHealth
  };
};