import React, { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface TestSummary {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageResponseTime: number;
  totalResultCount: number;
}

interface SystemLoggingProps {
  testResults: TestResult[];
  testSummary: TestSummary;
  sessionId: string;
}

export const SystemLoggingIntegration = ({ testResults, testSummary, sessionId }: SystemLoggingProps) => {
  const { logSingle, logPerformance } = useEnhancedLogging();

  const logTestSession = useCallback(async () => {
    const correlationId = `test_session_${sessionId}_${Date.now()}`;
    
    try {
      // Log session summary
      await logSingle({
        service_name: 'unified_provider_diagnostics',
        log_level: 'info',
        message: 'Comprehensive test session completed',
        metadata: {
          session_id: sessionId,
          correlation_id: correlationId,
          test_summary: testSummary,
          test_count: testResults.length,
          success_rate: (testSummary.successfulTests / testSummary.totalTests) * 100
        }
      });

      // Log individual test results with structured data
      for (const result of testResults) {
        await logSingle({
          service_name: `provider_test_${result.service.toLowerCase()}`,
          log_level: result.success ? 'info' : 'error',
          message: `Provider test ${result.success ? 'passed' : 'failed'}: ${result.service}`,
          duration_ms: result.responseTime,
          status_code: result.success ? 200 : 500,
          metadata: {
            session_id: sessionId,
            correlation_id: correlationId,
            provider: result.provider,
            service_type: result.service,
            result_count: result.resultCount,
            test_timestamp: result.timestamp.toISOString(),
            error_details: result.error ? { message: result.error } : undefined
          },
          error_details: result.error ? {
            error_type: 'provider_test_failure',
            error_message: result.error,
            service: result.service,
            provider: result.provider
          } : undefined
        });

        // Log performance metrics
        await logPerformance(
          `${result.service.toLowerCase()}_provider_test`,
          result.responseTime,
          {
            session_id: sessionId,
            provider: result.provider,
            success: result.success,
            result_count: result.resultCount
          }
        );
      }

      // Log aggregated performance metrics
      await logPerformance(
        'comprehensive_test_session',
        testSummary.averageResponseTime,
        {
          session_id: sessionId,
          total_tests: testSummary.totalTests,
          success_rate: (testSummary.successfulTests / testSummary.totalTests) * 100,
          total_results: testSummary.totalResultCount
        }
      );

      // Store structured logs in system_logs table for advanced querying
      await storeStructuredLogs(correlationId, testResults, testSummary);

    } catch (error) {
      console.error('Failed to log test session:', error);
      
      // Fallback logging
      await logSingle({
        service_name: 'unified_provider_diagnostics',
        log_level: 'error',
        message: 'Failed to log test session completely',
        metadata: {
          session_id: sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          partial_results: testResults.length
        }
      });
    }
  }, [testResults, testSummary, sessionId, logSingle, logPerformance]);

  const storeStructuredLogs = useCallback(async (correlationId: string, results: TestResult[], summary: TestSummary) => {
    try {
      const logEntry = {
        correlation_id: correlationId,
        service_name: 'unified_provider_diagnostics',
        log_level: 'info',
        level: 'info',
        message: 'Comprehensive provider diagnostic session',
        metadata: {
          session_data: {
            session_id: sessionId,
            start_time: results[0]?.timestamp.toISOString(),
            end_time: results[results.length - 1]?.timestamp.toISOString(),
            duration_ms: results.length > 0 ? 
              results[results.length - 1].timestamp.getTime() - results[0].timestamp.getTime() : 0
          },
          test_summary: {
            totalTests: summary.totalTests,
            successfulTests: summary.successfulTests,
            failedTests: summary.failedTests,
            averageResponseTime: summary.averageResponseTime,
            totalResultCount: summary.totalResultCount
          },
          provider_results: results.map(r => ({
            service: r.service,
            provider: r.provider,
            success: r.success,
            response_time: r.responseTime,
            result_count: r.resultCount,
            error: r.error
          })),
          system_health_impact: {
            critical_failures: results.filter(r => !r.success).length,
            performance_degradation: results.filter(r => r.responseTime > 5000).length,
            providers_affected: [...new Set(results.map(r => r.provider || r.service))]
          }
        },
        user_id: (await supabase.auth.getUser()).data.user?.id || null
      };

      const { error } = await supabase
        .from('system_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to store structured log:', error);
      }

    } catch (error) {
      console.error('Failed to store structured logs:', error);
    }
  }, [sessionId]);

  // Auto-log when component mounts with results
  React.useEffect(() => {
    if (testResults.length > 0) {
      logTestSession();
    }
  }, [testResults, logTestSession]);

  return null; // This is a logic-only component
};

export default SystemLoggingIntegration;