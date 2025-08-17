import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SeatMapParams {
  flightOfferId: string;
}

const getAmadeusAccessToken = async (): Promise<string> => {
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

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const getSeatMap = async (params: SeatMapParams, accessToken: string) => {
  const requestBody = {
    data: [{ id: params.flightOfferId }]
  };

  const response = await fetch('https://test.api.amadeus.com/v1/shopping/seatmaps', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus seat map error:', errorText);
    throw new Error(`Seat map retrieval failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightOfferId } = await req.json();
    
    console.log('Getting seat map for flight offer:', flightOfferId);

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    
    // Get seat map
    const seatMapData = await getSeatMap({ flightOfferId }, accessToken);
    
    console.log('Seat map retrieval successful');

    // Transform the response to our format
    const seatMaps = seatMapData.data?.map((seatMap: any) => {
      return {
        flightOfferId: seatMap.flightOfferId,
        segmentId: seatMap.segmentId,
        carrierCode: seatMap.carrierCode,
        number: seatMap.number,
        aircraft: {
          code: seatMap.aircraft?.code,
          name: seatMap.aircraft?.name
        },
        class: seatMap.class,
        decks: seatMap.decks?.map((deck: any) => ({
          deckType: deck.deckType,
          deckConfiguration: {
            width: deck.deckConfiguration?.width,
            length: deck.deckConfiguration?.length,
            startsWithRow: deck.deckConfiguration?.startsWithRow,
            endsWithRow: deck.deckConfiguration?.endsWithRow
          },
          facilities: deck.facilities?.map((facility: any) => ({
            code: facility.code,
            column: facility.column,
            row: facility.row,
            position: facility.position
          })),
          seats: deck.seats?.map((seat: any) => ({
            cabin: seat.cabin,
            number: seat.number,
            characteristicsCodes: seat.characteristicsCodes,
            travelerPricing: seat.travelerPricing?.map((pricing: any) => ({
              travelerId: pricing.travelerId,
              seatAvailabilityStatus: pricing.seatAvailabilityStatus,
              price: {
                currency: pricing.price?.currency,
                total: pricing.price?.total,
                base: pricing.price?.base
              }
            }))
          }))
        }))
      };
    });

    return new Response(JSON.stringify({
      success: true,
      seatMaps: seatMaps || [],
      rawResponse: seatMapData // Include raw response for debugging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Seat map error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Seat map retrieval failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});