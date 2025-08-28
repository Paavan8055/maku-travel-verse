import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import { generateHotelBedsSignature } from "../_shared/hotelbeds.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndpointTestResult {
  provider: string;
  service: string;
  endpoint: string;
  status: 'success' | 'error' | 'auth_error' | 'endpoint_error';
  responseTime: number;
  statusCode?: number;
  error?: string;
  recommendations?: string[];
}

async function validateAmadeusEndpoints(): Promise<EndpointTestResult[]> {
  const results: EndpointTestResult[] = [];
  
  // Test Amadeus OAuth endpoint
  const startTime = Date.now();
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
    
    results.push({
      provider: 'amadeus',
      service: 'authentication',
      endpoint: ENV_CONFIG.amadeus.tokenUrl,
      status: response.ok ? 'success' : 'auth_error',
      responseTime: Date.now() - startTime,
      statusCode: response.status,
      recommendations: response.ok ? [] : ['Verify Amadeus client credentials', 'Check environment (test vs production)']
    });
  } catch (error) {
    results.push({
      provider: 'amadeus',
      service: 'authentication',
      endpoint: ENV_CONFIG.amadeus.tokenUrl,
      status: 'endpoint_error',
      responseTime: Date.now() - startTime,
      error: error.message,
      recommendations: ['Check network connectivity', 'Verify API endpoint URL']
    });
  }
  
  return results;
}

async function validateSabreEndpoints(): Promise<EndpointTestResult[]> {
  const results: EndpointTestResult[] = [];
  
  // Test Sabre OAuth endpoint with PCC
  const startTime = Date.now();
  try {
    const credentials = btoa(`${ENV_CONFIG.SABRE_CLIENT_ID}:${ENV_CONFIG.SABRE_CLIENT_SECRET}`);
    const isProduction = ENV_CONFIG.isProduction;
    const pcc = isProduction 
      ? Deno.env.get('SABRE_PROD_PCC') 
      : Deno.env.get('SABRE_TEST_PCC');
    
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
    
    results.push({
      provider: 'sabre',
      service: 'authentication',
      endpoint: ENV_CONFIG.sabre.tokenUrl,
      status: response.ok ? 'success' : 'auth_error',
      responseTime: Date.now() - startTime,
      statusCode: response.status,
      recommendations: response.ok ? [] : [
        'Verify Sabre client credentials',
        pcc ? 'Check PCC validity' : 'Add SABRE_PCC to secrets',
        'Verify account permissions'
      ]
    });
  } catch (error) {
    results.push({
      provider: 'sabre',
      service: 'authentication',
      endpoint: ENV_CONFIG.sabre.tokenUrl,
      status: 'endpoint_error',
      responseTime: Date.now() - startTime,
      error: error.message,
      recommendations: ['Check network connectivity', 'Verify API endpoint URL']
    });
  }
  
  return results;
}

async function validateHotelBedsEndpoints(): Promise<EndpointTestResult[]> {
  const results: EndpointTestResult[] = [];
  
  // Test HotelBeds Hotels endpoint
  const hotelStartTime = Date.now();
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
      endpoint: `${ENV_CONFIG.hotelbeds.hotel.baseUrl}/hotel-api/1.0/status`,
      status: response.ok ? 'success' : 'auth_error',
      responseTime: Date.now() - hotelStartTime,
      statusCode: response.status,
      recommendations: response.ok ? [] : [
        'Verify HotelBeds hotel API credentials',
        'Check account status and permissions',
        'Verify IP whitelisting'
      ]
    });
  } catch (error) {
    results.push({
      provider: 'hotelbeds',
      service: 'hotels',
      endpoint: `${ENV_CONFIG.hotelbeds.hotel.baseUrl}/hotel-api/1.0/status`,
      status: 'endpoint_error',
      responseTime: Date.now() - hotelStartTime,
      error: error.message,
      recommendations: ['Check network connectivity', 'Verify credentials configuration']
    });
  }
  
  // Test HotelBeds Activities endpoint
  const activityStartTime = Date.now();
  try {
    const { signature, timestamp, apiKey } = await generateHotelBedsSignature('activity');
    
    const response = await fetch(`${ENV_CONFIG.hotelbeds.activity.baseUrl}/activity-api/3.0/status`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json',
      }
    });
    
    results.push({
      provider: 'hotelbeds',
      service: 'activities',
      endpoint: `${ENV_CONFIG.hotelbeds.activity.baseUrl}/activity-api/3.0/status`,
      status: response.ok ? 'success' : 'auth_error',
      responseTime: Date.now() - activityStartTime,
      statusCode: response.status,
      recommendations: response.ok ? [] : [
        'Verify HotelBeds activity API credentials',
        'Check account status and permissions',
        'Verify activity-specific access'
      ]
    });
  } catch (error) {
    results.push({
      provider: 'hotelbeds',
      service: 'activities',
      endpoint: `${ENV_CONFIG.hotelbeds.activity.baseUrl}/activity-api/3.0/status`,
      status: 'endpoint_error',
      responseTime: Date.now() - activityStartTime,
      error: error.message,
      recommendations: ['Check network connectivity', 'Verify credentials configuration']
    });
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[ENDPOINT-VALIDATOR] Starting provider endpoint validation');

    const [amadeusResults, sabreResults, hotelBedsResults] = await Promise.all([
      validateAmadeusEndpoints(),
      validateSabreEndpoints(),
      validateHotelBedsEndpoints()
    ]);

    const allResults = [...amadeusResults, ...sabreResults, ...hotelBedsResults];
    
    const summary = {
      total: allResults.length,
      successful: allResults.filter(r => r.status === 'success').length,
      authErrors: allResults.filter(r => r.status === 'auth_error').length,
      endpointErrors: allResults.filter(r => r.status === 'endpoint_error').length,
      avgResponseTime: Math.round(allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length)
    };

    const recommendations = allResults
      .filter(r => r.recommendations && r.recommendations.length > 0)
      .flatMap(r => r.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates

    logger.info('[ENDPOINT-VALIDATOR] Validation completed', summary);

    return new Response(JSON.stringify({
      success: true,
      summary,
      results: allResults,
      recommendations,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('[ENDPOINT-VALIDATOR] Validation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Endpoint validation failed',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});