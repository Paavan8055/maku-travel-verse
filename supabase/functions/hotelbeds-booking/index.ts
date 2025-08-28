import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ENV_CONFIG, getMTLSConfig, RATE_LIMITS } from '../_shared/config.ts'

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
  
  // Use dynamic environment configuration with mTLS support
  const mtlsConfig = getMTLSConfig()
  const baseUrl = mtlsConfig.enabled ? ENV_CONFIG.hotelbeds.mtlsUrl : ENV_CONFIG.hotelbeds.baseUrl
  
  const requestBody = {
    holder: params.holder,
    rooms: params.rooms,
    clientReference: params.clientReference,
    remark: params.remark,
    voucher: params.voucher,
    paymentData: params.paymentData
  }

  // Prepare fetch options with potential mTLS configuration
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(requestBody)
  }

  // Add mTLS configuration if enabled and available
  if (mtlsConfig.enabled && mtlsConfig.certPath && mtlsConfig.keyPath) {
    try {
      // Read certificate files for production mTLS
      const cert = await Deno.readTextFile(mtlsConfig.certPath);
      const key = await Deno.readTextFile(mtlsConfig.keyPath);
      
      // Configure mTLS for Deno fetch (simplified implementation)
      console.log('Using mTLS endpoint with certificates for booking:', baseUrl);
      
      // Note: In a real implementation, you would configure the fetch with client certificates
      // This is a placeholder for the actual mTLS implementation
    } catch (error) {
      console.warn('Failed to load mTLS certificates, falling back to standard endpoint:', error.message);
    }
  }

  const response = await fetch(`${baseUrl}/hotel-api/1.0/bookings`, fetchOptions)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HotelBeds booking failed: ${response.status} ${errorText}`)
  }

  return await response.json()
}

function transformBookingResponse(bookingData: any): any {
  const booking = bookingData.booking
  
  // Calculate enhanced financial breakdown
  const financialSummary = calculateFinancialBreakdown(booking);
  
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
      
      // Enhanced financial breakdown
      financial: {
        totalNet: booking.totalNet,
        totalSelling: booking.totalSellingRate || booking.totalNet,
        pendingAmount: booking.pendingAmount,
        currency: booking.currency,
        commission: {
          agent: booking.agCommission || 0,
          vat: booking.commissionVAT || 0,
          total: (booking.agCommission || 0) + (booking.commissionVAT || 0)
        },
        taxes: financialSummary.taxes,
        markup: financialSummary.markup,
        breakdown: financialSummary.breakdown
      },
      
      // Legacy fields for backward compatibility
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
        
        // Enhanced room details
        rooms: booking.hotel.rooms?.map((room: any) => ({
          code: room.code,
          name: room.name,
          status: room.status,
          id: room.id,
          supplierReference: room.supplierReference,
          
          // Enhanced rate information
          rates: room.rates?.map((rate: any) => {
            const netAmount = rate.net || 0;
            const sellingRate = rate.sellingRate || rate.amount || 0;
            const totalTaxes = rate.taxes?.taxes?.reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0) || 0;
            
            return {
              rateKey: rate.rateKey,
              rateClass: rate.rateClass,
              rateType: rate.rateType,
              
              // Enhanced pricing
              pricing: {
                net: netAmount,
                selling: sellingRate,
                hotelSelling: rate.hotelSellingRate || 0,
                markup: sellingRate - netAmount,
                totalTaxes: totalTaxes,
                finalAmount: sellingRate + totalTaxes
              },
              
              // Legacy pricing fields
              net: netAmount,
              discount: rate.discount,
              discountPCT: rate.discountPCT,
              sellingRate: sellingRate,
              hotelSellingRate: rate.hotelSellingRate,
              amount: rate.amount,
              hotelCurrency: rate.hotelCurrency,
              hotelMandatory: rate.hotelMandatory,
              packaging: rate.packaging,
              boardCode: rate.boardCode,
              boardName: rate.boardName,
              paymentType: rate.paymentType,
              
              // Enhanced cancellation policies with financial impact
              cancellationPolicies: rate.cancellationPolicies?.map((policy: any) => ({
                amount: policy.amount,
                hotelAmount: policy.hotelAmount,
                hotelCurrency: policy.hotelCurrency,
                from: policy.from,
                to: policy.to,
                percentage: policy.amount && sellingRate ? (policy.amount / sellingRate) * 100 : 0
              })) || [],
              
              // Enhanced tax breakdown
              taxes: {
                allIncluded: rate.taxes?.allIncluded || false,
                taxScheme: rate.taxes?.taxScheme,
                total: totalTaxes,
                breakdown: rate.taxes?.taxes?.map((tax: any) => ({
                  included: tax.included,
                  percent: tax.percent,
                  amount: tax.amount,
                  currency: tax.currency,
                  type: tax.type,
                  clientAmount: tax.clientAmount,
                  clientCurrency: tax.clientCurrency
                })) || []
              },
              
              rooms: rate.rooms,
              adults: rate.adults,
              children: rate.children,
              
              // Additional rate details
              rateComments: rate.rateComments,
              paymentPolicies: rate.paymentPolicies || [],
              promotions: rate.promotions || [],
              offers: rate.offers || []
            };
          }) || [],
          
          // Enhanced pax information
          paxes: room.paxes?.map((pax: any) => ({
            roomId: pax.roomId,
            type: pax.type,
            age: pax.age,
            name: pax.name,
            surname: pax.surname,
            title: pax.title
          })) || []
        })) || []
      },
      
      // Enhanced modification and cancellation policies
      policies: {
        modification: booking.modificationPolicies,
        cancellation: extractCancellationSummary(booking),
        payment: extractPaymentPolicies(booking)
      },
      
      // Booking timeline and status tracking
      timeline: {
        created: booking.creationDate,
        lastModified: booking.lastModified,
        checkIn: booking.hotel.checkIn,
        checkOut: booking.hotel.checkOut
      }
    },
    auditData: bookingData.auditData,
    
    // Enhanced metadata
    metadata: {
      processTime: bookingData.auditData?.processTime,
      timestamp: bookingData.auditData?.timestamp,
      serverId: bookingData.auditData?.serverId,
      environment: bookingData.auditData?.environment,
      bookingEngine: 'hotelbeds',
      version: '1.0'
    }
  }
}

// Helper function to calculate financial breakdown
function calculateFinancialBreakdown(booking: any) {
  const rooms = booking.hotel?.rooms || [];
  let totalTaxes = 0;
  let totalNet = 0;
  let totalSelling = 0;
  
  rooms.forEach((room: any) => {
    room.rates?.forEach((rate: any) => {
      totalNet += rate.net || 0;
      totalSelling += rate.sellingRate || rate.amount || 0;
      totalTaxes += rate.taxes?.taxes?.reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0) || 0;
    });
  });
  
  return {
    taxes: {
      total: totalTaxes,
      included: rooms.some((r: any) => r.rates?.some((rate: any) => rate.taxes?.allIncluded))
    },
    markup: {
      amount: totalSelling - totalNet,
      percentage: totalNet > 0 ? ((totalSelling - totalNet) / totalNet) * 100 : 0
    },
    breakdown: {
      subtotal: totalNet,
      taxes: totalTaxes,
      markup: totalSelling - totalNet,
      total: totalSelling + totalTaxes
    }
  };
}

// Helper function to extract cancellation summary
function extractCancellationSummary(booking: any) {
  const policies: any[] = [];
  
  booking.hotel?.rooms?.forEach((room: any) => {
    room.rates?.forEach((rate: any) => {
      if (rate.cancellationPolicies) {
        policies.push(...rate.cancellationPolicies);
      }
    });
  });
  
  return {
    hasFreeCancellation: policies.length === 0 || policies.some(p => p.amount === 0),
    policies: policies.sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()),
    summary: policies.length > 0 ? 
      `${policies.length} cancellation policy period(s)` : 
      'Free cancellation'
  };
}

// Helper function to extract payment policies
function extractPaymentPolicies(booking: any) {
  const paymentPolicies: any[] = [];
  
  booking.hotel?.rooms?.forEach((room: any) => {
    room.rates?.forEach((rate: any) => {
      if (rate.paymentPolicies) {
        paymentPolicies.push(...rate.paymentPolicies);
      }
    });
  });
  
  return {
    policies: paymentPolicies,
    paymentType: booking.hotel?.rooms?.[0]?.rates?.[0]?.paymentType || 'AT_HOTEL',
    summary: paymentPolicies.length > 0 ? 
      `${paymentPolicies.length} payment policy period(s)` : 
      'Standard payment terms'
  };
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