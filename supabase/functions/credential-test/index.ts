import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { ENV_CONFIG, validateProviderCredentials, validateHotelBedsCredentials } from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProviderStatus {
  provider: string;
  credentialsValid: boolean;
  authSuccess: boolean;
  environment: string;
  error?: string;
}

interface CredentialTestResult {
  environment: string;
  providers: ProviderStatus[];
  summary: {
    total: number;
    working: number;
    failed: number;
  };
}

// Test individual provider authentication
async function testProviderAuth(provider: 'amadeus' | 'sabre' | 'hotelbeds'): Promise<ProviderStatus> {
  const correlationId = crypto.randomUUID();
  logger.info(`Testing ${provider} credentials`, { correlationId, provider });
  
  const result: ProviderStatus = {
    provider,
    credentialsValid: false,
    authSuccess: false,
    environment: ENV_CONFIG.isProduction ? 'production' : 'test',
    error: undefined
  };

  // Validate credentials based on provider type
  if (provider === 'amadeus' || provider === 'sabre') {
    result.credentialsValid = validateProviderCredentials(provider);
  } else if (provider === 'hotelbeds') {
    // Check both hotel and activity services for HotelBeds
    const hotelValid = validateHotelBedsCredentials('hotel');
    const activityValid = validateHotelBedsCredentials('activity');
    result.credentialsValid = hotelValid || activityValid;
    logger.info(`HotelBeds validation - hotel: ${hotelValid}, activity: ${activityValid}`, { correlationId });
  }

  if (!result.credentialsValid) {
    result.error = 'Missing credentials';
    logger.warn(`${provider} credentials missing`, { correlationId, provider });
    return result;
  }

  try {
    switch (provider) {
      case 'amadeus':
        await testAmadeusAuth();
        break;
      case 'sabre':
        await testSabreAuth();
        break;
      case 'hotelbeds':
        await testHotelbedsAuth();
        break;
    }
    result.authSuccess = true;
    logger.info(`${provider} authentication successful`, { correlationId, provider });
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`${provider} authentication failed`, error, { correlationId, provider });
  }

  return result;
}

// Map core provider results to UI provider format
function mapProvidersToUIFormat(coreResults: ProviderStatus[]): ProviderStatus[] {
  const uiProviders: ProviderStatus[] = [];
  
  for (const result of coreResults) {
    switch (result.provider) {
      case 'amadeus':
        // Map Amadeus to three services
        ['Amadeus Flight', 'Amadeus Hotel', 'Amadeus Activity'].forEach(serviceProvider => {
          uiProviders.push({
            ...result,
            provider: serviceProvider
          });
        });
        break;
        
      case 'sabre':
        // Map Sabre to two services
        ['Sabre Flight', 'Sabre Hotel'].forEach(serviceProvider => {
          uiProviders.push({
            ...result,
            provider: serviceProvider
          });
        });
        break;
        
      case 'hotelbeds':
        // Map HotelBeds to specific services based on credentials
        const hotelValid = validateHotelBedsCredentials('hotel');
        const activityValid = validateHotelBedsCredentials('activity');
        
        if (hotelValid) {
          uiProviders.push({
            ...result,
            provider: 'HotelBeds Hotel'
          });
        }
        
        if (activityValid) {
          uiProviders.push({
            ...result,
            provider: 'HotelBeds Activity'
          });
        }
        
        // If neither service has credentials, show both as failed
        if (!hotelValid && !activityValid) {
          ['HotelBeds Hotel', 'HotelBeds Activity'].forEach(serviceProvider => {
            uiProviders.push({
              ...result,
              provider: serviceProvider,
              credentialsValid: false,
              authSuccess: false,
              error: 'Missing credentials for this service'
            });
          });
        }
        break;
    }
  }
  
  return uiProviders;
}

async function testAmadeusAuth(): Promise<void> {
  const response = await fetch(ENV_CONFIG.amadeus.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: Deno.env.get('AMADEUS_CLIENT_ID')!,
      client_secret: Deno.env.get('AMADEUS_CLIENT_SECRET')!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }
}

async function testSabreAuth(): Promise<void> {
  // Use the existing Sabre access token function
  await getSabreAccessToken();
}

async function testHotelbedsAuth(): Promise<void> {
  // Try hotel service first, then activity service
  let lastError: string | undefined;
  
  // Test hotel service
  const hotelApiKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY');
  const hotelSecret = Deno.env.get('HOTELBEDS_HOTEL_SECRET');
  
  if (hotelApiKey && hotelSecret) {
    try {
      await testHotelBedsService(hotelApiKey, hotelSecret, 'hotel');
      return; // Success with hotel service
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Hotel service test failed';
    }
  }
  
  // Test activity service
  const activityApiKey = Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY');
  const activitySecret = Deno.env.get('HOTELBEDS_ACTIVITY_SECRET');
  
  if (activityApiKey && activitySecret) {
    try {
      await testHotelBedsService(activityApiKey, activitySecret, 'activity');
      return; // Success with activity service
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Activity service test failed';
    }
  }
  
  throw new Error(lastError || 'No valid HotelBeds credentials found');
}

async function testHotelBedsService(apiKey: string, secret: string, service: 'hotel' | 'activity'): Promise<void> {
  const correlationId = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  
  logger.info(`Testing HotelBeds ${service} service`, { correlationId, service, apiKey: apiKey.substring(0, 8) + '...' });
  
  // Create signature using Web Crypto API (Deno compatible)
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + secret + timestamp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const baseUrl = service === 'hotel' 
    ? ENV_CONFIG.hotelbeds.baseUrl 
    : ENV_CONFIG.hotelbeds.activityBaseUrl || ENV_CONFIG.hotelbeds.baseUrl;
    
  const endpoint = service === 'hotel' 
    ? '/hotel-content-api/1.0/types/boards'
    : '/activity-content-api/1.0/types/categories';

  logger.info(`Making HotelBeds ${service} test request`, { 
    correlationId, 
    endpoint: `${baseUrl}${endpoint}`,
    timestamp 
  });

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`HotelBeds ${service} API test failed`, { 
      correlationId, 
      status: response.status, 
      statusText: response.statusText,
      error: errorText 
    });
    throw new Error(`HotelBeds ${service} auth failed: ${response.status} ${errorText}`);
  }

  logger.info(`HotelBeds ${service} authentication successful`, { correlationId });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider } = await req.json().catch(() => ({}));

    if (provider && ['amadeus', 'sabre', 'hotelbeds'].includes(provider)) {
      // Test specific provider
      const result = await testProviderAuth(provider as 'amadeus' | 'sabre' | 'hotelbeds');
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Test all providers
      const results = await Promise.allSettled([
        testProviderAuth('amadeus'),
        testProviderAuth('sabre'),
        testProviderAuth('hotelbeds')
      ]);

      const testResults: ProviderStatus[] = results.map((result, index) => {
        const providers = ['amadeus', 'sabre', 'hotelbeds'];
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            provider: providers[index],
            credentialsValid: false,
            authSuccess: false,
            environment: ENV_CONFIG.isProduction ? 'production' : 'test',
            error: result.reason?.message || 'Test failed'
          };
        }
      });

      // Map core provider results to UI format
      const uiProviders = mapProvidersToUIFormat(testResults);
      
      const response: CredentialTestResult = {
        environment: ENV_CONFIG.isProduction ? 'production' : 'test',
        providers: uiProviders,
        summary: {
          total: uiProviders.length,
          working: uiProviders.filter(r => r.authSuccess).length,
          failed: uiProviders.filter(r => !r.authSuccess).length
        }
      };
      
      logger.info(`Credential test completed`, {
        total: uiProviders.length,
        working: uiProviders.filter(r => r.authSuccess).length,
        failed: uiProviders.filter(r => !r.authSuccess).length,
        providers: uiProviders.map(p => ({ name: p.provider, status: p.authSuccess ? 'working' : 'failed' }))
      });

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});