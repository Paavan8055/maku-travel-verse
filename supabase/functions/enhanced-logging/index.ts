import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

interface LogEntry {
  service_name: string
  log_level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
  request_id?: string
  user_id?: string
  duration_ms?: number
  status_code?: number
  error_details?: Record<string, any>
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

    // Get correlation ID from headers or generate new one
    const correlationIdHeader = req.headers.get('X-Correlation-ID') || req.headers.get('x-correlation-id')
    const currentCorrelationId = correlationIdHeader || crypto.randomUUID()

    const { logs }: { logs: LogEntry[] } = await req.json()

    if (!Array.isArray(logs) || logs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid logs format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Batch insert logs with correlation ID
    const logEntries = logs.map(log => ({
      correlation_id: currentCorrelationId,
      service_name: log.service_name,
      log_level: log.log_level,
      message: log.message,
      metadata: log.metadata || {},
      request_id: log.request_id,
      user_id: log.user_id,
      duration_ms: log.duration_ms,
      status_code: log.status_code,
      error_details: log.error_details
    }))

    const { error: logError } = await supabase
      .from('system_logs')
      .insert(logEntries)

    if (logError) {
      console.error('Failed to store logs:', logError)
      return new Response(
        JSON.stringify({ error: 'Failed to store logs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store performance metrics for requests with duration
    const performanceEntries = logs
      .filter(log => log.duration_ms !== undefined)
      .map(log => ({
        correlation_id: currentCorrelationId,
        metric_type: 'api_request',
        operation: log.service_name,
        duration_ms: log.duration_ms!,
        success: !log.error_details,
        error_message: log.error_details?.message,
        metadata: {
          status_code: log.status_code,
          request_id: log.request_id,
          ...log.metadata
        },
        user_id: log.user_id
      }))

    if (performanceEntries.length > 0) {
      const { error: perfError } = await supabase
        .from('performance_metrics')
        .insert(performanceEntries)

      if (perfError) {
        console.error('Failed to store performance metrics:', perfError)
      }
    }

    // Log security events for errors and auth failures
    const securityEvents = logs
      .filter(log => 
        log.log_level === 'error' && 
        (log.message.includes('auth') || log.message.includes('unauthorized') || log.status_code === 401 || log.status_code === 403)
      )
      .map(log => ({
        event_type: 'authentication_failure',
        severity: log.status_code === 401 ? 'medium' : 'high',
        user_id: log.user_id,
        details: {
          correlation_id: currentCorrelationId,
          service: log.service_name,
          message: log.message,
          status_code: log.status_code,
          ...log.metadata
        }
      }))

    if (securityEvents.length > 0) {
      const { error: secError } = await supabase
        .from('security_events')
        .insert(securityEvents)

      if (secError) {
        console.error('Failed to store security events:', secError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        correlation_id: currentCorrelationId,
        logs_stored: logs.length,
        performance_metrics: performanceEntries.length,
        security_events: securityEvents.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enhanced logging error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})