// Intelligent Provider Router with Advanced Selection Logic
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import logger from "../_shared/logger.ts";
import { ProviderAuthFactory } from "../_shared/provider-authentication.ts";
import { CircuitBreakerManager } from "../_shared/provider-circuit-breakers.ts";
import { ResponseTransformer } from "../_shared/unified-response-transformer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  priority: number;
  healthScore: number;
  capabilities: string[];
  costTier: 'low' | 'medium' | 'high';
  speedTier: 'fast' | 'medium' | 'slow';
  reliabilityScore: number;
  quotaUsage: number;
  lastResponseTime: number;
}

interface IntelligentRoutingRequest {
  searchType: 'flight' | 'hotel' | 'activity';
  params: any;
  routingPreferences?: {
    strategy: 'cost_optimized' | 'speed_optimized' | 'reliability_optimized' | 'balanced';
    maxResponseTime?: number;
    maxCostPerRequest?: number;
    minReliabilityScore?: number;
    preferredProviders?: string[];
    blacklistedProviders?: string[];
  };
  userContext?: {
    userId?: string;
    tier: 'free' | 'premium' | 'enterprise';
    previousSuccessfulProvider?: string;
    affinityProviders?: string[];
  };
}

interface RoutingDecision {
  selectedProvider: ProviderConfig;
  reason: string;
  alternatives: ProviderConfig[];
  routingScore: number;
  expectedResponseTime: number;
  expectedCost: number;
}

const providerConfigs = new Map<string, ProviderConfig>();
const providerAffinity = new Map<string, Map<string, number>>(); // userId -> provider -> affinity score

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: IntelligentRoutingRequest = await req.json();
    const correlationId = crypto.randomUUID();
    
    logger.info('[INTELLIGENT-ROUTER] Processing routing request', {
      searchType: request.searchType,
      strategy: request.routingPreferences?.strategy || 'balanced',
      userTier: request.userContext?.tier || 'free',
      correlationId
    });

    // Load provider configurations
    await loadProviderConfigurations(supabase, request.searchType);
    
    // Make intelligent routing decision
    const routingDecision = await makeIntelligentRoutingDecision(request);
    
    if (!routingDecision) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No suitable provider found',
        fallbackData: await getFallbackData(request.searchType),
        correlationId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    logger.info('[INTELLIGENT-ROUTER] Routing decision made', {
      selectedProvider: routingDecision.selectedProvider.id,
      reason: routingDecision.reason,
      routingScore: routingDecision.routingScore,
      correlationId
    });

    // Execute request with selected provider
    const result = await executeWithSelectedProvider(
      routingDecision.selectedProvider,
      request.params,
      correlationId
    );

    // Update provider affinity if successful
    if (result.success && request.userContext?.userId) {
      updateProviderAffinity(
        request.userContext.userId,
        routingDecision.selectedProvider.id,
        true
      );
    }

    // Track routing metrics
    await trackRoutingMetrics(supabase, {
      correlationId,
      selectedProvider: routingDecision.selectedProvider.id,
      strategy: request.routingPreferences?.strategy || 'balanced',
      success: result.success,
      responseTime: result.responseTime,
      userTier: request.userContext?.tier || 'free'
    });

    return new Response(JSON.stringify({
      success: result.success,
      data: result.data,
      error: result.error,
      routing: {
        selectedProvider: routingDecision.selectedProvider.name,
        providerId: routingDecision.selectedProvider.id,
        reason: routingDecision.reason,
        routingScore: routingDecision.routingScore,
        alternatives: routingDecision.alternatives.length
      },
      performance: {
        responseTime: result.responseTime,
        expectedResponseTime: routingDecision.expectedResponseTime
      },
      correlationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 500
    });

  } catch (error) {
    logger.error('[INTELLIGENT-ROUTER] Request failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function loadProviderConfigurations(supabase: any, searchType: string): Promise<void> {
  try {
    const { data: providers, error } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('type', searchType)
      .eq('enabled', true);

    if (error) {
      logger.warn('[INTELLIGENT-ROUTER] Failed to load provider configs from database:', error);
      return;
    }

    for (const provider of providers) {
      providerConfigs.set(provider.id, {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        priority: provider.priority,
        healthScore: provider.health_score || 90,
        capabilities: provider.capabilities || [],
        costTier: provider.cost_tier || 'medium',
        speedTier: provider.speed_tier || 'medium',
        reliabilityScore: provider.reliability_score || 95,
        quotaUsage: provider.quota_usage || 0,
        lastResponseTime: provider.response_time || 500
      });
    }
  } catch (error) {
    logger.error('[INTELLIGENT-ROUTER] Error loading provider configurations:', error);
  }
}

async function makeIntelligentRoutingDecision(request: IntelligentRoutingRequest): Promise<RoutingDecision | null> {
  const availableProviders = Array.from(providerConfigs.values())
    .filter(provider => provider.type === request.searchType)
    .filter(provider => isProviderAvailable(provider))
    .filter(provider => !request.routingPreferences?.blacklistedProviders?.includes(provider.id));

  if (availableProviders.length === 0) {
    return null;
  }

  // Apply filtering based on preferences
  let candidates = availableProviders;

  if (request.routingPreferences?.maxResponseTime) {
    candidates = candidates.filter(p => p.lastResponseTime <= request.routingPreferences!.maxResponseTime!);
  }

  if (request.routingPreferences?.minReliabilityScore) {
    candidates = candidates.filter(p => p.reliabilityScore >= request.routingPreferences!.minReliabilityScore!);
  }

  if (candidates.length === 0) {
    candidates = availableProviders; // Fallback to all available
  }

  // Score each candidate based on strategy
  const scoredCandidates = candidates.map(provider => ({
    provider,
    score: calculateProviderScore(provider, request)
  }));

  // Sort by score (highest first)
  scoredCandidates.sort((a, b) => b.score - a.score);

  const selectedCandidate = scoredCandidates[0];
  
  return {
    selectedProvider: selectedCandidate.provider,
    reason: generateSelectionReason(selectedCandidate.provider, request.routingPreferences?.strategy || 'balanced'),
    alternatives: scoredCandidates.slice(1, 4).map(c => c.provider),
    routingScore: selectedCandidate.score,
    expectedResponseTime: selectedCandidate.provider.lastResponseTime,
    expectedCost: getCostEstimate(selectedCandidate.provider)
  };
}

function calculateProviderScore(provider: ProviderConfig, request: IntelligentRoutingRequest): number {
  const strategy = request.routingPreferences?.strategy || 'balanced';
  const userTier = request.userContext?.tier || 'free';
  
  let baseScore = provider.healthScore;
  
  // Strategy-based scoring
  switch (strategy) {
    case 'cost_optimized':
      baseScore += getCostScore(provider) * 0.5;
      baseScore += getSpeedScore(provider) * 0.2;
      baseScore += getReliabilityScore(provider) * 0.3;
      break;
      
    case 'speed_optimized':
      baseScore += getSpeedScore(provider) * 0.6;
      baseScore += getReliabilityScore(provider) * 0.3;
      baseScore += getCostScore(provider) * 0.1;
      break;
      
    case 'reliability_optimized':
      baseScore += getReliabilityScore(provider) * 0.6;
      baseScore += getSpeedScore(provider) * 0.2;
      baseScore += getCostScore(provider) * 0.2;
      break;
      
    default: // balanced
      baseScore += getCostScore(provider) * 0.3;
      baseScore += getSpeedScore(provider) * 0.3;
      baseScore += getReliabilityScore(provider) * 0.4;
  }

  // User tier adjustments
  if (userTier === 'premium') {
    baseScore += provider.priority <= 1 ? 20 : 0; // Prefer premium providers
  } else if (userTier === 'enterprise') {
    baseScore += provider.priority === 1 ? 30 : 0; // Prefer top-tier providers
  }

  // Provider affinity bonus
  if (request.userContext?.userId) {
    const affinityMap = providerAffinity.get(request.userContext.userId);
    if (affinityMap?.has(provider.id)) {
      baseScore += affinityMap.get(provider.id)! * 10;
    }
  }

  // Preferred providers bonus
  if (request.routingPreferences?.preferredProviders?.includes(provider.id)) {
    baseScore += 25;
  }

  // Previous successful provider bonus
  if (request.userContext?.previousSuccessfulProvider === provider.id) {
    baseScore += 15;
  }

  // Quota usage penalty
  if (provider.quotaUsage > 80) {
    baseScore -= (provider.quotaUsage - 80) * 2;
  }

  return Math.max(baseScore, 0);
}

function getCostScore(provider: ProviderConfig): number {
  switch (provider.costTier) {
    case 'low': return 100;
    case 'medium': return 70;
    case 'high': return 40;
    default: return 70;
  }
}

function getSpeedScore(provider: ProviderConfig): number {
  // Invert response time for scoring (lower response time = higher score)
  const maxResponseTime = 5000;
  const normalizedTime = Math.min(provider.lastResponseTime, maxResponseTime);
  return 100 - (normalizedTime / maxResponseTime * 100);
}

function getReliabilityScore(provider: ProviderConfig): number {
  return provider.reliabilityScore;
}

function getCostEstimate(provider: ProviderConfig): number {
  const baseCosts = { low: 0.01, medium: 0.02, high: 0.05 };
  return baseCosts[provider.costTier];
}

function isProviderAvailable(provider: ProviderConfig): boolean {
  // Check circuit breaker state
  try {
    const circuitBreaker = CircuitBreakerManager.getCircuitBreaker(provider.id);
    const state = circuitBreaker.getState();
    return state === 'closed' || state === 'half-open';
  } catch {
    return true; // Assume available if circuit breaker check fails
  }
}

function generateSelectionReason(provider: ProviderConfig, strategy: string): string {
  const reasons = [];
  
  if (provider.healthScore > 90) reasons.push('high health score');
  if (provider.reliabilityScore > 95) reasons.push('excellent reliability');
  if (provider.costTier === 'low') reasons.push('cost effective');
  if (provider.lastResponseTime < 300) reasons.push('fast response time');
  if (provider.priority === 1) reasons.push('premium provider');
  
  const strategyReasons = {
    cost_optimized: 'cost optimization strategy',
    speed_optimized: 'speed optimization strategy', 
    reliability_optimized: 'reliability optimization strategy',
    balanced: 'balanced strategy'
  };
  
  return `Selected for ${strategyReasons[strategy as keyof typeof strategyReasons]} due to ${reasons.join(', ')}`;
}

async function executeWithSelectedProvider(
  provider: ProviderConfig,
  params: any,
  correlationId: string
): Promise<{ success: boolean; data?: any; error?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const circuitBreaker = CircuitBreakerManager.getCircuitBreaker(provider.id);
    
    const result = await circuitBreaker.execute(async () => {
      return await makeProviderRequest(provider, params, correlationId);
    });

    const responseTime = Date.now() - startTime;
    
    // Transform response
    const providerType = provider.id.split('-')[0] as 'amadeus' | 'sabre' | 'hotelbeds';
    const serviceType = provider.id.split('-')[1] as 'flight' | 'hotel' | 'activity';
    
    const transformedData = ResponseTransformer.transformResponse(
      result,
      providerType,
      serviceType,
      provider.id,
      responseTime
    );

    return {
      success: true,
      data: transformedData,
      responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error(`[INTELLIGENT-ROUTER] Provider ${provider.id} execution failed:`, {
      error: error.message,
      responseTime,
      correlationId
    });
    
    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

async function makeProviderRequest(provider: ProviderConfig, params: any, correlationId: string): Promise<any> {
  const providerType = provider.id.split('-')[0];
  
  // Get authentication for the provider
  let authResult;
  
  switch (providerType) {
    case 'sabre': {
      const auth = ProviderAuthFactory.getSabreAuth();
      const token = await auth.getValidToken();
      authResult = { type: 'bearer', token };
      break;
    }
    case 'amadeus': {
      const auth = ProviderAuthFactory.getAmadeusAuth();
      const token = await auth.getValidToken();
      authResult = { type: 'bearer', token };
      break;
    }
    case 'hotelbeds': {
      const auth = ProviderAuthFactory.getHotelBedsAuth();
      const serviceType = provider.id.split('-')[1] as 'hotel' | 'activity';
      const signature = await auth.generateSignature(serviceType);
      authResult = { type: 'signature', signature };
      break;
    }
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }

  // Make API request with independent authentication
  return await callProviderAPI(provider, params, authResult, correlationId);
}

async function callProviderAPI(
  provider: ProviderConfig, 
  params: any, 
  auth: any, 
  correlationId: string
): Promise<any> {
  // This would contain the actual API call logic for each provider
  // For now, return mock response
  logger.info(`[INTELLIGENT-ROUTER] Making API call to ${provider.id}`, { correlationId });
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, provider.lastResponseTime + Math.random() * 100));
  
  return {
    data: [],
    meta: {
      provider: provider.name,
      providerId: provider.id,
      correlationId
    }
  };
}

function updateProviderAffinity(userId: string, providerId: string, success: boolean): void {
  if (!providerAffinity.has(userId)) {
    providerAffinity.set(userId, new Map());
  }
  
  const userAffinities = providerAffinity.get(userId)!;
  const currentAffinity = userAffinities.get(providerId) || 0;
  
  // Adjust affinity based on success/failure
  const adjustment = success ? 0.1 : -0.2;
  const newAffinity = Math.max(0, Math.min(1, currentAffinity + adjustment));
  
  userAffinities.set(providerId, newAffinity);
}

async function trackRoutingMetrics(supabase: any, metrics: any): Promise<void> {
  try {
    await supabase.from('routing_metrics').insert({
      correlation_id: metrics.correlationId,
      selected_provider: metrics.selectedProvider,
      routing_strategy: metrics.strategy,
      success: metrics.success,
      response_time: metrics.responseTime,
      user_tier: metrics.userTier,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.warn('[INTELLIGENT-ROUTER] Failed to track routing metrics:', error);
  }
}

async function getFallbackData(searchType: string): Promise<any> {
  return {
    [searchType + 's']: [],
    meta: {
      isDemoData: true,
      message: `Demo ${searchType} data - all providers unavailable`
    }
  };
}