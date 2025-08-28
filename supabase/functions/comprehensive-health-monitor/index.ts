import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ENV_CONFIG, validateProductionReadiness, getMTLSConfig } from '../_shared/config.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'outage'
  responseTime?: number
  lastChecked: string
  error?: string
  details?: any
}

async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase.from('system_logs').select('id').limit(1)
    
    return {
      service: 'supabase',
      status: error ? 'degraded' : 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error?.message,
      details: {
        url: Deno.env.get('SUPABASE_URL'),
        hasServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      }
    }
  } catch (error) {
    return {
      service: 'supabase',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error.message
    }
  }
}

async function checkHotelBedsHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    const apiKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY')
    const secret = Deno.env.get('HOTELBEDS_HOTEL_SECRET')
    
    if (!apiKey || !secret) {
      return {
        service: 'hotelbeds',
        status: 'outage',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: 'HotelBeds credentials not configured'
      }
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const stringToSign = apiKey + secret + timestamp
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const response = await fetch(`${ENV_CONFIG.hotelbeds.baseUrl}/hotel-content-api/1.0/types/countries`, {
      method: 'GET',
      headers: {
        'Api-key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json'
      }
    })

    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        service: 'hotelbeds',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          baseUrl: ENV_CONFIG.hotelbeds.baseUrl,
          environment: ENV_CONFIG.isProduction ? 'production' : 'test'
        }
      }
    } else {
      return {
        service: 'hotelbeds',
        status: response.status >= 500 ? 'outage' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      service: 'hotelbeds',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error.message
    }
  }
}

async function checkStripeHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeKey) {
      return {
        service: 'stripe',
        status: 'outage',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: 'Stripe secret key not configured'
      }
    }

    // Simple Stripe account check
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      return {
        service: 'stripe',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          country: data.country,
          chargesEnabled: data.charges_enabled,
          payoutsEnabled: data.payouts_enabled
        }
      }
    } else {
      return {
        service: 'stripe',
        status: response.status >= 500 ? 'outage' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      service: 'stripe',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error.message
    }
  }
}

Deno.serve(async (req) => {
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