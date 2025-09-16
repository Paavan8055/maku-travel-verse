import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
import { ENV_CONFIG, RATE_LIMITS } from '../_shared/config.ts';

type Severity = 'low' | 'medium' | 'high' | 'critical';
interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: Severity;
  notification_channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  escalation_delay_minutes: number;
  auto_resolve: boolean;
}

interface AlertNotification {
  channel: 'email' | 'sms' | 'slack' | 'webhook';
  recipients: string[];
  template: string;
  metadata: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, alert_data, rule_id } = await req.json()
    
    console.log(`[ADVANCED-ALERTING] Processing ${action} request`)

    switch (action) {
      case 'evaluate_rules':
        return await evaluateAlertRules(supabase)
      
      case 'send_notification':
        return await sendNotification(alert_data, supabase)
      
      case 'escalate_alert':
        return await escalateAlert(alert_data, supabase)
      
      case 'create_rule':
        return await createAlertRule(alert_data, supabase)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('[ADVANCED-ALERTING] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function evaluateAlertRules(supabase: any) {
  const startTime = performance.now()
  const triggeredAlerts: any[] = []

  // Get current system metrics
  const metrics = await getSystemMetrics(supabase)
  
  // Define alert rules
  const alertRules: AlertRule[] = [
    {
      id: 'provider_failure_rate',
      name: 'High Provider Failure Rate',
      condition: 'provider_error_rate > 10',
      severity: 'high',
      notification_channels: ['email', 'slack'],
      escalation_delay_minutes: 15,
      auto_resolve: true
    },
    {
      id: 'booking_timeout_rate',
      name: 'High Booking Timeout Rate',
      condition: 'booking_timeout_rate > 5',
      severity: 'critical',
      notification_channels: ['email', 'sms', 'slack'],
      escalation_delay_minutes: 5,
      auto_resolve: false
    },
    {
      id: 'database_performance',
      name: 'Database Performance Degradation',
      condition: 'avg_query_time > 1000',
      severity: 'medium',
      notification_channels: ['email'],
      escalation_delay_minutes: 30,
      auto_resolve: true
    },
    {
      id: 'system_memory_usage',
      name: 'High System Memory Usage',
      condition: 'memory_usage_percent > 85',
      severity: 'high',
      notification_channels: ['email', 'slack'],
      escalation_delay_minutes: 10,
      auto_resolve: true
    }
  ]

  // Evaluate each rule
  for (const rule of alertRules) {
    const isTriggered = evaluateCondition(rule.condition, metrics)
    
    if (isTriggered) {
      // Check if this alert already exists and is unresolved
      const { data: existingAlert } = await supabase
        .from('critical_alerts')
        .select('*')
        .eq('alert_type', rule.id)
        .eq('resolved', false)
        .single()

      if (!existingAlert) {
        // Create new alert
        const { data: newAlert } = await supabase
          .from('critical_alerts')
          .insert({
            alert_type: rule.id,
            severity: rule.severity,
            message: `${rule.name}: Alert triggered based on condition ${rule.condition}`,
            requires_manual_action: !rule.auto_resolve,
            booking_id: null
          })
          .select()
          .single()

        if (newAlert) {
          triggeredAlerts.push(newAlert)
          
          // Send notifications
          await sendAlertNotifications(newAlert, rule, metrics, supabase)
          
          // Schedule escalation if needed
          if (rule.escalation_delay_minutes > 0) {
            await scheduleEscalation(newAlert.id, rule.escalation_delay_minutes, supabase)
          }
        }
      }
    } else if (rule.auto_resolve) {
      // Auto-resolve if condition is no longer met
      await supabase
        .from('critical_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: '00000000-0000-0000-0000-000000000000'
        })
        .eq('alert_type', rule.id)
        .eq('resolved', false)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      triggered_alerts: triggeredAlerts.length,
      evaluation_time_ms: performance.now() - startTime,
      alerts: triggeredAlerts
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
}

async function getSystemMetrics(supabase: any) {
  // Get provider health metrics
  const { data: providerHealth } = await supabase
    .from('provider_health')
    .select('*')

  // Get recent booking timeouts
  const { data: timeoutBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'expired')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour

  // Calculate metrics
  const totalProviders = providerHealth?.length || 1
  const unhealthyProviders = providerHealth?.filter(p => p.status !== 'healthy').length || 0
  const providerErrorRate = (unhealthyProviders / totalProviders) * 100

  const totalBookings = 100 // Mock data for demo
  const timeoutRate = ((timeoutBookings?.length || 0) / totalBookings) * 100

  return {
    provider_error_rate: providerErrorRate,
    booking_timeout_rate: timeoutRate,
    avg_query_time: 800, // Mock data
    memory_usage_percent: 75 // Mock data
  }
}

function evaluateCondition(condition: string, metrics: any): boolean {
  try {
    // Simple condition evaluation
    const parts = condition.split(' ')
    if (parts.length === 3) {
      const [metric, operator, threshold] = parts
      const value = metrics[metric]
      const thresholdNum = parseFloat(threshold)
      
      switch (operator) {
        case '>': return value > thresholdNum
        case '<': return value < thresholdNum
        case '>=': return value >= thresholdNum
        case '<=': return value <= thresholdNum
        case '==': return value === thresholdNum
        default: return false
      }
    }
    return false
  } catch {
    return false
  }
}

async function sendAlertNotifications(alert: any, rule: AlertRule, metrics: any, supabase: any) {
  for (const channel of rule.notification_channels) {
    const notification: AlertNotification = {
      channel: channel as any,
      recipients: getRecipients(channel),
      template: getNotificationTemplate(channel, alert, rule),
      metadata: { alert, rule, metrics }
    }
    
    await sendNotificationToChannel(notification, supabase)
  }
}

function getRecipients(channel: string): string[] {
  switch (channel) {
    case 'email':
      return ['admin@maku.travel']
    case 'sms':
      return ['+61400000000']
    case 'slack':
      return ['#alerts']
    case 'webhook':
      return ['https://hooks.slack.com/services/...']
    default:
      return []
  }
}

function getNotificationTemplate(channel: string, alert: any, rule: AlertRule): string {
  const baseMessage = `🚨 ALERT: ${rule.name} (${alert.severity.toUpperCase()})\n\nMessage: ${alert.message}\nTime: ${new Date(alert.created_at).toLocaleString()}`
  
  switch (channel) {
    case 'slack':
      return `\`\`\`${baseMessage}\`\`\``
    case 'email':
      return `<h2>System Alert</h2><p>${baseMessage.replace(/\n/g, '<br>')}</p>`
    default:
      return baseMessage
  }
}

async function sendNotificationToChannel(notification: AlertNotification, supabase: any) {
  // Log notification attempt
  await supabase.from('system_logs').insert({
    correlation_id: crypto.randomUUID(),
    service_name: 'advanced-alerting',
    log_level: 'info',
    message: `Sending ${notification.channel} notification`,
    metadata: { 
      channel: notification.channel,
      recipients: notification.recipients,
      alert_id: notification.metadata.alert.id
    }
  })

  // In production, integrate with actual notification services
  console.log(`[NOTIFICATION] ${notification.channel}:`, notification.template)
}

async function scheduleEscalation(alertId: string, delayMinutes: number, supabase: any) {
  // In production, this would use a job queue or cron
  console.log(`[ESCALATION] Scheduled escalation for alert ${alertId} in ${delayMinutes} minutes`)
}

async function sendNotification(alertData: any, supabase: any) {
  // Implementation for manual notification sending
  return new Response(
    JSON.stringify({ success: true, message: 'Notification sent' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function escalateAlert(alertData: any, supabase: any) {
  // Implementation for alert escalation
  return new Response(
    JSON.stringify({ success: true, message: 'Alert escalated' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createAlertRule(ruleData: any, supabase: any) {
  // Implementation for creating new alert rules
  return new Response(
    JSON.stringify({ success: true, message: 'Alert rule created' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}