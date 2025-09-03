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
    logger.info('Cron cleanup trigger activated', { correlationId })

    // Check for pending bookings
    const { data: pendingBookings, error: pendingError } = await supabaseClient
      .from('bookings')
      .select('count')
      .eq('status', 'pending')

    if (pendingError) {
      logger.error('Error checking pending bookings', pendingError, { correlationId })
      throw new Error('Failed to check pending bookings')
    }

    const pendingCount = pendingBookings?.[0]?.count || 0
    logger.info(`Found ${pendingCount} pending bookings`, { correlationId })

    // Only run cleanup if there are pending bookings
    if (pendingCount > 0) {
      logger.info('Triggering enhanced cleanup', { correlationId, pendingCount })
      
      const { data: cleanupResult, error: cleanupError } = await supabaseClient.functions.invoke('enhanced-cleanup', {
        body: { 
          correlationId,
          cleanupType: 'cron_triggered'
        }
      })

      if (cleanupError) {
        logger.error('Enhanced cleanup failed', cleanupError, { correlationId })
        
        // Create critical alert
        await supabaseClient.from('critical_alerts').insert({
          alert_type: 'cron_cleanup_failure',
          severity: 'high',
          message: `Cron-triggered cleanup failed: ${cleanupError.message}`,
          requires_manual_action: true
        })

        throw new Error('Enhanced cleanup failed')
      }

      logger.info('Enhanced cleanup completed', { correlationId, result: cleanupResult })
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Cleanup completed',
          correlationId,
          result: cleanupResult
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      logger.info('No pending bookings found, skipping cleanup', { correlationId })
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No pending bookings, cleanup skipped',
          correlationId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    logger.error('Cron cleanup trigger error', error)
    
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