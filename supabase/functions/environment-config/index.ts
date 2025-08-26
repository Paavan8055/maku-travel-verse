import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ENV_CONFIG, validateProductionReadiness, getMTLSConfig } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, environment } = await req.json().catch(() => ({ action: 'get_config' }));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'get_config':
        console.log('[ENVIRONMENT-CONFIG] Getting current configuration');
        
        // Get current environment from database
        const { data: envConfig } = await supabase
          .from('environment_configs')
          .select('*')
          .eq('config_key', 'current_environment')
          .eq('is_active', true)
          .single();

        const currentEnv = envConfig?.config_value?.active_environment || 'test';
        const isProduction = currentEnv === 'production';
        
        const currentConfig = {
          isProduction,
          hotelbeds: {
            hotel: { baseUrl: isProduction ? "https://api.hotelbeds.com" : "https://api.test.hotelbeds.com" },
            activity: { baseUrl: isProduction ? "https://api.hotelbeds.com" : "https://api.test.hotelbeds.com" }
          },
          amadeus: {
            baseUrl: isProduction ? "https://api.amadeus.com" : "https://test.api.amadeus.com",
            tokenUrl: isProduction ? "https://api.amadeus.com/v1/security/oauth2/token" : "https://test.api.amadeus.com/v1/security/oauth2/token"
          },
          sabre: {
            baseUrl: isProduction ? "https://api.sabre.com" : "https://api-crt.cert.havail.sabre.com",
            tokenUrl: isProduction ? "https://api.sabre.com/v2/auth/token" : "https://api-crt.cert.havail.sabre.com/v2/auth/token"
          },
          mtls: getMTLSConfig(),
          environment: currentEnv
        };

        return new Response(JSON.stringify(currentConfig), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'switch_environment':
        console.log(`[ENVIRONMENT-CONFIG] Switching to ${environment} environment`);
        
        // In a real implementation, this would update environment variables
        // For now, we'll store the preference in the database
        const { error: insertError } = await supabase
          .from('environment_configs')
          .upsert({
            environment: environment,
            config_key: 'current_environment',
            config_value: { active_environment: environment },
            is_active: true
          });

        if (insertError) {
          throw insertError;
        }

        // Get updated config after environment switch
        const { data: updatedEnvConfig } = await supabase
          .from('environment_configs')
          .select('*')
          .eq('config_key', 'current_environment')
          .eq('is_active', true)
          .single();

        const newEnv = updatedEnvConfig?.config_value?.active_environment || environment;
        const newIsProduction = newEnv === 'production';

        const newConfig = {
          isProduction: newIsProduction,
          hotelbeds: {
            hotel: { baseUrl: newIsProduction ? "https://api.hotelbeds.com" : "https://api.test.hotelbeds.com" },
            activity: { baseUrl: newIsProduction ? "https://api.hotelbeds.com" : "https://api.test.hotelbeds.com" }
          },
          amadeus: {
            baseUrl: newIsProduction ? "https://api.amadeus.com" : "https://test.api.amadeus.com",
            tokenUrl: newIsProduction ? "https://api.amadeus.com/v1/security/oauth2/token" : "https://test.api.amadeus.com/v1/security/oauth2/token"
          },
          sabre: {
            baseUrl: newIsProduction ? "https://api.sabre.com" : "https://api-crt.cert.havail.sabre.com",
            tokenUrl: newIsProduction ? "https://api.sabre.com/v2/auth/token" : "https://api-crt.cert.havail.sabre.com/v2/auth/token"
          },
          mtls: getMTLSConfig(),
          environment: newEnv
        };

        return new Response(JSON.stringify(newConfig), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'validate_readiness':
        console.log('[ENVIRONMENT-CONFIG] Validating production readiness');
        
        const validation = validateProductionReadiness();
        
        return new Response(JSON.stringify(validation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action',
          availableActions: ['get_config', 'switch_environment', 'validate_readiness']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('[ENVIRONMENT-CONFIG] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});