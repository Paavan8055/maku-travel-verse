import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

/**
 * Analytics and Monitoring Edge Function
 * 
 * Handles event tracking, analytics data collection, and monitoring alerts
 * 
 * POST /analytics - Track events
 * GET /analytics/dashboard/{dashboard_name} - Get dashboard data
 * POST /analytics/provider-health - Update provider health
 * GET /analytics/alerts - Get system alerts
 */

interface AnalyticsEvent {
  event_type: string;
  event_category: string;
  user_id?: string;
  session_id?: string;
  event_data?: any;
  properties?: any;
  context?: any;
}

interface ProviderHealthUpdate {
  provider_name: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  response_time_ms?: number;
  error_rate?: number;
  error_message?: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (req.method === 'POST' && pathSegments[0] === 'analytics') {
      // Track analytics event
      const events: AnalyticsEvent[] = await req.json();
      const eventsArray = Array.isArray(events) ? events : [events];

      const insertData = eventsArray.map(event => ({
        event_type: event.event_type,
        event_category: event.event_category,
        user_id: event.user_id || null,
        session_id: event.session_id || null,
        event_data: event.event_data || {},
        properties: event.properties || {},
        context: event.context || {},
        environment: Deno.env.get('ENVIRONMENT') || 'production'
      }));

      const { data, error } = await supabase
        .from('events')
        .insert(insertData)
        .select();

      if (error) {
        console.error('[ANALYTICS] Event tracking error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to track events',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Tracked ${eventsArray.length} event(s)`,
        event_ids: data?.map(e => e.id) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'POST' && pathSegments[0] === 'provider-health') {
      // Update provider health status
      const healthData: ProviderHealthUpdate = await req.json();

      const { data, error } = await supabase
        .from('provider_health')
        .insert({
          provider_name: healthData.provider_name,
          status: healthData.status,
          response_time_ms: healthData.response_time_ms,
          error_rate: healthData.error_rate,
          error_message: healthData.error_message,
          metadata: healthData.metadata || {},
          environment: Deno.env.get('ENVIRONMENT') || 'production'
        })
        .select()
        .single();

      if (error) {
        console.error('[ANALYTICS] Provider health update error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update provider health',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check for alert conditions
      const alertConditions = [];
      if (healthData.status === 'down') {
        alertConditions.push({ type: 'provider_down', severity: 'critical' });
      } else if (healthData.status === 'degraded') {
        alertConditions.push({ type: 'provider_degraded', severity: 'high' });
      }
      
      if (healthData.error_rate && healthData.error_rate > 0.05) { // 5% error rate threshold
        alertConditions.push({ type: 'high_error_rate', severity: 'medium' });
      }

      if (healthData.response_time_ms && healthData.response_time_ms > 10000) { // 10s response time threshold
        alertConditions.push({ type: 'slow_response', severity: 'low' });
      }

      // Create alerts if conditions are met
      for (const condition of alertConditions) {
        await supabase
          .from('system_alerts')
          .insert({
            alert_type: condition.type,
            severity: condition.severity,
            provider_name: healthData.provider_name,
            alert_message: `${healthData.provider_name}: ${condition.type}`,
            alert_data: healthData,
            environment: Deno.env.get('ENVIRONMENT') || 'production'
          });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Provider health updated',
        health_id: data.id,
        alerts_created: alertConditions.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'GET' && pathSegments[0] === 'analytics' && pathSegments[1] === 'dashboard') {
      // Get dashboard data
      const dashboardName = pathSegments[2];
      
      if (!dashboardName) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Dashboard name is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get dashboard configuration
      const { data: dashboardConfig, error: dashboardError } = await supabase
        .from('analytics_dashboards')
        .select('*')
        .eq('dashboard_name', dashboardName)
        .single();

      if (dashboardError || !dashboardConfig) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Dashboard not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate dashboard data based on configuration
      const dashboardData = await generateDashboardData(supabase, dashboardConfig.dashboard_config);

      return new Response(JSON.stringify({
        success: true,
        dashboard: {
          name: dashboardConfig.dashboard_name,
          config: dashboardConfig.dashboard_config,
          data: dashboardData,
          last_updated: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (req.method === 'GET' && pathSegments[0] === 'alerts') {
      // Get system alerts
      const severity = url.searchParams.get('severity');
      const unresolved = url.searchParams.get('unresolved') === 'true';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let query = supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (unresolved) {
        query = query.eq('is_resolved', false);
      }

      const { data: alerts, error: alertsError } = await query;

      if (alertsError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch alerts',
          details: alertsError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        alerts: alerts || [],
        total: alerts?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid endpoint',
        available_endpoints: [
          'POST /analytics - Track events',
          'POST /provider-health - Update provider health',
          'GET /analytics/dashboard/{name} - Get dashboard data',
          'GET /alerts - Get system alerts'
        ]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('[ANALYTICS] Unexpected error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateDashboardData(supabase: any, config: any): Promise<any> {
  const dashboardData: any = {};

  for (const widget of config.widgets || []) {
    try {
      switch (widget.type) {
        case 'provider_status_grid':
          dashboardData[widget.type] = await getProviderStatusGrid(supabase, widget.providers);
          break;
        case 'response_time_chart':
          dashboardData[widget.type] = await getResponseTimeChart(supabase, widget.time_range);
          break;
        case 'booking_volume_chart':
          dashboardData[widget.type] = await getBookingVolumeChart(supabase, widget.time_range);
          break;
        case 'alert_list':
          dashboardData[widget.type] = await getAlertList(supabase, widget.severity_filter);
          break;
        case 'user_activity_heatmap':
          dashboardData[widget.type] = await getUserActivityHeatmap(supabase, widget.time_range);
          break;
        default:
          dashboardData[widget.type] = { message: 'Widget type not implemented', type: widget.type };
      }
    } catch (error) {
      console.error(`Error generating data for widget ${widget.type}:`, error);
      dashboardData[widget.type] = { error: error.message, type: widget.type };
    }
  }

  return dashboardData;
}

async function getProviderStatusGrid(supabase: any, providers: string[]): Promise<any> {
  const { data, error } = await supabase
    .from('provider_health')
    .select('provider_name, status, response_time_ms, error_rate, last_check_at')
    .in('provider_name', providers)
    .order('last_check_at', { ascending: false });

  if (error) throw error;

  return {
    providers: data?.map((p: any) => ({
      name: p.provider_name,
      status: p.status,
      response_time: p.response_time_ms,
      error_rate: p.error_rate,
      last_check: p.last_check_at
    })) || []
  };
}

async function getResponseTimeChart(supabase: any, timeRange: string): Promise<any> {
  // Mock data for now - would implement real time-series data
  return {
    time_range: timeRange,
    data_points: [
      { timestamp: new Date().toISOString(), avg_response_time: 1200 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), avg_response_time: 1100 },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), avg_response_time: 1350 }
    ]
  };
}

async function getBookingVolumeChart(supabase: any, timeRange: string): Promise<any> {
  const { data, error } = await supabase
    .from('events')
    .select('created_at')
    .eq('event_type', 'booking_completed')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return {
    time_range: timeRange,
    total_bookings: data?.length || 0,
    daily_breakdown: [] // Would implement proper time-series grouping
  };
}

async function getAlertList(supabase: any, severityFilter: string[]): Promise<any> {
  let query = supabase
    .from('system_alerts')
    .select('*')
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })
    .limit(10);

  if (severityFilter && severityFilter.length > 0) {
    query = query.in('severity', severityFilter);
  }

  const { data, error } = await query;

  if (error) throw error;

  return {
    alerts: data || [],
    total_unresolved: data?.length || 0
  };
}

async function getUserActivityHeatmap(supabase: any, timeRange: string): Promise<any> {
  const { data, error } = await supabase
    .from('events')
    .select('event_type, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  return {
    time_range: timeRange,
    total_events: data?.length || 0,
    event_types: {} // Would implement proper aggregation
  };
}