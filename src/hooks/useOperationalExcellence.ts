import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';
import { useEnhancedLogging } from './useEnhancedLogging';

interface OperationalMetrics {
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
  circuitBreakerStates: Record<string, 'open' | 'closed' | 'half-open'>;
  quotaUsage: Record<string, number>;
}

interface SelfHealingAction {
  id: string;
  type: 'failover' | 'circuit_break' | 'quota_reset' | 'restart';
  provider: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  automated: boolean;
  executed: boolean;
  executedAt?: string;
}

export const useOperationalExcellence = () => {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [healingActions, setHealingActions] = useState<SelfHealingAction[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { logSingle } = useEnhancedLogging();
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced Analytics Collection
  const collectMetrics = useCallback(async () => {
    try {
      const startTime = Date.now();
      
      // Get provider health data
      const { data: healthData, error: healthError } = await supabase
        .from('provider_health')
        .select('*')
        .order('last_checked', { ascending: false })
        .limit(100);

      if (healthError) throw healthError;

      // Get quota data
      const { data: quotaData, error: quotaError } = await supabase
        .from('provider_quotas')
        .select('*');

      if (quotaError) throw quotaError;

      // Calculate metrics
      const totalProviders = healthData?.length || 0;
      const healthyProviders = healthData?.filter(p => p.status === 'healthy').length || 0;
      const availability = totalProviders > 0 ? (healthyProviders / totalProviders) * 100 : 0;
      
      const avgResponseTime = healthData?.reduce((sum, p) => sum + (p.response_time_ms || 0), 0) / totalProviders || 0;
      const errorRate = ((totalProviders - healthyProviders) / totalProviders) * 100 || 0;

      // Circuit breaker states
      const { data: configData } = await supabase
        .from('provider_configs')
        .select('id, circuit_breaker_state');
      
      const circuitBreakerStates = configData?.reduce((acc, config) => ({
        ...acc,
        [config.id]: config.circuit_breaker_state
      }), {}) || {};

      // Quota usage
      const quotaUsage = quotaData?.reduce((acc, quota) => ({
        ...acc,
        [quota.provider_id]: quota.percentage_used
      }), {}) || {};

      const collectedMetrics: OperationalMetrics = {
        responseTime: avgResponseTime,
        errorRate,
        throughput: 0, // Would be calculated from API call frequency
        availability,
        circuitBreakerStates,
        quotaUsage
      };

      setMetrics(collectedMetrics);

      // Log performance metric
      await logSingle({
        service_name: 'operational_excellence',
        log_level: 'info',
        message: 'Metrics collected successfully',
        duration_ms: Date.now() - startTime,
        metadata: collectedMetrics,
        request_id: correlationId.getCurrentId()
      });

      return collectedMetrics;
    } catch (error) {
      console.error('Metrics collection failed:', error);
      await logSingle({
        service_name: 'operational_excellence',
        log_level: 'error',
        message: 'Metrics collection failed',
        error_details: { message: (error as Error).message },
        request_id: correlationId.getCurrentId()
      });
      return null;
    }
  }, [logSingle]);

  // Self-Healing Detection and Execution
  const detectAndHeal = useCallback(async (currentMetrics: OperationalMetrics) => {
    const actions: SelfHealingAction[] = [];

    // Circuit breaker logic
    Object.entries(currentMetrics.circuitBreakerStates).forEach(([provider, state]) => {
      if (state === 'open' && currentMetrics.errorRate > 50) {
        actions.push({
          id: `circuit_${provider}_${Date.now()}`,
          type: 'circuit_break',
          provider,
          severity: 'high',
          description: `Circuit breaker opened for ${provider} due to high error rate`,
          automated: true,
          executed: false
        });
      }
    });

    // Quota management
    Object.entries(currentMetrics.quotaUsage).forEach(([provider, usage]) => {
      if (usage > 90) {
        actions.push({
          id: `quota_${provider}_${Date.now()}`,
          type: 'failover',
          provider,
          severity: usage > 95 ? 'critical' : 'high',
          description: `Quota usage ${usage}% for ${provider}, initiating failover`,
          automated: true,
          executed: false
        });
      }
    });

    // Availability monitoring
    if (currentMetrics.availability < 80) {
      actions.push({
        id: `availability_${Date.now()}`,
        type: 'restart',
        provider: 'system',
        severity: 'critical',
        description: `System availability ${currentMetrics.availability}%, requires intervention`,
        automated: false,
        executed: false
      });
    }

    setHealingActions(prev => [...prev, ...actions]);

    // Execute automated actions
    for (const action of actions.filter(a => a.automated)) {
      await executeHealingAction(action);
    }

    return actions;
  }, []);

  // Execute healing action
  const executeHealingAction = useCallback(async (action: SelfHealingAction) => {
    try {
      const { error } = await supabase.functions.invoke('self-healing-executor', {
        body: { action },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      setHealingActions(prev => 
        prev.map(a => 
          a.id === action.id 
            ? { ...a, executed: true, executedAt: new Date().toISOString() }
            : a
        )
      );

      await logSingle({
        service_name: 'self_healing',
        log_level: 'info',
        message: `Healing action executed: ${action.type}`,
        metadata: action,
        request_id: correlationId.getCurrentId()
      });

    } catch (error) {
      console.error('Healing action failed:', error);
      await logSingle({
        service_name: 'self_healing',
        log_level: 'error',
        message: `Healing action failed: ${action.type}`,
        error_details: { message: (error as Error).message, action },
        request_id: correlationId.getCurrentId()
      });
    }
  }, [logSingle]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) return;

    setIsMonitoring(true);
    
    const monitor = async () => {
      const metrics = await collectMetrics();
      if (metrics) {
        await detectAndHeal(metrics);
      }
    };

    // Initial collection
    monitor();

    // Set up interval for continuous monitoring
    monitoringIntervalRef.current = setInterval(monitor, 30000); // Every 30 seconds
  }, [collectMetrics, detectAndHeal]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  // Advanced correlation tracking
  const trackCorrelation = useCallback(async (
    requestType: string,
    requestData: any,
    userId?: string
  ) => {
    const corrId = correlationId.generateId();
    
    try {
      const { error } = await supabase
        .from('correlation_tracking')
        .insert({
          correlation_id: corrId,
          request_type: requestType,
          status: 'in_progress',
          request_data: requestData,
          user_id: userId
        });

      if (error) throw error;

      return corrId;
    } catch (error) {
      console.error('Correlation tracking failed:', error);
      return corrId;
    }
  }, []);

  // Complete correlation tracking
  const completeCorrelation = useCallback(async (
    corrId: string,
    status: 'completed' | 'failed',
    responseData?: any,
    duration?: number
  ) => {
    try {
      const { error } = await supabase
        .from('correlation_tracking')
        .update({
          status,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          response_data: responseData
        })
        .eq('correlation_id', corrId);

      if (error) throw error;
    } catch (error) {
      console.error('Correlation completion failed:', error);
    }
  }, []);

  return {
    metrics,
    healingActions,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    collectMetrics,
    executeHealingAction,
    trackCorrelation,
    completeCorrelation
  };
};