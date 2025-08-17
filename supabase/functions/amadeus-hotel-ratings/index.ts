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
    const errorText = await response.text();
    console.error('Amadeus auth failed:', errorText);
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const getHotelRatings = async (hotelIds: string[], accessToken: string) => {
  const searchParams = new URLSearchParams({
    hotelIds: hotelIds.join(',')
  });

  console.log('Amadeus Hotel Ratings API call:', `https://test.api.amadeus.com/v2/e-reputation/hotel-sentiments?${searchParams}`);

  const response = await fetch(
    `https://test.api.amadeus.com/v2/e-reputation/hotel-sentiments?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel ratings error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      hotelIds: hotelIds
    });
    throw new Error(`Hotel ratings failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Amadeus Hotel Ratings API response:', {
    dataCount: result.data?.length || 0,
    meta: result.meta
  });

  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelIds } = await req.json();

    console.log('=== Amadeus Hotel Ratings Request ===', {
      hotelIds,
      count: hotelIds?.length
    });

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      throw new Error('Hotel IDs array is required');
    }

    if (hotelIds.length > 100) {
      throw new Error('Maximum 100 hotel IDs allowed per request');
    }

    const accessToken = await getAmadeusAccessToken();

    const ratingsData = await getHotelRatings(hotelIds, accessToken);

    const transformedRatings = ratingsData.data?.map((rating: any) => ({
      hotelId: rating.hotelId,
      overallRating: rating.overallRating,
      numberOfRatings: rating.numberOfRatings,
      numberOfReviews: rating.numberOfReviews,
      sentiments: {
        sleepQuality: rating.sentiments?.sleepQuality,
        service: rating.sentiments?.service,
        facilities: rating.sentiments?.facilities,
        restaurantsAndBars: rating.sentiments?.restaurantsAndBars,
        valueForMoney: rating.sentiments?.valueForMoney,
        location: rating.sentiments?.location,
        roomComfort: rating.sentiments?.roomComfort,
        cleanliness: rating.sentiments?.cleanliness,
        pointsOfInterest: rating.sentiments?.pointsOfInterest,
        staff: rating.sentiments?.staff,
        swimmingPool: rating.sentiments?.swimmingPool
      }
    })) || [];

    console.log(`=== Hotel Ratings Complete ===`, {
      ratingsFound: transformedRatings.length,
      searchSuccess: true
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      ratings: transformedRatings,
      meta: {
        totalResults: transformedRatings.length,
        apiProvider: 'Amadeus Hotel Ratings',
        searchId: crypto.randomUUID()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Amadeus Hotel Ratings Error ===', {
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