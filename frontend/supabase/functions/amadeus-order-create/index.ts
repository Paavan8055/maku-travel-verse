import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


interface AmadeusOrderCreateRequest {
  correlationId?: string;
  flightOffers: any[];
  travelers: Array<{
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    gender: string;
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }>;
    };
    documents?: Array<{
      documentType: string;
      birthPlace: string;
      issuanceLocation: string;
      issuanceDate: string;
      number: string;
      expiryDate: string;
      issuanceCountry: string;
      validityCountry: string;
      nationality: string;
      holder: boolean;
    }>;
  }>;
  remarks?: {
    general?: Array<{
      subType: string;
      text: string;
    }>;
  };
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[AMADEUS-ORDER-CREATE] Request received');
    
    const requestData: AmadeusOrderCreateRequest = await req.json();
    const { correlationId, flightOffers, travelers, remarks } = requestData;

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    logger.info('[AMADEUS-ORDER-CREATE] Got access token');

    // Build Amadeus Order Create request payload
    const orderCreateRequest = {
      data: {
        type: "flight-order",
        flightOffers: flightOffers,
        travelers: travelers,
        remarks: remarks || {
          general: [
            {
              subType: "GENERAL_MISCELLANEOUS",
              text: "ONLINE BOOKING VIA MAKU TRAVEL"
            }
          ]
        },
        ticketingAgreement: {
          option: "DELAY_TO_CANCEL",
          delay: "6D"
        },
        contacts: [
          {
            addresseeName: {
              firstName: travelers[0]?.name?.firstName || "CUSTOMER",
              lastName: travelers[0]?.name?.lastName || "SERVICE"
            },
            companyName: "MAKU TRAVEL",
            purpose: "STANDARD",
            phones: travelers[0]?.contact?.phones || [
              {
                deviceType: "MOBILE",
                countryCallingCode: "61",
                number: "0412345678"
              }
            ],
            emailAddress: travelers[0]?.contact?.emailAddress || "customer@maku.travel"
          }
        ]
      }
    };

    logger.info('[AMADEUS-ORDER-CREATE] Making order create request', {
      correlationId,
      travelersCount: travelers.length,
      offersCount: flightOffers.length
    });

    // Make request to Amadeus Flight Order Create API
    const response = await fetch('https://test.api.amadeus.com/v1/booking/flight-orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Correlation-ID': correlationId || `amadeus-order-${Date.now()}`
      },
      body: JSON.stringify(orderCreateRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[AMADEUS-ORDER-CREATE] Order creation failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        correlationId
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Amadeus order creation failed: ${response.status}`,
          details: errorText,
          correlationId
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const orderData = await response.json();
    logger.info('[AMADEUS-ORDER-CREATE] Order creation successful', { 
      correlationId,
      orderId: orderData.data?.id 
    });

    // Extract key information from Amadeus order response
    const extractedOrderInfo = {
      orderId: orderData.data?.id,
      associatedRecords: orderData.data?.associatedRecords || [],
      flightOffers: orderData.data?.flightOffers || [],
      travelers: orderData.data?.travelers || [],
      ticketingAgreement: orderData.data?.ticketingAgreement,
      bookingRequirements: orderData.data?.bookingRequirements || [],
      contacts: orderData.data?.contacts || [],
      creationDate: orderData.data?.creationDate || new Date().toISOString(),
      lastTicketingDate: orderData.data?.lastTicketingDate,
      queuingOfficeId: orderData.data?.queuingOfficeId,
      ownerOfficeId: orderData.data?.ownerOfficeId
    };

    // Store order creation result in Supabase for tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('correlation_tracking').insert({
      correlation_id: correlationId || `amadeus-order-${Date.now()}`,
      request_type: 'amadeus_order_create',
      request_data: {
        travelersCount: travelers.length,
        offersCount: flightOffers.length,
        provider: 'amadeus'
      },
      response_data: extractedOrderInfo,
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - parseInt(correlationId?.split('-').pop() || '0')
    });

    // Store in flight orders table
    if (extractedOrderInfo.orderId) {
      await supabase.from('flights_orders').insert({
        amadeus_order_id: extractedOrderInfo.orderId,
        offer_source: 'amadeus',
        offer_json: flightOffers[0] || {},
        passengers: travelers,
        status: 'confirmed',
        price_total: flightOffers[0]?.price?.total || 0,
        price_currency: flightOffers[0]?.price?.currency || 'USD',
        analytics: {
          correlationId,
          createdAt: new Date().toISOString(),
          provider: 'amadeus'
        },
        meta: {
          lastTicketingDate: extractedOrderInfo.lastTicketingDate,
          bookingRequirements: extractedOrderInfo.bookingRequirements,
          associatedRecords: extractedOrderInfo.associatedRecords
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedOrderInfo,
        correlationId,
        provider: 'amadeus',
        createdAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('[AMADEUS-ORDER-CREATE] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Amadeus order creation failed',
        correlationId: req.headers.get('X-Correlation-ID')
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});