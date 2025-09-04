import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/simpleLogger.ts";

interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

interface RecoveryPlan {
  planId: string;
  status: 'initializing' | 'running' | 'completed' | 'failed';
  steps: RecoveryStep[];
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  summary?: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    recoveredProviders: string[];
    failedProviders: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action = 'execute' } = await req.json().catch(() => ({}));
    
    if (action === 'status') {
      return await getRecoveryStatus(supabase);
    }

    logger.info('[SYSTEM-RECOVERY] Starting comprehensive system recovery');

    const recoveryPlan: RecoveryPlan = {
      planId: `recovery-${Date.now()}`,
      status: 'initializing',
      startTime: new Date(),
      steps: [
        {
          id: 'credential-test',
          name: 'Provider Credential Testing',
          description: 'Test all provider credentials and identify authentication issues',
          status: 'pending'
        },
        {
          id: 'health-recovery',
          name: 'Provider Health Recovery',
          description: 'Reset provider health statuses and circuit breakers',
          status: 'pending'
        },
        {
          id: 'config-update',
          name: 'Configuration Update',
          description: 'Update provider configurations and priorities',
          status: 'pending'
        },
        {
          id: 'rotation-test',
          name: 'Provider Rotation Test',
          description: 'Test end-to-end provider rotation functionality',
          status: 'pending'
        },
        {
          id: 'system-validation',
          name: 'System Validation',
          description: 'Validate all systems are functioning correctly',
          status: 'pending'
        }
      ]
    };

    recoveryPlan.status = 'running';

    // Step 1: Provider Credential Testing
    await executeStep(recoveryPlan, 'credential-test', async () => {
      logger.info('[SYSTEM-RECOVERY] Testing provider credentials');
      const response = await supabase.functions.invoke('provider-credential-test');
      
      if (response.error) {
        throw new Error(`Credential test failed: ${response.error.message}`);
      }
      
      return response.data;
    });

    // Step 2: Health Recovery
    await executeStep(recoveryPlan, 'health-recovery', async () => {
      logger.info('[SYSTEM-RECOVERY] Executing health recovery');
      const response = await supabase.functions.invoke('emergency-provider-fix', {
        body: { action: 'force_reset_health' }
      });
      
      if (response.error) {
        throw new Error(`Health recovery failed: ${response.error.message}`);
      }
      
      return response.data;
    });

    // Step 3: Configuration Update
    await executeStep(recoveryPlan, 'config-update', async () => {
      logger.info('[SYSTEM-RECOVERY] Updating provider configurations');
      const response = await supabase.functions.invoke('update-provider-configs');
      
      if (response.error) {
        throw new Error(`Config update failed: ${response.error.message}`);
      }
      
      return response.data;
    });

    // Step 4: Provider Rotation Test
    await executeStep(recoveryPlan, 'rotation-test', async () => {
      logger.info('[SYSTEM-RECOVERY] Testing provider rotation');
      const response = await supabase.functions.invoke('test-provider-rotation');
      
      if (response.error) {
        throw new Error(`Rotation test failed: ${response.error.message}`);
      }
      
      return response.data;
    });

    // Step 5: System Validation
    await executeStep(recoveryPlan, 'system-validation', async () => {
      logger.info('[SYSTEM-RECOVERY] Validating system health');
      const response = await supabase.functions.invoke('enhanced-provider-health');
      
      if (response.error) {
        throw new Error(`System validation failed: ${response.error.message}`);
      }
      
      return response.data;
    });

    // Complete recovery plan
    recoveryPlan.status = 'completed';
    recoveryPlan.endTime = new Date();
    recoveryPlan.totalDuration = recoveryPlan.endTime.getTime() - recoveryPlan.startTime.getTime();
    
    // Generate summary
    const completedSteps = recoveryPlan.steps.filter(s => s.status === 'completed');
    const failedSteps = recoveryPlan.steps.filter(s => s.status === 'failed');
    
    recoveryPlan.summary = {
      totalSteps: recoveryPlan.steps.length,
      completedSteps: completedSteps.length,
      failedSteps: failedSteps.length,
      recoveredProviders: extractRecoveredProviders(recoveryPlan.steps),
      failedProviders: extractFailedProviders(recoveryPlan.steps)
    };

    // Store recovery plan results
    await storeRecoveryResults(supabase, recoveryPlan);

    logger.info('[SYSTEM-RECOVERY] Recovery plan completed', {
      planId: recoveryPlan.planId,
      duration: recoveryPlan.totalDuration,
      summary: recoveryPlan.summary
    });

    return new Response(JSON.stringify({
      success: true,
      recoveryPlan,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[SYSTEM-RECOVERY] Recovery failed', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function executeStep(
  recoveryPlan: RecoveryPlan, 
  stepId: string, 
  operation: () => Promise<any>
): Promise<void> {
  const step = recoveryPlan.steps.find(s => s.id === stepId);
  if (!step) return;

  step.status = 'running';
  step.startTime = new Date();
  
  try {
    logger.info(`[SYSTEM-RECOVERY] Executing step: ${step.name}`);
    step.result = await operation();
    step.status = 'completed';
  } catch (error) {
    logger.error(`[SYSTEM-RECOVERY] Step failed: ${step.name}`, error);
    step.status = 'failed';
    step.error = error.message;
  }
  
  step.endTime = new Date();
  step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);
}

async function getRecoveryStatus(supabase: any): Promise<Response> {
  try {
    // Get latest recovery results from system_logs
    const { data: logs } = await supabase
      .from('system_logs')
      .select('*')
      .eq('service_name', 'system-recovery-orchestrator')
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(JSON.stringify({
      success: true,
      latestRecovery: logs?.[0] || null,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function storeRecoveryResults(supabase: any, recoveryPlan: RecoveryPlan): Promise<void> {
  try {
    await supabase
      .from('system_logs')
      .insert({
        correlation_id: recoveryPlan.planId,
        service_name: 'system-recovery-orchestrator',
        log_level: 'info',
        message: 'System recovery completed',
        metadata: {
          recoveryPlan,
          completedAt: recoveryPlan.endTime,
          duration: recoveryPlan.totalDuration,
          summary: recoveryPlan.summary
        }
      });
  } catch (error) {
    logger.error('[SYSTEM-RECOVERY] Failed to store recovery results', error);
  }
}

function extractRecoveredProviders(steps: RecoveryStep[]): string[] {
  const recovered: string[] = [];
  
  steps.forEach(step => {
    if (step.status === 'completed' && step.result?.recoveredProviders) {
      recovered.push(...step.result.recoveredProviders);
    }
  });
  
  return [...new Set(recovered)];
}

function extractFailedProviders(steps: RecoveryStep[]): string[] {
  const failed: string[] = [];
  
  steps.forEach(step => {
    if (step.result?.failedProviders) {
      failed.push(...step.result.failedProviders);
    }
  });
  
  return [...new Set(failed)];
}