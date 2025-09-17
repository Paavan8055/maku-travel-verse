import { supabase } from '@/integrations/supabase/client';
import { weightedProviderSelector, type ProviderWeight, type SelectionCriteria } from './WeightedProviderSelector';
import { intelligentCacheManager } from './IntelligentCacheManager';
import { crossModuleContextManager } from './CrossModuleContextManager';
import logger from '@/utils/logger';

export interface MLSelectionFeatures {
  historicalSuccessRate: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  costEfficiency: number;
  timeOfDay: number;
  searchComplexity: number;
  userTier: 'basic' | 'premium' | 'enterprise';
  seasonalFactor: number;
}

export interface ProviderPrediction {
  providerId: string;
  successProbability: number;
  predictedResponseTime: number;
  confidenceScore: number;
  riskFactors: string[];
}

export interface AdvancedRotationResult {
  success: boolean;
  data?: any;
  provider?: string;
  providerId?: string;
  responseTime?: number;
  fallbackUsed?: boolean;
  error?: string;
  mlScore?: number;
  prediction?: ProviderPrediction;
  alternativeProviders?: string[];
}

export class AdvancedProviderRotation {
  private learningData = new Map<string, MLSelectionFeatures[]>();
  private predictionCache = new Map<string, ProviderPrediction[]>();
  private performanceHistory = new Map<string, Array<{ timestamp: number; success: boolean; responseTime: number; userRating?: number }>>();

  async selectProviderWithML(
    searchType: 'flight' | 'hotel' | 'activity',
    params: any,
    userContext?: { tier?: string; preferences?: any; history?: any[] }
  ): Promise<AdvancedRotationResult> {
    try {
      const startTime = Date.now();
      
      // Get available providers with enhanced selection criteria
      const { data: providers } = await supabase.functions.invoke('get-quota-providers', {
        body: { searchType, excludedProviders: [] }
      });

      if (!providers?.length) {
        return { success: false, error: 'No providers available' };
      }

      // Generate ML features for current context
      const features = this.generateMLFeatures(searchType, params, userContext);
      
      // Get predictions for all providers
      const predictions = await this.generateProviderPredictions(providers, features);
      
      // Select best provider based on ML prediction + weighted selection
      const selectedProvider = this.selectOptimalProvider(predictions, features);
      
      if (!selectedProvider) {
        return { success: false, error: 'No suitable provider found' };
      }

      // Execute search with selected provider
      const result = await this.executeProviderSearch(selectedProvider.providerId, searchType, params);
      
      // Record result for ML training
      await this.recordMLTrainingData(selectedProvider.providerId, features, result, Date.now() - startTime);
      
      return {
        ...result,
        mlScore: selectedProvider.successProbability,
        prediction: selectedProvider,
        alternativeProviders: predictions.slice(1, 4).map(p => p.providerId)
      };

    } catch (error) {
      logger.error('Advanced provider rotation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async executeMultiProviderSearch(
    searchType: 'flight' | 'hotel' | 'activity',
    params: any,
    maxProviders: number = 3
  ): Promise<AdvancedRotationResult[]> {
    const { data: providers } = await supabase.functions.invoke('get-quota-providers', {
      body: { searchType, excludedProviders: [] }
    });

    if (!providers?.length) {
      return [{ success: false, error: 'No providers available' }];
    }

    const features = this.generateMLFeatures(searchType, params);
    const predictions = await this.generateProviderPredictions(providers, features);
    
    // Execute searches in parallel with top providers
    const topProviders = predictions.slice(0, maxProviders);
    const searchPromises = topProviders.map(async (provider) => {
      try {
        const result = await this.executeProviderSearch(provider.providerId, searchType, params);
        return {
          ...result,
          mlScore: provider.successProbability,
          prediction: provider
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Provider failed',
          providerId: provider.providerId,
          mlScore: provider.successProbability
        };
      }
    });

    return Promise.all(searchPromises);
  }

  private generateMLFeatures(
    searchType: string,
    params: any,
    userContext?: any
  ): MLSelectionFeatures {
    const hour = new Date().getHours();
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      historicalSuccessRate: 85, // Will be calculated from actual data
      averageResponseTime: 2000,
      userSatisfactionScore: 4.2,
      costEfficiency: 0.7,
      timeOfDay: hour,
      searchComplexity: this.calculateSearchComplexity(params),
      userTier: (userContext?.tier as any) || 'basic',
      seasonalFactor: Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.5 + 0.5
    };
  }

  private calculateSearchComplexity(params: any): number {
    let complexity = 1;
    
    if (params.flexible_dates) complexity += 0.3;
    if (params.multi_city) complexity += 0.5;
    if (params.special_requests) complexity += 0.2;
    if (params.filters && Object.keys(params.filters).length > 3) complexity += 0.4;
    
    return Math.min(complexity, 3.0);
  }

  private async generateProviderPredictions(
    providers: any[],
    features: MLSelectionFeatures
  ): Promise<ProviderPrediction[]> {
    const predictions: ProviderPrediction[] = [];

    for (const provider of providers) {
      const history = this.performanceHistory.get(provider.provider_id) || [];
      const recentHistory = history.slice(-50); // Last 50 requests
      
      const successRate = recentHistory.length > 0 
        ? recentHistory.filter(h => h.success).length / recentHistory.length 
        : 0.5;
      
      const avgResponseTime = recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + h.responseTime, 0) / recentHistory.length
        : 2000;

      // Simple ML prediction (in production, this would use a trained model)
      const successProbability = this.calculateSuccessProbability(provider, features, successRate);
      const predictedResponseTime = this.predictResponseTime(provider, features, avgResponseTime);
      
      predictions.push({
        providerId: provider.provider_id,
        successProbability,
        predictedResponseTime,
        confidenceScore: Math.min(recentHistory.length / 20, 1.0),
        riskFactors: this.identifyRiskFactors(provider, features)
      });
    }

    return predictions.sort((a, b) => b.successProbability - a.successProbability);
  }

  private calculateSuccessProbability(provider: any, features: MLSelectionFeatures, historicalSuccess: number): number {
    let probability = historicalSuccess;
    
    // Time of day factor
    if (features.timeOfDay >= 9 && features.timeOfDay <= 17) {
      probability *= 1.1; // Business hours boost
    } else if (features.timeOfDay >= 22 || features.timeOfDay <= 6) {
      probability *= 0.9; // Late night penalty
    }
    
    // Complexity factor
    probability *= Math.max(0.7, 1.0 - (features.searchComplexity - 1) * 0.1);
    
    // User tier factor
    if (features.userTier === 'premium') probability *= 1.05;
    if (features.userTier === 'enterprise') probability *= 1.1;
    
    // Seasonal factor
    probability *= (0.9 + features.seasonalFactor * 0.2);
    
    return Math.min(Math.max(probability, 0.1), 0.95);
  }

  private predictResponseTime(provider: any, features: MLSelectionFeatures, historicalTime: number): number {
    let predictedTime = historicalTime;
    
    // Complexity factor
    predictedTime *= (1 + (features.searchComplexity - 1) * 0.3);
    
    // Time of day factor
    if (features.timeOfDay >= 9 && features.timeOfDay <= 17) {
      predictedTime *= 1.2; // Slower during business hours
    }
    
    return Math.round(predictedTime);
  }

  private identifyRiskFactors(provider: any, features: MLSelectionFeatures): string[] {
    const riskFactors: string[] = [];
    
    if (provider.quota_status === 'warning') riskFactors.push('quota_warning');
    if (provider.quota_status === 'critical') riskFactors.push('quota_critical');
    if (features.searchComplexity > 2) riskFactors.push('complex_search');
    if (features.timeOfDay >= 22 || features.timeOfDay <= 6) riskFactors.push('off_hours');
    
    return riskFactors;
  }

  private selectOptimalProvider(predictions: ProviderPrediction[], features: MLSelectionFeatures): ProviderPrediction | null {
    if (predictions.length === 0) return null;
    
    // Weight factors for selection
    const weights = {
      success: 0.4,
      speed: 0.3,
      confidence: 0.2,
      risk: 0.1
    };
    
    const scoredPredictions = predictions.map(p => {
      const speedScore = Math.max(0, 1 - (p.predictedResponseTime - 1000) / 5000);
      const riskScore = Math.max(0, 1 - p.riskFactors.length * 0.2);
      
      const totalScore = 
        p.successProbability * weights.success +
        speedScore * weights.speed +
        p.confidenceScore * weights.confidence +
        riskScore * weights.risk;
        
      return { ...p, totalScore };
    });
    
    return scoredPredictions.sort((a, b) => b.totalScore - a.totalScore)[0];
  }

  private async executeProviderSearch(providerId: string, searchType: string, params: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType,
        params,
        preferredProvider: providerId,
        excludedProviders: []
      }
    });

    if (error) throw new Error(error.message);
    return data;
  }

  private async recordMLTrainingData(
    providerId: string,
    features: MLSelectionFeatures,
    result: any,
    responseTime: number
  ): Promise<void> {
    const history = this.performanceHistory.get(providerId) || [];
    history.push({
      timestamp: Date.now(),
      success: result.success,
      responseTime,
      userRating: result.userRating
    });
    
    // Keep only last 100 records per provider
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.performanceHistory.set(providerId, history);
    
    // Store learning data for future ML model training
    const learningHistory = this.learningData.get(providerId) || [];
    learningHistory.push(features);
    this.learningData.set(providerId, learningHistory.slice(-50));
  }

  async getProviderInsights(providerId: string): Promise<{
    performance: any;
    predictions: ProviderPrediction | null;
    recommendations: string[];
  }> {
    const history = this.performanceHistory.get(providerId) || [];
    const recentHistory = history.slice(-20);
    
    const performance = {
      successRate: recentHistory.length ? recentHistory.filter(h => h.success).length / recentHistory.length : 0,
      averageResponseTime: recentHistory.length ? recentHistory.reduce((sum, h) => sum + h.responseTime, 0) / recentHistory.length : 0,
      trend: this.calculateTrend(history),
      reliability: this.calculateReliability(history)
    };
    
    const recommendations = this.generateRecommendations(performance);
    
    return {
      performance,
      predictions: null, // Would generate current prediction
      recommendations
    };
  }

  private calculateTrend(history: any[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 10) return 'stable';
    
    const recent = history.slice(-5);
    const previous = history.slice(-10, -5);
    
    const recentSuccess = recent.filter(h => h.success).length / recent.length;
    const previousSuccess = previous.filter(h => h.success).length / previous.length;
    
    if (recentSuccess > previousSuccess + 0.1) return 'improving';
    if (recentSuccess < previousSuccess - 0.1) return 'declining';
    return 'stable';
  }

  private calculateReliability(history: any[]): number {
    if (history.length === 0) return 0.5;
    
    const successRate = history.filter(h => h.success).length / history.length;
    const consistencyScore = 1 - this.calculateVariance(history.map(h => h.success ? 1 : 0));
    
    return (successRate * 0.7 + consistencyScore * 0.3);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private generateRecommendations(performance: any): string[] {
    const recommendations: string[] = [];
    
    if (performance.successRate < 0.8) {
      recommendations.push('Consider reducing provider priority due to low success rate');
    }
    
    if (performance.averageResponseTime > 5000) {
      recommendations.push('Provider response time is high - monitor for quota issues');
    }
    
    if (performance.trend === 'declining') {
      recommendations.push('Provider performance is declining - investigate recent changes');
    }
    
    if (performance.reliability < 0.7) {
      recommendations.push('Provider shows inconsistent performance - consider backup options');
    }
    
    return recommendations;
  }
}

export const advancedProviderRotation = new AdvancedProviderRotation();
