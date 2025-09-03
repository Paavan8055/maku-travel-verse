import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[DEBUG-SABRE] Starting Sabre credential debug');

    // Check environment variables
    const envVars = {
      SABRE_CLIENT_ID: Deno.env.get('SABRE_CLIENT_ID'),
      SABRE_CLIENT_SECRET: Deno.env.get('SABRE_CLIENT_SECRET'),
      SABRE_BASE_URL: Deno.env.get('SABRE_BASE_URL')
    };

    // Log lengths and first few characters (safely)
    const envDebug = {
      SABRE_CLIENT_ID: {
        exists: !!envVars.SABRE_CLIENT_ID,
        length: envVars.SABRE_CLIENT_ID?.length || 0,
        prefix: envVars.SABRE_CLIENT_ID?.substring(0, 8) || 'none'
      },
      SABRE_CLIENT_SECRET: {
        exists: !!envVars.SABRE_CLIENT_SECRET,
        length: envVars.SABRE_CLIENT_SECRET?.length || 0,
        prefix: envVars.SABRE_CLIENT_SECRET?.substring(0, 8) || 'none'
      },
      SABRE_BASE_URL: {
        exists: !!envVars.SABRE_BASE_URL,
        value: envVars.SABRE_BASE_URL || 'none'
      }
    };

    logger.info('[DEBUG-SABRE] Environment variables:', envDebug);

    // Test authentication if credentials exist
    let authTest = null;
    if (envVars.SABRE_CLIENT_ID && envVars.SABRE_CLIENT_SECRET) {
      try {
        const credentials = btoa(`${envVars.SABRE_CLIENT_ID}:${envVars.SABRE_CLIENT_SECRET}`);
        const baseUrl = envVars.SABRE_BASE_URL || 'https://api-crt.cert.havail.sabre.com';
        
        logger.info('[DEBUG-SABRE] Attempting authentication test');
        
        const tokenResponse = await fetch(`${baseUrl}/v2/auth/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        const responseText = await tokenResponse.text();
        
        authTest = {
          success: tokenResponse.ok,
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          hasToken: tokenResponse.ok && responseText.includes('access_token'),
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 200)
        };

        logger.info('[DEBUG-SABRE] Auth test result:', authTest);
      } catch (error) {
        authTest = {
          success: false,
          error: error.message
        };
        logger.error('[DEBUG-SABRE] Auth test failed:', error);
      }
    }

    const result = {
      success: true,
      environment: envDebug,
      authTest,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[DEBUG-SABRE] Function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});