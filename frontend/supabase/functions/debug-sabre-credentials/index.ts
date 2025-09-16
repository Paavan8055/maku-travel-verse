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
      SABRE_BASE_URL: Deno.env.get('SABRE_BASE_URL'),
      SABRE_TEST_PCC: Deno.env.get('SABRE_TEST_PCC'),
      SABRE_PROD_PCC: Deno.env.get('SABRE_PROD_PCC'),
      SABRE_EPR_ID: Deno.env.get('SABRE_EPR_ID')
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
      },
      SABRE_TEST_PCC: {
        exists: !!envVars.SABRE_TEST_PCC,
        value: envVars.SABRE_TEST_PCC || 'none'
      },
      SABRE_PROD_PCC: {
        exists: !!envVars.SABRE_PROD_PCC,
        value: envVars.SABRE_PROD_PCC || 'none'
      },
      SABRE_EPR_ID: {
        exists: !!envVars.SABRE_EPR_ID,
        value: envVars.SABRE_EPR_ID || 'none'
      }
    };

    logger.info('[DEBUG-SABRE] Environment variables:', envDebug);

    // Test authentication if credentials exist
    let authTest = null;
    let pccTests = [];
    
    if (envVars.SABRE_CLIENT_ID && envVars.SABRE_CLIENT_SECRET) {
      const credentials = btoa(`${envVars.SABRE_CLIENT_ID}:${envVars.SABRE_CLIENT_SECRET}`);
      const baseUrl = envVars.SABRE_BASE_URL || 'https://api-crt.cert.havail.sabre.com';
      
      // Test with TEST PCC
      if (envVars.SABRE_TEST_PCC) {
        try {
          logger.info('[DEBUG-SABRE] Testing with TEST PCC');
          
          const tokenResponse = await fetch(`${baseUrl}/v2/auth/token`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'PCC': envVars.SABRE_TEST_PCC
            },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              pcc: envVars.SABRE_TEST_PCC
            }),
          });

          const responseText = await tokenResponse.text();
          
          pccTests.push({
            type: 'test',
            pcc: envVars.SABRE_TEST_PCC,
            success: tokenResponse.ok,
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            hasToken: tokenResponse.ok && responseText.includes('access_token'),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 200)
          });

          logger.info('[DEBUG-SABRE] TEST PCC result:', pccTests[pccTests.length - 1]);
        } catch (error) {
          pccTests.push({
            type: 'test',
            pcc: envVars.SABRE_TEST_PCC,
            success: false,
            error: error.message
          });
          logger.error('[DEBUG-SABRE] TEST PCC failed:', error);
        }
      }
      
      // Test with PROD PCC
      if (envVars.SABRE_PROD_PCC) {
        try {
          logger.info('[DEBUG-SABRE] Testing with PROD PCC');
          
          const tokenResponse = await fetch(`${baseUrl}/v2/auth/token`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'PCC': envVars.SABRE_PROD_PCC
            },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              pcc: envVars.SABRE_PROD_PCC
            }),
          });

          const responseText = await tokenResponse.text();
          
          pccTests.push({
            type: 'prod',
            pcc: envVars.SABRE_PROD_PCC,
            success: tokenResponse.ok,
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            hasToken: tokenResponse.ok && responseText.includes('access_token'),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 200)
          });

          logger.info('[DEBUG-SABRE] PROD PCC result:', pccTests[pccTests.length - 1]);
        } catch (error) {
          pccTests.push({
            type: 'prod',
            pcc: envVars.SABRE_PROD_PCC,
            success: false,
            error: error.message
          });
          logger.error('[DEBUG-SABRE] PROD PCC failed:', error);
        }
      }
      
      // Legacy test (without PCC) for comparison
      try {
        logger.info('[DEBUG-SABRE] Testing without PCC (legacy)');
        
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
          type: 'legacy_no_pcc',
          success: tokenResponse.ok,
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          hasToken: tokenResponse.ok && responseText.includes('access_token'),
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 200)
        };

        logger.info('[DEBUG-SABRE] Legacy auth test result:', authTest);
      } catch (error) {
        authTest = {
          type: 'legacy_no_pcc',
          success: false,
          error: error.message
        };
        logger.error('[DEBUG-SABRE] Legacy auth test failed:', error);
      }
    }

    const result = {
      success: true,
      environment: envDebug,
      authTest,
      pccTests,
      recommendations: {
        requiresPCC: !pccTests.some(test => test.success) && authTest && !authTest.success,
        workingEnvironments: pccTests.filter(test => test.success).map(test => test.type),
        missingCredentials: Object.entries(envVars).filter(([key, value]) => !value).map(([key]) => key)
      },
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