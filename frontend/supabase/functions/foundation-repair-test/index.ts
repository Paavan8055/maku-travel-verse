import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { ENV_CONFIG, validateProviderCredentials, validateHotelBedsCredentials } from "../_shared/config.ts";
import logger from "../_shared/logger.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[FOUNDATION-REPAIR] Starting foundation repair tests...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0 }
    };

    // Test 1: Core secrets validation
    logger.info('[FOUNDATION-REPAIR] Testing core secrets...');
    const coreSecrets = {
      SUPABASE_URL: !!ENV_CONFIG.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!ENV_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: !!ENV_CONFIG.STRIPE_SECRET_KEY
    };
    
    const coreSecretsTest = {
      name: 'Core Secrets Validation',
      status: Object.values(coreSecrets).every(v => v) ? 'passed' : 'failed',
      details: coreSecrets
    };
    results.tests.push(coreSecretsTest);
    
    // Test 2: Provider credentials
    logger.info('[FOUNDATION-REPAIR] Testing provider credentials...');
    const providerTests = {
      amadeus: validateProviderCredentials('amadeus'),
      sabre: validateProviderCredentials('sabre'),
      hotelbeds_hotel: validateHotelBedsCredentials('hotel'),
      hotelbeds_activity: validateHotelBedsCredentials('activity')
    };
    
    const providerCredTest = {
      name: 'Provider Credentials',
      status: Object.values(providerTests).some(v => v) ? 'passed' : 'failed',
      details: providerTests,
      message: `Available providers: ${Object.entries(providerTests).filter(([,v]) => v).map(([k]) => k).join(', ')}`
    };
    results.tests.push(providerCredTest);

    // Test 3: Database connectivity
    logger.info('[FOUNDATION-REPAIR] Testing database connectivity...');
    try {
      const { data: configData, error: configError } = await supabase
        .from('provider_configs')
        .select('id, enabled')
        .limit(1);
        
      const dbTest = {
        name: 'Database Connectivity',
        status: configError ? 'failed' : 'passed',
        details: { 
          error: configError?.message,
          connected: !configError,
          recordCount: configData?.length || 0
        }
      };
      results.tests.push(dbTest);
    } catch (error) {
      results.tests.push({
        name: 'Database Connectivity',
        status: 'failed',
        details: { error: error.message }
      });
    }

    // Test 4: Provider health table check
    logger.info('[FOUNDATION-REPAIR] Testing provider health table...');
    try {
      const { data: healthData, error: healthError } = await supabase
        .from('provider_health')
        .select('provider, status')
        .limit(5);
        
      const healthTest = {
        name: 'Provider Health Table',
        status: healthError ? 'failed' : 'passed',
        details: { 
          error: healthError?.message,
          recordCount: healthData?.length || 0,
          records: healthData
        }
      };
      results.tests.push(healthTest);
    } catch (error) {
      results.tests.push({
        name: 'Provider Health Table',
        status: 'failed',
        details: { error: error.message }
      });
    }

    // Calculate summary
    results.summary.passed = results.tests.filter(t => t.status === 'passed').length;
    results.summary.failed = results.tests.filter(t => t.status === 'failed').length;

    logger.info('[FOUNDATION-REPAIR] Foundation repair tests completed', {
      passed: results.summary.passed,
      failed: results.summary.failed
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[FOUNDATION-REPAIR] Test execution failed:', error);
    
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