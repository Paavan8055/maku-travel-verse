import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


interface QuotaStatus {
  provider: string;
  service: string;
  quotaUsed: number;
  quotaLimit: number;
  percentageUsed: number;
  resetTime?: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  lastChecked: number;
  errorType?: string;
  isActualQuotaLimit: boolean;
}

interface ProviderQuotaResponse {
  success: boolean;
  quotas: QuotaStatus[];
  warnings: string[];
  criticalProviders: string[];
  recommendedActions: string[];
}

// Enhanced quota checking with proper error classification
async function checkAmadeusQuota(): Promise<QuotaStatus[]> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    return [{
      provider: 'amadeus',
      service: 'api_calls',
      quotaUsed: 0,
      quotaLimit: 1000,
      percentageUsed: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      errorType: 'missing_credentials',
      isActualQuotaLimit: false
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
      // Distinguish between auth errors and quota errors
      if (authResponse.status === 429) {
        logger.warn('[QUOTA-MONITOR] Amadeus auth rate limited - actual quota issue');
        return [{
          provider: 'amadeus',
          service: 'api_calls',
          quotaUsed: 1000,
          quotaLimit: 1000,
          percentageUsed: 100,
          status: 'exceeded',
          lastChecked: Date.now(),
          errorType: 'rate_limit',
          isActualQuotaLimit: true
        }];
      } else {
        logger.warn(`[QUOTA-MONITOR] Amadeus auth failed with ${authResponse.status} - not a quota issue`);
        return [{
          provider: 'amadeus',
          service: 'api_calls',
          quotaUsed: 0,
          quotaLimit: 1000,
          percentageUsed: 0,
          status: 'healthy',
          lastChecked: Date.now(),
          errorType: 'auth_error',
          isActualQuotaLimit: false
        }];
      }
    }

    const authData = await authResponse.json();
    
    // Make a test request to check actual quota headers
    const testResponse = await fetch('https://test.api.amadeus.com/v1/reference-data/locations?keyword=SYD&subType=CITY', {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
      },
    });

    // Parse actual rate limit headers from Amadeus
    const quotaLimit = parseInt(testResponse.headers.get('X-RateLimit-Limit') || '1000');
    const quotaRemaining = parseInt(testResponse.headers.get('X-RateLimit-Remaining') || '900');
    const quotaUsed = Math.max(0, quotaLimit - quotaRemaining);
    const percentageUsed = (quotaUsed / quotaLimit) * 100;

    let status: QuotaStatus['status'] = 'healthy';
    let isActualQuotaLimit = false;

    if (testResponse.status === 429) {
      status = 'exceeded';
      isActualQuotaLimit = true;
      logger.warn('[QUOTA-MONITOR] Amadeus actual quota exceeded');
    } else if (percentageUsed > 90) {
      status = 'critical';
    } else if (percentageUsed > 75) {
      status = 'warning';
    }

    return [{
      provider: 'amadeus',
      service: 'api_calls',
      quotaUsed,
      quotaLimit,
      percentageUsed,
      status,
      lastChecked: Date.now(),
      isActualQuotaLimit
    }];
  } catch (error) {
    logger.warn('[QUOTA-MONITOR] Amadeus quota check network error (not quota issue):', error);
    return [{
      provider: 'amadeus',
      service: 'api_calls',
      quotaUsed: 0,
      quotaLimit: 1000,
      percentageUsed: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      errorType: 'network_error',
      isActualQuotaLimit: false
    }];
  }
}

async function checkHotelBedsQuota(): Promise<QuotaStatus[]> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY') || Deno.env.get('HOTELBEDS_HOTEL_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET') || Deno.env.get('HOTELBEDS_HOTEL_SECRET');
  
  if (!apiKey || !secret) {
    return [{
      provider: 'hotelbeds',
      service: 'api_calls',
      quotaUsed: 0,
      quotaLimit: 10000,
      percentageUsed: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      errorType: 'missing_credentials',
      isActualQuotaLimit: false
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

    // Test HotelBeds API
    const response = await fetch('https://api.test.hotelbeds.com/hotel-content-api/1.0/types/countries', {
      headers: {
        'Api-key': apiKey,
        'X-Signature': signatureHex,
        'Accept': 'application/json',
      },
    });

    const quotaLimit = 10000; // Typical daily limit
    let quotaUsed = 0;
    let status: QuotaStatus['status'] = 'healthy';
    let isActualQuotaLimit = false;

    if (response.status === 429) {
      status = 'exceeded';
      quotaUsed = quotaLimit;
      isActualQuotaLimit = true;
      logger.warn('[QUOTA-MONITOR] HotelBeds actual quota exceeded');
    } else if (response.ok) {
      // Only estimate minimal usage when API is working normally
      quotaUsed = Math.min(quotaLimit * 0.1, 500); // Very conservative estimate
    } else {
      // For other errors (401, 403, 500, etc.), don't assume quota issues
      logger.warn(`[QUOTA-MONITOR] HotelBeds API error ${response.status} - not quota related`);
    }

    const percentageUsed = (quotaUsed / quotaLimit) * 100;

    return [{
      provider: 'hotelbeds',
      service: 'api_calls',
      quotaUsed,
      quotaLimit,
      percentageUsed,
      status,
      lastChecked: Date.now(),
      isActualQuotaLimit
    }];
  } catch (error) {
    logger.warn('[QUOTA-MONITOR] HotelBeds quota check network error (not quota issue):', error);
    return [{
      provider: 'hotelbeds',
      service: 'api_calls',
      quotaUsed: 0,
      quotaLimit: 10000,
      percentageUsed: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      errorType: 'network_error',
      isActualQuotaLimit: false
    }];
  }
}

async function checkSabreQuota(): Promise<QuotaStatus[]> {
  const clientId = Deno.env.get('SABRE_CLIENT_ID');
  const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    return [{
      provider: 'sabre',
      service: 'api_calls',
      quotaUsed: 0,
      quotaLimit: 5000,
      percentageUsed: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      errorType: 'missing_credentials',
      isActualQuotaLimit: false
    }];
  }

  try {
    // Sabre auth endpoint check
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
    let isActualQuotaLimit = false;

    if (authResponse.status === 429) {
      status = 'exceeded';
      quotaUsed = quotaLimit;
      isActualQuotaLimit = true;
      logger.warn('[QUOTA-MONITOR] Sabre actual quota exceeded');
    } else if (authResponse.ok) {
      // Conservative estimate when working normally
      quotaUsed = Math.min(quotaLimit * 0.1, 200);
    } else {
      // Don't assume quota issues for other errors
      logger.warn(`[QUOTA-MONITOR] Sabre API error ${authResponse.status} - not quota related`);
    }

    const percentageUsed = (quotaUsed / quotaLimit) * 100;

    return [{
      provider: 'sabre',
      service: 'api_calls',
      quotaUsed,
      quotaLimit,
      percentageUsed,
      status,
      lastChecked: Date.now(),
      isActualQuotaLimit
    }];
  } catch (error) {
    logger.warn('[QUOTA-MONITOR] Sabre quota check network error (not quota issue):', error);
    return [{
      provider: 'sabre',
      service: 'api_calls',
      quotaUsed: 0,
      quotaLimit: 5000,
      percentageUsed: 0,
      status: 'healthy',
      lastChecked: Date.now(),
      errorType: 'network_error',
      isActualQuotaLimit: false
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
    
    // Analyze quota status - only real quota issues
    const warnings: string[] = [];
    const criticalProviders: string[] = [];
    const recommendedActions: string[] = [];

    for (const quota of allQuotas) {
      // Only report issues for actual quota limits, not network/auth errors
      if (quota.isActualQuotaLimit && (quota.status === 'exceeded' || quota.status === 'critical')) {
        criticalProviders.push(quota.provider);
        
        if (quota.status === 'exceeded') {
          warnings.push(`${quota.provider} quota exceeded - service unavailable`);
          recommendedActions.push(`Wait for quota reset or contact ${quota.provider} support`);
        } else {
          warnings.push(`${quota.provider} quota at ${quota.percentageUsed.toFixed(1)}% - approaching limit`);
          recommendedActions.push(`Monitor ${quota.provider} usage carefully`);
        }
      } else if (quota.status === 'warning' && quota.percentageUsed > 75) {
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
            last_checked: new Date().toISOString(),
            error_type: quota.errorType || null,
            is_actual_quota_limit: quota.isActualQuotaLimit
          }, {
            onConflict: 'provider_id'
          });
      } catch (dbError) {
        logger.warn('[QUOTA-MONITOR] Failed to store quota data:', dbError);
      }
    }

    // ONLY update provider priorities for actual quota issues
    const actualQuotaIssues = allQuotas.filter(q => q.isActualQuotaLimit && q.status === 'exceeded');
    if (actualQuotaIssues.length > 0) {
      await updateProviderPriorities(supabase, actualQuotaIssues);
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
      criticalCount: criticalProviders.length,
      actualQuotaIssues: actualQuotaIssues.length
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

// FIXED: Only disable providers for actual quota exceeded (not network/auth errors)
async function updateProviderPriorities(supabase: any, actualQuotaIssues: QuotaStatus[]) {
  try {
    logger.info('[QUOTA-MONITOR] Updating provider priorities for actual quota issues only');

    // Get current provider configs
    const { data: configs } = await supabase
      .from('provider_configs')
      .select('*');

    if (!configs) return;

    // Only update for providers with actual quota exceeded
    for (const quota of actualQuotaIssues) {
      const matchingConfigs = configs.filter(config => config.id.includes(quota.provider));
      
      for (const config of matchingConfigs) {
        if (quota.status === 'exceeded' && quota.isActualQuotaLimit) {
          // Only disable for confirmed quota exceeded
          await supabase
            .from('provider_configs')
            .update({
              enabled: false,
              priority: 999,
              updated_at: new Date().toISOString()
            })
            .eq('id', config.id);

          logger.warn(`[QUOTA-MONITOR] Disabled ${config.id} due to actual quota exceeded`);
        }
      }
    }
  } catch (error) {
    logger.error('[QUOTA-MONITOR] Failed to update provider priorities:', error);
  }
}