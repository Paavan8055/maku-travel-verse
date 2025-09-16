import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    logger.info('[ADMIN-FIX] Re-enabling Amadeus providers');

    // Re-enable amadeus-flight
    const { error: flightError } = await supabase
      .from('provider_configs')
      .update({
        enabled: true,
        priority: 2,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'amadeus-flight');

    // Re-enable amadeus-hotel  
    const { error: hotelError } = await supabase
      .from('provider_configs')
      .update({
        enabled: true,
        priority: 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'amadeus-hotel');

    // Reset quota status
    const { error: quotaError } = await supabase
      .from('provider_quotas')
      .update({
        status: 'healthy',
        percentage_used: 0,
        is_actual_quota_limit: false,
        last_checked: new Date().toISOString()
      })
      .in('provider_id', ['amadeus-flight', 'amadeus-hotel']);

    logger.info('[ADMIN-FIX] Providers re-enabled successfully', {
      flightError: !!flightError,
      hotelError: !!hotelError, 
      quotaError: !!quotaError
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Amadeus providers re-enabled',
      errors: {
        flight: flightError?.message,
        hotel: hotelError?.message,
        quota: quotaError?.message
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[ADMIN-FIX] Failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});