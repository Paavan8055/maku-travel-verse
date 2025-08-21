import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import logger from "../_shared/logger.ts";

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

async function getHotelPhotos(hotelId: string, accessToken: string) {
  const url = `https://test.api.amadeus.com/v2/media/files/generated-photos?category=HOTEL&hotelIds=${hotelId}`;
  
  logger.info('Getting hotel photos for:', hotelId);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    logger.error('Hotel photos API error:', response.status, response.statusText);
    throw new Error(`Hotel photos API error: ${response.statusText}`);
  }

  const data = await response.json();
  logger.info('Hotel photos response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId } = await req.json();
    
    if (!hotelId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing hotelId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Hotel photos request for:', hotelId);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    logger.info('Got Amadeus access token for hotel photos');

    // Get hotel photos
    const photosData = await getHotelPhotos(hotelId, accessToken);

    // Transform photos data
    const photos = photosData.data?.map((photo: any) => ({
      url: photo.href,
      category: photo.category,
      width: photo.dimensions?.width,
      height: photo.dimensions?.height,
      title: photo.title || 'Hotel photo'
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        photos,
        count: photos.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Hotel photos function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch hotel photos',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});