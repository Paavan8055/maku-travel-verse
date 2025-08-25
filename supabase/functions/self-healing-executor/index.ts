import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json() as { action: SelfHealingAction };
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    console.log(`[SELF-HEALING] [${correlationId}] Executing action: ${action.type} for ${action.provider}`);

    let executionResult = { success: false, message: '', details: {} };

    switch (action.type) {
      case 'failover':
        executionResult = await executeFailover(supabase, action);
        break;
      
      case 'circuit_break':
        executionResult = await executeCircuitBreak(supabase, action);
        break;
      
      case 'quota_reset':
        executionResult = await executeQuotaReset(supabase, action);
        break;
      
      case 'restart':
        executionResult = await executeRestart(supabase, action);
        break;
      
      default:
        executionResult = { 
          success: false, 
          message: `Unknown action type: ${action.type}`,
          details: {} 
        };
    }

    // Log the execution result
    await supabase.from('system_logs').insert({
      correlation_id: correlationId,
      service_name: 'self_healing_executor',
      log_level: executionResult.success ? 'info' : 'error',
      message: `Self-healing action ${action.type}: ${executionResult.message}`,
      metadata: {
        action,
        result: executionResult,
        automated: action.automated
      }
    });

    // Create critical alert if action failed
    if (!executionResult.success && action.severity === 'critical') {
      await supabase.from('critical_alerts').insert({
        alert_type: 'self_healing_failure',
        severity: 'critical',
        message: `Critical self-healing action failed: ${action.type} for ${action.provider}`,
        booking_id: null,
        requires_manual_action: true
      });
    }

    console.log(`[SELF-HEALING] [${correlationId}] Result: ${executionResult.success ? 'SUCCESS' : 'FAILED'} - ${executionResult.message}`);

    return new Response(
      JSON.stringify({
        success: executionResult.success,
        message: executionResult.message,
        details: executionResult.details,
        correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: executionResult.success ? 200 : 400
      }
    );

  } catch (error) {
    console.error('[SELF-HEALING] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Self-healing execution failed',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function executeFailover(supabase: any, action: SelfHealingAction) {
  try {
    console.log(`[FAILOVER] Initiating failover for provider: ${action.provider}`);

    // Get current provider priority
    const { data: currentConfig, error: fetchError } = await supabase
      .from('provider_configs')
      .select('priority, enabled')
      .eq('id', action.provider)
      .single();

    if (fetchError) throw fetchError;

    // Reduce priority to move to backup providers
    const newPriority = currentConfig.priority + 1000; // Move to end of queue

    const { error: updateError } = await supabase
      .from('provider_configs')
      .update({ 
        priority: newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', action.provider);

    if (updateError) throw updateError;

    // Record the provider health change
    await supabase.from('provider_health').insert({
      provider: action.provider,
      status: 'degraded',
      error_message: 'Failover initiated due to quota/performance issues',
      last_checked: new Date().toISOString(),
      metadata: { action_type: 'failover', original_priority: currentConfig.priority }
    });

    return {
      success: true,
      message: `Failover completed for ${action.provider}`,
      details: { 
        originalPriority: currentConfig.priority, 
        newPriority,
        provider: action.provider
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failover failed for ${action.provider}: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function executeCircuitBreak(supabase: any, action: SelfHealingAction) {
  try {
    console.log(`[CIRCUIT-BREAK] Opening circuit breaker for provider: ${action.provider}`);

    const { error } = await supabase
      .from('provider_configs')
      .update({ 
        circuit_breaker_state: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', action.provider);

    if (error) throw error;

    // Schedule circuit breaker to half-open after 5 minutes
    setTimeout(async () => {
      await supabase
        .from('provider_configs')
        .update({ 
          circuit_breaker_state: 'half-open',
          updated_at: new Date().toISOString()
        })
        .eq('id', action.provider);
      
      console.log(`[CIRCUIT-BREAK] Circuit breaker for ${action.provider} moved to half-open`);
    }, 5 * 60 * 1000); // 5 minutes

    return {
      success: true,
      message: `Circuit breaker opened for ${action.provider}`,
      details: { provider: action.provider, state: 'open' }
    };

  } catch (error) {
    return {
      success: false,
      message: `Circuit break failed for ${action.provider}: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function executeQuotaReset(supabase: any, action: SelfHealingAction) {
  try {
    console.log(`[QUOTA-RESET] Resetting quota tracking for provider: ${action.provider}`);

    // Reset quota tracking (this would typically involve provider-specific logic)
    const { error } = await supabase
      .from('provider_quotas')
      .update({ 
        quota_used: 0,
        last_reset: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('provider_id', action.provider);

    if (error) throw error;

    return {
      success: true,
      message: `Quota reset completed for ${action.provider}`,
      details: { provider: action.provider, resetAt: new Date().toISOString() }
    };

  } catch (error) {
    return {
      success: false,
      message: `Quota reset failed for ${action.provider}: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function executeRestart(supabase: any, action: SelfHealingAction) {
  try {
    console.log(`[RESTART] Initiating system restart for: ${action.provider}`);

    // For system-wide restart, this would involve coordinated shutdown/startup
    // For now, we'll record the request and mark for manual intervention
    await supabase.from('critical_alerts').insert({
      alert_type: 'restart_required',
      severity: 'critical',
      message: `System restart requested for ${action.provider}`,
      requires_manual_action: true
    });

    // Reset all circuit breakers for fresh start
    await supabase
      .from('provider_configs')
      .update({ 
        circuit_breaker_state: 'closed',
        updated_at: new Date().toISOString()
      });

    return {
      success: true,
      message: `Restart procedure initiated for ${action.provider}`,
      details: { 
        provider: action.provider, 
        manualInterventionRequired: true,
        alertCreated: true
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Restart failed for ${action.provider}: ${error.message}`,
      details: { error: error.message }
    };
  }
}