import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ENV_CONFIG, RATE_LIMITS } from '../_shared/config.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MonitoringEntry {
  endpoint: string
  responseTime: number
  statusCode: number
  success: boolean
  errorMessage?: string
  rateLimit?: {
    current: number
    limit: number
    window: number
  }
  timestamp: string
}

async function logToMonitoring(entry: MonitoringEntry): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  await supabase.from('hotelbeds_monitoring').insert({
    endpoint: entry.endpoint,
    response_time_ms: entry.responseTime,
    status_code: entry.statusCode,
    success: entry.success,
    error_message: entry.errorMessage,
    rate_limit_data: entry.rateLimit ? {
      current: entry.rateLimit.current,
      limit: entry.rateLimit.limit,
      window: entry.rateLimit.window
    } : null,
    created_at: new Date().toISOString()
  })
}

async function testHotelBedsEndpoint(endpoint: string, testData: any = null): Promise<MonitoringEntry> {
  const startTime = Date.now()
  const apiKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY')
  const secret = Deno.env.get('HOTELBEDS_HOTEL_SECRET')
  
  if (!apiKey || !secret) {
    return {
      endpoint,
      responseTime: Date.now() - startTime,
      statusCode: 500,
      success: false,
      errorMessage: 'HotelBeds credentials not configured',
      timestamp: new Date().toISOString()
    }
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    
    // Generate signature (simplified version)
    const stringToSign = apiKey + secret + timestamp
    const encoder = new TextEncoder()
    const data = encoder.encode(stringToSign)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const headers = {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    }

    let url = `${ENV_CONFIG.hotelbeds.baseUrl}${endpoint}`
    let fetchOptions: RequestInit = {
      method: 'GET',
      headers
    }

    // Handle different endpoint types
    if (testData) {
      fetchOptions.method = 'POST'
      fetchOptions.headers = { ...headers, 'Content-Type': 'application/json' }
      fetchOptions.body = JSON.stringify(testData)
    }

    const response = await fetch(url, fetchOptions)
    const responseTime = Date.now() - startTime

    return {
      endpoint,
      responseTime,
      statusCode: response.status,
      success: response.ok,
      errorMessage: response.ok ? undefined : await response.text(),
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    return {
      endpoint,
      responseTime: Date.now() - startTime,
      statusCode: 500,
      success: false,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    }
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

    if (req.method === 'GET') {
      // Return monitoring dashboard data
      const { data: recentLogs, error } = await supabase
        .from('hotelbeds_monitoring')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw new Error(`Failed to fetch monitoring data: ${error.message}`)
      }

      // Calculate summary statistics
      const summary = {
        totalRequests: recentLogs.length,
        successRate: recentLogs.length > 0 ? 
          (recentLogs.filter(log => log.success).length / recentLogs.length) * 100 : 0,
        avgResponseTime: recentLogs.length > 0 ? 
          recentLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / recentLogs.length : 0,
        errorRate: recentLogs.length > 0 ? 
          (recentLogs.filter(log => !log.success).length / recentLogs.length) * 100 : 0,
        lastHour: recentLogs.filter(log => 
          new Date(log.created_at).getTime() > Date.now() - 3600000
        ).length
      }

      return new Response(
        JSON.stringify({
          success: true,
          summary,
          recentLogs: recentLogs.slice(0, 20), // Most recent 20 logs
          environment: ENV_CONFIG.isProduction ? 'production' : 'test',
          baseUrl: ENV_CONFIG.hotelbeds.baseUrl
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      // Run monitoring tests
      const { endpoint, testData } = await req.json()

      if (endpoint) {
        // Test specific endpoint
        const result = await testHotelBedsEndpoint(endpoint, testData)
        await logToMonitoring(result)

        return new Response(
          JSON.stringify({ success: true, result }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // Run comprehensive monitoring suite
        const testEndpoints = [
          { path: '/hotel-content-api/1.0/types/countries', data: null },
          { path: '/hotel-api/1.0/status', data: null }
        ]

        const results = await Promise.all(
          testEndpoints.map(({ path, data }) => testHotelBedsEndpoint(path, data))
        )

        // Log all results
        await Promise.all(results.map(result => logToMonitoring(result)))

        const overallSuccess = results.every(r => r.success)
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

        return new Response(
          JSON.stringify({
            success: overallSuccess,
            results,
            summary: {
              overallHealth: overallSuccess ? 'healthy' : 'degraded',
              avgResponseTime,
              testedEndpoints: results.length,
              failedEndpoints: results.filter(r => !r.success).length
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('HotelBeds monitoring error:', error)

    const errorResponse = {
      success: false,
      error: error.message || 'Failed to run monitoring checks'
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