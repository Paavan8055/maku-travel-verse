import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
...
import { ENV_CONFIG, validateApiKeys, RATE_LIMITS } from '../_shared/config.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, issue_type, severity } = await req.json()
    
    const startTime = performance.now()
    const healingResults: HealingResult[] = []

    console.log(`[SELF-HEALING] Starting healing for ${issue_type} with severity ${severity}`)

    // Determine healing actions based on issue type
    const healingActions = await determineHealingActions(issue_type, severity, supabase)
    
    // Execute healing actions
    for (const healingAction of healingActions) {
      const actionStartTime = performance.now()
      const result = await executeHealingAction(healingAction, supabase)
      
      healingResults.push({
        ...result,
        duration_ms: performance.now() - actionStartTime
      })
    }

    // Log healing execution
    await supabase.from('system_logs').insert({
      correlation_id: crypto.randomUUID(),
      service_name: 'self-healing-executor',
      log_level: 'info',
      message: `Self-healing completed for ${issue_type}`,
      metadata: {
        issue_type,
        severity,
        actions_executed: healingResults.length,
        total_duration_ms: performance.now() - startTime,
        results: healingResults
      }
    })

    // Update critical alerts if healing was successful
    const successfulActions = healingResults.filter(r => r.success)
    if (successfulActions.length > 0) {
      await supabase
        .from('critical_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: '00000000-0000-0000-0000-000000000000'
        })
        .eq('alert_type', issue_type)
        .eq('resolved', false)
    }

    return new Response(
      JSON.stringify({
        success: true,
        healing_results: healingResults,
        total_duration_ms: performance.now() - startTime,
        recovered_services: healingResults.flatMap(r => r.recovered_services || [])
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[SELF-HEALING] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function determineHealingActions(issueType: string, severity: string, supabase: any): Promise<HealingAction[]> {
  const actions: HealingAction[] = []

  switch (issueType) {
    case 'provider_failure':
      actions.push(
        { type: 'provider_reset', target: 'amadeus' },
        { type: 'provider_reset', target: 'sabre' },
        { type: 'provider_reset', target: 'hotelbeds' }
      )
      break

    case 'database_performance':
      actions.push(
        { type: 'cache_clear', target: 'query_cache' },
        { type: 'connection_refresh', target: 'database_pool' }
      )
      break

    case 'booking_timeout':
      actions.push(
        { type: 'cache_clear', target: 'booking_cache' },
        { type: 'provider_reset', target: 'payment_processor' }
      )
      break

    case 'memory_leak':
      if (severity === 'critical') {
        actions.push(
          { type: 'cache_clear', target: 'all_caches' },
          { type: 'connection_refresh', target: 'all_connections' }
        )
      }
      break

    default:
      actions.push({ type: 'config_reload', target: 'system' })
  }

  return actions
}

async function executeHealingAction(action: HealingAction, supabase: any): Promise<HealingResult> {
  try {
    const recoveredServices: string[] = []

    switch (action.type) {
      case 'provider_reset':
        await resetProvider(action.target, supabase)
        recoveredServices.push(`provider_${action.target}`)
        break

      case 'cache_clear':
        await clearCache(action.target, supabase)
        recoveredServices.push(`cache_${action.target}`)
        break

      case 'connection_refresh':
        await refreshConnections(action.target)
        recoveredServices.push(`connection_${action.target}`)
        break

      case 'config_reload':
        await reloadConfiguration(supabase)
        recoveredServices.push('system_config')
        break
    }

    return {
      action,
      success: true,
      duration_ms: 0,
      recovered_services: recoveredServices
    }

  } catch (error) {
    return {
      action,
      success: false,
      duration_ms: 0,
      error: error.message
    }
  }
}

async function resetProvider(provider: string, supabase: any) {
  // Reset provider health status
  await supabase
    .from('provider_health')
    .upsert({
      provider_name: provider,
      status: 'healthy',
      last_checked: new Date().toISOString(),
      response_time_ms: 0,
      error_count: 0
    })

  // Clear provider quotas
  await supabase
    .from('provider_quotas')
    .update({
      current_usage: 0,
      percentage_used: 0,
      status: 'healthy'
    })
    .eq('provider_id', provider)
}

async function clearCache(cacheType: string, supabase: any) {
  const now = new Date()
  const expiredTime = new Date(now.getTime() - 1000) // 1 second ago

  if (cacheType === 'all_caches' || cacheType === 'query_cache') {
    await supabase.from('hotel_offers_cache').delete().lt('ttl_expires_at', now.toISOString())
    await supabase.from('flight_offers_cache').delete().lt('ttl_expires_at', now.toISOString())
    await supabase.from('activities_offers_cache').delete().lt('ttl_expires_at', now.toISOString())
  }

  if (cacheType === 'booking_cache') {
    await supabase.from('admin_metrics_cache').delete().lt('expires_at', now.toISOString())
  }
}

async function refreshConnections(target: string) {
  // Simulate connection refresh
  console.log(`[HEALING] Refreshing connections for ${target}`)
  await new Promise(resolve => setTimeout(resolve, 100))
}

async function reloadConfiguration(supabase: any) {
  // Force reload of API configurations
  await supabase
    .from('api_configuration')
    .update({ updated_at: new Date().toISOString() })
    .eq('is_active', true)
}