import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhotoRequest {
  hotelId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId }: PhotoRequest = await req.json();
    
    if (!hotelId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Hotel ID is required'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Get Amadeus access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: Deno.env.get('AMADEUS_CLIENT_ID') || '',
        client_secret: Deno.env.get('AMADEUS_CLIENT_SECRET') || ''
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with Amadeus');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get hotel photos
    const photosResponse = await fetch(
      `https://test.api.amadeus.com/v2/reference-data/locations/hotels/${hotelId}/photos`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!photosResponse.ok) {
      if (photosResponse.status === 404) {
        return new Response(JSON.stringify({
          success: true,
          photos: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Photos API returned ${photosResponse.status}`);
    }

    const photosData = await photosResponse.json();
    
    // Transform photos to standard format
    const photos = photosData.data?.map((photo: any) => ({
      url: photo.links?.href || photo.url,
      caption: photo.category || 'Hotel photo',
      type: photo.category || 'exterior'
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      photos,
      hotelId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Hotel photos error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      photos: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});