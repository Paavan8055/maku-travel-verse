import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";

interface ReconfirmationRequest {
  booking_id: string;
  confirmation_number: string;
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

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const reference = url.searchParams.get('reference')
    const language = url.searchParams.get('language') || 'ENG'

    if (!reference) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: reference' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Reconfirming HotelBeds booking:', reference)

    // Check rate limits before proceeding
    const rateLimitCheck = await supabase.functions.invoke('rate-limiter', {
      body: {
        identifier: req.headers.get('x-forwarded-for') || 'anonymous',
        action: 'booking',
        window: 60,
        maxAttempts: RATE_LIMITS.hotelbeds.bookingPerMinute
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

    // Call HotelBeds reconfirmation API
    const reconfirmationData = await reconfirmBooking({
      reference,
      language
    })

    // Transform response
    const transformedResponse = transformReconfirmationResponse(reconfirmationData)

    // Log the successful reconfirmation
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'hotelbeds-reconfirmation',
        log_level: 'info',
        message: `Reconfirmation successful for booking ${reference}`,
        metadata: {
          reference,
          status: transformedResponse.reconfirmation.status,
          hotelCode: transformedResponse.reconfirmation.hotel?.code
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
    console.error('HotelBeds reconfirmation error:', error)

    const errorResponse = {
      success: false,
      error: error.message || 'Failed to reconfirm hotel booking',
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