import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('🚀 MAKU Platform Deployment Validation Starting...');
    
    const results = {
      timestamp: new Date().toISOString(),
      deployment: {
        status: 'validating',
        version: Date.now()
      },
      database: {},
      providers: {},
      functions: {},
      configurations: {}
    };

    // 1. Database Schema Validation
    console.log('📊 Validating database schema...');
    
    try {
      const { data: providerConfigs } = await supabase
        .from('provider_configs')
        .select('*')
        .limit(1);
      
      const { data: providerMetrics } = await supabase
        .from('provider_metrics')
        .select('*')
        .limit(1);
        
      results.database = {
        providerConfigsTable: !!providerConfigs,
        providerMetricsTable: !!providerMetrics,
        status: 'healthy'
      };
    } catch (error) {
      results.database = {
        status: 'error',
        error: error.message
      };
    }

    // 2. Provider Configuration Validation
    console.log('🔧 Validating provider configurations...');
    
    try {
      const { data: providers } = await supabase
        .from('provider_configs')
        .select('*');
      
      const hotelProviders = providers?.filter(p => p.type === 'hotel') || [];
      const flightProviders = providers?.filter(p => p.type === 'flight') || [];
      const activityProviders = providers?.filter(p => p.type === 'activity') || [];
      
      results.providers = {
        total: providers?.length || 0,
        hotel: hotelProviders.length,
        flight: flightProviders.length,
        activity: activityProviders.length,
        enabled: providers?.filter(p => p.enabled).length || 0,
        status: providers?.length > 0 ? 'configured' : 'missing'
      };
    } catch (error) {
      results.providers = {
        status: 'error',
        error: error.message
      };
    }

    // 3. Function Health Validation
    console.log('⚡ Testing core functions...');
    
    const functionTests = [
      { name: 'health-check', critical: true },
      { name: 'amadeus-hotel-search', critical: false },
      { name: 'hotelbeds-search', critical: false },
      { name: 'provider-rotation', critical: true }
    ];
    
    results.functions = {};
    
    for (const func of functionTests) {
      try {
        const startTime = Date.now();
        const { data, error } = await supabase.functions.invoke(func.name, {
          body: func.name === 'health-check' ? {} : {
            destination: 'Sydney',
            checkIn: '2025-08-25',
            checkOut: '2025-08-26'
          }
        });
        
        const responseTime = Date.now() - startTime;
        
        results.functions[func.name] = {
          status: error ? 'error' : 'healthy',
          responseTime,
          critical: func.critical,
          error: error?.message
        };
      } catch (error) {
        results.functions[func.name] = {
          status: 'error',
          critical: func.critical,
          error: error.message
        };
      }
    }

    // 4. API Credential Validation
    console.log('🔑 Validating API credentials...');
    
    const secrets = [
      'AMADEUS_CLIENT_ID',
      'AMADEUS_CLIENT_SECRET', 
      'HOTELBEDS_API_KEY',
      'HOTELBEDS_SECRET',
      'STRIPE_SECRET_KEY'
    ];
    
    results.configurations = {
      secrets: {},
      status: 'checking'
    };
    
    for (const secret of secrets) {
      const value = Deno.env.get(secret);
      results.configurations.secrets[secret] = {
        configured: !!value,
        hasValue: value && value.length > 10
      };
    }
    
    // Overall health determination
    const criticalFunctionsFailed = Object.values(results.functions)
      .filter((f: any) => f.critical && f.status === 'error').length;
    
    const databaseHealthy = results.database.status === 'healthy';
    const providersConfigured = results.providers.status === 'configured';
    
    if (criticalFunctionsFailed > 0 || !databaseHealthy) {
      results.deployment.status = 'critical';
    } else if (!providersConfigured) {
      results.deployment.status = 'degraded';
    } else {
      results.deployment.status = 'healthy';
    }

    console.log('✅ Validation complete:', results.deployment.status);

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Validation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      deployment: {
        status: 'failed',
        error: error.message
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});