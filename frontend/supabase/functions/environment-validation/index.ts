import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

/**
 * Environment Validation Function
 * 
 * Validates deployment environment configuration and readiness
 * 
 * GET /environment-validation?environment=staging
 * POST /environment-validation (with environment in body)
 */

interface ValidationRequest {
  environment?: string;
  check_secrets?: boolean;
  check_providers?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let requestData: ValidationRequest = {};
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      requestData.environment = url.searchParams.get('environment') || 'development';
      requestData.check_secrets = url.searchParams.get('check_secrets') === 'true';
      requestData.check_providers = url.searchParams.get('check_providers') === 'true';
    } else if (req.method === 'POST') {
      requestData = await req.json().catch(() => ({}));
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { environment = 'development', check_secrets = true, check_providers = true } = requestData;

    console.log(`[ENV-VALIDATION] Validating environment: ${environment}`);

    const validation = {
      environment,
      is_valid: true,
      timestamp: new Date().toISOString(),
      checks: {
        environment_exists: false,
        environment_configs: { valid: false, missing: [] as string[], details: {} },
        secrets: { valid: false, missing: [] as string[], total: 0, configured: 0 },
        providers: { valid: false, missing: [] as string[], total: 0, configured: 0 }
      },
      warnings: [] as string[],
      errors: [] as string[]
    };

    // Check if environment exists
    const { data: envData, error: envError } = await supabase
      .from('environment')
      .select('key')
      .eq('environment', environment)
      .eq('is_active', true);

    if (envError) {
      validation.errors.push(`Database error: ${envError.message}`);
      validation.is_valid = false;
    } else {
      validation.checks.environment_exists = (envData && envData.length > 0);
      if (!validation.checks.environment_exists) {
        validation.errors.push(`Environment '${environment}' not found in database`);
        validation.is_valid = false;
      }
    }

    // Check environment_configs
    const { data: configData, error: configError } = await supabase
      .from('environment_configs')
      .select('config_key, config_value')
      .eq('environment', environment)
      .eq('is_active', true);

    if (configError) {
      validation.errors.push(`Config error: ${configError.message}`);
      validation.is_valid = false;
    } else {
      const requiredConfigs = [
        'amadeus_base_url', 'sabre_base_url', 'viator_base_url', 
        'expedia_base_url', 'stripe_mode'
      ];
      
      const configKeys = configData?.map(c => c.config_key) || [];
      const missingConfigs = requiredConfigs.filter(key => !configKeys.includes(key));
      
      validation.checks.environment_configs.valid = missingConfigs.length === 0;
      validation.checks.environment_configs.missing = missingConfigs;
      validation.checks.environment_configs.details = Object.fromEntries(
        configData?.map(c => [c.config_key, c.config_value]) || []
      );

      if (missingConfigs.length > 0) {
        validation.errors.push(`Missing environment configs: ${missingConfigs.join(', ')}`);
        validation.is_valid = false;
      }
    }

    // Check secrets if requested
    if (check_secrets) {
      const { data: secretsData, error: secretsError } = await supabase
        .from('environment')
        .select('key, value, is_secret')
        .eq('environment', environment)
        .eq('is_active', true)
        .eq('is_secret', true);

      if (secretsError) {
        validation.errors.push(`Secrets error: ${secretsError.message}`);
        validation.is_valid = false;
      } else {
        const requiredSecrets = [
          'AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET',
          'SABRE_CLIENT_ID', 'SABRE_CLIENT_SECRET',
          'STRIPE_SECRET_KEY'
        ];
        
        const secretKeys = secretsData?.map(s => s.key) || [];
        const missingSecrets = requiredSecrets.filter(key => !secretKeys.includes(key));
        const placeholderSecrets = secretsData?.filter(s => 
          s.value.startsWith('your-') || 
          s.value.startsWith('staging-') ||
          s.value.includes('placeholder')
        ).map(s => s.key) || [];

        validation.checks.secrets.total = requiredSecrets.length;
        validation.checks.secrets.configured = secretKeys.length;
        validation.checks.secrets.missing = missingSecrets;
        validation.checks.secrets.valid = missingSecrets.length === 0 && placeholderSecrets.length === 0;

        if (missingSecrets.length > 0) {
          validation.errors.push(`Missing secrets: ${missingSecrets.join(', ')}`);
          validation.is_valid = false;
        }

        if (placeholderSecrets.length > 0) {
          validation.warnings.push(`Placeholder secrets found: ${placeholderSecrets.join(', ')}`);
          if (environment === 'production') {
            validation.errors.push(`Production environment has placeholder secrets: ${placeholderSecrets.join(', ')}`);
            validation.is_valid = false;
          }
        }
      }
    }

    // Check provider configurations if requested
    if (check_providers) {
      const providers = ['amadeus', 'sabre', 'viator', 'duffle', 'ratehawk', 'expedia', 'stripe'];
      let configuredProviders = 0;
      const missingProviders = [];

      for (const provider of providers) {
        // Check if provider has base URL configured
        const hasBaseUrl = configData?.some(c => 
          c.config_key === `${provider}_base_url` && 
          c.config_value && 
          !c.config_value.includes('your-')
        );

        // Check if provider has required secrets
        const providerSecrets = secretsData?.filter(s => 
          s.key.toLowerCase().includes(provider.toLowerCase()) ||
          (provider === 'stripe' && s.key.includes('STRIPE'))
        );

        if (hasBaseUrl && (providerSecrets && providerSecrets.length > 0)) {
          configuredProviders++;
        } else {
          missingProviders.push(provider);
        }
      }

      validation.checks.providers.total = providers.length;
      validation.checks.providers.configured = configuredProviders;
      validation.checks.providers.missing = missingProviders;
      validation.checks.providers.valid = missingProviders.length === 0;

      if (missingProviders.length > 0) {
        validation.warnings.push(`Incomplete provider configs: ${missingProviders.join(', ')}`);
      }
    }

    // Environment-specific validations
    if (environment === 'production') {
      // Production-specific checks
      const prodChecks = [];
      
      if (validation.checks.environment_configs.details.stripe_mode !== '"live"') {
        prodChecks.push('Stripe not in live mode for production');
      }
      
      const prodUrls = ['amadeus_base_url', 'sabre_base_url'];
      for (const urlKey of prodUrls) {
        const url = validation.checks.environment_configs.details[urlKey];
        if (url && url.includes('test') || url.includes('sandbox')) {
          prodChecks.push(`${urlKey} appears to be using test endpoint in production`);
        }
      }

      if (prodChecks.length > 0) {
        validation.errors.push(...prodChecks);
        validation.is_valid = false;
      }
    }

    // Add deployment readiness assessment
    const readinessScore = [
      validation.checks.environment_exists ? 20 : 0,
      validation.checks.environment_configs.valid ? 30 : 0,
      validation.checks.secrets.valid ? 35 : 0,
      validation.checks.providers.valid ? 15 : 0
    ].reduce((a, b) => a + b, 0);

    return new Response(JSON.stringify({
      success: true,
      validation,
      readiness: {
        score: readinessScore,
        status: readinessScore >= 85 ? 'ready' : readinessScore >= 60 ? 'needs_attention' : 'not_ready',
        recommendation: readinessScore >= 85 
          ? 'Environment is ready for deployment'
          : readinessScore >= 60 
          ? 'Environment needs attention before deployment'
          : 'Environment requires significant configuration before deployment'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ENV-VALIDATION] Unexpected error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});