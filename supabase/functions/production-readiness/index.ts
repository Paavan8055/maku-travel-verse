import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { ENV_CONFIG, validateProductionReadiness, validateProviderCredentials, getMTLSConfig } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReadinessCheck {
  ready: boolean;
  issues: string[];
  warnings: string[];
  checks: {
    credentials: boolean;
    mtls: boolean;
    environment: boolean;
    endpoints: boolean;
  };
}

const performReadinessCheck = (): ReadinessCheck => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check provider credentials
  const credentialsCheck = {
    hotelbeds: validateProviderCredentials('hotelbeds'),
    amadeus: validateProviderCredentials('amadeus'),
    sabre: validateProviderCredentials('sabre')
  };
  
  if (!credentialsCheck.hotelbeds) {
    issues.push('HotelBeds credentials not configured');
  }
  if (!credentialsCheck.amadeus) {
    warnings.push('Amadeus credentials not configured');
  }
  if (!credentialsCheck.sabre) {
    warnings.push('Sabre credentials not configured');
  }
  
  // Check mTLS configuration
  const mtlsConfig = getMTLSConfig();
  if (ENV_CONFIG.isProduction && !mtlsConfig.enabled) {
    issues.push('mTLS certificates not configured for production');
  }
  
  // Check environment configuration
  if (!ENV_CONFIG.isProduction) {
    warnings.push('Using test environment - switch to production for live bookings');
  }
  
  // Check Stripe configuration
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    issues.push('Stripe secret key not configured');
  } else if (stripeKey.startsWith('sk_test_') && ENV_CONFIG.isProduction) {
    warnings.push('Using Stripe test keys in production environment');
  }
  
  // Check endpoint configurations
  const endpointIssues = [];
  if (ENV_CONFIG.isProduction) {
    if (!ENV_CONFIG.hotelbeds.baseUrl.includes('api.hotelbeds.com')) {
      endpointIssues.push('HotelBeds production endpoint not configured');
    }
    if (!ENV_CONFIG.amadeus.baseUrl.includes('api.amadeus.com')) {
      endpointIssues.push('Amadeus production endpoint not configured');
    }
  }
  
  return {
    ready: issues.length === 0,
    issues,
    warnings,
    checks: {
      credentials: credentialsCheck.hotelbeds && credentialsCheck.amadeus,
      mtls: ENV_CONFIG.isProduction ? mtlsConfig.enabled : true,
      environment: ENV_CONFIG.isProduction,
      endpoints: endpointIssues.length === 0
    }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    console.log('[PRODUCTION-READINESS] Performing readiness check');

    if (action === 'validate') {
      const readinessCheck = performReadinessCheck();
      
      console.log('[PRODUCTION-READINESS] Check results:', {
        ready: readinessCheck.ready,
        issueCount: readinessCheck.issues.length,
        warningCount: readinessCheck.warnings.length
      });

      return new Response(JSON.stringify({
        success: true,
        readiness: readinessCheck,
        environment: {
          current: ENV_CONFIG.isProduction ? 'production' : 'test',
          hotelbeds: ENV_CONFIG.hotelbeds,
          amadeus: ENV_CONFIG.amadeus,
          sabre: ENV_CONFIG.sabre
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action',
      availableActions: ['validate']
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PRODUCTION-READINESS] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});