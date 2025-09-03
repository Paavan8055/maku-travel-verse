import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


interface FlightPriceVerificationRequest {
  offerId: string;
  provider: 'amadeus' | 'sabre';
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    cabin: string;
  };
}

async function getAmadeusAccessToken(): Promise<string> {
  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': Deno.env.get('AMADEUS_CLIENT_ID') || '',
      'client_secret': Deno.env.get('AMADEUS_CLIENT_SECRET') || '',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function getSabreAccessToken(): Promise<string> {
  const credentials = btoa(`${Deno.env.get('SABRE_CLIENT_ID')}:${Deno.env.get('SABRE_CLIENT_SECRET')}`);
  
  const response = await fetch('https://api-crt.cert.havail.sabre.com/v2/auth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

async function verifyAmadeusPrice(accessToken: string, offerId: string, searchParams: any) {
  const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers/pricing`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: "flight-offers-pricing",
        flightOffers: [{ id: offerId }]
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus pricing verification failed: ${response.statusText}`);
  }

  return await response.json();
}

async function verifySabrePrice(accessToken: string, offerId: string, searchParams: any) {
  // Sabre price verification using Air Price API
  const response = await fetch(`${Deno.env.get('SABRE_BASE_URL')}/v1/offers/shop/flights/price`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      OTA_AirPriceRQ: {
        OriginDestinationInformation: [{
          DepartureDateTime: searchParams.departureDate,
          OriginLocation: { LocationCode: searchParams.origin },
          DestinationLocation: { LocationCode: searchParams.destination }
        }],
        TravelerInfoSummary: {
          AirTravelerAvail: [{
            PassengerTypeQuantity: {
              Code: "ADT",
              Quantity: searchParams.adults
            }
          }]
        },
        TPA_Extensions: {
          IntelliSellTransaction: {
            RequestType: { Name: "200ITINS" }
          }
        }
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Sabre pricing verification failed: ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: FlightPriceVerificationRequest = await req.json();
    console.log('Flight price verification request:', request);

    let verificationResult;
    
    if (request.provider === 'amadeus') {
      const accessToken = await getAmadeusAccessToken();
      verificationResult = await verifyAmadeusPrice(accessToken, request.offerId, request.searchParams);
    } else if (request.provider === 'sabre') {
      const accessToken = await getSabreAccessToken();
      verificationResult = await verifySabrePrice(accessToken, request.offerId, request.searchParams);
    } else {
      throw new Error('Invalid provider specified');
    }

    const result = {
      success: true,
      verified: true,
      originalPrice: verificationResult.data?.flightOffers?.[0]?.price || verificationResult.price,
      currentPrice: verificationResult.data?.flightOffers?.[0]?.price || verificationResult.price,
      priceChanged: false,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes validity
      provider: request.provider,
      timestamp: new Date().toISOString()
    };

    console.log('Price verification result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Flight price verification error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Price verification failed' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});