import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import logger from "../_shared/logger.ts";


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
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

async function getHotelRatings(hotelIds: string[], accessToken: string) {
  const url = 'https://test.api.amadeus.com/v2/e-reputation/hotel-sentiments';
  
  logger.info('Getting hotel ratings for hotels:', hotelIds);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: "hotel-sentiment-analysis",
        hotelIds: hotelIds
      }
    }),
  });

  if (!response.ok) {
    logger.error('Hotel ratings API error:', response.status, response.statusText);
    throw new Error(`Hotel ratings API error: ${response.statusText}`);
  }

  const data = await response.json();
  logger.info('Hotel ratings response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelIds } = await req.json();
    
    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid hotelIds parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Hotel ratings request for hotels:', hotelIds);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    logger.info('Got Amadeus access token for hotel ratings');

    // Get hotel ratings
    const ratingsData = await getHotelRatings(hotelIds, accessToken);

    // Transform the response
    const ratings = ratingsData.data?.map((rating: any) => ({
      hotelId: rating.hotelId,
      overallRating: rating.overallRating,
      numberOfReviews: rating.numberOfReviews,
      numberOfRatings: rating.numberOfRatings,
      sentiments: {
        sleepQuality: rating.sentiments?.sleepQuality,
        service: rating.sentiments?.service,
        facilities: rating.sentiments?.facilities,
        roomComforts: rating.sentiments?.roomComforts,
        valueForMoney: rating.sentiments?.valueForMoney,
        catering: rating.sentiments?.catering,
        pointOfInterest: rating.sentiments?.pointOfInterest,
        staff: rating.sentiments?.staff,
        swimmingPool: rating.sentiments?.swimmingPool,
        location: rating.sentiments?.location
      }
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        ratings,
        count: ratings.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Hotel ratings function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch hotel ratings',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});