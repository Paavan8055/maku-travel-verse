import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryAction {
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  automated: boolean;
}

interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastChecked: string;
  errorCount: number;
  responseTime?: number;
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

    const { action, mode = 'diagnostic' } = await req.json();

    console.log(`[EMERGENCY-RECOVERY] ${action} initiated in ${mode} mode`);

    switch (action) {
      case 'system_health_check':
        return await performSystemHealthCheck(supabase);
      
      case 'emergency_recovery':
        return await performEmergencyRecovery(supabase, mode);
      
      case 'provider_circuit_reset':
        return await resetProviderCircuits(supabase);
      
      case 'database_repair':
        return await repairDatabaseInconsistencies(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action specified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[EMERGENCY-RECOVERY] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Emergency recovery failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performSystemHealthCheck(supabase: any): Promise<Response> {
  const healthChecks: SystemHealthCheck[] = [];
  const startTime = Date.now();

  try {
    // Check database connectivity
    const { error: dbError } = await supabase.from('bookings').select('id').limit(1);
    healthChecks.push({
      component: 'database',
      status: dbError ? 'critical' : 'healthy',
      lastChecked: new Date().toISOString(),
      errorCount: dbError ? 1 : 0,
      responseTime: Date.now() - startTime
    });

    // Check provider health
    const { data: providerHealth, error: providerError } = await supabase
      .from('provider_health')
      .select('*')
      .order('last_checked', { ascending: false })
      .limit(10);

    if (!providerError && providerHealth) {
      const criticalProviders = providerHealth.filter(p => p.status === 'critical').length;
      healthChecks.push({
        component: 'providers',
        status: criticalProviders > 1 ? 'critical' : criticalProviders > 0 ? 'degraded' : 'healthy',
        lastChecked: new Date().toISOString(),
        errorCount: criticalProviders
      });
    }

    // Check booking integrity
    const { data: stuckBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, created_at')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (!bookingError) {
      healthChecks.push({
        component: 'booking_system',
        status: stuckBookings && stuckBookings.length > 5 ? 'critical' : 
                stuckBookings && stuckBookings.length > 0 ? 'degraded' : 'healthy',
        lastChecked: new Date().toISOString(),
        errorCount: stuckBookings ? stuckBookings.length : 0
      });
    }

    // Check critical alerts
    const { data: criticalAlerts, error: alertError } = await supabase
      .from('critical_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (!alertError) {
      const highSeverityAlerts = criticalAlerts?.filter(a => a.severity === 'critical').length || 0;
      healthChecks.push({
        component: 'alert_system',
        status: highSeverityAlerts > 0 ? 'critical' : 'healthy',
        lastChecked: new Date().toISOString(),
        errorCount: highSeverityAlerts
      });
    }

    const overallStatus = healthChecks.some(h => h.status === 'critical') ? 'critical' :
                         healthChecks.some(h => h.status === 'degraded') ? 'degraded' : 'healthy';

    return new Response(
      JSON.stringify({
        success: true,
        overall_status: overallStatus,
        health_checks: healthChecks,
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HEALTH-CHECK] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Health check failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function performEmergencyRecovery(supabase: any, mode: string): Promise<Response> {
  const recoveryActions: RecoveryAction[] = [];
  const startTime = Date.now();
  
  try {
    console.log(`[EMERGENCY-RECOVERY] Starting ${mode} recovery`);

    // 1. Reset stuck bookings
    const { data: stuckBookings } = await supabase
      .from('bookings')
      .select('id, booking_reference')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (stuckBookings && stuckBookings.length > 0) {
      recoveryActions.push({
        action: `Reset ${stuckBookings.length} stuck bookings`,
        priority: 'critical',
        description: 'Automatically expire bookings stuck in pending state > 10 minutes',
        automated: true
      });

      if (mode === 'execute') {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .in('id', stuckBookings.map(b => b.id));

        if (error) {
          console.error('[RECOVERY] Failed to reset stuck bookings:', error);
        }
      }
    }

    // 2. Reset provider circuit breakers
    const { data: unhealthyProviders } = await supabase
      .from('provider_health')
      .select('provider_id, status')
      .in('status', ['critical', 'degraded']);

    if (unhealthyProviders && unhealthyProviders.length > 0) {
      recoveryActions.push({
        action: `Reset ${unhealthyProviders.length} provider circuit breakers`,
        priority: 'high',
        description: 'Reset circuit breakers for degraded/critical providers',
        automated: true
      });

      if (mode === 'execute') {
        for (const provider of unhealthyProviders) {
          await supabase.functions.invoke('provider-rotation', {
            body: { action: 'reset_circuit_breaker', provider_id: provider.provider_id }
          });
        }
      }
    }

    // 3. Clear expired cache entries
    recoveryActions.push({
      action: 'Clear expired cache entries',
      priority: 'medium',
      description: 'Remove expired search results and offers from cache tables',
      automated: true
    });

    if (mode === 'execute') {
      await Promise.all([
        supabase.from('hotel_offers_cache').delete().lt('ttl_expires_at', new Date().toISOString()),
        supabase.from('flight_offers_cache').delete().lt('ttl_expires_at', new Date().toISOString()),
        supabase.from('activities_offers_cache').delete().lt('ttl_expires_at', new Date().toISOString())
      ]);
    }

    // 4. Cleanup old audit data
    recoveryActions.push({
      action: 'Cleanup old audit data',
      priority: 'low',
      description: 'Remove audit logs older than 90 days',
      automated: true
    });

    if (mode === 'execute') {
      await supabase.rpc('cleanup_old_audit_data');
    }

    // Log recovery completion
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'emergency-system-recovery',
        log_level: 'info',
        message: `Emergency recovery completed in ${mode} mode`,
        metadata: {
          actions_performed: recoveryActions.length,
          execution_time_ms: Date.now() - startTime,
          mode
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        recovery_actions: recoveryActions,
        actions_performed: mode === 'execute' ? recoveryActions.length : 0,
        execution_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EMERGENCY-RECOVERY] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Emergency recovery failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function resetProviderCircuits(supabase: any): Promise<Response> {
  try {
    const { data: providers } = await supabase
      .from('provider_configs')
      .select('id, name, type');

    const resetResults = [];

    for (const provider of providers || []) {
      try {
        const { data, error } = await supabase.functions.invoke('provider-rotation', {
          body: { 
            action: 'reset_circuit_breaker', 
            provider_id: provider.id,
            force: true 
          }
        });

        resetResults.push({
          provider_id: provider.id,
          provider_name: provider.name,
          status: error ? 'failed' : 'reset',
          error: error?.message
        });
      } catch (err) {
        resetResults.push({
          provider_id: provider.id,
          provider_name: provider.name,
          status: 'failed',
          error: err.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reset_results: resetResults,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CIRCUIT-RESET] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Circuit reset failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function repairDatabaseInconsistencies(supabase: any): Promise<Response> {
  const repairActions = [];
  
  try {
    // 1. Fix bookings without references
    const { data: bookingsWithoutRef } = await supabase
      .from('bookings')
      .select('id')
      .is('booking_reference', null);

    if (bookingsWithoutRef && bookingsWithoutRef.length > 0) {
      repairActions.push(`Generate references for ${bookingsWithoutRef.length} bookings`);
      
      for (const booking of bookingsWithoutRef) {
        const ref = 'BK' + Math.random().toString(36).substr(2, 8).toUpperCase();
        await supabase
          .from('bookings')
          .update({ booking_reference: ref })
          .eq('id', booking.id);
      }
    }

    // 2. Clean up orphaned booking items
    const { error: cleanupError } = await supabase.rpc('cleanup_guest_data');
    if (!cleanupError) {
      repairActions.push('Cleaned up orphaned booking items and payments');
    }

    // 3. Reset provider quotas
    const { error: quotaError } = await supabase
      .from('provider_quotas')
      .update({ 
        current_usage: 0, 
        percentage_used: 0, 
        updated_at: new Date().toISOString() 
      })
      .eq('status', 'exceeded');

    if (!quotaError) {
      repairActions.push('Reset exceeded provider quotas');
    }

    return new Response(
      JSON.stringify({
        success: true,
        repairs_performed: repairActions,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DATABASE-REPAIR] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Database repair failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}