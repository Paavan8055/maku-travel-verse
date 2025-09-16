import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';

export interface LogEntry {
  service_name: string;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
  request_id?: string;
  user_id?: string;
  duration_ms?: number;
  status_code?: number;
  error_details?: Record<string, any>;
}

export const useEnhancedLogging = () => {
  const logBatch = useCallback(async (logs: LogEntry[]) => {
    try {
      const { error } = await supabase.functions.invoke('enhanced-logging', {
        body: { logs },
        headers: {
          'X-Correlation-ID': correlationId.getCurrentId()
        }
      });

      if (error) {
        console.error('Enhanced logging failed:', error);
      }
    } catch (err) {
      console.error('Enhanced logging error:', err);
    }
  }, []);

  const logSingle = useCallback(async (log: LogEntry) => {
    await logBatch([log]);
  }, [logBatch]);

  const logApiCall = useCallback(async (
    serviceName: string,
    operation: string,
    startTime: number,
    success: boolean,
    statusCode?: number,
    error?: any,
    metadata?: Record<string, any>
  ) => {
    const duration = Date.now() - startTime;
    
    await logSingle({
      service_name: serviceName,
      log_level: success ? 'info' : 'error',
      message: `${operation} ${success ? 'completed' : 'failed'}`,
      duration_ms: duration,
      status_code: statusCode,
      error_details: error ? { message: error.message, stack: error.stack } : undefined,
      metadata,
      request_id: correlationId.getCurrentId()
    });
  }, [logSingle]);

  const logPerformance = useCallback(async (
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ) => {
    await logSingle({
      service_name: 'frontend_performance',
      log_level: 'info',
      message: `Performance metric: ${operation}`,
      duration_ms: duration,
      metadata,
      request_id: correlationId.getCurrentId()
    });
  }, [logSingle]);

  const logSecurityEvent = useCallback(async (
    eventType: string,
    message: string,
    severity: 'info' | 'warn' | 'error' = 'warn',
    metadata?: Record<string, any>
  ) => {
    await logSingle({
      service_name: 'security',
      log_level: severity,
      message: `Security event: ${eventType} - ${message}`,
      metadata,
      request_id: correlationId.getCurrentId()
    });
  }, [logSingle]);

  return {
    logBatch,
    logSingle,
    logApiCall,
    logPerformance,
    logSecurityEvent
  };
};