import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  steps: RecoveryStep[];
  estimatedDuration: number; // in seconds
  riskLevel: 'low' | 'medium' | 'high';
}

interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  action: string;
  rollbackAction?: string;
  timeout: number;
  critical: boolean;
}

interface RecoveryResult {
  success: boolean;
  message: string;
  details?: any;
  executedSteps?: string[];
  rollbackPerformed?: boolean;
}

export const useEnhancedRecovery = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Define comprehensive recovery plans
  const recoveryPlans: Record<string, RecoveryPlan> = {
    payment_system_recovery: {
      id: 'payment_system_recovery',
      name: 'Payment System Recovery',
      description: 'Complete payment system diagnostics and recovery',
      estimatedDuration: 120,
      riskLevel: 'medium',
      steps: [
        {
          id: 'check_stripe_status',
          name: 'Check Stripe API Status',
          description: 'Verify Stripe API connectivity and webhook endpoints',
          action: 'test_stripe_connection',
          timeout: 30,
          critical: true
        },
        {
          id: 'clear_payment_cache',
          name: 'Clear Payment Cache',
          description: 'Clear stuck payment sessions and failed transactions',
          action: 'clear_payment_cache',
          rollbackAction: 'restore_payment_cache',
          timeout: 15,
          critical: false
        },
        {
          id: 'restart_payment_service',
          name: 'Restart Payment Service',
          description: 'Gracefully restart payment processing service',
          action: 'restart_payment_service',
          timeout: 45,
          critical: true
        },
        {
          id: 'validate_payment_flow',
          name: 'Validate Payment Flow',
          description: 'Test complete payment flow with test transactions',
          action: 'test_payment_flow',
          timeout: 30,
          critical: true
        }
      ]
    },
    
    provider_health_optimization: {
      id: 'provider_health_optimization',
      name: 'Provider Health Optimization',
      description: 'Optimize provider connections and performance',
      estimatedDuration: 90,
      riskLevel: 'low',
      steps: [
        {
          id: 'provider_health_check',
          name: 'Provider Health Assessment',
          description: 'Check all provider endpoints and response times',
          action: 'comprehensive_provider_check',
          timeout: 45,
          critical: false
        },
        {
          id: 'reset_slow_connections',
          name: 'Reset Slow Connections',
          description: 'Reset connections for providers with high response times',
          action: 'reset_degraded_providers',
          rollbackAction: 'restore_provider_state',
          timeout: 30,
          critical: false
        },
        {
          id: 'optimize_provider_rotation',
          name: 'Optimize Provider Rotation',
          description: 'Update provider priority based on performance',
          action: 'optimize_provider_rotation',
          timeout: 15,
          critical: false
        }
      ]
    },
    
    booking_optimization: {
      id: 'booking_optimization',
      name: 'Booking System Optimization',
      description: 'Optimize booking conversion and reduce failures',
      estimatedDuration: 150,
      riskLevel: 'medium',
      steps: [
        {
          id: 'analyze_booking_funnel',
          name: 'Analyze Booking Funnel',
          description: 'Identify bottlenecks in the booking process',
          action: 'analyze_booking_metrics',
          timeout: 30,
          critical: false
        },
        {
          id: 'clear_stuck_bookings',
          name: 'Clear Stuck Bookings',
          description: 'Resolve bookings stuck in pending state',
          action: 'fix_stuck_bookings',
          timeout: 60,
          critical: true
        },
        {
          id: 'optimize_inventory_cache',
          name: 'Optimize Inventory Cache',
          description: 'Refresh and optimize inventory caching',
          action: 'refresh_inventory_cache',
          rollbackAction: 'restore_inventory_cache',
          timeout: 45,
          critical: false
        },
        {
          id: 'test_booking_flow',
          name: 'Test Booking Flow',
          description: 'End-to-end booking flow validation',
          action: 'test_booking_flow',
          timeout: 15,
          critical: true
        }
      ]
    },
    
    performance_optimization: {
      id: 'performance_optimization',
      name: 'Performance Optimization',
      description: 'System-wide performance improvements',
      estimatedDuration: 180,
      riskLevel: 'high',
      steps: [
        {
          id: 'database_optimization',
          name: 'Database Optimization',
          description: 'Optimize database queries and connections',
          action: 'optimize_database',
          timeout: 90,
          critical: false
        },
        {
          id: 'cache_optimization',
          name: 'Cache Optimization',
          description: 'Clear and rebuild system caches',
          action: 'optimize_caches',
          rollbackAction: 'restore_caches',
          timeout: 45,
          critical: false
        },
        {
          id: 'load_balancing',
          name: 'Load Balancing Optimization',
          description: 'Optimize request distribution and rate limiting',
          action: 'optimize_load_balancing',
          timeout: 30,
          critical: false
        },
        {
          id: 'system_health_check',
          name: 'System Health Validation',
          description: 'Comprehensive system health validation',
          action: 'comprehensive_health_check',
          timeout: 15,
          critical: true
        }
      ]
    }
  };

  const executeEnhancedRecovery = useCallback(async (
    planId: string, 
    issueContext?: any
  ): Promise<RecoveryResult> => {
    const plan = recoveryPlans[planId];
    if (!plan) {
      throw new Error(`Recovery plan "${planId}" not found`);
    }

    setIsExecuting(true);
    setExecutionLog([]);
    
    const executedSteps: string[] = [];
    let rollbackPerformed = false;

    try {
      setExecutionLog(prev => [...prev, `Starting recovery plan: ${plan.name}`]);
      setExecutionLog(prev => [...prev, `Estimated duration: ${plan.estimatedDuration} seconds`]);
      setExecutionLog(prev => [...prev, `Risk level: ${plan.riskLevel}`]);

      // Execute each step in sequence
      for (const step of plan.steps) {
        setCurrentStep(step.name);
        setExecutionLog(prev => [...prev, `Executing: ${step.name}`]);

        try {
          // Call the appropriate recovery edge function
          const { data, error } = await supabase.functions.invoke('enhanced-recovery-executor', {
            body: { 
              action: step.action,
              stepId: step.id,
              planId: plan.id,
              timeout: step.timeout,
              context: issueContext
            }
          });

          if (error) {
            throw new Error(`Step failed: ${error.message}`);
          }

          executedSteps.push(step.id);
          setExecutionLog(prev => [...prev, `✅ Completed: ${step.name}`]);

          // Add delay between steps for safety
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (stepError) {
          setExecutionLog(prev => [...prev, `❌ Failed: ${step.name} - ${(stepError as Error).message}`]);
          
          if (step.critical) {
            // Critical step failed, attempt rollback
            setExecutionLog(prev => [...prev, `Critical step failed, initiating rollback...`]);
            rollbackPerformed = await performRollback(executedSteps, plan);
            throw new Error(`Critical step "${step.name}" failed: ${(stepError as Error).message}`);
          } else {
            // Non-critical step failed, continue with warning
            setExecutionLog(prev => [...prev, `⚠️ Non-critical step failed, continuing...`]);
            continue;
          }
        }
      }

      setExecutionLog(prev => [...prev, `✅ Recovery plan completed successfully`]);
      toast.success(`Recovery completed: ${plan.name}`);

      return {
        success: true,
        message: `Recovery plan "${plan.name}" executed successfully`,
        details: { plan, executedSteps },
        executedSteps,
        rollbackPerformed
      };

    } catch (error) {
      setExecutionLog(prev => [...prev, `❌ Recovery failed: ${(error as Error).message}`]);
      toast.error(`Recovery failed: ${(error as Error).message}`);

      return {
        success: false,
        message: (error as Error).message,
        details: { plan, executedSteps },
        executedSteps,
        rollbackPerformed
      };
    } finally {
      setIsExecuting(false);
      setCurrentStep(null);
    }
  }, []);

  const performRollback = async (executedSteps: string[], plan: RecoveryPlan): Promise<boolean> => {
    try {
      setExecutionLog(prev => [...prev, `Performing rollback for ${executedSteps.length} steps...`]);
      
      // Rollback in reverse order
      for (const stepId of executedSteps.reverse()) {
        const step = plan.steps.find(s => s.id === stepId);
        if (step?.rollbackAction) {
          setExecutionLog(prev => [...prev, `Rolling back: ${step.name}`]);
          
          await supabase.functions.invoke('enhanced-recovery-executor', {
            body: { 
              action: step.rollbackAction,
              stepId: step.id,
              planId: plan.id,
              isRollback: true
            }
          });
          
          setExecutionLog(prev => [...prev, `↩️ Rolled back: ${step.name}`]);
        }
      }
      
      setExecutionLog(prev => [...prev, `✅ Rollback completed`]);
      return true;
    } catch (rollbackError) {
      setExecutionLog(prev => [...prev, `❌ Rollback failed: ${(rollbackError as Error).message}`]);
      return false;
    }
  };

  const getAvailablePlans = useCallback(() => {
    return Object.values(recoveryPlans);
  }, []);

  const getPlanDetails = useCallback((planId: string) => {
    return recoveryPlans[planId];
  }, []);

  return {
    executeEnhancedRecovery,
    getAvailablePlans,
    getPlanDetails,
    isExecuting,
    currentStep,
    executionLog
  };
};