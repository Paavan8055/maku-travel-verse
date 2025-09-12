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

    const params = await req.json() as ContentParams

    console.log('Fetching HotelBeds content with params:', params)

    // Check rate limits before proceeding
    const rateLimitCheck = await supabase.functions.invoke('rate-limiter', {
      body: {
        identifier: req.headers.get('x-forwarded-for') || 'anonymous',
        action: 'search',
        window: 60,
        maxAttempts: RATE_LIMITS.hotelbeds.contentPerMinute
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

    // Validate parameters
    if (!params.hotelCodes && !params.destinationCode) {
      return new Response(
        JSON.stringify({ 
          error: 'Either hotelCodes or destinationCode must be provided' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call HotelBeds content API
    const contentData = await getHotelContent(params)

    // Transform response
    const transformedResponse = transformContentResponse(contentData)

    // Log the successful content fetch
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'hotelbeds-content',
        log_level: 'info',
        message: `Content fetched successfully`,
        metadata: {
          hotelCodes: params.hotelCodes,
          destinationCode: params.destinationCode,
          language: params.language || 'ENG',
          resultsCount: transformedResponse.totalCount
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
    console.error('HotelBeds content error:', error)

    const errorResponse = {
      success: false,
      error: error.message || 'Failed to fetch hotel content',
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