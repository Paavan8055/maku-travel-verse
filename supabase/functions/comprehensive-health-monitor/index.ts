import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
...
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
        avgResponseTime: allServices.reduce((sum, s) => sum + (s.responseTime || 0), 0) / allServices.length
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
        error: error.message
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