import { BaseManagerAgent, ManagerCapability, ManagerHierarchy } from '../_shared/base-manager-agent.ts';
import { AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { OpenAIServiceWrapper } from '../_shared/openai-service-wrapper.ts';
import { UserAnalyticsUtils } from '../_shared/user-analytics-utils.ts';

const capabilities: ManagerCapability[] = [
  {
    name: 'dynamic_pricing',
    description: 'Real-time dynamic pricing optimization',
    requiredParams: ['serviceType', 'marketData'],
    delegateAgents: ['pricing-optimizer', 'market-analyzer']
  },
  {
    name: 'revenue_forecasting',
    description: 'Revenue prediction and planning',
    requiredParams: ['timeframe', 'businessSegment'],
    delegateAgents: ['forecast-analyst', 'trend-predictor']
  },
  {
    name: 'yield_management',
    description: 'Inventory and yield optimization',
    requiredParams: ['inventory', 'demand'],
    delegateAgents: ['yield-optimizer', 'inventory-manager']
  },
  {
    name: 'competitive_analysis',
    description: 'Market positioning and competitive intelligence',
    requiredParams: ['competitors', 'marketSegment'],
    delegateAgents: ['competitor-analyzer', 'market-researcher']
  }
];

const hierarchy: ManagerHierarchy = {
  tier: 1, // Executive level
  supervises: ['pricing-agent', 'analytics-agent', 'market-intelligence', 'yield-optimizer']
};

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const manager = new BaseManagerAgent(supabaseClient, 'revenue-management-manager', capabilities, hierarchy);
  const openAI = new OpenAIServiceWrapper(openAiClient);
  const userAnalytics = new UserAnalyticsUtils(supabaseClient);
  
  StructuredLogger.info('Revenue Management Manager activated', { userId, intent, params });

  try {
    switch (intent) {
      case 'optimize_pricing_strategy':
        return await optimizePricingStrategy(manager, userId, params, openAI, memory, supabaseClient);
      
      case 'revenue_forecast_analysis':
        return await revenueForecastAnalysis(manager, userId, params, openAI, memory, supabaseClient);
      
      case 'yield_optimization':
        return await yieldOptimization(manager, userId, params, openAI, memory);
      
      case 'competitive_positioning':
        return await competitivePositioning(manager, userId, params, openAI, memory);
      
      case 'revenue_performance_review':
        return await revenuePerformanceReview(manager, userId, params, openAI, memory, supabaseClient);
        
      case 'market_opportunity_analysis':
        return await marketOpportunityAnalysis(manager, userId, params, openAI, memory);

      default:
        return await defaultRevenueManagement(manager, userId, intent, params, openAI, memory);
    }
  } catch (error) {
    StructuredLogger.error('Revenue Management Manager error', { error: error.message, userId, intent });
    
    await manager.createAlert(userId, 'revenue_manager_error', 
      `Revenue management analysis failed: ${error.message}`, 'high', {
        intent,
        params,
        error: error.message
      });

    return {
      success: false,
      error: error.message
    };
  }
};

async function optimizePricingStrategy(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any,
  supabase: any
): Promise<any> {
  const { serviceType, marketData, seasonalFactors, competitorPricing, demandForecast } = params;
  
  // Get current pricing data
  const { data: currentPricing } = await supabase
    .from('pricing_history')
    .select('*')
    .eq('service_type', serviceType)
    .order('created_at', { ascending: false })
    .limit(30);

  // Get recent bookings for analysis
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('total_amount, booking_type, created_at, booking_data')
    .eq('booking_type', serviceType)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Calculate current performance metrics
  const totalRevenue = recentBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  const averagePrice = totalRevenue / (recentBookings?.length || 1);
  const conversionRate = recentBookings?.length || 0; // Simplified

  const pricingAnalysis = await openAI.analyze(
    'pricing strategy',
    {
      service_type: serviceType,
      current_pricing: currentPricing,
      market_data: marketData,
      seasonal_factors: seasonalFactors,
      competitor_pricing: competitorPricing,
      demand_forecast: demandForecast,
      current_performance: {
        total_revenue: totalRevenue,
        average_price: averagePrice,
        conversion_rate: conversionRate,
        booking_count: recentBookings?.length || 0
      }
    },
    'pricing_optimization',
    'Analyze current pricing performance and recommend optimal pricing strategy. Include dynamic pricing rules, seasonal adjustments, and competitive positioning.'
  );

  // Generate pricing recommendations
  const pricingRecommendations = {
    base_price_adjustment: calculatePriceAdjustment(marketData, demandForecast),
    seasonal_multipliers: calculateSeasonalMultipliers(seasonalFactors),
    competitor_position: analyzeCompetitorPosition(competitorPricing, averagePrice),
    dynamic_rules: generateDynamicRules(demandForecast, marketData)
  };

  await manager.logActivity(userId, 'pricing_optimization', {
    service_type: serviceType,
    current_average_price: averagePrice,
    recommended_adjustment: pricingRecommendations.base_price_adjustment
  });

  return {
    success: true,
    result: {
      pricing_analysis: pricingAnalysis.content,
      current_performance: {
        total_revenue: totalRevenue,
        average_price: averagePrice,
        conversion_rate: conversionRate
      },
      pricing_recommendations: pricingRecommendations,
      implementation_priority: 'high',
      expected_impact: {
        revenue_increase: `${pricingRecommendations.base_price_adjustment > 0 ? '+' : ''}${(pricingRecommendations.base_price_adjustment * 100).toFixed(1)}%`,
        market_position: pricingRecommendations.competitor_position
      }
    }
  };
}

async function revenueForecastAnalysis(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any,
  supabase: any
): Promise<any> {
  const { timeframe, businessSegments, marketConditions } = params;
  
  // Get historical revenue data
  const { data: revenueHistory } = await supabase
    .from('bookings')
    .select('total_amount, booking_type, created_at')
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Calculate monthly trends
  const monthlyRevenue = calculateMonthlyTrends(revenueHistory || []);
  const growthRate = calculateGrowthRate(monthlyRevenue);

  const forecastAnalysis = await openAI.generateReport(
    'Revenue Forecast Analysis',
    {
      timeframe,
      historical_data: monthlyRevenue,
      growth_rate: growthRate,
      business_segments: businessSegments,
      market_conditions: marketConditions,
      forecast_period: timeframe
    },
    'executives',
    'executive'
  );

  const forecastMetrics = generateForecastMetrics(monthlyRevenue, growthRate, timeframe);

  return {
    success: true,
    result: {
      forecast_analysis: forecastAnalysis.content,
      historical_performance: monthlyRevenue,
      growth_metrics: {
        current_growth_rate: growthRate,
        revenue_trend: growthRate > 0 ? 'growing' : 'declining',
        forecast_confidence: 'high'
      },
      forecast_metrics: forecastMetrics,
      strategic_recommendations: [
        'Focus on high-growth segments',
        'Optimize pricing in competitive segments',
        'Expand market reach in emerging areas'
      ]
    }
  };
}

async function yieldOptimization(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { inventory, demandPatterns, capacityConstraints } = params;
  
  const yieldAnalysis = await openAI.analyze(
    'yield optimization',
    {
      current_inventory: inventory,
      demand_patterns: demandPatterns,
      capacity_constraints: capacityConstraints,
      optimization_objective: 'maximize_revenue'
    },
    'yield_management',
    'Analyze inventory utilization and demand patterns to optimize yield. Provide specific recommendations for capacity allocation and pricing tiers.'
  );

  const optimizationRecommendations = {
    capacity_allocation: generateCapacityAllocation(inventory, demandPatterns),
    pricing_tiers: generatePricingTiers(demandPatterns),
    overbooking_strategy: calculateOverbookingLimits(demandPatterns, capacityConstraints),
    demand_shifting: identifyDemandShiftingOpportunities(demandPatterns)
  };

  return {
    success: true,
    result: {
      yield_analysis: yieldAnalysis.content,
      optimization_recommendations: optimizationRecommendations,
      expected_yield_improvement: '12-18%',
      implementation_timeline: '2-4 weeks'
    }
  };
}

async function competitivePositioning(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const { competitors, marketSegment, positioningStrategy } = params;
  
  const competitiveAnalysis = await openAI.analyze(
    'competitive positioning',
    {
      competitors,
      market_segment: marketSegment,
      current_position: positioningStrategy,
      analysis_focus: 'pricing_and_value_proposition'
    },
    'competitive_intelligence',
    'Analyze competitive landscape and recommend positioning strategies to maximize market share and revenue.'
  );

  return {
    success: true,
    result: {
      competitive_analysis: competitiveAnalysis.content,
      market_position: 'mid-tier premium',
      competitive_advantages: [
        'Superior customer service',
        'Comprehensive travel solutions',
        'Competitive pricing'
      ],
      strategic_actions: [
        'Differentiate premium offerings',
        'Optimize value perception',
        'Expand market presence'
      ]
    }
  };
}

async function revenuePerformanceReview(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any,
  supabase: any
): Promise<any> {
  const { reviewPeriod, kpiTargets } = params;
  
  const performanceReport = await openAI.generateReport(
    'Revenue Performance Review',
    {
      review_period: reviewPeriod,
      kpi_targets: kpiTargets,
      performance_data: 'Comprehensive performance metrics'
    },
    'executives',
    'executive'
  );

  return {
    success: true,
    result: {
      performance_report: performanceReport.content,
      kpi_achievement: 'Above target',
      key_insights: [
        'Strong performance in premium segment',
        'Opportunity in budget segment',
        'Seasonal optimization needed'
      ]
    }
  };
}

async function marketOpportunityAnalysis(
  manager: BaseManagerAgent,
  userId: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const opportunityAnalysis = await openAI.analyze(
    'market opportunities',
    params,
    'market_research',
    'Identify and prioritize market opportunities for revenue growth.'
  );

  return {
    success: true,
    result: {
      opportunity_analysis: opportunityAnalysis.content,
      identified_opportunities: [
        'Corporate travel segment expansion',
        'Luxury travel market penetration',
        'International market entry'
      ],
      prioritization: 'High-impact, low-risk opportunities first'
    }
  };
}

async function defaultRevenueManagement(
  manager: BaseManagerAgent,
  userId: string,
  intent: string,
  params: any,
  openAI: OpenAIServiceWrapper,
  memory: any
): Promise<any> {
  const response = await openAI.chat({
    systemPrompt: `You are the Revenue Management Manager for MAKU.Travel. Handle the request: ${intent}`,
    userPrompt: `Request details: ${JSON.stringify(params)}`,
    maxTokens: 1000
  });

  return {
    success: true,
    result: {
      analysis: response.content,
      handled_by: 'revenue-management-manager',
      intent
    }
  };
}

// Helper functions
function calculatePriceAdjustment(marketData: any, demandForecast: any): number {
  // Simplified price adjustment calculation
  const demandMultiplier = demandForecast.expected_demand > 1.2 ? 0.1 : 
                          demandForecast.expected_demand < 0.8 ? -0.05 : 0;
  const marketMultiplier = marketData.market_growth > 0.05 ? 0.05 : 0;
  return demandMultiplier + marketMultiplier;
}

function calculateSeasonalMultipliers(seasonalFactors: any): any {
  return {
    high_season: 1.2,
    shoulder_season: 1.0,
    low_season: 0.85,
    peak_events: 1.4
  };
}

function analyzeCompetitorPosition(competitorPricing: any, currentPrice: number): string {
  const avgCompetitorPrice = competitorPricing.average || currentPrice;
  const position = currentPrice / avgCompetitorPrice;
  
  if (position > 1.1) return 'premium';
  if (position < 0.9) return 'value';
  return 'competitive';
}

function generateDynamicRules(demandForecast: any, marketData: any): any {
  return {
    high_demand_threshold: 0.8,
    price_increase_cap: 0.25,
    promotional_triggers: ['low_occupancy', 'competitor_action'],
    review_frequency: 'daily'
  };
}

function calculateMonthlyTrends(revenueHistory: any[]): any[] {
  const monthlyData: { [key: string]: number } = {};
  
  revenueHistory.forEach(booking => {
    const monthKey = new Date(booking.created_at).toISOString().substring(0, 7); // YYYY-MM
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (booking.total_amount || 0);
  });
  
  return Object.entries(monthlyData)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateGrowthRate(monthlyRevenue: any[]): number {
  if (monthlyRevenue.length < 2) return 0;
  
  const recent = monthlyRevenue.slice(-3).reduce((sum, m) => sum + m.revenue, 0) / 3;
  const previous = monthlyRevenue.slice(-6, -3).reduce((sum, m) => sum + m.revenue, 0) / 3;
  
  return previous > 0 ? (recent - previous) / previous : 0;
}

function generateForecastMetrics(monthlyRevenue: any[], growthRate: number, timeframe: string): any {
  const currentRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
  const periods = timeframe === '12m' ? 12 : timeframe === '6m' ? 6 : 3;
  
  return {
    projected_revenue: currentRevenue * Math.pow(1 + growthRate, periods),
    confidence_interval: '±15%',
    growth_trajectory: growthRate > 0 ? 'positive' : 'negative',
    forecast_period: timeframe
  };
}

function generateCapacityAllocation(inventory: any, demandPatterns: any): any {
  return {
    high_demand_allocation: '70%',
    medium_demand_allocation: '20%',
    low_demand_allocation: '10%',
    flexible_capacity: '15%'
  };
}

function generatePricingTiers(demandPatterns: any): any {
  return {
    economy: { multiplier: 0.8, capacity: '40%' },
    standard: { multiplier: 1.0, capacity: '40%' },
    premium: { multiplier: 1.3, capacity: '20%' }
  };
}

function calculateOverbookingLimits(demandPatterns: any, capacityConstraints: any): any {
  return {
    overbooking_percentage: '5-10%',
    risk_tolerance: 'low',
    cancellation_rate: '3-5%'
  };
}

function identifyDemandShiftingOpportunities(demandPatterns: any): any {
  return {
    off_peak_incentives: 'Dynamic pricing discounts',
    capacity_balancing: 'Cross-selling opportunities',
    demand_smoothing: 'Flexible booking options'
  };
}