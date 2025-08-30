import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ENV_CONFIG, validateProviderCredentials, validateHotelBedsCredentials } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test individual provider authentication
async function testProviderAuth(provider: 'amadeus' | 'sabre' | 'hotelbeds'): Promise<{
  provider: string;
  credentialsValid: boolean;
  authSuccess: boolean;
  error?: string;
  environment: string;
}> {
  const result = {
    provider,
    credentialsValid: provider === 'hotelbeds' ? 
      validateHotelBedsCredentials('hotel') : 
      validateProviderCredentials(provider),
    authSuccess: false,
    environment: ENV_CONFIG.isProduction ? 'production' : 'test',
    error: undefined as string | undefined
  };

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
  const credentials = btoa(`${Deno.env.get('SABRE_CLIENT_ID')}:${Deno.env.get('SABRE_CLIENT_SECRET')}`);
  
  const response = await fetch(ENV_CONFIG.sabre.tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Sabre auth failed: ${response.statusText}`);
  }
}

async function testHotelbedsAuth(): Promise<void> {
  // HotelBeds uses API key authentication - test with a simple info request
  const apiKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY')!;
  const secret = Deno.env.get('HOTELBEDS_HOTEL_SECRET')!;
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create signature for HotelBeds using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey + secret + timestamp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const response = await fetch(`${ENV_CONFIG.hotelbeds.baseUrl}/hotel-content-api/1.0/types/boards`, {
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HotelBeds auth failed: ${response.statusText}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider } = await req.json();

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

      const testResults = results.map((result, index) => {
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

      return new Response(JSON.stringify({
        environment: ENV_CONFIG.isProduction ? 'production' : 'test',
        providers: testResults,
        summary: {
          total: testResults.length,
          working: testResults.filter(r => r.authSuccess).length,
          failed: testResults.filter(r => !r.authSuccess).length
        }
      }), {
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