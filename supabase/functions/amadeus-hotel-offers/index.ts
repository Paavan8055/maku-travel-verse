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

// Get Amadeus access token
async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('Missing Amadeus credentials');
    throw new Error('Missing Amadeus credentials');
  }

  console.log('Getting Amadeus access token...');

  try {
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
      const errorText = await response.text();
      console.error('Amadeus auth failed:', response.status, response.statusText, errorText);
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data: AmadeusAuthResponse = await response.json();
    console.log('Successfully authenticated with Amadeus');
    return data.access_token;
  } catch (error) {
    console.error('Amadeus authentication error:', error);
    throw error;
  }
}

// Get hotel offers for specific hotel
async function getHotelOffers(accessToken: string, hotelId: string, checkIn: string, checkOut: string, adults: number, children: number, rooms: number, currency: string): Promise<any> {
  const url = `https://api.amadeus.com/v3/shopping/hotel-offers`;
  
  console.log('Getting hotel offers:', { hotelId, checkIn, checkOut, adults, children, rooms, currency });

  const params = new URLSearchParams({
    hotelIds: hotelId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: adults.toString(),
    roomQuantity: rooms.toString(),
    currency: currency
  });

  if (children > 0) {
    params.append('children', children.toString());
  }

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hotel offers search failed:', response.status, response.statusText, errorText);
      throw new Error(`Hotel offers search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Hotel offers search successful, found', data.data?.[0]?.offers?.length || 0, 'offers');
    return data;
  } catch (error) {
    console.error('Hotel offers search error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, checkIn, checkOut, adults = 1, children = 0, rooms = 1, currency = 'AUD' } = await req.json();
    
    if (!hotelId || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: hotelId, checkIn, checkOut are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Hotel offers request:', { hotelId, checkIn, checkOut, adults, children, rooms, currency });

    // Get access token
    const accessToken = await getAmadeusAccessToken();

    // Get hotel offers
    const searchResult = await getHotelOffers(accessToken, hotelId, checkIn, checkOut, adults, children, rooms, currency);

    if (!searchResult?.data || searchResult.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No offers found for this hotel',
          offers: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hotel = searchResult.data[0];
    const offers = hotel.offers || [];

    // Transform offers to match frontend interface
    const transformedOffers = offers.map((offer: any, index: number) => {
      const room = offer.room || {};
      const ratePlan = offer.ratePlan || {};
      const price = offer.price || {};
      
      return {
        id: offer.id,
        room: {
          type: room.type || 'Standard Room',
          typeEstimated: room.typeEstimated || {},
          description: room.description?.text || `Comfortable ${room.type || 'room'} with modern amenities`,
          bedType: room.typeEstimated?.bedType || 'Queen',
          beds: room.typeEstimated?.beds || 1
        },
        ratePlan: {
          code: ratePlan.ratePlanCode || 'ROOM_ONLY',
          name: ratePlan.ratePlanCode || 'Room Only',
          paymentType: ratePlan.paymentType || 'AT_PROPERTY',
          cancellation: ratePlan.cancellation || { type: 'FREE_CANCELLATION' }
        },
        price: {
          total: parseFloat(price.total || '0'),
          base: parseFloat(price.base || price.total || '0'),
          currency: price.currency || currency,
          breakdown: price.variations?.changes || []
        },
        policies: {
          paymentType: offer.policies?.paymentType || 'AT_PROPERTY',
          cancellation: offer.policies?.cancellation || { 
            type: 'FREE_CANCELLATION',
            deadline: checkIn 
          }
        },
        boardType: offer.boardType || 'ROOM_ONLY',
        checkIn,
        checkOut,
        guests: adults + children,
        isAvailable: true,
        // Additional features for selection
        features: [
          room.typeEstimated?.bedType ? `${room.typeEstimated.bedType} bed` : 'Comfortable bed',
          'Free WiFi',
          'Air conditioning',
          ...(room.description?.text?.match(/\b(pool|spa|gym|breakfast|parking)\b/gi) || [])
        ].slice(0, 4)
      };
    });

    console.log(`Successfully found ${transformedOffers.length} offers for hotel ${hotelId}`);

    return new Response(
      JSON.stringify({
        success: true,
        hotel: {
          id: hotel.hotel.hotelId,
          name: hotel.hotel.name,
          chainCode: hotel.hotel.chainCode
        },
        offers: transformedOffers,
        checkIn,
        checkOut,
        searchCriteria: { adults, children, rooms, currency }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Hotel offers function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        offers: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});