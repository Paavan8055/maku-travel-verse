import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";
import { performEmergencyConfigCheck, getProviderHealthStatus } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    logger.info('🚨 EMERGENCY: Starting provider rotation system repair');

    // 1. Emergency configuration check
    const configValid = performEmergencyConfigCheck();
    if (!configValid) {
      throw new Error('Critical configuration issues detected');
    }

    // 2. Get current provider health
    const providerHealth = getProviderHealthStatus();
    logger.info('Current provider health:', providerHealth);

    // 3. Reset provider quotas to allow usage
    const resetResult = await supabase
      .from('provider_quotas')
      .update({
        current_usage: 0,
        status: 'healthy',
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

    logger.info('Provider quotas reset:', resetResult);

    // 4. Update provider configs to enable working providers
    const enabledProviders = [];
    for (const [providerName, config] of Object.entries(providerHealth)) {
      if (config.available) {
        for (const service of config.services) {
          const providerId = `${providerName}-${service}`;
          enabledProviders.push(providerId);
          
          await supabase
            .from('provider_configs')
            .upsert({
              id: providerId,
              name: providerName,
              type: service,
              enabled: true,
              priority: providerName === 'hotelbeds' ? 1 : 
                       providerName === 'amadeus' ? 2 : 3,
              circuit_breaker: {
                failureCount: 0,
                lastFailure: null,
                timeout: 30000,
                state: 'closed'
              },
              updated_at: new Date().toISOString()
            });
        }
      }
    }

    // 5. Test provider rotation
    logger.info('Testing emergency provider rotation...');
    
    const testResults = [];
    for (const searchType of ['hotel', 'flight', 'activity']) {
      try {
        const testResult = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType,
            params: getTestParams(searchType)
          }
        });
        
        testResults.push({
          searchType,
          success: !testResult.error,
          provider: testResult.data?.provider,
          error: testResult.error?.message
        });
      } catch (error) {
        testResults.push({
          searchType,
          success: false,
          error: error.message
        });
      }
    }

    // 6. Create emergency success metrics
    const emergencyReport = {
      timestamp: new Date().toISOString(),
      configValid,
      providerHealth,
      enabledProviders,
      testResults,
      summary: {
        totalProviders: enabledProviders.length,
        workingProviders: testResults.filter(r => r.success).length,
        failedTests: testResults.filter(r => !r.success).length
      }
    };

    // 7. Log emergency completion
    await supabase.rpc('log_system_event', {
      p_correlation_id: 'emergency_fix',
      p_service_name: 'emergency_provider_fix',
      p_log_level: 'INFO',
      p_message: 'Emergency provider rotation repair completed',
      p_metadata: emergencyReport
    });

    logger.info('✅ Emergency provider fix completed:', emergencyReport.summary);

    return new Response(JSON.stringify({
      success: true,
      message: 'Emergency provider rotation repair completed',
      report: emergencyReport
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('❌ Emergency fix failed:', error);
    
    // Log critical alert
    await supabase.from('critical_alerts').insert({
      alert_type: 'emergency_fix_failed',
      message: `Emergency provider fix failed: ${error.message}`,
      severity: 'critical',
      requires_manual_action: true,
      metadata: { error: error.message }
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getTestParams(searchType: string) {
  switch (searchType) {
    case 'hotel':
      return {
        destination: 'SYD',
        checkInDate: '2025-08-26',
        checkOutDate: '2025-08-27',
        adults: 2,
        rooms: 1
      };
    case 'flight':
      return {
        origin: 'SYD',
        destination: 'LAX',
        departureDate: '2025-08-26',
        adults: 2,
        travelClass: 'ECONOMY'
      };
    case 'activity':
      return {
        destination: 'SYD',
        from: '2025-08-26',
        to: '2025-08-30'
      };
    default:
      return {};
  }
}