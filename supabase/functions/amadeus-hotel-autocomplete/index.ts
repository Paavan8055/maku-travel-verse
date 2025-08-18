import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Amadeus credentials');
  }

  const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
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
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

async function getHotelAutocomplete(query: string, accessToken: string) {
  const url = `https://api.amadeus.com/v1/reference-data/locations/hotels/by-keyword?keyword=${encodeURIComponent(query)}`;
  
  console.log('Getting hotel autocomplete for:', query, 'using URL:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hotel autocomplete API error:', response.status, response.statusText, errorText);
    
    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    throw new Error(`Hotel autocomplete API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Hotel autocomplete response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 10 } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Hotel autocomplete request for:', query);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    console.log('Got Amadeus access token for hotel autocomplete');

    // Get hotel suggestions
    const autocompleteData = await getHotelAutocomplete(query, accessToken);

    // Transform suggestions
    const suggestions = autocompleteData.data?.slice(0, limit).map((hotel: any) => ({
      id: hotel.id,
      name: hotel.name,
      hotelId: hotel.hotelId || hotel.id,
      chainCode: hotel.chainCode,
      address: {
        cityName: hotel.address?.cityName,
        countryCode: hotel.address?.countryCode,
        postalCode: hotel.address?.postalCode,
        stateCode: hotel.address?.stateCode
      },
      geoCode: {
        latitude: hotel.geoCode?.latitude,
        longitude: hotel.geoCode?.longitude
      },
      lastUpdate: hotel.lastUpdate
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        count: suggestions.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Hotel autocomplete function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch hotel suggestions',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});