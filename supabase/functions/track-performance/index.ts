import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";


interface PerformanceMetric {
  component: string;
  renderTime: number;
  memoryUsage: number;
  rerenderCount: number;
  timestamp: string;
  user_id?: string;
  session_id?: string;
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

    const metricData: PerformanceMetric = await req.json();

    // Validate metric data
    if (!metricData.component || typeof metricData.renderTime !== 'number') {
      throw new Error('Invalid metric data');
    }

    // Store performance metric in system logs
    const logEntry = {
      level: 'info',
      message: `Performance metric for ${metricData.component}`,
      metadata: {
        type: 'performance_metric',
        component: metricData.component,
        render_time: metricData.renderTime,
        memory_usage: metricData.memoryUsage,
        rerender_count: metricData.rerenderCount,
        timestamp: metricData.timestamp,
        user_id: metricData.user_id,
        session_id: metricData.session_id
      }
    };

    const { error } = await supabase
      .from('system_logs')
      .insert([logEntry]);

    if (error) throw error;

    // Check for performance alerts
    const alerts = await checkPerformanceAlerts(metricData);
    
    if (alerts.length > 0) {
      await createPerformanceAlerts(supabase, alerts, metricData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        metric_stored: true,
        alerts_created: alerts.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-performance:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function checkPerformanceAlerts(metric: PerformanceMetric): Promise<string[]> {
  const alerts: string[] = [];

  // Check render time thresholds
  if (metric.renderTime > 1000) {
    alerts.push('critical_render_time');
  } else if (metric.renderTime > 500) {
    alerts.push('slow_render_time');
  }

  // Check memory usage thresholds
  if (metric.memoryUsage > 80) {
    alerts.push('high_memory_usage');
  }

  // Check excessive re-renders
  if (metric.rerenderCount > 10) {
    alerts.push('excessive_rerenders');
  }

  return alerts;
}

async function createPerformanceAlerts(
  supabase: any, 
  alerts: string[], 
  metric: PerformanceMetric
): Promise<void> {
  const alertPromises = alerts.map(alertType => {
    const severity = getSeverity(alertType);
    const message = getAlertMessage(alertType, metric);

    return supabase
      .from('critical_alerts')
      .insert([{
        alert_type: `performance_${alertType}`,
        severity,
        message,
        requires_manual_action: severity === 'critical'
      }]);
  });

  try {
    await Promise.all(alertPromises);
  } catch (error) {
    console.error('Failed to create performance alerts:', error);
  }
}

function getSeverity(alertType: string): string {
  switch (alertType) {
    case 'critical_render_time':
    case 'high_memory_usage':
      return 'critical';
    case 'slow_render_time':
    case 'excessive_rerenders':
      return 'medium';
    default:
      return 'low';
  }
}

function getAlertMessage(alertType: string, metric: PerformanceMetric): string {
  switch (alertType) {
    case 'critical_render_time':
      return `Critical render time detected in ${metric.component}: ${metric.renderTime}ms (threshold: 1000ms)`;
    case 'slow_render_time':
      return `Slow render time detected in ${metric.component}: ${metric.renderTime}ms (threshold: 500ms)`;
    case 'high_memory_usage':
      return `High memory usage detected in ${metric.component}: ${metric.memoryUsage}% (threshold: 80%)`;
    case 'excessive_rerenders':
      return `Excessive re-renders detected in ${metric.component}: ${metric.rerenderCount} renders`;
    default:
      return `Performance issue detected in ${metric.component}`;
  }
}