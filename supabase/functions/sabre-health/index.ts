import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('SABRE_CLIENT_ID');
    const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
    const isProduction = Deno.env.get('NODE_ENV') === 'production';
    const baseUrl = isProduction 
      ? 'https://api.havail.sabre.com' 
      : 'https://api-crt.cert.havail.sabre.com';
    const pcc = isProduction 
      ? Deno.env.get('SABRE_PROD_PCC') 
      : Deno.env.get('SABRE_TEST_PCC');
    
    // Test authentication
    const authStartTime = Date.now();
    let authResult = { success: false, message: '', responseTime: 0 };
    
    if (!clientId || !clientSecret) {
      authResult = {
        success: false,
        message: 'Sabre credentials not configured',
        responseTime: 0
      };
    } else {
      try {
        const credentials = btoa(`${clientId}:${clientSecret}`);
        
        const tokenResponse = await fetch(`${baseUrl}/v2/auth/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(pcc && { 'PCC': pcc })
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            ...(pcc && { pcc })
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

    // Test API endpoints availability
    const flightSearch = {
      available: authResult.success,
      message: authResult.success ? 'Flight search API available' : 'Cannot test without valid authentication'
    };

    const hotelSearch = {
      available: authResult.success,
      message: authResult.success ? 'Hotel search API available' : 'Cannot test without valid authentication'
    };

    const result = {
      success: authResult.success,
      provider: 'sabre',
      auth: authResult,
      flightSearch,
      hotelSearch,
      credentials: {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        pcc: !!pcc,
        environment: isProduction ? 'production' : 'test'
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sabre health check error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      provider: 'sabre',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});