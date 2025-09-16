import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FailurePattern {
  testSuite: string;
  consecutiveFailures: number;
  lastFailureTime: Date;
  recoveryAttempts: number;
}

interface RecoveryStrategy {
  retryDelayMs: number;
  maxRetries: number;
  escalateAfter: number;
}

export const useSmartFailureRecovery = () => {
  const [failurePatterns, setFailurePatterns] = useState<Map<string, FailurePattern>>(new Map());
  const [isRecovering, setIsRecovering] = useState(false);
  const { toast } = useToast();

  const calculateRetryDelay = (attempts: number): number => {
    // Exponential backoff: 30s, 1m, 2m, 4m, 8m, max 15m
    const baseDelay = 30000; // 30 seconds
    const maxDelay = 900000; // 15 minutes
    return Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
  };

  const getRecoveryStrategy = (consecutiveFailures: number): RecoveryStrategy => {
    if (consecutiveFailures <= 2) {
      return { retryDelayMs: 30000, maxRetries: 3, escalateAfter: 3 };
    } else if (consecutiveFailures <= 5) {
      return { retryDelayMs: 120000, maxRetries: 2, escalateAfter: 5 };
    } else {
      return { retryDelayMs: 300000, maxRetries: 1, escalateAfter: 7 };
    }
  };

  const recordFailure = useCallback(async (testSuite: string, error: any) => {
    const now = new Date();
    const pattern = failurePatterns.get(testSuite) || {
      testSuite,
      consecutiveFailures: 0,
      lastFailureTime: now,
      recoveryAttempts: 0,
    };

    const updatedPattern = {
      ...pattern,
      consecutiveFailures: pattern.consecutiveFailures + 1,
      lastFailureTime: now,
    };

    setFailurePatterns(new Map(failurePatterns.set(testSuite, updatedPattern)));

    // Log failure to system
    try {
      await supabase.functions.invoke('system-logging', {
        body: {
          correlation_id: crypto.randomUUID(),
          service_name: 'testing-framework',
          log_level: 'error',
          message: `Test suite ${testSuite} failed`,
          metadata: {
            consecutive_failures: updatedPattern.consecutiveFailures,
            error_details: error,
            recovery_attempts: updatedPattern.recoveryAttempts,
          },
        },
      });
    } catch (logError) {
      console.error('Failed to log failure:', logError);
    }

    // Check if escalation is needed
    const strategy = getRecoveryStrategy(updatedPattern.consecutiveFailures);
    if (updatedPattern.consecutiveFailures >= strategy.escalateAfter) {
      await escalateFailure(testSuite, updatedPattern, error);
    }

    return updatedPattern;
  }, [failurePatterns]);

  const recordSuccess = useCallback((testSuite: string) => {
    if (failurePatterns.has(testSuite)) {
      const pattern = failurePatterns.get(testSuite)!;
      if (pattern.consecutiveFailures > 0) {
        toast({
          title: "Recovery successful",
          description: `${testSuite} is now working properly`,
        });

        // Log recovery success
        supabase.functions.invoke('system-logging', {
          body: {
            correlation_id: crypto.randomUUID(),
            service_name: 'testing-framework',
            log_level: 'info',
            message: `Test suite ${testSuite} recovered`,
            metadata: {
              previous_failures: pattern.consecutiveFailures,
              recovery_attempts: pattern.recoveryAttempts,
            },
          },
        });
      }
      
      // Reset failure pattern
      setFailurePatterns(new Map(failurePatterns.set(testSuite, {
        ...pattern,
        consecutiveFailures: 0,
        recoveryAttempts: 0,
      })));
    }
  }, [failurePatterns, toast]);

  const escalateFailure = async (testSuite: string, pattern: FailurePattern, error: any) => {
    try {
      // Create critical alert
      await supabase.from('agent_alerts').insert({
        alert_type: 'critical_test_failure',
        severity: 'high',
        title: `Critical Test Failure: ${testSuite}`,
        message: `Test suite has failed ${pattern.consecutiveFailures} consecutive times`,
        agent_id: 'testing-framework',
        alert_data: {
          test_suite: testSuite,
          consecutive_failures: pattern.consecutiveFailures,
          last_error: error,
          first_failure_time: new Date(Date.now() - (pattern.consecutiveFailures * 30000)).toISOString(),
        },
      });

      // Notify admins - notifications table requires user_id, so we'll skip this for now
      // and rely on agent_alerts for admin notifications

      toast({
        title: "Critical failure escalated",
        description: `Administrators have been notified about ${testSuite}`,
        variant: "destructive",
      });
    } catch (escalationError) {
      console.error('Failed to escalate failure:', escalationError);
    }
  };

  const attemptRecovery = useCallback(async (
    testSuite: string,
    retryFunction: () => Promise<any>
  ): Promise<{ success: boolean; result?: any; shouldRetry: boolean }> => {
    const pattern = failurePatterns.get(testSuite);
    if (!pattern) {
      return { success: false, shouldRetry: false };
    }

    const strategy = getRecoveryStrategy(pattern.consecutiveFailures);
    
    if (pattern.recoveryAttempts >= strategy.maxRetries) {
      return { success: false, shouldRetry: false };
    }

    setIsRecovering(true);
    
    try {
      // Wait for exponential backoff delay
      const delay = calculateRetryDelay(pattern.recoveryAttempts);
      await new Promise(resolve => setTimeout(resolve, delay));

      const result = await retryFunction();
      
      // Success - record it
      recordSuccess(testSuite);
      setIsRecovering(false);
      
      return { success: true, result, shouldRetry: false };
    } catch (error) {
      // Update recovery attempts
      const updatedPattern = {
        ...pattern,
        recoveryAttempts: pattern.recoveryAttempts + 1,
      };
      setFailurePatterns(new Map(failurePatterns.set(testSuite, updatedPattern)));
      
      setIsRecovering(false);
      
      const shouldRetry = updatedPattern.recoveryAttempts < strategy.maxRetries;
      
      if (!shouldRetry) {
        toast({
          title: "Recovery failed",
          description: `Unable to recover ${testSuite} after ${strategy.maxRetries} attempts`,
          variant: "destructive",
        });
      }
      
      return { success: false, shouldRetry };
    }
  }, [failurePatterns, recordSuccess, toast]);

  return {
    failurePatterns: Array.from(failurePatterns.values()),
    isRecovering,
    recordFailure,
    recordSuccess,
    attemptRecovery,
  };
};