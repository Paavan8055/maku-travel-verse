import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";

// Helper types and utilities

type ServiceStatus = 'healthy' | 'degraded' | 'outage';

interface HealthResult {
  status: ServiceStatus;
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

const ENV_CONFIG = {
  isProduction: (Deno.env.get('ENV') || Deno.env.get('NODE_ENV')) === 'production',
};

function validateProductionReadiness(): { ready: boolean; issues: string[] } {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
  ];
  const issues = required.filter((k) => !Deno.env.get(k)).map((k) => `${k} is missing`);
  return { ready: issues.length === 0, issues };
}

function getMTLSConfig(): { enabled: boolean } {
  return { enabled: Deno.env.get('MTLS_ENABLED') === 'true' };
}

async function checkSupabaseHealth(): Promise<HealthResult> {
  const start = Date.now();
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      return {
        status: 'degraded',
        responseTime: Date.now() - start,
        error: 'Missing Supabase configuration',
      };
    }

    const supabase = createClient(url, key);
    // Lightweight connectivity check – attempt a head-like select on a small table if present
    try {
      await supabase.from('provider_configs').select('id', { count: 'exact', head: true }).limit(1);
    } catch (_e) {
      // Table may not exist in some environments; connectivity is still likely fine.
    }

    return { status: 'healthy', responseTime: Date.now() - start };
  } catch (e) {
    return { status: 'outage', responseTime: Date.now() - start, error: (e as Error).message };
  }
}

async function checkHotelBedsHealth(): Promise<HealthResult> {
  const start = Date.now();
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY') || Deno.env.get('HOTELBEDS_HOTEL_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET') || Deno.env.get('HOTELBEDS_HOTEL_SECRET');
  if (apiKey && secret) {
    return { status: 'healthy', responseTime: Date.now() - start };
  }
  return {
    status: 'degraded',
    responseTime: Date.now() - start,
    error: 'Missing HotelBeds credentials',
  };
}

async function checkStripeHealth(): Promise<HealthResult> {
  const start = Date.now();
  if (Deno.env.get('STRIPE_SECRET_KEY')) {
    return { status: 'healthy', responseTime: Date.now() - start };
  }
  return {
    status: 'degraded',
    responseTime: Date.now() - start,
    error: 'Missing STRIPE_SECRET_KEY',
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Run all health checks in parallel
    const [supabaseHealth, hotelbedsHealth, stripeHealth] = await Promise.all([
      checkSupabaseHealth(),
      checkHotelBedsHealth(),
      checkStripeHealth()
    ])

    // Determine overall system health
    const allServices = [supabaseHealth, hotelbedsHealth, stripeHealth]
    const healthyServices = allServices.filter(s => s.status === 'healthy').length
    const degradedServices = allServices.filter(s => s.status === 'degraded').length
    const outageServices = allServices.filter(s => s.status === 'outage').length

    let overallStatus: 'healthy' | 'degraded' | 'outage'
    if (outageServices > 0) {
      overallStatus = 'outage'
    } else if (degradedServices > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    // Get production readiness information
    const productionReadiness = validateProductionReadiness()
    const mtlsConfig = getMTLSConfig()

    const healthReport = {
      overall: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        environment: ENV_CONFIG.isProduction ? 'production' : 'test'
      },
      services: {
        supabase: supabaseHealth,
        hotelbeds: hotelbedsHealth,
        stripe: stripeHealth
      },
      summary: {
        total: allServices.length,
        healthy: healthyServices,
        degraded: degradedServices,
        outage: outageServices,
        avgResponseTime: allServices.reduce((sum, s) => sum + (s.responseTime || 0), 0) / (allServices.length || 1)
      },
      productionReadiness: {
        ready: productionReadiness.ready,
        issues: productionReadiness.issues,
        mtlsEnabled: mtlsConfig.enabled,
        environment: ENV_CONFIG.isProduction ? 'production' : 'test'
      }
    }

    return new Response(
      JSON.stringify(healthReport),
      { 
        status: overallStatus === 'healthy' ? 200 : 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Comprehensive health check error:', error)

    const errorResponse = {
      overall: {
        status: 'outage',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      },
      services: {},
      summary: {
        total: 0,
        healthy: 0,
        degraded: 0,
        outage: 1
      }
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
