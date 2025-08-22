import { useState, useEffect, useCallback } from 'react';
import { useHealthMonitor } from './useHealthMonitor';
import { toast } from '@/hooks/use-toast';

interface DegradationOptions {
  enableFallbacks?: boolean;
  showUserNotifications?: boolean;
  fallbackData?: Record<string, any>;
}

interface ServiceFallbacks {
  search: {
    useLocalData: boolean;
    cacheDuration: number;
  };
  booking: {
    allowOfflineQueue: boolean;
    showMaintenanceMode: boolean;
  };
  payments: {
    enableFallbackProvider: boolean;
    showRetryOptions: boolean;
  };
}

export const useGracefulDegradation = (options: DegradationOptions = {}) => {
  const {
    enableFallbacks = true,
    showUserNotifications = true,
    fallbackData = {}
  } = options;

  const { health, isUnhealthy, isDegraded } = useHealthMonitor();
  const [fallbacks, setFallbacks] = useState<ServiceFallbacks>({
    search: { useLocalData: false, cacheDuration: 300000 }, // 5 minutes
    booking: { allowOfflineQueue: false, showMaintenanceMode: false },
    payments: { enableFallbackProvider: false, showRetryOptions: false }
  });

  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  // Determine fallback strategies based on health status
  useEffect(() => {
    if (!enableFallbacks || !health) return;

    const newFallbacks: ServiceFallbacks = {
      search: {
        useLocalData: health.services.amadeus.status === 'down',
        cacheDuration: health.services.amadeus.status === 'slow' ? 600000 : 300000
      },
      booking: {
        allowOfflineQueue: health.services.database.status === 'down',
        showMaintenanceMode: isUnhealthy
      },
      payments: {
        enableFallbackProvider: health.services.stripe.status === 'down',
        showRetryOptions: health.services.stripe.status === 'slow'
      }
    };

    setFallbacks(newFallbacks);
  }, [health, isUnhealthy, enableFallbacks]);

  // Show user notifications for service issues
  useEffect(() => {
    if (!showUserNotifications || !health) return;

    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;

    // Only show notifications every 5 minutes to avoid spam
    if (timeSinceLastNotification < 5 * 60 * 1000) return;

    if (isUnhealthy) {
      toast({
        title: "Service Maintenance",
        description: "We're experiencing technical difficulties. Some features may be temporarily unavailable.",
        variant: "destructive",
      });
      setLastNotificationTime(now);
    } else if (isDegraded) {
      toast({
        title: "Reduced Performance",
        description: "Some services are running slower than usual. We're working to resolve this.",
        variant: "default",
      });
      setLastNotificationTime(now);
    }
  }, [isUnhealthy, isDegraded, showUserNotifications, lastNotificationTime, health]);

  // Fallback data providers
  const getFallbackSearchData = useCallback((searchType: 'hotels' | 'flights' | 'activities') => {
    if (!fallbacks.search.useLocalData) return null;

    // Return cached or static fallback data
    return fallbackData[searchType] || null;
  }, [fallbacks.search.useLocalData, fallbackData]);

  const shouldUseOfflineMode = useCallback((feature: 'search' | 'booking' | 'payments') => {
    switch (feature) {
      case 'search':
        return fallbacks.search.useLocalData;
      case 'booking':
        return fallbacks.booking.allowOfflineQueue;
      case 'payments':
        return fallbacks.payments.enableFallbackProvider;
      default:
        return false;
    }
  }, [fallbacks]);

  const getServiceMessage = useCallback((service: 'amadeus' | 'stripe' | 'database') => {
    if (!health) return null;

    const serviceHealth = health.services[service];
    
    switch (serviceHealth.status) {
      case 'down':
        return {
          title: `${service.charAt(0).toUpperCase() + service.slice(1)} Unavailable`,
          message: "This service is temporarily unavailable. Please try again later.",
          variant: "destructive" as const
        };
      case 'slow':
        return {
          title: `${service.charAt(0).toUpperCase() + service.slice(1)} Running Slowly`,
          message: "This service is responding slowly. Operations may take longer than usual.",
          variant: "default" as const
        };
      default:
        return null;
    }
  }, [health]);

  const shouldShowMaintenanceMode = useCallback(() => {
    return fallbacks.booking.showMaintenanceMode;
  }, [fallbacks.booking.showMaintenanceMode]);

  const canProcessBookings = useCallback(() => {
    if (!health) return true; // Assume yes if we don't have health data
    
    // Can process if database and stripe are both working
    return health.services.database.status !== 'down' && 
           health.services.stripe.status !== 'down';
  }, [health]);

  const getRecommendedAction = useCallback(() => {
    if (!health) return null;

    if (isUnhealthy) {
      return {
        type: 'maintenance',
        title: 'Service Maintenance',
        message: 'Our system is undergoing maintenance. Please check back in a few minutes.',
        action: 'refresh'
      };
    }

    if (isDegraded) {
      return {
        type: 'performance',
        title: 'Reduced Performance',
        message: 'Some features may be slower than usual. Consider using simplified search options.',
        action: 'continue'
      };
    }

    return null;
  }, [health, isUnhealthy, isDegraded]);

  return {
    // Service status
    health,
    isUnhealthy,
    isDegraded,
    
    // Fallback strategies
    fallbacks,
    shouldUseOfflineMode,
    getFallbackSearchData,
    
    // User experience
    getServiceMessage,
    shouldShowMaintenanceMode,
    canProcessBookings,
    getRecommendedAction,
    
    // Utilities
    hasServiceIssues: isUnhealthy || isDegraded,
    isServiceAvailable: (service: 'amadeus' | 'stripe' | 'database') => 
      health?.services[service]?.status !== 'down'
  };
};