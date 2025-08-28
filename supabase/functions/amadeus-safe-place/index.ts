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

async function getSafetyRating(latitude: number, longitude: number, accessToken: string) {
  const url = `https://test.api.amadeus.com/v1/safety/safety-rated-locations?latitude=${latitude}&longitude=${longitude}`;
  
  logger.info('Getting safety rating for coordinates:', latitude, longitude);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    logger.error('Safe Place API error:', response.status, response.statusText);
    throw new Error(`Safe Place API error: ${response.statusText}`);
  }

  const data = await response.json();
  logger.info('Safe Place response:', data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing latitude or longitude parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Safety rating request for coordinates:', latitude, longitude);

    // Get access token
    const accessToken = await getAmadeusAccessToken();
    logger.info('Got Amadeus access token for safety rating');

    // Get safety rating
    const safetyData = await getSafetyRating(parseFloat(latitude), parseFloat(longitude), accessToken);

    // Transform safety data
    const safetyInfo = safetyData.data?.[0] ? {
      overallSafety: safetyData.data[0].safetyScores?.overall || 'unknown',
      physicalHarm: safetyData.data[0].safetyScores?.physicalHarm || 'unknown',
      theft: safetyData.data[0].safetyScores?.theft || 'unknown',
      politicalFreedom: safetyData.data[0].safetyScores?.politicalFreedom || 'unknown',
      lgbtq: safetyData.data[0].safetyScores?.lgbtq || 'unknown',
      medical: safetyData.data[0].safetyScores?.medical || 'unknown',
      womenSafety: safetyData.data[0].safetyScores?.women || 'unknown'
    } : null;

    return new Response(
      JSON.stringify({
        success: true,
        safetyInfo,
        hasData: !!safetyInfo
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Safety rating function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch safety rating',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});