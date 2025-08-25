import { useState, useEffect, useCallback, useRef } from 'react';
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

interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  state: 'closed' | 'open' | 'half-open';
}

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

export const useHealthMonitor = (options: {
  checkInterval?: number;
  enableAutoCheck?: boolean;
  onStatusChange?: (status: SystemHealth) => void;
} = {}) => {
  const {
    checkInterval = 10 * 60 * 1000, // 10 minutes - increased from too frequent checks
    enableAutoCheck = true,
    onStatusChange
  } = options;

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();
  
  // Circuit breaker and rate limiting
  const circuitBreaker = useRef<CircuitBreakerState>({
    failures: 0,
    lastFailure: null,
    state: 'closed'
  });
  const requestTimes = useRef<number[]>([]);
  
  // Cache for fallback
  const cachedHealth = useRef<SystemHealth | null>(null);

  // Rate limiting check
  const isRateLimited = useCallback((): boolean => {
    const now = Date.now();
    // Clean old requests outside the window
    requestTimes.current = requestTimes.current.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (requestTimes.current.length >= MAX_REQUESTS_PER_WINDOW) {
      console.warn('Health check rate limited');
      return true;
    }
    
    requestTimes.current.push(now);
    return false;
  }, []);

  // Circuit breaker check
  const canMakeRequest = useCallback((): boolean => {
    const cb = circuitBreaker.current;
    const now = Date.now();
    
    if (cb.state === 'open') {
      if (cb.lastFailure && now - cb.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
        cb.state = 'half-open';
        return true;
      }
      return false;
    }
    
    return true;
  }, []);

  // Handle successful request
  const onSuccess = useCallback((healthData: SystemHealth) => {
    const cb = circuitBreaker.current;
    cb.failures = 0;
    cb.state = 'closed';
    
    // Cache successful response
    cachedHealth.current = healthData;
    localStorage.setItem('lastKnownHealth', JSON.stringify({
      data: healthData,
      timestamp: Date.now()
    }));
    
    setHealth(healthData);
    setError(null);
    setLastChecked(new Date());
    
    if (onStatusChange) {
      onStatusChange(healthData);
    }
  }, [onStatusChange]);

  // Handle failed request
  const onFailure = useCallback((error: any) => {
    const cb = circuitBreaker.current;
    cb.failures++;
    cb.lastFailure = Date.now();
    
    if (cb.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      cb.state = 'open';
      console.warn('Health check circuit breaker opened due to repeated failures');
    }
    
    // Try to use cached data
    const cached = localStorage.getItem('lastKnownHealth');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cached data if less than 10 minutes old
        if (age < 10 * 60 * 1000) {
          setHealth({
            ...data,
            status: 'degraded', // Mark as degraded since it's cached
          });
          setError('Using cached health data due to connection issues');
          return;
        }
      } catch (e) {
        console.warn('Failed to parse cached health data', e);
      }
    }
    
    // Create fallback health status
    const fallbackHealth: SystemHealth = {
      status: 'unhealthy',
      timestamp: Date.now(),
      services: {
        database: { status: 'down', lastChecked: Date.now(), error: 'Health check unavailable' },
        amadeus: { status: 'down', lastChecked: Date.now(), error: 'Health check unavailable' },
        stripe: { status: 'down', lastChecked: Date.now(), error: 'Health check unavailable' },
        supabase: { status: 'down', lastChecked: Date.now(), error: 'Health check unavailable' }
      },
      performance: { responseTime: 0 }
    };
    
    setHealth(fallbackHealth);
    setError(error?.message || 'Health check system unavailable');
  }, []);

  const checkHealth = useCallback(async (): Promise<SystemHealth | null> => {
    if (isRateLimited()) {
      console.warn('Health check skipped due to rate limiting');
      return cachedHealth.current;
    }
    
    if (!canMakeRequest()) {
      console.warn('Health check skipped due to circuit breaker');
      return cachedHealth.current;
    }
    
    setLoading(true);
    
    try {
      // Run both health check and quota monitor in parallel for comprehensive monitoring
      const [healthResponse, quotaResponse] = await Promise.allSettled([
        supabase.functions.invoke('health-check'),
        supabase.functions.invoke('provider-quota-monitor')
      ]);
      
      // Process health check response
      if (healthResponse.status === 'rejected' || healthResponse.value.error) {
        const error = healthResponse.status === 'rejected' 
          ? healthResponse.reason 
          : healthResponse.value.error;
        onFailure(error);
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

      const healthData = healthResponse.value.data as SystemHealth;
      
      // Enhance health data with quota information if available
      if (quotaResponse.status === 'fulfilled' && quotaResponse.value.data?.success) {
        const quotaData = quotaResponse.value.data;
        
        // Add quota health to the system health
        (healthData as any).quotaHealth = {
          status: quotaData.criticalProviders.length > 0 ? 'critical' :
                  quotaData.warnings.length > 0 ? 'warning' : 'healthy',
          criticalProviders: quotaData.criticalProviders.length,
          warnings: quotaData.warnings.length,
          totalProviders: quotaData.quotas.length,
          lastUpdated: Date.now()
        };
        
        // Adjust overall status based on quota health
        if (quotaData.criticalProviders.length > 0 && healthData.status === 'healthy') {
          healthData.status = 'degraded';
        }
      }
      
      onSuccess(healthData);
      return healthData;
    } catch (error) {
      onFailure(error);
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
  }, [handleError, isRateLimited, canMakeRequest, onSuccess, onFailure]);

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

  const resetCircuitBreaker = useCallback(() => {
    circuitBreaker.current = {
      failures: 0,
      lastFailure: null,
      state: 'closed'
    };
    requestTimes.current = [];
    localStorage.removeItem('lastKnownHealth');
    console.log('Circuit breaker and rate limiter reset');
  }, []);

  // Load cached health data on mount
  useEffect(() => {
    const cached = localStorage.getItem('lastKnownHealth');
    if (cached && !health) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cached data if less than 1 hour old
        if (age < 60 * 60 * 1000) {
          setHealth({
            ...data,
            status: 'degraded', // Mark as degraded since it's cached
          });
          setError('Showing cached health status');
        }
      } catch (e) {
        console.warn('Failed to load cached health data', e);
      }
    }
  }, [health]);

  // Auto-check health at intervals with improved timing
  useEffect(() => {
    if (!enableAutoCheck) return;

    // Delay initial check to avoid startup rush
    const initialDelay = setTimeout(() => {
      checkHealth();
    }, 2000);

    // Set up interval with jitter to avoid thundering herd
    const jitter = Math.random() * 30000; // 0-30s jitter
    const interval = setInterval(checkHealth, checkInterval + jitter);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
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
    error,
    checkHealth: refreshHealth,
    getOverallStatus,
    getServiceStatus,
    isServiceHealthy,
    getHealthScore,
    // Utility functions
    isHealthy: getOverallStatus() === 'healthy',
    isDegraded: getOverallStatus() === 'degraded',
    isUnhealthy: getOverallStatus() === 'unhealthy',
    // Circuit breaker status
    isCircuitBreakerOpen: circuitBreaker.current.state === 'open',
    circuitBreakerState: circuitBreaker.current.state,
    resetCircuitBreaker
  };
};