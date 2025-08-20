import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AmadeusAuthResponse {
  access_token: string;
  expires_in: number;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  const amadeusEnv = Deno.env.get('AMADEUS_ENV') || 'test';
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Amadeus credentials');
  }

  const baseUrl = amadeusEnv === 'prod' 
    ? 'https://api.amadeus.com' 
    : 'https://test.api.amadeus.com';

  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
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
    throw new Error(`Amadeus auth failed: ${response.status} ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, checkIn, checkOut, adults = 2, children = 0, rooms = 1, currency = 'AUD' } = await req.json();

    // Validate required parameters
    if (!hotelId || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: hotelId, checkIn, checkOut' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching hotel details for:', { hotelId, checkIn, checkOut, adults, children, rooms });

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();

    // Build request URL for Amadeus Hotel Offers API v3
    const amadeusEnv = Deno.env.get('AMADEUS_ENV') || 'test';
    const baseUrl = amadeusEnv === 'prod' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';

    const url = new URL(`${baseUrl}/v3/shopping/hotel-offers`);
    url.searchParams.set('hotelIds', hotelId);
    url.searchParams.set('checkInDate', checkIn);
    url.searchParams.set('checkOutDate', checkOut);
    url.searchParams.set('adults', adults.toString());
    if (children > 0) {
      url.searchParams.set('children', children.toString());
    }
    url.searchParams.set('roomQuantity', rooms.toString());
    url.searchParams.set('currency', currency);
    url.searchParams.set('bestRateOnly', 'false');
    url.searchParams.set('includeClosed', 'false');
    url.searchParams.set('lang', 'en');

    console.log('Making request to Amadeus:', url.toString());

    // Make request to Amadeus
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Amadeus API error:', response.status, responseData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Amadeus API error: ${response.status}`,
          details: responseData 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Successfully fetched hotel details for hotel ${hotelId}`);
    console.log(`Found ${responseData.data?.length || 0} hotel(s) with offers`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: responseData,
        hotel: responseData.data?.[0]?.hotel,
        offers: responseData.data?.[0]?.offers || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Hotel details error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch hotel details' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});