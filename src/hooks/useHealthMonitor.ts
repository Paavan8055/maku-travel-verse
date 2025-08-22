import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';

interface ServiceStatus {
  status: 'up' | 'down' | 'slow';
  responseTime?: number;
  lastChecked: number;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceStatus;
    amadeus: ServiceStatus;
    stripe: ServiceStatus;
    supabase: ServiceStatus;
  };
  performance: {
    responseTime: number;
    memoryUsage?: number;
  };
  timestamp: number;
}

export const useHealthMonitor = (options: {
  checkInterval?: number;
  enableAutoCheck?: boolean;
  onStatusChange?: (status: SystemHealth) => void;
} = {}) => {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes
    enableAutoCheck = true,
    onStatusChange
  } = options;

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { handleError } = useErrorHandler();

  const checkHealth = useCallback(async (): Promise<SystemHealth | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (error) {
        handleError({
          error,
          options: {
            context: 'health-check',
            showToast: false,
            logError: true
          }
        });
        return null;
      }

      const healthData = data as SystemHealth;
      setHealth(healthData);
      setLastChecked(new Date());
      
      // Notify about status changes
      if (onStatusChange) {
        onStatusChange(healthData);
      }

      return healthData;
    } catch (error) {
      handleError({
        error,
        options: {
          context: 'health-check-network',
          showToast: false,
          logError: true
        }
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, onStatusChange]);

  const getOverallStatus = useCallback((): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' => {
    if (!health) return 'unknown';
    return health.status;
  }, [health]);

  const getServiceStatus = useCallback((serviceName: keyof SystemHealth['services']) => {
    if (!health) return null;
    return health.services[serviceName];
  }, [health]);

  const isServiceHealthy = useCallback((serviceName: keyof SystemHealth['services']) => {
    const service = getServiceStatus(serviceName);
    return service?.status === 'up';
  }, [getServiceStatus]);

  const getHealthScore = useCallback((): number => {
    if (!health) return 0;
    
    const services = Object.values(health.services);
    const upServices = services.filter(s => s.status === 'up').length;
    const slowServices = services.filter(s => s.status === 'slow').length;
    
    // Calculate score: up = 1 point, slow = 0.5 points, down = 0 points
    const score = (upServices + slowServices * 0.5) / services.length;
    return Math.round(score * 100);
  }, [health]);

  const refreshHealth = useCallback(async () => {
    return await checkHealth();
  }, [checkHealth]);

  // Auto-check health at intervals
  useEffect(() => {
    if (!enableAutoCheck) return;

    // Initial check
    checkHealth();

    const interval = setInterval(checkHealth, checkInterval);
    return () => clearInterval(interval);
  }, [checkHealth, checkInterval, enableAutoCheck]);

  // Detect when user comes back to tab (visibility API)
  useEffect(() => {
    if (!enableAutoCheck) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && lastChecked) {
        const timeSinceLastCheck = Date.now() - lastChecked.getTime();
        // If more than 2 minutes since last check, refresh
        if (timeSinceLastCheck > 2 * 60 * 1000) {
          checkHealth();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkHealth, enableAutoCheck, lastChecked]);

  return {
    health,
    loading,
    lastChecked,
    checkHealth: refreshHealth,
    getOverallStatus,
    getServiceStatus,
    isServiceHealthy,
    getHealthScore,
    // Utility functions
    isHealthy: getOverallStatus() === 'healthy',
    isDegraded: getOverallStatus() === 'degraded',
    isUnhealthy: getOverallStatus() === 'unhealthy'
  };
};