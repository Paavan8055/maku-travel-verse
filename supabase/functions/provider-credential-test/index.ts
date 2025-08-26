import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getAmadeusAccessToken } from "../_shared/amadeus.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import { generateHotelBedsSignature } from "../_shared/hotelbeds.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CredentialTestResult {
  provider: string;
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  responseTime: number;
  details?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, service } = await req.json().catch(() => ({ provider: 'all', service: 'all' }));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    logger.info('[CREDENTIAL-TEST] Starting credential tests', { provider, service });

    const results: CredentialTestResult[] = [];

    // Test Amadeus credentials
    if (provider === 'all' || provider === 'amadeus') {
      await testAmadeusCredentials(results);
    }

    // Test Sabre credentials
    if (provider === 'all' || provider === 'sabre') {
      await testSabreCredentials(results);
    }

    // Test HotelBeds credentials
    if (provider === 'all' || provider === 'hotelbeds') {
      await testHotelBedsCredentials(results, service);
    }

    // Update provider_configs with test results
    for (const result of results) {
      const providerId = `${result.provider}-${result.service}`;
      const healthScore = result.status === 'success' ? 100 : 
                         result.status === 'warning' ? 50 : 0;

      await supabase
        .from('provider_configs')
        .update({
          health_score: healthScore,
          response_time: result.responseTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      // Also update provider_health
      await supabase
        .from('provider_health')
        .upsert({
          provider: providerId,
          status: result.status === 'success' ? 'healthy' : 'error',
          response_time_ms: result.responseTime,
          error_message: result.status !== 'success' ? result.message : null,
          last_checked: new Date().toISOString(),
          metadata: { 
            credentialsValid: result.status === 'success',
            testDetails: result.details 
          }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        warnings: results.filter(r => r.status === 'warning').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[CREDENTIAL-TEST] Test failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function testAmadeusCredentials(results: CredentialTestResult[]): Promise<void> {
  const startTime = Date.now();
  
  try {
    if (!ENV_CONFIG.AMADEUS_CLIENT_ID || !ENV_CONFIG.AMADEUS_CLIENT_SECRET) {
      results.push({
        provider: 'amadeus',
        service: 'flight',
        status: 'error',
        message: 'Missing Amadeus credentials',
        responseTime: 0,
        details: { hasClientId: !!ENV_CONFIG.AMADEUS_CLIENT_ID, hasSecret: !!ENV_CONFIG.AMADEUS_CLIENT_SECRET }
      });
      return;
    }

    const token = await getAmadeusAccessToken();
    const responseTime = Date.now() - startTime;

    if (token) {
      results.push({
        provider: 'amadeus',
        service: 'flight',
        status: 'success',
        message: 'Amadeus authentication successful',
        responseTime,
        details: { tokenLength: token.length }
      });
    } else {
      results.push({
        provider: 'amadeus',
        service: 'flight',
        status: 'error',
        message: 'Failed to obtain Amadeus access token',
        responseTime
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.push({
      provider: 'amadeus',
      service: 'flight',
      status: 'error',
      message: `Amadeus credential test failed: ${error.message}`,
      responseTime,
      details: { error: error.message }
    });
  }
}

async function testSabreCredentials(results: CredentialTestResult[]): Promise<void> {
  const startTime = Date.now();
  
  try {
    if (!ENV_CONFIG.SABRE_CLIENT_ID || !ENV_CONFIG.SABRE_CLIENT_SECRET) {
      results.push({
        provider: 'sabre',
        service: 'flight',
        status: 'error',
        message: 'Missing Sabre credentials',
        responseTime: 0,
        details: { hasClientId: !!ENV_CONFIG.SABRE_CLIENT_ID, hasSecret: !!ENV_CONFIG.SABRE_CLIENT_SECRET }
      });
      return;
    }

    const token = await getSabreAccessToken();
    const responseTime = Date.now() - startTime;

    if (token) {
      results.push({
        provider: 'sabre',
        service: 'flight',
        status: 'success',
        message: 'Sabre authentication successful',
        responseTime,
        details: { tokenLength: token.length }
      });
    } else {
      results.push({
        provider: 'sabre',
        service: 'flight',
        status: 'error',
        message: 'Failed to obtain Sabre access token',
        responseTime
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.push({
      provider: 'sabre',
      service: 'flight',
      status: 'error',
      message: `Sabre credential test failed: ${error.message}`,
      responseTime,
      details: { error: error.message }
    });
  }
}

async function testHotelBedsCredentials(results: CredentialTestResult[], service: string): Promise<void> {
  const services = service === 'all' ? ['hotel', 'activity'] : [service];
  
  for (const svc of services) {
    if (svc !== 'hotel' && svc !== 'activity') continue;
    
    const startTime = Date.now();
    
    try {
      const { signature, timestamp, apiKey } = await generateHotelBedsSignature(svc as 'hotel' | 'activity');
      const responseTime = Date.now() - startTime;

      if (signature && apiKey) {
        // Test actual API call to validate credentials
        const testUrl = svc === 'hotel' 
          ? `${ENV_CONFIG.hotelbeds.hotel.baseUrl}/hotel-content-api/1.0/types/countries`
          : `${ENV_CONFIG.hotelbeds.activity.baseUrl}/activity-content-api/1.0/types/countries`;

        const testStartTime = Date.now();
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Api-key': apiKey,
            'X-Signature': signature,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const testResponseTime = Date.now() - testStartTime;

        if (response.ok) {
          results.push({
            provider: 'hotelbeds',
            service: svc,
            status: 'success',
            message: `HotelBeds ${svc} API credentials valid`,
            responseTime: testResponseTime,
            details: { 
              apiKey: apiKey.substring(0, 8) + '...', 
              signatureLength: signature.length,
              httpStatus: response.status
            }
          });
        } else if (response.status === 403) {
          results.push({
            provider: 'hotelbeds',
            service: svc,
            status: 'error',
            message: `HotelBeds ${svc} API credentials invalid (403 Forbidden)`,
            responseTime: testResponseTime,
            details: { httpStatus: response.status, statusText: response.statusText }
          });
        } else {
          results.push({
            provider: 'hotelbeds',
            service: svc,
            status: 'warning',
            message: `HotelBeds ${svc} API responded with status ${response.status}`,
            responseTime: testResponseTime,
            details: { httpStatus: response.status, statusText: response.statusText }
          });
        }
      } else {
        results.push({
          provider: 'hotelbeds',
          service: svc,
          status: 'error',
          message: `Failed to generate HotelBeds ${svc} signature`,
          responseTime
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        provider: 'hotelbeds',
        service: svc,
        status: 'error',
        message: `HotelBeds ${svc} credential test failed: ${error.message}`,
        responseTime,
        details: { error: error.message }
      });
    }
  }
}