import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";

interface RecoveryAction {
  action: string;
  provider: string;
  status: 'success' | 'failed' | 'skipped';
  details: string;
  timestamp: string;
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
    logger.info('[API-RECOVERY] Starting provider API recovery');
    
    const recoveryActions: RecoveryAction[] = [];
    
    // Check and recover Amadeus quota issues
    try {
      const { data: amadeusQuota } = await supabase
        .from('provider_quotas')
        .select('*')
        .eq('provider_id', 'amadeus')
        .single();

      if (amadeusQuota?.status === 'exceeded') {
        logger.info('[API-RECOVERY] Attempting Amadeus quota recovery');
        
        // Reset quota status if enough time has passed (daily reset)
        const lastReset = new Date(amadeusQuota.last_reset || 0);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceReset >= 24) {
          await supabase
            .from('provider_quotas')
            .update({
              current_usage: 0,
              percentage_used: 0,
              status: 'healthy',
              last_reset: now.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('provider_id', 'amadeus');
            
          recoveryActions.push({
            action: 'quota_reset',
            provider: 'amadeus',
            status: 'success',
            details: 'Daily quota reset applied',
            timestamp: now.toISOString()
          });
          
          // Re-enable provider configs
          await supabase
            .from('provider_configs')
            .update({ enabled: true })
            .in('id', ['amadeus', 'amadeus-flight', 'amadeus-hotel']);
        } else {
          recoveryActions.push({
            action: 'quota_reset',
            provider: 'amadeus',
            status: 'skipped',
            details: `Too early for reset (${Math.round(hoursSinceReset)}h since last reset)`,
            timestamp: now.toISOString()
          });
        }
      }
    } catch (error) {
      recoveryActions.push({
        action: 'quota_recovery',
        provider: 'amadeus',
        status: 'failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Recovery circuit breaker states for all providers
    try {
      const { data: providers } = await supabase
        .from('provider_configs')
        .select('id, circuit_breaker')
        .neq('circuit_breaker->state', 'closed');

      for (const provider of providers || []) {
        const circuitBreaker = provider.circuit_breaker || {};
        const lastFailure = new Date(circuitBreaker.lastFailure || 0);
        const timeSinceFailure = Date.now() - lastFailure.getTime();
        
        // Reset circuit breakers after 5 minutes
        if (timeSinceFailure > 5 * 60 * 1000) {
          await supabase
            .from('provider_configs')
            .update({
              circuit_breaker: {
                ...circuitBreaker,
                state: 'closed',
                failureCount: 0,
                lastFailure: null
              }
            })
            .eq('id', provider.id);
            
          recoveryActions.push({
            action: 'circuit_breaker_reset',
            provider: provider.id,
            status: 'success',
            details: 'Circuit breaker reset after timeout',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      logger.error('[API-RECOVERY] Circuit breaker recovery failed', error);
    }

    // Update provider health scores
    try {
      await supabase.functions.invoke('provider-quota-monitor');
      recoveryActions.push({
        action: 'health_refresh',
        provider: 'all',
        status: 'success',
        details: 'Provider health monitoring refreshed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      recoveryActions.push({
        action: 'health_refresh',
        provider: 'all',
        status: 'failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }

    const successCount = recoveryActions.filter(a => a.status === 'success').length;
    
    logger.info('[API-RECOVERY] Recovery completed', {
      totalActions: recoveryActions.length,
      successful: successCount,
      failed: recoveryActions.filter(a => a.status === 'failed').length
    });

    return new Response(JSON.stringify({
      success: true,
      actions: recoveryActions,
      summary: {
        total: recoveryActions.length,
        successful: successCount,
        failed: recoveryActions.filter(a => a.status === 'failed').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[API-RECOVERY] Recovery process failed', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      actions: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});