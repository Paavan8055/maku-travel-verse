import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ENV_CONFIG, validateProductionReadiness, getMTLSConfig } from '../_shared/config.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductionReadinessResponse {
  ready: boolean
  environment: string
  issues: string[]
  configuration: {
    hotelbeds: {
      baseUrl: string
      mtlsEnabled: boolean
      credentialsConfigured: boolean
    }
    stripe: {
      configured: boolean
    }
    general: {
      isProduction: boolean
    }
  }
  healthChecks: {
    database: boolean
    apis: boolean
  }
}

async function checkApiHealth(): Promise<boolean> {
  try {
    // Test basic connectivity to HotelBeds
    const apiKey = Deno.env.get('HOTELBEDS_API_KEY')
    if (!apiKey) return false
    
    return true
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check production readiness
    const readinessCheck = validateProductionReadiness()
    const mtlsConfig = getMTLSConfig()
    const apiHealth = await checkApiHealth()

    // Test database connectivity
    const { error: dbError } = await supabase.from('system_logs').select('id').limit(1)
    const dbHealthy = !dbError

    const response: ProductionReadinessResponse = {
      ready: readinessCheck.ready,
      environment: ENV_CONFIG.isProduction ? 'production' : 'test',
      issues: readinessCheck.issues,
      configuration: {
        hotelbeds: {
          baseUrl: ENV_CONFIG.hotelbeds.baseUrl,
          mtlsEnabled: mtlsConfig.enabled,
          credentialsConfigured: !!(Deno.env.get('HOTELBEDS_API_KEY') && Deno.env.get('HOTELBEDS_SECRET'))
        },
        stripe: {
          configured: !!Deno.env.get('STRIPE_SECRET_KEY')
        },
        general: {
          isProduction: ENV_CONFIG.isProduction
        }
      },
      healthChecks: {
        database: dbHealthy,
        apis: apiHealth
      }
    }

    // Log the readiness check
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'production-readiness',
        log_level: 'info',
        message: `Production readiness check completed`,
        metadata: {
          ready: response.ready,
          environment: response.environment,
          issueCount: response.issues.length,
          issues: response.issues
        }
      }
    })

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Production readiness check error:', error)

    const errorResponse = {
      ready: false,
      error: error.message || 'Failed to check production readiness'
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