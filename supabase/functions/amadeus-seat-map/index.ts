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

interface SeatMapParams {
  flightOfferId: string;
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

async function getSeatMap(params: SeatMapParams, accessToken: string) {
  const url = 'https://api.amadeus.com/v1/shopping/seatmaps';
  
  console.log('Getting seat map for flight offer ID:', params.flightOfferId);
  
  const body = {
    data: [
      {
        type: "flight-offer",
        id: params.flightOfferId
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error('Seat Map API error:', response.status, response.statusText);
    throw new Error(`Seat Map API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Seat Map response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightOfferId } = await req.json();
    
    if (!flightOfferId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing flightOfferId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Seat map request for flight offer:', flightOfferId);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    console.log('Got Amadeus access token for seat map');

    // Get seat map
    const seatMapData = await getSeatMap({ flightOfferId }, accessToken);

    // Transform the response to a more usable format
    const seatMaps = seatMapData.data?.map((seatMap: any) => ({
      flightOfferId: seatMap.flightOfferId,
      segmentId: seatMap.segmentId,
      carrierCode: seatMap.carrierCode,
      number: seatMap.number,
      aircraft: {
        code: seatMap.aircraft?.code,
        width: seatMap.aircraft?.width,
        length: seatMap.aircraft?.length
      },
      departure: {
        iataCode: seatMap.departure?.iataCode,
        at: seatMap.departure?.at
      },
      arrival: {
        iataCode: seatMap.arrival?.iataCode,
        at: seatMap.arrival?.at
      },
      decks: seatMap.decks?.map((deck: any) => ({
        deckType: deck.deckType,
        deckConfiguration: {
          width: deck.deckConfiguration?.width,
          length: deck.deckConfiguration?.length,
          startseat: deck.deckConfiguration?.startseat,
          endseat: deck.deckConfiguration?.endseat
        },
        facilities: deck.facilities || [],
        seats: deck.seats?.map((seat: any) => ({
          cabin: seat.cabin,
          number: seat.number,
          characteristicsCodes: seat.characteristicsCodes || [],
          travelerPricing: seat.travelerPricing || [],
          coordinates: seat.coordinates
        })) || []
      })) || []
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        seatMaps,
        count: seatMaps.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Seat map function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch seat map',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});