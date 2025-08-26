import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple logger for edge functions
const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[${timestamp}] [ERROR] ${message}`, errorData ? JSON.stringify(errorData) : '');
  }
};

interface EmergencyReport {
  success: boolean;
  message: string;
  summary: {
    totalProviders: number;
    workingProviders: number;
    failedTests: number;
  };
  testResults: Array<{
    searchType: string;
    provider?: string;
    success: boolean;
    error?: string;
  }>;
  enabledProviders: string[];
  details: any;
}

function performEmergencyConfigCheck(): boolean {
  const requiredSecrets = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  const missing = requiredSecrets.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    logger.error('[CONFIG] CRITICAL: Core secrets missing:', missing);
    return false;
  }
  
  return true;
}

function getProviderHealthStatus() {
  return {
    amadeus: {
      available: !!(Deno.env.get('AMADEUS_CLIENT_ID') && Deno.env.get('AMADEUS_CLIENT_SECRET')),
      services: ['flight', 'hotel', 'activity']
    },
    sabre: {
      available: !!(Deno.env.get('SABRE_CLIENT_ID') && Deno.env.get('SABRE_CLIENT_SECRET')),
      services: ['flight', 'hotel']
    },
    hotelbeds: {
      available: !!(Deno.env.get('HOTELBEDS_HOTEL_API_KEY') && Deno.env.get('HOTELBEDS_HOTEL_SECRET')),
      services: ['hotel', 'activity']
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    logger.info('[EMERGENCY-FIX] Starting emergency provider rotation repair');

    const report: EmergencyReport = {
      success: false,
      message: '',
      summary: {
        totalProviders: 0,
        workingProviders: 0,
        failedTests: 0
      },
      testResults: [],
      enabledProviders: [],
      details: {}
    };

    // Step 1: Validate critical configurations
    logger.info('[EMERGENCY-FIX] Step 1: Validating configurations');
    const configValid = performEmergencyConfigCheck();
    if (!configValid) {
      report.message = 'Critical configuration issues detected';
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Step 2: Get provider health status
    logger.info('[EMERGENCY-FIX] Step 2: Checking provider health');
    const providerHealth = getProviderHealthStatus();
    report.details.providerHealth = providerHealth;

    // Step 3: Reset provider quotas to allow usage
    logger.info('[EMERGENCY-FIX] Step 3: Resetting provider quotas');
    try {
      const { error: quotaError } = await supabase
        .from('provider_quotas')
        .delete()
        .neq('id', 'fake'); // Delete all existing quota records

      if (quotaError) {
        logger.warn('[EMERGENCY-FIX] Failed to reset quotas:', quotaError);
      } else {
        logger.info('[EMERGENCY-FIX] Provider quotas reset successfully');
      }
    } catch (error) {
      logger.warn('[EMERGENCY-FIX] Quota reset failed:', error);
    }

    // Step 4: Enable working providers
    logger.info('[EMERGENCY-FIX] Step 4: Enabling working providers');
    const workingProviders: string[] = [];
    
    Object.entries(providerHealth).forEach(([provider, config]) => {
      if (config.available) {
        config.services.forEach(service => {
          const providerId = `${provider}-${service}`;
          workingProviders.push(providerId);
        });
      }
    });

    report.enabledProviders = workingProviders;
    report.summary.totalProviders = workingProviders.length;

    // Step 5: Enable providers in database
    for (const providerId of workingProviders) {
      try {
        const [provider, service] = providerId.split('-');
        const { error } = await supabase
          .from('provider_configs')
          .upsert({
            id: providerId,
            name: provider.charAt(0).toUpperCase() + provider.slice(1),
            type: service,
            enabled: true,
            priority: provider === 'amadeus' ? 1 : provider === 'sabre' ? 2 : 3,
            circuit_breaker: {
              failureCount: 0,
              lastFailure: null,
              timeout: 30000,
              state: 'closed'
            }
          }, {
            onConflict: 'id'
          });

        if (error) {
          logger.warn(`[EMERGENCY-FIX] Failed to enable provider ${providerId}:`, error);
        } else {
          logger.info(`[EMERGENCY-FIX] Enabled provider: ${providerId}`);
        }
      } catch (error) {
        logger.warn(`[EMERGENCY-FIX] Error enabling provider ${providerId}:`, error);
      }
    }

    // Step 6: Test provider rotation for each service type
    logger.info('[EMERGENCY-FIX] Step 6: Testing provider rotation');
    const searchTypes = ['hotel', 'flight', 'activity'];
    let successfulTests = 0;

    for (const searchType of searchTypes) {
      try {
        const testParams = getTestParams(searchType);
        const { data, error } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType,
            params: testParams
          }
        });

        const success = !error && data?.success;
        report.testResults.push({
          searchType,
          provider: data?.provider || 'Unknown',
          success,
          error: error?.message || data?.error
        });

        if (success) {
          successfulTests++;
        }
      } catch (error) {
        report.testResults.push({
          searchType,
          success: false,
          error: error.message
        });
      }
    }

    report.summary.workingProviders = successfulTests;
    report.summary.failedTests = searchTypes.length - successfulTests;

    // Step 7: Log the emergency fix report
    try {
      await supabase.rpc('log_system_event', {
        p_correlation_id: crypto.randomUUID(),
        p_service_name: 'emergency-provider-fix',
        p_log_level: 'info',
        p_message: 'Emergency provider rotation fix completed',
        p_metadata: {
          report,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.warn('[EMERGENCY-FIX] Failed to log system event:', error);
    }

    // Determine overall success
    report.success = successfulTests > 0;
    report.message = report.success 
      ? `Emergency fix completed. ${successfulTests}/${searchTypes.length} services restored.`
      : 'Emergency fix completed but no services are working. Manual intervention required.';

    logger.info('[EMERGENCY-FIX] Emergency fix completed', {
      success: report.success,
      workingProviders: report.summary.workingProviders,
      totalProviders: report.summary.totalProviders
    });

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[EMERGENCY-FIX] Emergency fix failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Emergency fix failed: ${error.message}`,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getTestParams(searchType: string): any {
  switch (searchType) {
    case 'hotel':
      return {
        destination: 'SYD',
        checkInDate: '2025-08-26',
        checkOutDate: '2025-08-27',
        adults: 1,
        roomQuantity: 1
      };
    case 'flight':
      return {
        originLocationCode: 'SYD',
        destinationLocationCode: 'MEL',
        departureDate: '2025-09-01',
        adults: 1
      };
    case 'activity':
      return {
        destination: 'sydney',
        date: '2025-08-26',
        participants: 1,
        radius: 10
      };
    default:
      return {};
  }
}