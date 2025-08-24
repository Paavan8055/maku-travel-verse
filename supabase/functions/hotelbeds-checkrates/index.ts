import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckratesParams {
  hotelCode: string
  rateKey: string
  rooms: Array<{
    rateKey: string
    paxes: Array<{
      type: 'AD' | 'CH'
      age?: number
    }>
  }>
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

async function checkHotelRates(params: CheckratesParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY')
  const secret = Deno.env.get('HOTELBEDS_SECRET')
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp)
  
  // Use test environment for now
  const baseUrl = 'https://api.test.hotelbeds.com'
  
  const requestBody = {
    rooms: params.rooms,
    upselling: false
  }

  const response = await fetch(`${baseUrl}/hotel-api/1.0/checkrates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HotelBeds checkrates failed: ${response.status} ${errorText}`)
  }

  return await response.json()
}

function transformCheckratesResponse(checkratesData: any): any {
  const hotel = checkratesData.hotel
  
  return {
    success: true,
    source: 'hotelbeds',
    hotel: {
      code: hotel.code,
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      categoryCode: hotel.categoryCode,
      categoryName: hotel.categoryName,
      coordinates: hotel.coordinates ? {
        latitude: parseFloat(hotel.coordinates.latitude),
        longitude: parseFloat(hotel.coordinates.longitude)
      } : null,
      facilities: hotel.facilities || [],
      images: hotel.images?.map((img: any) => ({
        path: img.path,
        order: img.order,
        type: img.type
      })) || [],
      rooms: hotel.rooms?.map((room: any) => ({
        code: room.code,
        name: room.name,
        rates: room.rates?.map((rate: any) => ({
          rateKey: rate.rateKey,
          rateClass: rate.rateClass,
          rateType: rate.rateType,
          net: rate.net,
          discount: rate.discount,
          discountPCT: rate.discountPCT,
          sellingRate: rate.sellingRate,
          hotelSellingRate: rate.hotelSellingRate,
          amount: rate.amount,
          hotelCurrency: rate.hotelCurrency,
          hotelMandatory: rate.hotelMandatory,
          packaging: rate.packaging,
          boardCode: rate.boardCode,
          boardName: rate.boardName,
          cancellationPolicies: rate.cancellationPolicies,
          taxes: {
            allIncluded: rate.taxes?.allIncluded,
            taxScheme: rate.taxes?.taxScheme,
            taxes: rate.taxes?.taxes || []
          },
          rateComments: rate.rateComments,
          paymentType: rate.paymentType,
          offers: rate.offers || [],
          shiftRate: rate.shiftRate,
          dailyRates: rate.dailyRates || []
        })) || []
      })) || []
    },
    totalResults: 1,
    auditData: checkratesData.auditData
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