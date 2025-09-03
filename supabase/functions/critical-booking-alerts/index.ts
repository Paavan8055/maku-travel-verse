import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertTrigger {
  type: string;
  condition: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  automated_action?: string;
}

const ALERT_TRIGGERS: AlertTrigger[] = [
  {
    type: 'stuck_bookings',
    condition: { threshold: 5, time_window: 600 }, // 5 bookings stuck for >10 minutes
    severity: 'critical',
    description: 'Multiple bookings stuck in pending state',
    automated_action: 'auto_expire_bookings'
  },
  {
    type: 'payment_failures',
    condition: { threshold: 3, time_window: 300 }, // 3 payment failures in 5 minutes
    severity: 'high',
    description: 'High payment failure rate detected',
    automated_action: 'switch_payment_provider'
  },
  {
    type: 'provider_degradation',
    condition: { failed_requests: 5, consecutive: true },
    severity: 'high',
    description: 'Provider showing consecutive failures',
    automated_action: 'activate_provider_rotation'
  },
  {
    type: 'database_performance',
    condition: { avg_response_time: 2000, sample_size: 10 },
    severity: 'medium',
    description: 'Database response time degradation',
    automated_action: 'optimize_queries'
  },
  {
    type: 'quota_exceeded',
    condition: { usage_percentage: 95 },
    severity: 'critical',
    description: 'Provider quota nearly exceeded',
    automated_action: 'rotate_to_backup_provider'
  }
];

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

    const { action, alert_type, booking_id, provider_id } = await req.json();

    console.log(`[CRITICAL-ALERTS] Processing ${action} for ${alert_type || 'all triggers'}`);

    switch (action) {
      case 'check_triggers':
        return await checkAllTriggers(supabase);
      
      case 'manual_alert':
        return await createManualAlert(supabase, alert_type, booking_id, provider_id);
      
      case 'resolve_alert':
        return await resolveAlert(supabase, booking_id);
      
      case 'get_active_alerts':
        return await getActiveAlerts(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action specified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[CRITICAL-ALERTS] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Critical alerts processing failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkAllTriggers(supabase: any): Promise<Response> {
  const alertsTriggered = [];
  const currentTime = new Date();
  
  try {
    console.log('[CRITICAL-ALERTS] Checking all alert triggers');

    for (const trigger of ALERT_TRIGGERS) {
      const alertTriggered = await evaluateTrigger(supabase, trigger, currentTime);
      if (alertTriggered) {
        alertsTriggered.push(alertTriggered);
        
        // Create alert in database
        await createAlert(supabase, alertTriggered);
        
        // Execute automated action if configured
        if (trigger.automated_action) {
          await executeAutomatedAction(supabase, trigger.automated_action, alertTriggered);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_triggered: alertsTriggered.length,
        alerts: alertsTriggered,
        checked_at: currentTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TRIGGER-CHECK] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Trigger check failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function evaluateTrigger(supabase: any, trigger: AlertTrigger, currentTime: Date): Promise<any> {
  try {
    switch (trigger.type) {
      case 'stuck_bookings':
        const cutoffTime = new Date(currentTime.getTime() - trigger.condition.time_window * 1000);
        const { data: stuckBookings } = await supabase
          .from('bookings')
          .select('id, booking_reference, created_at')
          .eq('status', 'pending')
          .lt('created_at', cutoffTime.toISOString());

        if (stuckBookings && stuckBookings.length >= trigger.condition.threshold) {
          return {
            type: trigger.type,
            severity: trigger.severity,
            message: `${stuckBookings.length} bookings stuck in pending state for over ${trigger.condition.time_window / 60} minutes`,
            affected_bookings: stuckBookings.map(b => b.id),
            triggered_at: currentTime.toISOString(),
            requires_manual_action: true
          };
        }
        break;

      case 'payment_failures':
        const failureWindow = new Date(currentTime.getTime() - trigger.condition.time_window * 1000);
        const { data: failedPayments } = await supabase
          .from('payments')
          .select('id, booking_id, status, created_at')
          .eq('status', 'failed')
          .gte('created_at', failureWindow.toISOString());

        if (failedPayments && failedPayments.length >= trigger.condition.threshold) {
          return {
            type: trigger.type,
            severity: trigger.severity,
            message: `${failedPayments.length} payment failures in the last ${trigger.condition.time_window / 60} minutes`,
            affected_payments: failedPayments.map(p => p.id),
            triggered_at: currentTime.toISOString(),
            requires_manual_action: false
          };
        }
        break;

      case 'provider_degradation':
        const { data: providerHealth } = await supabase
          .from('provider_health')
          .select('*')
          .eq('status', 'critical')
          .order('last_checked', { ascending: false });

        if (providerHealth && providerHealth.length > 0) {
          const degradedProvider = providerHealth[0];
          return {
            type: trigger.type,
            severity: trigger.severity,
            message: `Provider ${degradedProvider.provider_id} showing critical status`,
            provider_id: degradedProvider.provider_id,
            triggered_at: currentTime.toISOString(),
            requires_manual_action: false
          };
        }
        break;

      case 'quota_exceeded':
        const { data: quotaStatus } = await supabase
          .from('provider_quotas')
          .select('*')
          .gte('percentage_used', trigger.condition.usage_percentage);

        if (quotaStatus && quotaStatus.length > 0) {
          return {
            type: trigger.type,
            severity: trigger.severity,
            message: `Provider quota at ${quotaStatus[0].percentage_used}% usage`,
            provider_id: quotaStatus[0].provider_id,
            triggered_at: currentTime.toISOString(),
            requires_manual_action: false
          };
        }
        break;
    }

    return null;
  } catch (error) {
    console.error(`[TRIGGER-EVAL] Error evaluating ${trigger.type}:`, error);
    return null;
  }
}

async function createAlert(supabase: any, alertData: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('critical_alerts')
      .insert({
        alert_type: alertData.type,
        severity: alertData.severity,
        message: alertData.message,
        booking_id: alertData.affected_bookings?.[0] || null,
        requires_manual_action: alertData.requires_manual_action,
        resolved: false,
        created_at: alertData.triggered_at
      });

    if (error) {
      console.error('[CREATE-ALERT] Error:', error);
    } else {
      console.log(`[CREATE-ALERT] Created ${alertData.severity} alert for ${alertData.type}`);
    }
  } catch (error) {
    console.error('[CREATE-ALERT] Exception:', error);
  }
}

async function executeAutomatedAction(supabase: any, action: string, alertData: any): Promise<void> {
  try {
    console.log(`[AUTO-ACTION] Executing ${action} for alert ${alertData.type}`);

    switch (action) {
      case 'auto_expire_bookings':
        if (alertData.affected_bookings) {
          const { error } = await supabase
            .from('bookings')
            .update({ 
              status: 'expired', 
              updated_at: new Date().toISOString() 
            })
            .in('id', alertData.affected_bookings);

          if (!error) {
            console.log(`[AUTO-ACTION] Expired ${alertData.affected_bookings.length} stuck bookings`);
          }
        }
        break;

      case 'activate_provider_rotation':
        if (alertData.provider_id) {
          await supabase.functions.invoke('provider-rotation', {
            body: { 
              action: 'rotate_provider', 
              failed_provider: alertData.provider_id,
              reason: 'automated_alert_response'
            }
          });
        }
        break;

      case 'rotate_to_backup_provider':
        if (alertData.provider_id) {
          await supabase.functions.invoke('provider-rotation', {
            body: { 
              action: 'quota_rotation', 
              provider_id: alertData.provider_id 
            }
          });
        }
        break;
    }
  } catch (error) {
    console.error(`[AUTO-ACTION] Error executing ${action}:`, error);
  }
}

async function createManualAlert(supabase: any, alertType: string, bookingId?: string, providerId?: string): Promise<Response> {
  try {
    const { error } = await supabase
      .from('critical_alerts')
      .insert({
        alert_type: alertType || 'manual',
        severity: 'high',
        message: `Manual alert created by admin`,
        booking_id: bookingId || null,
        requires_manual_action: true,
        resolved: false
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Manual alert created successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MANUAL-ALERT] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create manual alert', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function resolveAlert(supabase: any, alertId: string): Promise<Response> {
  try {
    const { error } = await supabase
      .from('critical_alerts')
      .update({ 
        resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: 'system' // Would be actual user ID in production
      })
      .eq('id', alertId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alert resolved successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RESOLVE-ALERT] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to resolve alert', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getActiveAlerts(supabase: any): Promise<Response> {
  try {
    const { data: alerts, error } = await supabase
      .from('critical_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        active_alerts: alerts || [],
        count: alerts?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GET-ALERTS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch active alerts', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}