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

async function getPointsOfInterest(latitude: number, longitude: number, radius: number, accessToken: string) {
  const url = `https://test.api.amadeus.com/v1/reference-data/locations/pois?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
  
  console.log('Getting points of interest for coordinates:', latitude, longitude, 'radius:', radius);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Points of Interest API error:', response.status, response.statusText);
    throw new Error(`Points of Interest API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Points of Interest response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5 } = await req.json();
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing latitude or longitude parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Points of interest request for coordinates:', latitude, longitude);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    console.log('Got Amadeus access token for points of interest');

    // Get points of interest
    const poisData = await getPointsOfInterest(parseFloat(latitude), parseFloat(longitude), radius, accessToken);

    // Transform points of interest data
    const pointsOfInterest = poisData.data?.map((poi: any) => ({
      id: poi.id,
      name: poi.name,
      category: poi.category,
      subCategory: poi.subCategory,
      rank: poi.rank,
      geoCode: {
        latitude: poi.geoCode?.latitude,
        longitude: poi.geoCode?.longitude
      },
      distance: {
        value: poi.distance?.value,
        unit: poi.distance?.unit
      },
      tags: poi.tags || []
    })) || [];

    // Group by category for better organization
    const groupedPOIs = pointsOfInterest.reduce((acc: any, poi: any) => {
      const category = poi.category || 'OTHER';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(poi);
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        success: true,
        pointsOfInterest,
        groupedPOIs,
        count: pointsOfInterest.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Points of interest function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch points of interest',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});