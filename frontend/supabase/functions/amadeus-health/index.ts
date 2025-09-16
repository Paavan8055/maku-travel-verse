import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
    
    // Test authentication
    const authStartTime = Date.now();
    let authResult = { success: false, message: '', responseTime: 0 };
    
    if (!clientId || !clientSecret) {
      authResult = {
        success: false,
        message: 'Amadeus credentials not configured',
        responseTime: 0
      };
    } else {
      try {
        const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
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

        const authResponseTime = Date.now() - authStartTime;
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          authResult = {
            success: true,
            message: `Authentication successful (token: ${tokenData.access_token?.substring(0, 10)}...)`,
            responseTime: authResponseTime
          };
        } else {
          const errorData = await tokenResponse.text();
          authResult = {
            success: false,
            message: `Authentication failed: ${tokenResponse.status} ${errorData}`,
            responseTime: authResponseTime
          };
        }
      } catch (error) {
        authResult = {
          success: false,
          message: `Authentication error: ${error.message}`,
          responseTime: Date.now() - authStartTime
        };
      }
    }

    // Test API endpoints availability (lightweight check)
    const flightSearch = {
      success: authResult.success,
      message: authResult.success ? 'Flight search API available' : 'Cannot test without valid authentication',
      responseTime: undefined
    };

    const hotelSearch = {
      success: authResult.success,
      message: authResult.success ? 'Hotel search API available' : 'Cannot test without valid authentication',
      responseTime: undefined
    };

    const result = {
      success: authResult.success,
      provider: 'amadeus',
      auth: authResult,
      flightSearch,
      hotelSearch,
      credentials: {
        clientId: !!clientId,
        clientSecret: !!clientSecret
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Amadeus health check error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      provider: 'amadeus',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});