import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseAgent, StructuredLogger, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory
) => {
  const agent = new BaseAgent(supabaseClient, 'advanced-supplier-manager');
  
  try {
    StructuredLogger.info('Advanced supplier manager processing request', {
      userId,
      intent,
      agentId: 'advanced-supplier-manager'
    });

    switch (intent) {
      case 'negotiate_pricing':
        return await negotiatePricing(agent, userId, params);
      
      case 'analyze_market_rates':
        return await analyzeMarketRates(agent, userId, params);
      
      case 'optimize_supplier_mix':
        return await optimizeSupplierMix(agent, userId, params);
      
      case 'track_negotiation_performance':
        return await trackNegotiationPerformance(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for advanced supplier manager', { intent });
        return {
          success: false,
          error: 'Unknown intent for advanced supplier manager'
        };
    }
  } catch (error) {
    StructuredLogger.error('Advanced supplier manager error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function negotiatePricing(
  agent: BaseAgent,
  userId: string,
  params: {
    supplierId: string;
    productType: string;
    currentPrice: number;
    targetDiscount: number;
    volume?: number;
    negotiationStrategy?: string;
  }
): Promise<any> {
  try {
    // Create negotiation record
    const { data: negotiation, error: negotiationError } = await agent['supabase']
      .from('supplier_negotiations')
      .insert({
        supplier_id: params.supplierId,
        negotiation_type: 'pricing',
        product_type: params.productType,
        original_price: params.currentPrice,
        negotiation_strategy: {
          targetDiscount: params.targetDiscount,
          volume: params.volume || 1,
          strategy: params.negotiationStrategy || 'volume_based',
          maxRounds: 3
        },
        status: 'initiated',
        agent_id: 'advanced-supplier-manager',
        user_id: userId
      })
      .select()
      .single();

    if (negotiationError) throw negotiationError;

    // Simulate dynamic pricing negotiation logic
    const negotiationResult = await simulateNegotiation(params);

    // Update negotiation with result
    const { data: updatedNegotiation, error: updateError } = await agent['supabase']
      .from('supplier_negotiations')
      .update({
        negotiated_price: negotiationResult.finalPrice,
        negotiation_rounds: negotiationResult.rounds,
        status: negotiationResult.success ? 'completed' : 'failed',
        final_terms: negotiationResult.terms,
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiation.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await agent.logActivity(userId, 'pricing_negotiation_completed', {
      negotiationId: negotiation.id,
      supplierId: params.supplierId,
      originalPrice: params.currentPrice,
      finalPrice: negotiationResult.finalPrice,
      savingsAchieved: params.currentPrice - negotiationResult.finalPrice,
      success: negotiationResult.success
    });

    return {
      success: true,
      result: {
        negotiation: updatedNegotiation,
        savingsAchieved: params.currentPrice - negotiationResult.finalPrice,
        savingsPercentage: ((params.currentPrice - negotiationResult.finalPrice) / params.currentPrice) * 100,
        recommendedAction: negotiationResult.recommendation
      },
      memoryUpdates: [{
        key: 'recent_negotiation',
        data: {
          supplierId: params.supplierId,
          finalPrice: negotiationResult.finalPrice,
          success: negotiationResult.success,
          timestamp: new Date().toISOString()
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to negotiate pricing', { error: error.message, userId });
    throw error;
  }
}

async function analyzeMarketRates(
  agent: BaseAgent,
  userId: string,
  params: {
    productType: string;
    destination?: string;
    timeframe?: string;
  }
): Promise<any> {
  try {
    // Get historical pricing data from recent bookings
    const { data: recentBookings, error } = await agent['supabase']
      .from('bookings')
      .select('booking_data, total_amount, currency, created_at')
      .eq('booking_type', params.productType)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const marketAnalysis = analyzeMarketData(recentBookings || [], params);

    await agent.logActivity(userId, 'market_analysis_completed', {
      productType: params.productType,
      sampleSize: recentBookings?.length || 0,
      averagePrice: marketAnalysis.averagePrice
    });

    return {
      success: true,
      result: {
        marketAnalysis,
        recommendations: generatePricingRecommendations(marketAnalysis),
        dataFreshness: new Date().toISOString()
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to analyze market rates', { error: error.message, userId });
    throw error;
  }
}

async function optimizeSupplierMix(
  agent: BaseAgent,
  userId: string,
  params: {
    productType: string;
    criteria: {
      prioritizePrice?: boolean;
      prioritizeQuality?: boolean;
      prioritizeSpeed?: boolean;
    };
  }
): Promise<any> {
  try {
    // Get supplier performance data
    const { data: supplierPerformance, error } = await agent['supabase']
      .from('supplier_negotiations')
      .select('supplier_id, negotiated_price, original_price, status, created_at')
      .eq('product_type', params.productType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const optimization = optimizeSupplierSelection(supplierPerformance || [], params.criteria);

    await agent.logActivity(userId, 'supplier_mix_optimized', {
      productType: params.productType,
      suppliersAnalyzed: optimization.suppliersAnalyzed,
      recommendedSuppliers: optimization.recommendations.length
    });

    return {
      success: true,
      result: {
        optimization,
        implementationSteps: generateImplementationSteps(optimization),
        expectedSavings: optimization.projectedSavings
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to optimize supplier mix', { error: error.message, userId });
    throw error;
  }
}

async function trackNegotiationPerformance(
  agent: BaseAgent,
  userId: string,
  params: { timeframe?: string; supplierId?: string }
): Promise<any> {
  try {
    let query = agent['supabase']
      .from('supplier_negotiations')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.supplierId) {
      query = query.eq('supplier_id', params.supplierId);
    }

    if (params.timeframe) {
      const date = getTimeframeDate(params.timeframe);
      query = query.gte('created_at', date.toISOString());
    }

    const { data: negotiations, error } = await query;

    if (error) throw error;

    const performance = calculateNegotiationPerformance(negotiations || []);

    return {
      success: true,
      result: {
        performance,
        trends: analyzeNegotiationTrends(negotiations || []),
        topPerformingStrategies: identifyTopStrategies(negotiations || [])
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to track negotiation performance', { error: error.message, userId });
    throw error;
  }
}

async function simulateNegotiation(params: any): Promise<any> {
  // Simulate negotiation logic - in production, this would integrate with actual supplier APIs
  const targetDiscount = params.targetDiscount / 100;
  const volume = params.volume || 1;
  
  // Volume-based discount calculation
  let achievableDiscount = Math.min(targetDiscount, 0.15); // Max 15% discount
  
  if (volume > 10) achievableDiscount += 0.02;
  if (volume > 50) achievableDiscount += 0.03;
  if (volume > 100) achievableDiscount += 0.05;
  
  const finalPrice = params.currentPrice * (1 - achievableDiscount);
  const rounds = Math.ceil(Math.random() * 3) + 1;
  const success = achievableDiscount >= targetDiscount * 0.7; // 70% of target is considered success
  
  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    rounds,
    success,
    terms: {
      discountAchieved: achievableDiscount,
      paymentTerms: '30 days',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    recommendation: success ? 'Accept offer' : 'Consider alternative suppliers'
  };
}

function analyzeMarketData(bookings: any[], params: any): any {
  const prices = bookings.map(b => b.total_amount).filter(p => p > 0);
  
  if (prices.length === 0) {
    return {
      averagePrice: 0,
      medianPrice: 0,
      priceRange: { min: 0, max: 0 },
      trend: 'insufficient_data',
      volatility: 0
    };
  }
  
  prices.sort((a, b) => a - b);
  
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const median = prices[Math.floor(prices.length / 2)];
  const min = prices[0];
  const max = prices[prices.length - 1];
  
  // Calculate price volatility
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance) / average;
  
  return {
    averagePrice: Math.round(average * 100) / 100,
    medianPrice: Math.round(median * 100) / 100,
    priceRange: { min, max },
    trend: analyzePriceTrend(bookings),
    volatility: Math.round(volatility * 100) / 100,
    sampleSize: prices.length
  };
}

function analyzePriceTrend(bookings: any[]): string {
  if (bookings.length < 10) return 'insufficient_data';
  
  const recentPrices = bookings.slice(0, Math.floor(bookings.length / 2)).map(b => b.total_amount);
  const olderPrices = bookings.slice(Math.floor(bookings.length / 2)).map(b => b.total_amount);
  
  const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
  const olderAvg = olderPrices.reduce((sum, p) => sum + p, 0) / olderPrices.length;
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  if (change > 0.05) return 'increasing';
  if (change < -0.05) return 'decreasing';
  return 'stable';
}

function generatePricingRecommendations(analysis: any): any[] {
  const recommendations = [];
  
  if (analysis.volatility > 0.2) {
    recommendations.push({
      type: 'volatility_warning',
      message: 'High price volatility detected. Consider flexible booking strategies.',
      priority: 'high'
    });
  }
  
  if (analysis.trend === 'increasing') {
    recommendations.push({
      type: 'price_trend',
      message: 'Prices are trending upward. Consider booking sooner or exploring alternatives.',
      priority: 'medium'
    });
  }
  
  if (analysis.sampleSize < 20) {
    recommendations.push({
      type: 'data_quality',
      message: 'Limited market data available. Recommendations may be less accurate.',
      priority: 'low'
    });
  }
  
  return recommendations;
}

function optimizeSupplierSelection(performance: any[], criteria: any): any {
  const supplierStats: Record<string, any> = {};
  
  performance.forEach(negotiation => {
    const supplierId = negotiation.supplier_id;
    if (!supplierStats[supplierId]) {
      supplierStats[supplierId] = {
        supplierId,
        totalNegotiations: 0,
        successfulNegotiations: 0,
        totalSavings: 0,
        averageDiscount: 0
      };
    }
    
    const stats = supplierStats[supplierId];
    stats.totalNegotiations++;
    
    if (negotiation.status === 'completed' && negotiation.negotiated_price < negotiation.original_price) {
      stats.successfulNegotiations++;
      const savings = negotiation.original_price - negotiation.negotiated_price;
      stats.totalSavings += savings;
    }
  });
  
  // Calculate performance metrics
  Object.values(supplierStats).forEach((stats: any) => {
    stats.successRate = stats.successfulNegotiations / stats.totalNegotiations;
    stats.averageDiscount = stats.totalSavings / stats.totalNegotiations;
    
    // Composite score based on criteria
    let score = 0;
    if (criteria.prioritizePrice) score += stats.averageDiscount * 0.4;
    if (criteria.prioritizeQuality) score += stats.successRate * 0.3;
    if (criteria.prioritizeSpeed) score += (1 - Math.min(stats.totalNegotiations / 10, 1)) * 0.3;
    
    stats.optimizationScore = score;
  });
  
  const recommendations = Object.values(supplierStats)
    .sort((a: any, b: any) => b.optimizationScore - a.optimizationScore)
    .slice(0, 5);
  
  return {
    suppliersAnalyzed: Object.keys(supplierStats).length,
    recommendations,
    projectedSavings: calculateProjectedSavings(recommendations as any[]),
    optimizationCriteria: criteria
  };
}

function generateImplementationSteps(optimization: any): any[] {
  return [
    {
      step: 1,
      action: 'Review recommended supplier rankings',
      description: 'Analyze the top-performing suppliers based on your criteria',
      timeframe: '1 day'
    },
    {
      step: 2,
      action: 'Negotiate contracts with top suppliers',
      description: 'Initiate formal negotiations with the highest-ranked suppliers',
      timeframe: '1-2 weeks'
    },
    {
      step: 3,
      action: 'Implement gradual supplier mix changes',
      description: 'Gradually shift volume to optimized supplier mix',
      timeframe: '1 month'
    },
    {
      step: 4,
      action: 'Monitor performance metrics',
      description: 'Track savings and performance improvements',
      timeframe: 'Ongoing'
    }
  ];
}

function calculateNegotiationPerformance(negotiations: any[]): any {
  const total = negotiations.length;
  const successful = negotiations.filter(n => n.status === 'completed').length;
  const totalSavings = negotiations.reduce((sum, n) => {
    if (n.status === 'completed' && n.negotiated_price < n.original_price) {
      return sum + (n.original_price - n.negotiated_price);
    }
    return sum;
  }, 0);
  
  return {
    totalNegotiations: total,
    successfulNegotiations: successful,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    totalSavings: Math.round(totalSavings * 100) / 100,
    averageSavingsPerNegotiation: total > 0 ? Math.round((totalSavings / total) * 100) / 100 : 0
  };
}

function analyzeNegotiationTrends(negotiations: any[]): any {
  // Group by month to show trends
  const monthlyData: Record<string, any> = {};
  
  negotiations.forEach(negotiation => {
    const month = new Date(negotiation.created_at).toISOString().slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { total: 0, successful: 0, savings: 0 };
    }
    
    monthlyData[month].total++;
    if (negotiation.status === 'completed') {
      monthlyData[month].successful++;
      if (negotiation.negotiated_price < negotiation.original_price) {
        monthlyData[month].savings += (negotiation.original_price - negotiation.negotiated_price);
      }
    }
  });
  
  return {
    monthlyTrends: monthlyData,
    trendDirection: calculateTrendDirection(monthlyData)
  };
}

function identifyTopStrategies(negotiations: any[]): any[] {
  const strategies: Record<string, any> = {};
  
  negotiations.forEach(negotiation => {
    const strategy = negotiation.negotiation_strategy?.strategy || 'unknown';
    if (!strategies[strategy]) {
      strategies[strategy] = { total: 0, successful: 0, totalSavings: 0 };
    }
    
    strategies[strategy].total++;
    if (negotiation.status === 'completed') {
      strategies[strategy].successful++;
      if (negotiation.negotiated_price < negotiation.original_price) {
        strategies[strategy].totalSavings += (negotiation.original_price - negotiation.negotiated_price);
      }
    }
  });
  
  return Object.entries(strategies)
    .map(([strategy, data]: [string, any]) => ({
      strategy,
      successRate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
      averageSavings: data.total > 0 ? Math.round((data.totalSavings / data.total) * 100) / 100 : 0,
      totalUses: data.total
    }))
    .sort((a, b) => b.successRate - a.successRate);
}

function getTimeframeDate(timeframe: string): Date {
  const date = new Date();
  switch (timeframe) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'quarter':
      date.setMonth(date.getMonth() - 3);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setMonth(date.getMonth() - 1);
  }
  return date;
}

function calculateProjectedSavings(recommendations: any[]): number {
  return recommendations.reduce((sum, rec) => sum + (rec.averageDiscount * 100), 0);
}

function calculateTrendDirection(monthlyData: Record<string, any>): string {
  const months = Object.keys(monthlyData).sort();
  if (months.length < 2) return 'insufficient_data';
  
  const recent = monthlyData[months[months.length - 1]];
  const previous = monthlyData[months[months.length - 2]];
  
  const recentRate = recent.total > 0 ? recent.successful / recent.total : 0;
  const previousRate = previous.total > 0 ? previous.successful / previous.total : 0;
  
  if (recentRate > previousRate + 0.1) return 'improving';
  if (recentRate < previousRate - 0.1) return 'declining';
  return 'stable';
}