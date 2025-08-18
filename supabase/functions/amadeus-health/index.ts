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

async function checkAmadeusHealth(): Promise<{ healthy: boolean; message: string; responseTime?: number }> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    return { 
      healthy: false, 
      message: 'Missing Amadeus credentials'
    };
  }

  try {
    const startTime = Date.now();
    
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

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data: AmadeusAuthResponse = await response.json();
      if (data.access_token) {
        return { 
          healthy: true, 
          message: 'Amadeus API is operational',
          responseTime
        };
      }
    }

    return { 
      healthy: false, 
      message: `Amadeus API authentication failed: ${response.status}`,
      responseTime
    };

  } catch (error) {
    return { 
      healthy: false, 
      message: `Amadeus API connection failed: ${error.message}`
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const health = await checkAmadeusHealth();
    
    return new Response(
      JSON.stringify({
        service: 'amadeus-api',
        ...health,
        timestamp: new Date().toISOString()
      }),
      { 
        status: health.healthy ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        service: 'amadeus-api',
        healthy: false,
        message: `Health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});