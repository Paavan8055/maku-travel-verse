import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time?: number;
  last_checked: string;
  error_message?: string;
  details?: any;
}

interface SystemHealthResponse {
  success: boolean;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthStatus[];
  timestamp: string;
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting unified health monitor check...');

    const services: HealthStatus[] = [];
    const timestamp = new Date().toISOString();

    // 1. Check Database Health
    const dbStart = Date.now();
    try {
      await supabase.from('bookings').select('count').limit(1);
      services.push({
        service: 'Database',
        status: 'healthy',
        response_time: Date.now() - dbStart,
        last_checked: timestamp
      });
    } catch (error) {
      services.push({
        service: 'Database',
        status: 'unhealthy',
        response_time: Date.now() - dbStart,
        last_checked: timestamp,
        error_message: error.message
      });
    }

    // 2. Check Provider Health
    try {
      const { data: providers } = await supabase
        .from('provider_configs')
        .select('*')
        .eq('enabled', true);

      if (providers && providers.length > 0) {
        services.push({
          service: 'Providers',
          status: 'healthy',
          last_checked: timestamp,
          details: { enabled_count: providers.length }
        });
      } else {
        services.push({
          service: 'Providers',
          status: 'degraded',
          last_checked: timestamp,
          error_message: 'No providers are enabled'
        });
      }
    } catch (error) {
      services.push({
        service: 'Providers',
        status: 'unhealthy',
        last_checked: timestamp,
        error_message: `Failed to check providers: ${error.message}`
      });
    }

    // 3. Check Auth System
    const authStart = Date.now();
    try {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      services.push({
        service: 'Authentication',
        status: error ? 'degraded' : 'healthy',
        response_time: Date.now() - authStart,
        last_checked: timestamp,
        error_message: error?.message
      });
    } catch (error) {
      services.push({
        service: 'Authentication',
        status: 'unhealthy',
        response_time: Date.now() - authStart,
        last_checked: timestamp,
        error_message: error.message
      });
    }

    // Calculate summary
    const summary = {
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length,
      total: services.length
    };

    const overall_status = summary.unhealthy > 0 ? 'unhealthy' : 
                          summary.degraded > 0 ? 'degraded' : 'healthy';

    // Store health snapshot
    try {
      await supabase.from('system_health_snapshots').insert({
        overall_status,
        service_statuses: services,
        summary,
        timestamp
      });
    } catch (error) {
      console.warn('Failed to store health snapshot:', error);
    }

    const response: SystemHealthResponse = {
      success: true,
      overall_status,
      services,
      timestamp,
      summary
    };

    console.log(`Health check completed: ${overall_status} (${summary.healthy}/${summary.total} healthy)`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unified health monitor failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      overall_status: 'unhealthy',
      services: [{
        service: 'Health Monitor',
        status: 'unhealthy',
        last_checked: new Date().toISOString(),
        error_message: error.message
      }],
      timestamp: new Date().toISOString(),
      summary: { healthy: 0, degraded: 0, unhealthy: 1, total: 1 }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});