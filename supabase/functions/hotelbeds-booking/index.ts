import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingParams {
  holder: {
    name: string
    surname: string
    title?: string
  }
  rooms: Array<{
    rateKey: string
    paxes: Array<{
      roomId: number
      type: 'AD' | 'CH'
      age?: number
      name: string
      surname: string
      title?: string
    }>
  }>
  clientReference: string
  remark?: string
  voucher?: {
    language?: string
  }
  paymentData?: {
    paymentCard?: {
      cardType: string
      cardNumber: string
      expiryDate: string
      cardCVC: string
      cardHolderName: string
    }
    contactData?: {
      email: string
      phoneNumber: string
    }
    billingAddress?: {
      address1: string
      address2?: string
      city: string
      state: string
      postalCode: string
      countryCode: string
    }
  }
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

async function createHotelBooking(params: BookingParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY')
  const secret = Deno.env.get('HOTELBEDS_SECRET')
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp)
  
  // Use test environment for now - will need mTLS for production
  const baseUrl = 'https://api.test.hotelbeds.com'
  
  const requestBody = {
    holder: params.holder,
    rooms: params.rooms,
    clientReference: params.clientReference,
    remark: params.remark,
    voucher: params.voucher,
    paymentData: params.paymentData
  }

  const response = await fetch(`${baseUrl}/hotel-api/1.0/bookings`, {
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
    throw new Error(`HotelBeds booking failed: ${response.status} ${errorText}`)
  }

  return await response.json()
}

function transformBookingResponse(bookingData: any): any {
  const booking = bookingData.booking
  
  return {
    success: true,
    source: 'hotelbeds',
    booking: {
      reference: booking.reference,
      clientReference: booking.clientReference,
      creationDate: booking.creationDate,
      status: booking.status,
      modificationPolicies: booking.modificationPolicies,
      agCommission: booking.agCommission,
      commissionVAT: booking.commissionVAT,
      creationUser: booking.creationUser,
      holder: booking.holder,
      remark: booking.remark,
      totalNet: booking.totalNet,
      pendingAmount: booking.pendingAmount,
      currency: booking.currency,
      hotel: {
        checkIn: booking.hotel.checkIn,
        checkOut: booking.hotel.checkOut,
        code: booking.hotel.code,
        name: booking.hotel.name,
        description: booking.hotel.description,
        address: booking.hotel.address,
        postalCode: booking.hotel.postalCode,
        city: booking.hotel.city,
        email: booking.hotel.email,
        phone: booking.hotel.phone,
        fax: booking.hotel.fax,
        categoryCode: booking.hotel.categoryCode,
        categoryName: booking.hotel.categoryName,
        destinationCode: booking.hotel.destinationCode,
        destinationName: booking.hotel.destinationName,
        zoneCode: booking.hotel.zoneCode,
        zoneName: booking.hotel.zoneName,
        coordinates: booking.hotel.coordinates ? {
          latitude: parseFloat(booking.hotel.coordinates.latitude),
          longitude: parseFloat(booking.hotel.coordinates.longitude)
        } : null,
        rooms: booking.hotel.rooms?.map((room: any) => ({
          code: room.code,
          name: room.name,
          status: room.status,
          id: room.id,
          supplierReference: room.supplierReference,
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
            paymentType: rate.paymentType,
            cancellationPolicies: rate.cancellationPolicies,
            taxes: {
              allIncluded: rate.taxes?.allIncluded,
              taxScheme: rate.taxes?.taxScheme,
              taxes: rate.taxes?.taxes || []
            },
            rooms: rate.rooms,
            adults: rate.adults,
            children: rate.children
          })) || [],
          paxes: room.paxes || []
        })) || []
      }
    },
    auditData: bookingData.auditData
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

    const bookingParams = await req.json() as BookingParams

    if (!bookingParams.holder || !bookingParams.rooms || !bookingParams.clientReference) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: holder, rooms, clientReference' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating HotelBeds booking with reference:', bookingParams.clientReference)

    // Call HotelBeds booking API
    const bookingData = await createHotelBooking(bookingParams)

    // Transform response
    const transformedResponse = transformBookingResponse(bookingData)

    // Log the successful booking
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: crypto.randomUUID(),
        service_name: 'hotelbeds-booking',
        log_level: 'info',
        message: `Booking created successfully`,
        metadata: {
          hotelbedsReference: transformedResponse.booking.reference,
          clientReference: bookingParams.clientReference,
          hotelCode: transformedResponse.booking.hotel.code,
          totalNet: transformedResponse.booking.totalNet
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
    console.error('HotelBeds booking error:', error)

    const errorResponse = {
      success: false,
      error: error.message || 'Failed to create hotel booking',
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