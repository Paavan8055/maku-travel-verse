import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceMetric {
  component: string;
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  page?: string;
  action?: string;
}

interface SystemMetric {
  type: 'api_latency' | 'database_query' | 'external_api' | 'cache_hit' | 'error_rate';
  value: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer');

    // Handle different types of metrics
    if (body.type === 'performance') {
      const metric: PerformanceMetric = {
        ...body,
        userAgent,
        page: referer,
        timestamp: body.timestamp || Date.now()
      };

      // Store performance metrics
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          component: metric.component,
          render_time: metric.renderTime,
          memory_usage: metric.memoryUsage,
          user_agent: metric.userAgent,
          page: metric.page,
          session_id: metric.sessionId,
          user_id: metric.userId,
          metadata: {
            action: metric.action,
            timestamp: metric.timestamp
          }
        });

      if (error) {
        console.error('Failed to store performance metric:', error);
      }

      // Alert on critical performance issues
      if (metric.renderTime > 1000 || (metric.memoryUsage && metric.memoryUsage > 100)) {
        console.warn('Critical performance issue detected:', metric);
        
        // Could send alert to monitoring service
        await fetch(Deno.env.get('WEBHOOK_URL') || '', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'performance_alert',
            metric,
            severity: 'high'
          })
        }).catch(() => {});
      }

    } else if (body.type === 'system') {
      const metric: SystemMetric = {
        ...body,
        timestamp: body.timestamp || Date.now()
      };

      // Store system metrics
      const { error } = await supabase
        .from('system_metrics')
        .insert({
          metric_type: metric.type,
          value: metric.value,
          metadata: metric.metadata || {},
          created_at: new Date(metric.timestamp).toISOString()
        });

      if (error) {
        console.error('Failed to store system metric:', error);
      }

      // Alert on system issues
      if (metric.type === 'error_rate' && metric.value > 0.1) { // 10% error rate
        console.error('High error rate detected:', metric);
      }

    } else if (body.type === 'user_interaction') {
      // Track user interactions for UX analysis
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          action: body.action,
          component: body.component,
          duration: body.duration,
          user_agent: userAgent,
          page: referer,
          session_id: body.sessionId,
          metadata: body.metadata || {}
        });

      if (error) {
        console.error('Failed to store user interaction:', error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Performance monitor error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});