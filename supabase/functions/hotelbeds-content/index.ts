import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { ENV_CONFIG, RATE_LIMITS } from '../_shared/config.ts'

interface ContentParams {
  hotelCodes?: string[]
  destinationCode?: string
  language?: string
  from?: number
  to?: number
}

interface HotelContentResponse {
  success: boolean
  source: string
  hotels: any[]
  totalCount: number
}

// Generate HotelBeds signature for authentication
async function generateHotelBedsSignature(apiKey: string, secret: string, timestamp: number): Promise<string> {
  const stringToSign = apiKey + secret + timestamp
  const encoder = new TextEncoder()
  const data = encoder.encode(stringToSign)
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getHotelContent(params: ContentParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY')
  const secret = Deno.env.get('HOTELBEDS_SECRET')
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp)
  
  // Use dynamic environment configuration
  const baseUrl = ENV_CONFIG.hotelbeds.baseUrl
  
  // Build query parameters
  const queryParams = new URLSearchParams()
  
  if (params.hotelCodes && params.hotelCodes.length > 0) {
    queryParams.append('codes', params.hotelCodes.join(','))
  }
  
  if (params.destinationCode) {
    queryParams.append('destinationCode', params.destinationCode)
  }
  
  if (params.language) {
    queryParams.append('language', params.language)
  } else {
    queryParams.append('language', 'ENG') // Default to English
  }
  
  if (params.from) {
    queryParams.append('from', params.from.toString())
  }
  
  if (params.to) {
    queryParams.append('to', params.to.toString())
  }

  const url = `${baseUrl}/hotel-content-api/1.0/hotels?${queryParams.toString()}`

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
    throw new Error(`HotelBeds content API failed: ${response.status} ${errorText}`)
  }

  return await response.json()
}

function transformContentResponse(contentData: any): HotelContentResponse {
  const hotels = contentData.hotels || []
  
  return {
    success: true,
    source: 'hotelbeds',
    hotels: hotels.map((hotel: any) => ({
      code: hotel.code,
      name: hotel.name?.content || hotel.name,
      description: hotel.description?.content || hotel.description,
      countryCode: hotel.countryCode,
      stateCode: hotel.stateCode,
      destinationCode: hotel.destinationCode,
      zoneCode: hotel.zoneCode,
      coordinates: hotel.coordinates ? {
        latitude: parseFloat(hotel.coordinates.latitude),
        longitude: parseFloat(hotel.coordinates.longitude)
      } : null,
      categoryCode: hotel.categoryCode,
      categoryGroupCode: hotel.categoryGroupCode,
      chainCode: hotel.chainCode,
      accommodationTypeCode: hotel.accommodationTypeCode,
      boardCodes: hotel.boardCodes || [],
      segmentCodes: hotel.segmentCodes || [],
      address: {
        content: hotel.address?.content || hotel.address,
        street: hotel.address?.street,
        number: hotel.address?.number,
        zipCode: hotel.postalCode
      },
      contactInfo: {
        email: hotel.email,
        phone: hotel.phone,
        fax: hotel.fax,
        web: hotel.web
      },
      images: hotel.images?.map((img: any) => ({
        imageTypeCode: img.imageTypeCode,
        path: img.path,
        order: img.order,
        visualOrder: img.visualOrder,
        roomCode: img.roomCode,
        roomType: img.roomType,
        characteristicCode: img.characteristicCode
      })) || [],
      facilities: hotel.facilities?.map((facility: any) => ({
        facilityCode: facility.facilityCode,
        facilityGroupCode: facility.facilityGroupCode,
        order: facility.order,
        number: facility.number,
        voucher: facility.voucher,
        description: facility.description?.content || facility.description
      })) || [],
      terminals: hotel.terminals || [],
      interestPoints: hotel.interestPoints?.map((poi: any) => ({
        facilityCode: poi.facilityCode,
        facilityGroupCode: poi.facilityGroupCode,
        order: poi.order,
        poiName: poi.poiName,
        distance: poi.distance
      })) || [],
      rooms: hotel.rooms?.map((room: any) => ({
        roomCode: room.roomCode,
        isParentRoom: room.isParentRoom,
        minPax: room.minPax,
        maxPax: room.maxPax,
        maxAdults: room.maxAdults,
        maxChildren: room.maxChildren,
        minAdults: room.minAdults,
        description: room.description?.content || room.description,
        typeDescription: room.typeDescription?.content || room.typeDescription,
        characteristicCode: room.characteristicCode,
        roomFacilities: room.roomFacilities?.map((facility: any) => ({
          facilityCode: facility.facilityCode,
          facilityGroupCode: facility.facilityGroupCode,
          number: facility.number,
          voucher: facility.voucher,
          description: facility.description?.content || facility.description
        })) || [],
        roomStays: room.roomStays || []
      })) || [],
      issues: hotel.issues || [],
      creationDate: hotel.creationDate,
      lastUpdate: hotel.lastUpdate,
      S2C: hotel.S2C,
      ranking: hotel.ranking
    })),
    totalCount: contentData.total || hotels.length
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