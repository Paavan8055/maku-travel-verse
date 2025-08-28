import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '';
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';

    if (!publishableKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_PUBLISHABLE_KEY not set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Detect test mode and validate key consistency
    const isTestMode = publishableKey.startsWith('pk_test_');
    const isSecretTest = secretKey.startsWith('sk_test_');
    
    // Warn if keys don't match environments
    if (isTestMode !== isSecretTest) {
      console.warn('Stripe key environment mismatch detected');
    }

    return new Response(
      JSON.stringify({ 
        publishableKey,
        isTestMode,
        environment: isTestMode ? 'test' : 'live'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});