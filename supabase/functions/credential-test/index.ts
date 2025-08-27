import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ENV_CONFIG, validateProviderCredentials, validateHotelBedsCredentials } from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";

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
  }

  if (!result.credentialsValid) {
    result.error = 'Missing credentials';
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
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
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
  const timestamp = Math.floor(Date.now() / 1000);
  
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

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HotelBeds ${service} auth failed: ${response.statusText}`);
  }
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

      const response: CredentialTestResult = {
        environment: ENV_CONFIG.isProduction ? 'production' : 'test',
        providers: testResults,
        summary: {
          total: testResults.length,
          working: testResults.filter(r => r.authSuccess).length,
          failed: testResults.filter(r => !r.authSuccess).length
        }
      };

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