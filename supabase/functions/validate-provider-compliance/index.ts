import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import { generateHotelBedsSignature } from "../_shared/hotelbeds.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceTestResult {
  provider: string;
  service: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  recommendations?: string[];
}

async function testAmadeusCompliance(): Promise<ComplianceTestResult[]> {
  const results: ComplianceTestResult[] = [];
  
  // Test Amadeus OAuth 2.0 compliance
  try {
    const response = await fetch(`${ENV_CONFIG.amadeus.tokenUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ENV_CONFIG.AMADEUS_CLIENT_ID || '',
        client_secret: ENV_CONFIG.AMADEUS_CLIENT_SECRET || '',
      }),
    });
    
    if (response.ok) {
      const tokenData = await response.json();
      results.push({
        provider: 'amadeus',
        service: 'authentication',
        test: 'oauth2_compliance',
        status: 'pass',
        message: 'OAuth 2.0 client credentials flow working correctly',
        details: { token_type: tokenData.token_type, expires_in: tokenData.expires_in }
      });
    } else {
      const errorData = await response.text();
      results.push({
        provider: 'amadeus',
        service: 'authentication',
        test: 'oauth2_compliance',
        status: 'fail',
        message: `OAuth 2.0 authentication failed: ${response.status}`,
        details: { error: errorData },
        recommendations: ['Verify client credentials', 'Check API endpoint environment']
      });
    }
  } catch (error) {
    results.push({
      provider: 'amadeus',
      service: 'authentication',
      test: 'oauth2_compliance',
      status: 'fail',
      message: 'OAuth 2.0 endpoint unreachable',
      details: { error: error.message },
      recommendations: ['Check network connectivity', 'Verify API URL']
    });
  }
  
  // Test Amadeus API endpoint URLs
  const expectedUrls = {
    test: 'https://test.api.amadeus.com',
    production: 'https://api.amadeus.com'
  };
  
  const currentBaseUrl = ENV_CONFIG.amadeus.baseUrl;
  const isProduction = ENV_CONFIG.isProduction;
  const expectedUrl = isProduction ? expectedUrls.production : expectedUrls.test;
  
  results.push({
    provider: 'amadeus',
    service: 'configuration',
    test: 'endpoint_urls',
    status: currentBaseUrl === expectedUrl ? 'pass' : 'fail',
    message: `Base URL ${currentBaseUrl === expectedUrl ? 'matches' : 'does not match'} expected ${expectedUrl}`,
    details: { current: currentBaseUrl, expected: expectedUrl, environment: isProduction ? 'production' : 'test' },
    recommendations: currentBaseUrl !== expectedUrl ? ['Update base URL to match environment'] : []
  });
  
  return results;
}

async function testSabreCompliance(): Promise<ComplianceTestResult[]> {
  const results: ComplianceTestResult[] = [];
  
  // Test Sabre PCC configuration
  const pcc = Deno.env.get('SABRE_PCC');
  results.push({
    provider: 'sabre',
    service: 'configuration',
    test: 'pcc_configuration',
    status: pcc ? 'pass' : 'warning',
    message: pcc ? `PCC configured: ${pcc}` : 'PCC not configured - may cause authentication issues',
    recommendations: pcc ? [] : ['Add SABRE_PCC secret with your travel agent PCC code']
  });
  
  // Test Sabre OAuth 2.0 with PCC
  try {
    const credentials = btoa(`${ENV_CONFIG.SABRE_CLIENT_ID}:${ENV_CONFIG.SABRE_CLIENT_SECRET}`);
    
    const response = await fetch(ENV_CONFIG.sabre.tokenUrl, {
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
    
    if (response.ok) {
      const tokenData = await response.json();
      results.push({
        provider: 'sabre',
        service: 'authentication',
        test: 'oauth2_with_pcc',
        status: 'pass',
        message: 'OAuth 2.0 authentication with PCC successful',
        details: { access_token_length: tokenData.access_token?.length }
      });
    } else {
      const errorData = await response.text();
      results.push({
        provider: 'sabre',
        service: 'authentication',
        test: 'oauth2_with_pcc',
        status: 'fail',
        message: `Authentication failed: ${response.status}`,
        details: { error: errorData },
        recommendations: [
          'Verify client credentials',
          'Ensure PCC is valid and associated with your account',
          'Check account permissions and status'
        ]
      });
    }
  } catch (error) {
    results.push({
      provider: 'sabre',
      service: 'authentication',
      test: 'oauth2_with_pcc',
      status: 'fail',
      message: 'Authentication endpoint unreachable',
      details: { error: error.message },
      recommendations: ['Check network connectivity', 'Verify API URL']
    });
  }
  
  // Test Sabre API endpoint URLs
  const expectedUrls = {
    test: 'https://api-crt.cert.havail.sabre.com',
    production: 'https://api.sabre.com'
  };
  
  const currentBaseUrl = ENV_CONFIG.sabre.baseUrl;
  const isProduction = ENV_CONFIG.isProduction;
  const expectedUrl = isProduction ? expectedUrls.production : expectedUrls.test;
  
  results.push({
    provider: 'sabre',
    service: 'configuration',
    test: 'endpoint_urls',
    status: currentBaseUrl === expectedUrl ? 'pass' : 'fail',
    message: `Base URL ${currentBaseUrl === expectedUrl ? 'matches' : 'does not match'} expected ${expectedUrl}`,
    details: { current: currentBaseUrl, expected: expectedUrl, environment: isProduction ? 'production' : 'test' },
    recommendations: currentBaseUrl !== expectedUrl ? ['Update base URL to match environment'] : []
  });
  
  return results;
}

async function testHotelBedsCompliance(): Promise<ComplianceTestResult[]> {
  const results: ComplianceTestResult[] = [];
  
  // Test HotelBeds signature generation (SHA-256 compliance)
  try {
    const { signature, timestamp, apiKey } = await generateHotelBedsSignature('hotel');
    
    // Verify signature format (should be 64 characters hex)
    const isValidHex = /^[a-f0-9]{64}$/i.test(signature);
    results.push({
      provider: 'hotelbeds',
      service: 'authentication',
      test: 'signature_algorithm',
      status: isValidHex ? 'pass' : 'fail',
      message: isValidHex ? 'SHA-256 signature generation compliant' : 'Invalid signature format',
      details: { 
        signatureLength: signature.length, 
        isHex: isValidHex,
        algorithm: 'SHA-256'
      },
      recommendations: isValidHex ? [] : ['Fix signature generation algorithm']
    });
  } catch (error) {
    results.push({
      provider: 'hotelbeds',
      service: 'authentication',
      test: 'signature_algorithm',
      status: 'fail',
      message: 'Signature generation failed',
      details: { error: error.message },
      recommendations: ['Check HotelBeds credentials configuration']
    });
  }
  
  // Test HotelBeds API endpoints
  const expectedUrls = {
    test: 'https://api.test.hotelbeds.com',
    production: 'https://api.hotelbeds.com'
  };
  
  const currentBaseUrl = ENV_CONFIG.hotelbeds.baseUrl;
  const isProduction = ENV_CONFIG.isProduction;
  const expectedUrl = isProduction ? expectedUrls.production : expectedUrls.test;
  
  results.push({
    provider: 'hotelbeds',
    service: 'configuration',
    test: 'endpoint_urls',
    status: currentBaseUrl === expectedUrl ? 'pass' : 'fail',
    message: `Base URL ${currentBaseUrl === expectedUrl ? 'matches' : 'does not match'} expected ${expectedUrl}`,
    details: { current: currentBaseUrl, expected: expectedUrl, environment: isProduction ? 'production' : 'test' },
    recommendations: currentBaseUrl !== expectedUrl ? ['Update base URL to match environment'] : []
  });
  
  // Test HotelBeds hotel authentication
  try {
    const { signature, timestamp, apiKey } = await generateHotelBedsSignature('hotel');
    
    const response = await fetch(`${ENV_CONFIG.hotelbeds.hotel.baseUrl}/hotel-api/1.0/status`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json',
      }
    });
    
    results.push({
      provider: 'hotelbeds',
      service: 'hotels',
      test: 'api_authentication',
      status: response.ok ? 'pass' : 'fail',
      message: response.ok ? 'Hotel API authentication successful' : `Authentication failed: ${response.status}`,
      details: { statusCode: response.status },
      recommendations: response.ok ? [] : [
        'Verify hotel API credentials',
        'Check account permissions',
        'Verify IP whitelisting'
      ]
    });
  } catch (error) {
    results.push({
      provider: 'hotelbeds',
      service: 'hotels',
      test: 'api_authentication',
      status: 'fail',
      message: 'Hotel API unreachable',
      details: { error: error.message },
      recommendations: ['Check network connectivity', 'Verify API credentials']
    });
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[COMPLIANCE-VALIDATOR] Starting provider compliance validation');

    const [amadeusResults, sabreResults, hotelBedsResults] = await Promise.all([
      testAmadeusCompliance(),
      testSabreCompliance(),
      testHotelBedsCompliance()
    ]);

    const allResults = [...amadeusResults, ...sabreResults, ...hotelBedsResults];
    
    const summary = {
      total: allResults.length,
      passed: allResults.filter(r => r.status === 'pass').length,
      failed: allResults.filter(r => r.status === 'fail').length,
      warnings: allResults.filter(r => r.status === 'warning').length,
      complianceScore: Math.round((allResults.filter(r => r.status === 'pass').length / allResults.length) * 100)
    };

    const failedTests = allResults.filter(r => r.status === 'fail');
    const recommendations = allResults
      .filter(r => r.recommendations && r.recommendations.length > 0)
      .flatMap(r => r.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index);

    logger.info('[COMPLIANCE-VALIDATOR] Validation completed', {
      complianceScore: summary.complianceScore,
      failedTests: failedTests.length
    });

    return new Response(JSON.stringify({
      success: true,
      summary,
      results: allResults,
      failedTests,
      recommendations,
      timestamp: new Date().toISOString(),
      complianceLevel: summary.complianceScore >= 90 ? 'excellent' : 
                       summary.complianceScore >= 70 ? 'good' : 
                       summary.complianceScore >= 50 ? 'fair' : 'poor'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('[COMPLIANCE-VALIDATOR] Validation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Compliance validation failed',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});