import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  thresholds: Record<string, number>;
  notificationChannels: ('email' | 'sms' | 'webhook')[];
  autoActions: string[];
}

const ALERT_CONFIGS: Record<string, AlertConfig> = {
  provider_failure: {
    type: 'provider_failure',
    severity: 'critical',
    thresholds: { consecutive_failures: 3, error_rate: 0.5 },
    notificationChannels: ['email', 'sms'],
    autoActions: ['rotate_provider', 'escalate']
  },
  high_error_rate: {
    type: 'high_error_rate',
    severity: 'high',
    thresholds: { error_rate: 0.25, time_window: 300 },
    notificationChannels: ['email'],
    autoActions: ['scale_resources']
  },
  quota_exceeded: {
    type: 'quota_exceeded',
    severity: 'medium',
    thresholds: { usage_percent: 90 },
    notificationChannels: ['email'],
    autoActions: ['notify_admin']
  },
  payment_failure: {
    type: 'payment_failure',
    severity: 'critical',
    thresholds: { failure_count: 5, time_window: 600 },
    notificationChannels: ['email', 'sms', 'webhook'],
    autoActions: ['freeze_processing', 'manual_review']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, alertType, data } = await req.json();

    switch (action) {
      case 'process_alert':
        return await processAlert(supabase, alertType, data);
      case 'get_active_alerts':
        return await getActiveAlerts(supabase);
      case 'resolve_alert':
        return await resolveAlert(supabase, data.alertId, data.userId);
      case 'configure_alert':
        return await configureAlert(supabase, data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Critical Alert System Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processAlert(supabase: any, alertType: string, data: any) {
  const config = ALERT_CONFIGS[alertType];
  if (!config) {
    throw new Error(`Unknown alert type: ${alertType}`);
  }

  // Check if alert should be triggered based on thresholds
  const shouldTrigger = await evaluateThresholds(supabase, config, data);
  
  if (!shouldTrigger) {
    return new Response(
      JSON.stringify({ triggered: false, reason: 'Thresholds not met' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create alert record
  const { data: alertData, error: alertError } = await supabase
    .from('critical_alerts')
    .insert({
      alert_type: alertType,
      severity: config.severity,
      message: generateAlertMessage(alertType, data),
      metadata: {
        config,
        triggerData: data,
        timestamp: new Date().toISOString()
      },
      requires_manual_action: config.severity === 'critical'
    })
    .select()
    .single();

  if (alertError) throw alertError;

  // Execute auto-actions
  const actionResults = await executeAutoActions(supabase, config.autoActions, alertData);

  // Send notifications
  const notificationResults = await sendNotifications(supabase, config, alertData);

  // Create correlation tracking
  await supabase.from('correlation_tracking').insert({
    correlation_id: `alert_${alertData.id}`,
    request_type: 'critical_alert',
    request_data: { alertType, config, triggerData: data },
    status: 'completed'
  });

  return new Response(
    JSON.stringify({
      triggered: true,
      alertId: alertData.id,
      severity: config.severity,
      autoActions: actionResults,
      notifications: notificationResults
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function evaluateThresholds(supabase: any, config: AlertConfig, data: any): Promise<boolean> {
  switch (config.type) {
    case 'provider_failure':
      // Check recent failure count for provider
      const { data: failures } = await supabase
        .from('api_health_logs')
        .select('*')
        .eq('provider', data.provider)
        .eq('status', 'error')
        .gte('checked_at', new Date(Date.now() - 300000).toISOString()) // 5 minutes
        .order('checked_at', { ascending: false });
      
      return (failures?.length || 0) >= config.thresholds.consecutive_failures;

    case 'high_error_rate':
      // Calculate error rate in time window
      const timeWindow = config.thresholds.time_window * 1000;
      const { data: logs } = await supabase
        .from('system_logs')
        .select('log_level')
        .gte('created_at', new Date(Date.now() - timeWindow).toISOString());
      
      const totalLogs = logs?.length || 0;
      const errorLogs = logs?.filter(log => log.log_level === 'error').length || 0;
      
      return totalLogs > 0 && (errorLogs / totalLogs) >= config.thresholds.error_rate;

    case 'quota_exceeded':
      return data.usagePercent >= config.thresholds.usage_percent;

    case 'payment_failure':
      // Check payment failures in time window
      const paymentWindow = config.thresholds.time_window * 1000;
      const { data: payments } = await supabase
        .from('payments')
        .select('status')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - paymentWindow).toISOString());
      
      return (payments?.length || 0) >= config.thresholds.failure_count;

    default:
      return false;
  }
}

function generateAlertMessage(alertType: string, data: any): string {
  switch (alertType) {
    case 'provider_failure':
      return `Provider ${data.provider} has experienced consecutive failures and may be unavailable`;
    case 'high_error_rate':
      return `System error rate has exceeded acceptable thresholds`;
    case 'quota_exceeded':
      return `Provider ${data.provider} quota usage at ${data.usagePercent}%`;
    case 'payment_failure':
      return `Multiple payment failures detected - potential payment processor issue`;
    default:
      return `Alert triggered for ${alertType}`;
  }
}

async function executeAutoActions(supabase: any, actions: string[], alertData: any): Promise<string[]> {
  const results: string[] = [];
  
  for (const action of actions) {
    try {
      switch (action) {
        case 'rotate_provider':
          await supabase.functions.invoke('provider-rotation', {
            body: { action: 'emergency_rotation', excludeProvider: alertData.metadata.triggerData.provider }
          });
          results.push('Provider rotation initiated');
          break;
          
        case 'escalate':
          await supabase.from('admin_notifications').insert({
            type: 'escalation',
            priority: 'urgent',
            message: `Critical alert requires immediate attention: ${alertData.message}`,
            alert_id: alertData.id
          });
          results.push('Alert escalated to administrators');
          break;
          
        case 'scale_resources':
          results.push('Resource scaling requested (manual intervention required)');
          break;
          
        case 'freeze_processing':
          await supabase.from('system_configuration').upsert({
            key: 'payment_processing_enabled',
            value: false,
            updated_at: new Date().toISOString()
          });
          results.push('Payment processing temporarily frozen');
          break;
          
        case 'manual_review':
          await supabase.from('manual_review_queue').insert({
            type: 'critical_alert',
            reference_id: alertData.id,
            priority: 'urgent',
            assigned_to: null
          });
          results.push('Added to manual review queue');
          break;
          
        default:
          results.push(`Unknown action: ${action}`);
      }
    } catch (error) {
      results.push(`Action failed: ${action} - ${error.message}`);
    }
  }
  
  return results;
}

async function sendNotifications(supabase: any, config: AlertConfig, alertData: any): Promise<string[]> {
  const results: string[] = [];
  
  // For now, log notifications (in production, integrate with email/SMS services)
  for (const channel of config.notificationChannels) {
    try {
      await supabase.from('notification_queue').insert({
        channel,
        recipient_type: 'admin',
        subject: `Critical Alert: ${alertData.alert_type}`,
        content: alertData.message,
        metadata: {
          alertId: alertData.id,
          severity: alertData.severity
        }
      });
      results.push(`${channel} notification queued`);
    } catch (error) {
      results.push(`${channel} notification failed: ${error.message}`);
    }
  }
  
  return results;
}

async function getActiveAlerts(supabase: any) {
  const { data, error } = await supabase
    .from('critical_alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ alerts: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function resolveAlert(supabase: any, alertId: string, userId: string) {
  const { data, error } = await supabase
    .from('critical_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, alert: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function configureAlert(supabase: any, configData: any) {
  // Store alert configuration in database
  const { data, error } = await supabase
    .from('alert_configurations')
    .upsert(configData)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, configuration: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}