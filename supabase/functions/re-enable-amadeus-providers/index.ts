import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";

// One-time function to re-enable Amadeus flight and hotel providers
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    logger.info('[RE-ENABLE-AMADEUS] Re-enabling Amadeus providers');

    // Re-enable amadeus-flight and amadeus-hotel providers
    const { error: flightError } = await supabase
      .from('provider_configs')
      .update({
        enabled: true,
        priority: 2, // Set reasonable priority
        updated_at: new Date().toISOString()
      })
      .eq('id', 'amadeus-flight');

    const { error: hotelError } = await supabase
      .from('provider_configs')
      .update({
        enabled: true,
        priority: 3, // Set reasonable priority  
        updated_at: new Date().toISOString()
      })
      .eq('id', 'amadeus-hotel');

    if (flightError) {
      logger.error('[RE-ENABLE-AMADEUS] Failed to enable amadeus-flight:', flightError);
    } else {
      logger.info('[RE-ENABLE-AMADEUS] Successfully re-enabled amadeus-flight');
    }

    if (hotelError) {
      logger.error('[RE-ENABLE-AMADEUS] Failed to enable amadeus-hotel:', hotelError);
    } else {
      logger.info('[RE-ENABLE-AMADEUS] Successfully re-enabled amadeus-hotel');
    }

    // Also reset quota status to healthy for these providers
    const { error: quotaError } = await supabase
      .from('provider_quotas')
      .update({
        status: 'healthy',
        percentage_used: 0,
        is_actual_quota_limit: false,
        last_checked: new Date().toISOString()
      })
      .in('provider_id', ['amadeus-flight', 'amadeus-hotel']);

    if (quotaError) {
      logger.error('[RE-ENABLE-AMADEUS] Failed to reset quota status:', quotaError);
    } else {
      logger.info('[RE-ENABLE-AMADEUS] Successfully reset quota status');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Amadeus providers re-enabled successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[RE-ENABLE-AMADEUS] Operation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});