import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import logger from "../_shared/logger.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const correlationId = crypto.randomUUID()
    logger.info('Starting automated cleanup scheduler', { correlationId })

    // Check if cleanup has run recently (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: recentCleanup, error: auditError } = await supabaseClient
      .from('cleanup_audit')
      .select('*')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)

    if (auditError) {
      logger.error('Error checking cleanup audit', auditError, { correlationId })
    }

    // If no recent cleanup, trigger one
    if (!recentCleanup || recentCleanup.length === 0) {
      logger.info('No recent cleanup found, triggering cleanup', { correlationId })
      
      const { data: cleanupResult, error: cleanupError } = await supabaseClient.functions.invoke('fix-stuck-bookings', {
        body: {
          automated: true,
          timeout_minutes: 10
        }
      })

      if (cleanupError) {
        logger.error('Error triggering cleanup', cleanupError, { correlationId })
        
        // Create critical alert for cleanup failure
        await supabaseClient.from('critical_alerts').insert({
          alert_type: 'cleanup_failure',
          severity: 'high',
          message: `Automated cleanup failed: ${cleanupError.message}`,
          requires_manual_action: true
        })

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Cleanup failed',
            correlationId 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (cleanupResult?.triggered_by !== 'automated') {
        logger.error('Cleanup function returned unexpected trigger source', {
          correlationId,
          triggeredBy: cleanupResult?.triggered_by
        })
      }

      logger.info('Cleanup triggered successfully', { correlationId, result: cleanupResult })
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cleanup triggered', 
          result: cleanupResult,
          correlationId 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      logger.info('Recent cleanup found, skipping', { 
        correlationId, 
        lastCleanup: recentCleanup[0].created_at 
      })
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Recent cleanup found, skipping',
          lastCleanup: recentCleanup[0].created_at,
          correlationId 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    logger.error('Automated cleanup scheduler error', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})