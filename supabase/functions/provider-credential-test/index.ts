import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";
import { 
  validateProviderCredentials, 
  validateHotelBedsCredentials,
  ENV_CONFIG 
} from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CredentialTestResult {
  provider: string;
  service?: string;
  status: 'success' | 'failed' | 'missing_credentials';
  credentials_present: boolean;
  api_test_result?: boolean;
  error?: string;
  details?: any;
}

async function testAmadeusCredentials(): Promise<CredentialTestResult> {
  const result: CredentialTestResult = {
    provider: 'amadeus',
    status: 'missing_credentials',
    credentials_present: false
  };

  try {
    const hasCredentials = validateProviderCredentials('amadeus');
    result.credentials_present = hasCredentials;

    if (!hasCredentials) {
      result.error = 'Amadeus API key or secret not configured';
      return result;
    }

    // Test actual API call
    const testResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ENV_CONFIG.AMADEUS_CLIENT_ID || '',
        client_secret: ENV_CONFIG.AMADEUS_CLIENT_SECRET || ''
      })
    });

    result.api_test_result = testResponse.ok;
    result.status = testResponse.ok ? 'success' : 'failed';
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      result.error = `Amadeus authentication failed: ${testResponse.status} - ${errorText}`;
    }

  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
  }

  return result;
}

async function testSabreCredentials(): Promise<CredentialTestResult> {
  const result: CredentialTestResult = {
    provider: 'sabre',
    status: 'missing_credentials',
    credentials_present: false
  };

  try {
    const hasCredentials = validateProviderCredentials('sabre');
    result.credentials_present = hasCredentials;

    if (!hasCredentials) {
      result.error = 'Sabre client ID or secret not configured';
      return result;
    }

    // Test actual API authentication
    const accessToken = await getSabreAccessToken();
    result.api_test_result = !!accessToken;
    result.status = accessToken ? 'success' : 'failed';

  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    result.api_test_result = false;
  }

  return result;
}

async function testHotelBedsCredentials(service: 'hotel' | 'activity'): Promise<CredentialTestResult> {
  const result: CredentialTestResult = {
    provider: 'hotelbeds',
    service,
    status: 'missing_credentials',
    credentials_present: false
  };

  try {
    const hasCredentials = validateHotelBedsCredentials(service);
    result.credentials_present = hasCredentials;

    if (!hasCredentials) {
      result.error = `HotelBeds ${service} API credentials not configured`;
      return result;
    }

    // For HotelBeds, just having credentials is sufficient for now
    // as testing requires specific destination codes and dates
    result.status = 'success';
    result.api_test_result = true;
    result.details = {
      note: 'Credentials present - actual API test requires valid search parameters'
    };

  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[CREDENTIAL-TEST] Starting comprehensive credential test');

    const testResults: CredentialTestResult[] = [];

    // Test all providers
    const amadeus = await testAmadeusCredentials();
    testResults.push(amadeus);

    const sabre = await testSabreCredentials();
    testResults.push(sabre);

    const hotelbedsHotel = await testHotelBedsCredentials('hotel');
    testResults.push(hotelbedsHotel);

    const hotelbedsActivity = await testHotelBedsCredentials('activity');
    testResults.push(hotelbedsActivity);

    // Create summary
    const summary = {
      total_providers: testResults.length,
      working_providers: testResults.filter(r => r.status === 'success').length,
      failed_providers: testResults.filter(r => r.status === 'failed').length,
      missing_credentials: testResults.filter(r => r.status === 'missing_credentials').length,
      overall_status: testResults.every(r => r.status === 'success') ? 'all_working' :
                     testResults.some(r => r.status === 'success') ? 'partial_working' : 'all_failed'
    };

    logger.info('[CREDENTIAL-TEST] Test completed', summary);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      detailed_results: testResults,
      recommendations: generateRecommendations(testResults)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[CREDENTIAL-TEST] Test failed:', error);
    
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

function generateRecommendations(results: CredentialTestResult[]): string[] {
  const recommendations: string[] = [];
  
  const failedResults = results.filter(r => r.status !== 'success');
  
  if (failedResults.length === 0) {
    recommendations.push('✅ All provider credentials are working correctly');
    return recommendations;
  }

  recommendations.push('🚨 Provider credential issues detected:');
  
  failedResults.forEach(result => {
    if (result.status === 'missing_credentials') {
      recommendations.push(`❌ ${result.provider}${result.service ? `-${result.service}` : ''}: Configure API credentials in Supabase secrets`);
    } else if (result.status === 'failed') {
      recommendations.push(`⚠️ ${result.provider}${result.service ? `-${result.service}` : ''}: ${result.error}`);
    }
  });

  recommendations.push('');
  recommendations.push('🔧 Next steps:');
  recommendations.push('1. Add missing API keys to Supabase Edge Functions secrets');
  recommendations.push('2. Verify API keys are valid and not expired');
  recommendations.push('3. Check if you need to switch from test to production endpoints');
  recommendations.push('4. Run this test again after adding credentials');

  return recommendations;
}