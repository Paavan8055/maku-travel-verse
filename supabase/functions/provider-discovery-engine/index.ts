import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface DiscoveryResult {
  provider_name: string;
  endpoint: string;
  type: string;
  capabilities: string[];
  authentication_type: string;
  integration_complexity: string;
  confidence_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method = 'marketplace_scan', provider_type = 'all' } = await req.json().catch(() => ({}));
    
    console.log(`[DISCOVERY] Starting discovery scan: method=${method}, type=${provider_type}`);
    
    const discoveredProviders: DiscoveryResult[] = [];
    
    // Marketplace scanning simulation (real implementation would hit actual APIs)
    if (method === 'marketplace_scan' || method === 'all') {
      const marketplaceProviders = await scanMarketplaceProviders(provider_type);
      discoveredProviders.push(...marketplaceProviders);
    }
    
    // API endpoint discovery
    if (method === 'endpoint_scan' || method === 'all') {
      const endpointProviders = await scanAPIEndpoints(provider_type);
      discoveredProviders.push(...endpointProviders);
    }
    
    // Process and store discoveries
    const processedDiscoveries = [];
    for (const provider of discoveredProviders) {
      const discoveryId = await logDiscovery(provider, method);
      const pendingId = await createPendingProvider(provider, discoveryId);
      
      processedDiscoveries.push({
        discovery_id: discoveryId,
        pending_id: pendingId,
        provider: provider
      });
      
      console.log(`[DISCOVERY] Found provider: ${provider.provider_name} (confidence: ${provider.confidence_score})`);
    }
    
    // Trigger automation rules
    await triggerAutomationRules(processedDiscoveries);
    
    return new Response(JSON.stringify({
      success: true,
      method,
      discovered_count: discoveredProviders.length,
      discoveries: processedDiscoveries,
      summary: {
        high_confidence: discoveredProviders.filter(p => p.confidence_score >= 0.8).length,
        medium_confidence: discoveredProviders.filter(p => p.confidence_score >= 0.5 && p.confidence_score < 0.8).length,
        low_confidence: discoveredProviders.filter(p => p.confidence_score < 0.5).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[DISCOVERY] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: 'Provider discovery engine failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function scanMarketplaceProviders(type: string): Promise<DiscoveryResult[]> {
  console.log(`[DISCOVERY] Scanning marketplace for ${type} providers`);
  
  // Simulated marketplace discovery (replace with real API calls)
  const mockProviders: DiscoveryResult[] = [
    {
      provider_name: "TravelPort Universal API",
      endpoint: "https://api.travelport.com/v1",
      type: "flight",
      capabilities: ["flight_search", "booking", "pnr_management", "fare_rules"],
      authentication_type: "oauth",
      integration_complexity: "complex",
      confidence_score: 0.9
    },
    {
      provider_name: "Expedia Partner Solutions",
      endpoint: "https://api.expediapartnercentral.com/v1",
      type: "hotel",
      capabilities: ["hotel_search", "availability", "booking", "modification"],
      authentication_type: "api_key",
      integration_complexity: "medium",
      confidence_score: 0.85
    },
    {
      provider_name: "Viator API",
      endpoint: "https://api.viatorpartner.com/v1",
      type: "activity",
      capabilities: ["activity_search", "availability", "booking", "cancellation"],
      authentication_type: "api_key",
      integration_complexity: "simple",
      confidence_score: 0.8
    },
    {
      provider_name: "Kiwi.com Partner API",
      endpoint: "https://api.kiwi.com/v1",
      type: "flight",
      capabilities: ["flight_search", "multi_city", "booking"],
      authentication_type: "api_key",
      integration_complexity: "medium",
      confidence_score: 0.75
    }
  ];
  
  return type === 'all' ? mockProviders : mockProviders.filter(p => p.type === type);
}

async function scanAPIEndpoints(type: string): Promise<DiscoveryResult[]> {
  console.log(`[DISCOVERY] Scanning API endpoints for ${type} providers`);
  
  // Simulated endpoint discovery
  const endpointProviders: DiscoveryResult[] = [
    {
      provider_name: "Direct Connect Airlines API",
      endpoint: "https://directconnect.airlines.com/api/v2",
      type: "flight",
      capabilities: ["direct_booking", "loyalty_programs", "seat_selection"],
      authentication_type: "bearer",
      integration_complexity: "medium",
      confidence_score: 0.7
    }
  ];
  
  return type === 'all' ? endpointProviders : endpointProviders.filter(p => p.type === type);
}

async function logDiscovery(provider: DiscoveryResult, method: string): Promise<string> {
  const { data, error } = await supabase
    .from('provider_discovery_log')
    .insert({
      discovery_method: method,
      discovered_provider_name: provider.provider_name,
      discovered_endpoint: provider.endpoint,
      discovered_capabilities: provider.capabilities,
      discovery_metadata: {
        confidence_score: provider.confidence_score,
        authentication_type: provider.authentication_type,
        integration_complexity: provider.integration_complexity,
        discovery_timestamp: new Date().toISOString()
      },
      verification_status: provider.confidence_score >= 0.8 ? 'verified' : 'pending'
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('[DISCOVERY] Failed to log discovery:', error);
    throw error;
  }
  
  return data.id;
}

async function createPendingProvider(provider: DiscoveryResult, discoveryLogId: string): Promise<string> {
  const { data, error } = await supabase
    .from('pending_providers')
    .insert({
      discovery_log_id: discoveryLogId,
      provider_name: provider.provider_name,
      provider_type: provider.type,
      api_endpoint: provider.endpoint,
      authentication_type: provider.authentication_type,
      capabilities: provider.capabilities,
      integration_complexity: provider.integration_complexity,
      estimated_setup_time_minutes: getEstimatedSetupTime(provider.integration_complexity),
      cost_estimation: {
        setup_cost: getSetupCost(provider.integration_complexity),
        monthly_cost: getEstimatedMonthlyCost(provider.type),
        revenue_potential: getRevenueEstimate(provider.capabilities.length)
      },
      approval_status: provider.confidence_score >= 0.9 ? 'approved' : 'pending'
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('[DISCOVERY] Failed to create pending provider:', error);
    throw error;
  }
  
  return data.id;
}

async function triggerAutomationRules(discoveries: any[]): Promise<void> {
  // Get active automation rules
  const { data: rules, error } = await supabase
    .from('discovery_automation_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  
  if (error) {
    console.error('[DISCOVERY] Failed to fetch automation rules:', error);
    return;
  }
  
  for (const discovery of discoveries) {
    for (const rule of rules) {
      if (await evaluateRuleConditions(rule.conditions, discovery)) {
        await executeRuleActions(rule.actions, discovery);
        
        // Update rule trigger count
        await supabase
          .from('discovery_automation_rules')
          .update({
            last_triggered: new Date().toISOString(),
            trigger_count: (rule.trigger_count || 0) + 1
          })
          .eq('id', rule.id);
        
        console.log(`[DISCOVERY] Triggered rule: ${rule.rule_name} for ${discovery.provider.provider_name}`);
      }
    }
  }
}

async function evaluateRuleConditions(conditions: any, discovery: any): Promise<boolean> {
  // Simple condition evaluation (extend as needed)
  if (conditions.integration_complexity) {
    if (!conditions.integration_complexity.includes(discovery.provider.integration_complexity)) {
      return false;
    }
  }
  
  if (conditions.authentication_type) {
    if (!conditions.authentication_type.includes(discovery.provider.authentication_type)) {
      return false;
    }
  }
  
  if (conditions.min_confidence && discovery.provider.confidence_score < conditions.min_confidence) {
    return false;
  }
  
  return true;
}

async function executeRuleActions(actions: any, discovery: any): Promise<void> {
  if (actions.auto_approve) {
    await supabase
      .from('pending_providers')
      .update({ approval_status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', discovery.pending_id);
  }
  
  if (actions.auto_test) {
    // Trigger credential testing
    await supabase.functions.invoke('provider-api-tester', {
      body: {
        provider_id: discovery.pending_id,
        test_type: 'basic_connectivity'
      }
    });
  }
  
  if (actions.notify_admin) {
    // Create admin notification
    await supabase
      .from('agent_alerts')
      .insert({
        alert_type: 'provider_discovery',
        title: `New Provider Discovered: ${discovery.provider.provider_name}`,
        message: `Auto-discovery found a new ${discovery.provider.type} provider with ${discovery.provider.confidence_score * 100}% confidence`,
        severity: actions.priority || 'medium',
        alert_data: {
          discovery_id: discovery.discovery_id,
          provider_name: discovery.provider.provider_name,
          confidence_score: discovery.provider.confidence_score,
          auto_approved: actions.auto_approve || false
        }
      });
  }
}

function getEstimatedSetupTime(complexity: string): number {
  switch (complexity) {
    case 'simple': return 15;
    case 'medium': return 30;
    case 'complex': return 60;
    default: return 30;
  }
}

function getSetupCost(complexity: string): number {
  switch (complexity) {
    case 'simple': return 500;
    case 'medium': return 1500;
    case 'complex': return 5000;
    default: return 1500;
  }
}

function getEstimatedMonthlyCost(type: string): number {
  const baseCosts = {
    flight: 200,
    hotel: 150,
    activity: 100,
    transfer: 75
  };
  return baseCosts[type] || 150;
}

function getRevenueEstimate(capabilityCount: number): number {
  return capabilityCount * 1000; // $1000 per capability per month
}