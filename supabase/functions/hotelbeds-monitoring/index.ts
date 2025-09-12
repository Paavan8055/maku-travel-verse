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