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

const getAmadeusAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
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
    const errorText = await response.text();
    console.error('Amadeus auth failed:', errorText);
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const getHotelOffers = async (
  accessToken: string, 
  hotelId: string, 
  checkIn: string, 
  checkOut: string, 
  adults: number, 
  children: number, 
  rooms: number, 
  currency: string
): Promise<any> => {
  console.log('Amadeus Hotel Offers API call:', `https://api.amadeus.com/v3/shopping/hotel-offers/${hotelId}`);

  const params = new URLSearchParams({
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: adults.toString(),
    roomQuantity: rooms.toString(),
    currency: currency,
  });

  if (children > 0) {
    params.append('children', children.toString());
  }

  const response = await fetch(
    `https://api.amadeus.com/v3/shopping/hotel-offers/${hotelId}?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel offers error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      hotelId: hotelId
    });
    throw new Error(`Hotel offers failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Amadeus Hotel Offers API response:', {
    hotelId: result.data?.hotel?.hotelId,
    offersCount: result.data?.offers?.length,
    available: result.data?.available
  });

  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, checkIn, checkOut, adults = 2, children = 0, rooms = 1, currency = 'USD' } = await req.json();

    console.log('=== Amadeus Hotel Offers Request ===', {
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      currency
    });

    if (!hotelId || !checkIn || !checkOut) {
      throw new Error('Hotel ID, check-in and check-out dates are required');
    }

    const accessToken = await getAmadeusAccessToken();

    const offersData = await getHotelOffers(
      accessToken,
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      currency
    );

    const hotel = offersData.data?.hotel;
    const offers = offersData.data?.offers || [];

    // Transform offers to match frontend expectations
    const transformedOffers = offers.map((offer: any) => ({
      id: offer.id,
      checkInDate: offer.checkInDate,
      checkOutDate: offer.checkOutDate,
      rateCode: offer.rateCode,
      rateFamilyEstimated: offer.rateFamilyEstimated,
      room: {
        type: offer.room?.type,
        typeEstimated: offer.room?.typeEstimated,
        description: offer.room?.description,
        capacity: offer.guests?.adults || adults
      },
      guests: offer.guests,
      price: {
        currency: offer.price?.currency,
        base: offer.price?.base,
        total: offer.price?.total,
        taxes: offer.price?.taxes,
        markups: offer.price?.markups,
        variations: offer.price?.variations
      },
      policies: {
        paymentType: offer.policies?.paymentType,
        cancellation: offer.policies?.cancellation,
        guarantee: offer.policies?.guarantee,
        deposit: offer.policies?.deposit
      },
      self: offer.self
    }));

    console.log(`=== Hotel Offers Complete ===`, {
      hotelId: hotel?.hotelId,
      hotelName: hotel?.name,
      offersFound: transformedOffers.length,
      available: offersData.data?.available
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      hotel: {
        hotelId: hotel?.hotelId,
        chainCode: hotel?.chainCode,
        dupeId: hotel?.dupeId,
        name: hotel?.name,
        cityCode: hotel?.cityCode,
        latitude: hotel?.latitude,
        longitude: hotel?.longitude
      },
      offers: transformedOffers,
      available: offersData.data?.available,
      meta: {
        apiProvider: 'Amadeus Hotel Offers',
        searchId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Amadeus Hotel Offers Error ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'amadeus',
      details: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});