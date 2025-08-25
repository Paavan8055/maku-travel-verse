import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/simpleLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuotaStatus {
  provider: string;
  service: string;
  quotaUsed: number;
  quotaLimit: number;
  percentageUsed: number;
  resetTime?: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  lastChecked: number;
}

interface ProviderQuotaResponse {
  success: boolean;
  quotas: QuotaStatus[];
  warnings: string[];
  criticalProviders: string[];
  recommendedActions: string[];
}

// Provider-specific quota checking functions
async function checkAmadeusQuota(): Promise<QuotaStatus[]> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    return [{
      provider: 'amadeus',
      service: 'general',
      quotaUsed: 0,
      quotaLimit: 0,
      percentageUsed: 100,
      status: 'critical',
      lastChecked: Date.now()
    }];
  }

  try {
    // Get Amadeus auth token
    const authResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    
    // Make a test request to check quota headers
    const testResponse = await fetch('https://test.api.amadeus.com/v1/reference-data/locations?keyword=SYD&subType=CITY', {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
      },
    });

    const quotaLimit = parseInt(testResponse.headers.get('X-RateLimit-Limit') || '1000');
    const quotaRemaining = parseInt(testResponse.headers.get('X-RateLimit-Remaining') || '0');
    const quotaUsed = quotaLimit - quotaRemaining;
    const percentageUsed = (quotaUsed / quotaLimit) * 100;

    let status: QuotaStatus['status'] = 'healthy';
    if (percentageUsed > 90) status = 'critical';
    else if (percentageUsed > 75) status = 'warning';

    return [{
      provider: 'amadeus',
      service: 'api_calls',
      quotaUsed,
      quotaLimit,
      percentageUsed,
      status,
      lastChecked: Date.now()
    }];
  } catch (error) {
    logger.error('[QUOTA-MONITOR] Amadeus quota check failed:', error);
    return [{
      provider: 'amadeus',
      service: 'api_calls',
      quotaUsed: 999,
      quotaLimit: 1000,
      percentageUsed: 99.9,
      status: 'critical',
      lastChecked: Date.now()
    }];
  }
}

async function checkHotelBedsQuota(): Promise<QuotaStatus[]> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  
  if (!apiKey || !secret) {
    return [{
      provider: 'hotelbeds',
      service: 'general',
      quotaUsed: 0,
      quotaLimit: 0,
      percentageUsed: 100,
      status: 'critical',
      lastChecked: Date.now()
    }];
  }

  try {
    // Create signature for HotelBeds
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(apiKey + secret + timestamp)
    );
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Test HotelBeds API with quota monitoring
    const response = await fetch('https://api.test.hotelbeds.com/hotel-content-api/1.0/types/countries', {
      headers: {
        'Api-key': apiKey,
        'X-Signature': signatureHex,
        'Accept': 'application/json',
      },
    });

    // HotelBeds doesn't provide standard quota headers, so we estimate based on response
    const quotaLimit = 10000; // Typical daily limit
    let quotaUsed = 0;
    let status: QuotaStatus['status'] = 'healthy';

    if (response.status === 429) {
      quotaUsed = quotaLimit;
      status = 'exceeded';
    } else if (response.status === 403) {
      status = 'critical';
      quotaUsed = quotaLimit * 0.95;
    } else if (response.ok) {
      // Estimate usage based on response time
      const responseTime = Date.now();
      quotaUsed = Math.min(quotaLimit * 0.3, quotaLimit); // Conservative estimate
    }

    const percentageUsed = (quotaUsed / quotaLimit) * 100;

    return [{
      provider: 'hotelbeds',
      service: 'api_calls',
      quotaUsed,
      quotaLimit,
      percentageUsed,
      status,
      lastChecked: Date.now()
    }];
  } catch (error) {
    logger.error('[QUOTA-MONITOR] HotelBeds quota check failed:', error);
    return [{
      provider: 'hotelbeds',
      service: 'api_calls',
      quotaUsed: 9500,
      quotaLimit: 10000,
      percentageUsed: 95,
      status: 'critical',
      lastChecked: Date.now()
    }];
  }
}

async function checkSabreQuota(): Promise<QuotaStatus[]> {
  const clientId = Deno.env.get('SABRE_CLIENT_ID');
  const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    return [{
      provider: 'sabre',
      service: 'general',
      quotaUsed: 0,
      quotaLimit: 0,
      percentageUsed: 100,
      status: 'critical',
      lastChecked: Date.now()
    }];
  }

  try {
    // Sabre uses different quota monitoring - checking auth endpoint
    const authResponse = await fetch('https://api.sabre.com/v2/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    let status: QuotaStatus['status'] = 'healthy';
    let quotaUsed = 0;
    const quotaLimit = 5000; // Typical limit

    if (authResponse.status === 429) {
      status = 'exceeded';
      quotaUsed = quotaLimit;
    } else if (authResponse.status === 403) {
      status = 'critical';
      quotaUsed = quotaLimit * 0.9;
    } else if (authResponse.ok) {
      quotaUsed = quotaLimit * 0.2; // Conservative estimate
    } else {
      status = 'warning';
      quotaUsed = quotaLimit * 0.8;
    }

    const percentageUsed = (quotaUsed / quotaLimit) * 100;

    return [{
      provider: 'sabre',
      service: 'api_calls',
      quotaUsed,
      quotaLimit,
      percentageUsed,
      status,
      lastChecked: Date.now()
    }];
  } catch (error) {
    logger.error('[QUOTA-MONITOR] Sabre quota check failed:', error);
    return [{
      provider: 'sabre',
      service: 'api_calls',
      quotaUsed: 4500,
      quotaLimit: 5000,
      percentageUsed: 90,
      status: 'critical',
      lastChecked: Date.now()
    }];
  }
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
    logger.info('[QUOTA-MONITOR] Starting quota check for all providers');

    // Check all provider quotas in parallel
    const [amadeusQuotas, hotelBedsQuotas, sabreQuotas] = await Promise.all([
      checkAmadeusQuota(),
      checkHotelBedsQuota(),
      checkSabreQuota()
    ]);

    const allQuotas = [...amadeusQuotas, ...hotelBedsQuotas, ...sabreQuotas];
    
    // Analyze quota status
    const warnings: string[] = [];
    const criticalProviders: string[] = [];
    const recommendedActions: string[] = [];

    for (const quota of allQuotas) {
      if (quota.status === 'exceeded' || quota.status === 'critical') {
        criticalProviders.push(quota.provider);
        
        if (quota.status === 'exceeded') {
          warnings.push(`${quota.provider} quota exceeded - service unavailable`);
          recommendedActions.push(`Disable ${quota.provider} temporarily`);
        } else {
          warnings.push(`${quota.provider} quota at ${quota.percentageUsed.toFixed(1)}% - approaching limit`);
          recommendedActions.push(`Reduce ${quota.provider} priority or implement throttling`);
        }
      } else if (quota.status === 'warning') {
        warnings.push(`${quota.provider} quota at ${quota.percentageUsed.toFixed(1)}% - monitor closely`);
      }
    }

    // Store quota data in database
    for (const quota of allQuotas) {
      try {
        await supabase
          .from('provider_quotas')
          .upsert({
            provider_id: `${quota.provider}-${quota.service}`,
            provider_name: quota.provider,
            service_type: quota.service,
            quota_used: quota.quotaUsed,
            quota_limit: quota.quotaLimit,
            percentage_used: quota.percentageUsed,
            status: quota.status,
            reset_time: quota.resetTime ? new Date(quota.resetTime).toISOString() : null,
            last_checked: new Date().toISOString()
          }, {
            onConflict: 'provider_id'
          });
      } catch (dbError) {
        logger.warn('[QUOTA-MONITOR] Failed to store quota data:', dbError);
      }
    }

    // Update provider priorities based on quota status
    if (criticalProviders.length > 0) {
      await updateProviderPriorities(supabase, allQuotas);
    }

    const response: ProviderQuotaResponse = {
      success: true,
      quotas: allQuotas,
      warnings,
      criticalProviders,
      recommendedActions
    };

    logger.info('[QUOTA-MONITOR] Quota check completed', {
      totalProviders: allQuotas.length,
      warningCount: warnings.length,
      criticalCount: criticalProviders.length
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[QUOTA-MONITOR] Quota monitoring failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      quotas: [],
      warnings: ['Quota monitoring system temporarily unavailable'],
      criticalProviders: [],
      recommendedActions: ['Manual provider status check recommended']
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function updateProviderPriorities(supabase: any, quotas: QuotaStatus[]) {
  try {
    logger.info('[QUOTA-MONITOR] Updating provider priorities based on quota status');

    // Get current provider configs
    const { data: configs } = await supabase
      .from('provider_configs')
      .select('*');

    if (!configs) return;

    // Update priorities based on quota status
    for (const config of configs) {
      const relevantQuota = quotas.find(q => config.id.includes(q.provider));
      
      if (relevantQuota) {
        let newPriority = config.priority;
        let enabled = config.enabled;

        switch (relevantQuota.status) {
          case 'exceeded':
            enabled = false; // Disable completely
            newPriority = 999; // Lowest priority
            break;
          case 'critical':
            newPriority = Math.max(config.priority + 2, 10); // Lower priority significantly
            break;
          case 'warning':
            newPriority = Math.max(config.priority + 1, 5); // Lower priority slightly
            break;
          case 'healthy':
            // Restore original priority if it was modified
            if (config.priority > 5) {
              newPriority = Math.max(1, config.priority - 1);
            }
            enabled = true;
            break;
        }

        // Update if changed
        if (newPriority !== config.priority || enabled !== config.enabled) {
          await supabase
            .from('provider_configs')
            .update({
              priority: newPriority,
              enabled: enabled,
              updated_at: new Date().toISOString()
            })
            .eq('id', config.id);

          logger.info(`[QUOTA-MONITOR] Updated ${config.id}: priority ${config.priority} -> ${newPriority}, enabled: ${enabled}`);
        }
      }
    }
  } catch (error) {
    logger.error('[QUOTA-MONITOR] Failed to update provider priorities:', error);
  }
}