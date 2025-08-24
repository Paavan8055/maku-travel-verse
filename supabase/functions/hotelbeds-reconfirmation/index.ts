import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ENV_CONFIG, getMTLSConfig, RATE_LIMITS } from '../_shared/config.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReconfirmationParams {
  reference: string
  language?: string
}

// Generate HotelBeds signature for authentication
function generateHotelBedsSignature(apiKey: string, secret: string, timestamp: number): string {
  const message = apiKey + secret + timestamp
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  ).then(signature => 
    Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  )
}

async function reconfirmBooking(params: ReconfirmationParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY')
  const secret = Deno.env.get('HOTELBEDS_SECRET')
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp)
  
  // Use dynamic environment configuration with mTLS support
  const mtlsConfig = getMTLSConfig()
  const baseUrl = mtlsConfig.enabled ? ENV_CONFIG.hotelbeds.mtlsUrl : ENV_CONFIG.hotelbeds.baseUrl
  
  // Build query parameters
  const queryParams = new URLSearchParams()
  if (params.language) {
    queryParams.append('language', params.language)
  }
  
  const url = `${baseUrl}/hotel-api/1.0/bookings/reconfirmations/${params.reference}${queryParams.toString() ? '?' + queryParams.toString() : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HotelBeds reconfirmation failed: ${response.status} ${errorText}`)
  }

  return await response.json()
}

function transformReconfirmationResponse(reconfirmationData: any): any {
  const booking = reconfirmationData.booking
  
  return {
    success: true,
    source: 'hotelbeds',
    reconfirmation: {
      reference: booking.reference,
      clientReference: booking.clientReference,
      status: booking.status,
      creationDate: booking.creationDate,
      checkIn: booking.hotel?.checkIn,
      checkOut: booking.hotel?.checkOut,
      holder: booking.holder,
      totalNet: booking.totalNet,
      currency: booking.currency,
      hotel: booking.hotel ? {
        code: booking.hotel.code,
        name: booking.hotel.name,
        address: booking.hotel.address,
        city: booking.hotel.city,
        phone: booking.hotel.phone,
        email: booking.hotel.email,
        categoryName: booking.hotel.categoryName,
        destinationName: booking.hotel.destinationName,
        coordinates: booking.hotel.coordinates ? {
          latitude: parseFloat(booking.hotel.coordinates.latitude),
          longitude: parseFloat(booking.hotel.coordinates.longitude)
        } : null,
        checkIn: booking.hotel.checkIn,
        checkOut: booking.hotel.checkOut,
        rooms: booking.hotel.rooms?.map((room: any) => ({
          code: room.code,
          name: room.name,
          status: room.status,
          id: room.id,
          paxes: room.paxes || [],
          rates: room.rates?.map((rate: any) => ({
            rateKey: rate.rateKey,
            rateClass: rate.rateClass,
            net: rate.net,
            amount: rate.amount,
            boardName: rate.boardName,
            paymentType: rate.paymentType,
            packaging: rate.packaging,
            cancellationPolicies: rate.cancellationPolicies,
            rooms: rate.rooms,
            adults: rate.adults,
            children: rate.children
          })) || []
        })) || []
      } : null,
      modificationPolicies: booking.modificationPolicies,
      remarks: booking.remarks
    },
    auditData: reconfirmationData.auditData
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