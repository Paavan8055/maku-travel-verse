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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { hotelCode, rateKey, rooms } = await req.json() as CheckratesParams

    if (!hotelCode || !rateKey || !rooms) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: hotelCode, rateKey, rooms' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Checking rates for hotel:', hotelCode, 'with rateKey:', rateKey)

    // Check rate limits before proceeding
    const rateLimitCheck = await supabase.functions.invoke('rate-limiter', {
      body: {
        identifier: req.headers.get('x-forwarded-for') || 'anonymous',
        action: 'search',
        window: 60,
        maxAttempts: RATE_LIMITS.hotelbeds.searchPerMinute
      }
    })

    if (rateLimitCheck.data && !rateLimitCheck.data.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retryAfter: rateLimitCheck.data.retryAfter 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call HotelBeds checkrates API
    const checkratesData = await checkHotelRates({
      hotelCode,
      rateKey,
      rooms
    })

    // Transform response
    const transformedResponse = transformCheckratesResponse(checkratesData)

    // Log the successful checkrates call
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'hotelbeds-checkrates',
        log_level: 'info',
        message: `Checkrates successful for hotel ${hotelCode}`,
        metadata: {
          hotelCode,
          rateKey,
          roomCount: rooms.length
        }
      }
    })

    return new Response(
      JSON.stringify(transformedResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('HotelBeds checkrates error:', error)

    const errorResponse = {
      success: false,
      error: error.message || 'Failed to check hotel rates',
      source: 'hotelbeds'
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