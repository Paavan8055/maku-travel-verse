import React, { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedLogging } from '@/hooks/useEnhancedLogging';

interface TestResult {
  service: string;
  success: boolean;
  provider?: string;
  resultCount: number;
  responseTime: number;
  error?: string;
  timestamp: Date;
  details?: any;
}

interface HealthMonitoringProps {
  testResults: TestResult[];
  onHealthUpdate?: () => void;
}

export const HealthMonitoringIntegration = ({ testResults, onHealthUpdate }: HealthMonitoringProps) => {
  const { toast } = useToast();
  const { logSingle, logApiCall } = useEnhancedLogging();

  const updateProviderHealth = useCallback(async (results: TestResult[]) => {
    const startTime = Date.now();
    
    try {
      // Update provider_health table with comprehensive test results
      for (const result of results) {
        const healthData = {
          provider: result.provider || `${result.service.toLowerCase()}_provider`,
          status: result.success ? 'healthy' : 'degraded',
          response_time_ms: result.responseTime,
          error_count: result.success ? 0 : 1,
          last_checked: new Date().toISOString(),
          metadata: {
            test_type: 'comprehensive_diagnostics',
            result_count: result.resultCount,
            error_details: result.error,
            test_timestamp: result.timestamp.toISOString(),
            provider_name: result.provider || `${result.service} Provider`,
            circuit_breaker_state: result.success ? 'closed' : 'open',
            credentials_valid: result.success,
            service_endpoints: { [result.service]: result.success },
            quota_status: result.success ? 'healthy' : 'warning'
          }
        };

        const { error: healthError } = await supabase
          .from('provider_health')
          .upsert(healthData, {
            onConflict: 'provider',
            ignoreDuplicates: false
          });

        if (healthError) {
          console.error('Failed to update provider health:', healthError);
        }

        // Log the health update
        await logSingle({
          service_name: 'provider_health_monitor',
          log_level: result.success ? 'info' : 'warn',
          message: `Provider health updated: ${result.service}`,
          metadata: {
            provider: result.provider || result.service,
            status: result.success ? 'healthy' : 'degraded',
            response_time: result.responseTime,
            result_count: result.resultCount
          }
        });

        // Generate critical alert if provider is failing
        if (!result.success) {
          await generateCriticalAlert(result);
        }
      }

      await logApiCall(
        'provider_health_integration',
        'bulk_health_update',
        startTime,
        true,
        200,
        undefined,
        { updated_providers: results.length }
      );

      onHealthUpdate?.();

    } catch (error) {
      console.error('Health monitoring integration failed:', error);
      
      await logApiCall(
        'provider_health_integration',
        'bulk_health_update',
        startTime,
        false,
        500,
        error,
        { attempted_providers: results.length }
      );

      toast({
        title: "Health Update Failed",
        description: "Failed to update provider health status",
        variant: "destructive"
      });
    }
  }, [logSingle, logApiCall, onHealthUpdate, toast]);

  const generateCriticalAlert = useCallback(async (result: TestResult) => {
    try {
      const alertData = {
        alert_type: 'provider_failure',
        severity: 'high',
        title: `${result.service} Provider Failure`,
        message: `Provider ${result.provider || result.service} failed with error: ${result.error || 'Unknown error'}`,
        alert_data: {
          service: result.service,
          provider: result.provider,
          error: result.error,
          response_time: result.responseTime,
          timestamp: result.timestamp.toISOString()
        },
        is_resolved: false
      };

      const { error } = await supabase
        .from('critical_alerts')
        .insert(alertData);

      if (error) {
        console.error('Failed to create critical alert:', error);
      } else {
        // Log alert creation
        await logSingle({
          service_name: 'critical_alert_system',
          log_level: 'error',
          message: `Critical alert generated for ${result.service} provider failure`,
          metadata: alertData
        });
      }
    } catch (error) {
      console.error('Failed to generate critical alert:', error);
    }
  }, [logSingle]);

  const triggerHealthMonitorSync = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      // Invoke comprehensive-health-monitor to sync with our updates
      const { data, error } = await supabase.functions.invoke('comprehensive-health-monitor', {
        body: {
          source: 'unified_provider_diagnostics',
          trigger_comprehensive_check: true,
          include_provider_rotation: true
        }
      });

      if (error) throw error;

      await logApiCall(
        'comprehensive_health_monitor',
        'sync_trigger',
        startTime,
        true,
        200,
        undefined,
        { sync_result: data }
      );

      toast({
        title: "Health Monitor Synced",
        description: "Comprehensive health monitor updated with latest test results",
        variant: "default"
      });

    } catch (error) {
      await logApiCall(
        'comprehensive_health_monitor',
        'sync_trigger',
        startTime,
        false,
        500,
        error
      );

      console.error('Failed to sync with health monitor:', error);
    }
  }, [logApiCall, toast]);

  // Auto-update when test results change
  React.useEffect(() => {
    if (testResults.length > 0) {
      updateProviderHealth(testResults);
    }
  }, [testResults, updateProviderHealth]);

  return null; // This is a logic-only component
};

export default HealthMonitoringIntegration;