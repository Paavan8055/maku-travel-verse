import logger from '@/utils/logger';
import { circuitBreakerRegistry } from './CircuitBreaker';

export interface ProviderWeight {
  providerId: string;
  weight: number;
  lastResponseTime: number;
  successRate: number;
  quotaUsage: number;
  costPerRequest: number;
  healthScore: number;
}

export interface SelectionCriteria {
  prioritizeSpeed?: boolean;
  prioritizeCost?: boolean;
  prioritizeReliability?: boolean;
  maxResponseTime?: number;
  minSuccessRate?: number;
  maxCostPerRequest?: number;
}

export class WeightedProviderSelector {
  private providerWeights = new Map<string, ProviderWeight>();
  private weightUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startWeightUpdates();
  }

  updateProviderMetrics(
    providerId: string,
    responseTime: number,
    success: boolean,
    quotaUsage: number,
    costPerRequest: number = 0.01
  ): void {
    const current = this.providerWeights.get(providerId) || {
      providerId,
      weight: 100,
      lastResponseTime: responseTime,
      successRate: 100,
      quotaUsage: 0,
      costPerRequest,
      healthScore: 100
    };

    // Update metrics using exponential moving averages
    const alpha = 0.3; // Smoothing factor
    
    current.lastResponseTime = (alpha * responseTime) + ((1 - alpha) * current.lastResponseTime);
    current.successRate = (alpha * (success ? 100 : 0)) + ((1 - alpha) * current.successRate);
    current.quotaUsage = quotaUsage;
    current.costPerRequest = costPerRequest;

    // Calculate health score based on multiple factors
    current.healthScore = this.calculateHealthScore(current);
    
    // Update weight based on performance
    current.weight = this.calculateWeight(current);

    this.providerWeights.set(providerId, current);
    
    logger.info(`Updated provider metrics for ${providerId}`, {
      weight: current.weight,
      healthScore: current.healthScore,
      successRate: current.successRate,
      responseTime: current.lastResponseTime
    });
  }

  selectProvider(
    availableProviders: string[],
    criteria: SelectionCriteria = {}
  ): string | null {
    if (availableProviders.length === 0) return null;

    // Filter providers based on criteria
    const eligibleProviders = availableProviders.filter(providerId => {
      const weight = this.providerWeights.get(providerId);
      if (!weight) return true; // Allow new providers

      // Check circuit breaker status
      const circuitBreaker = circuitBreakerRegistry.getCircuitBreaker(providerId);
      if (!circuitBreaker.isRequestAllowed()) return false;

      // Apply criteria filters
      if (criteria.maxResponseTime && weight.lastResponseTime > criteria.maxResponseTime) return false;
      if (criteria.minSuccessRate && weight.successRate < criteria.minSuccessRate) return false;
      if (criteria.maxCostPerRequest && weight.costPerRequest > criteria.maxCostPerRequest) return false;
      if (weight.quotaUsage >= 100) return false; // Quota exhausted

      return true;
    });

    if (eligibleProviders.length === 0) return null;

    // Apply weighted selection with criteria
    const weights = eligibleProviders.map(providerId => {
      const providerWeight = this.providerWeights.get(providerId) || {
        providerId,
        weight: 100,
        lastResponseTime: 1000,
        successRate: 100,
        quotaUsage: 0,
        costPerRequest: 0.01,
        healthScore: 100
      };

      let adjustedWeight = providerWeight.weight;

      // Apply criteria-based adjustments
      if (criteria.prioritizeSpeed) {
        adjustedWeight *= (2000 / Math.max(providerWeight.lastResponseTime, 100));
      }
      
      if (criteria.prioritizeCost) {
        adjustedWeight *= (0.1 / Math.max(providerWeight.costPerRequest, 0.001));
      }
      
      if (criteria.prioritizeReliability) {
        adjustedWeight *= (providerWeight.successRate / 100);
      }

      return { providerId, weight: Math.max(adjustedWeight, 1) };
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { providerId, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        logger.info(`Selected provider ${providerId}`, {
          criteria,
          totalCandidates: eligibleProviders.length,
          selectedWeight: weight,
          totalWeight
        });
        return providerId;
      }
    }

    // Fallback to first eligible provider
    return eligibleProviders[0];
  }

  private calculateHealthScore(provider: ProviderWeight): number {
    // Composite health score based on multiple factors
    const responseTimeFactor = Math.max(0, 100 - (provider.lastResponseTime / 50)); // Penalty for slow responses
    const successRateFactor = provider.successRate;
    const quotaFactor = Math.max(0, 100 - provider.quotaUsage); // Penalty for high quota usage
    const costFactor = Math.max(0, 100 - (provider.costPerRequest * 1000)); // Penalty for high cost

    return (
      responseTimeFactor * 0.3 +
      successRateFactor * 0.4 +
      quotaFactor * 0.2 +
      costFactor * 0.1
    );
  }

  private calculateWeight(provider: ProviderWeight): number {
    // Weight calculation based on health score with dampening
    const baseWeight = Math.max(1, provider.healthScore);
    
    // Apply exponential decay for consistently poor performers
    if (provider.successRate < 50) {
      return baseWeight * 0.1;
    } else if (provider.successRate < 80) {
      return baseWeight * 0.5;
    }

    return baseWeight;
  }

  getProviderStats(): ProviderWeight[] {
    return Array.from(this.providerWeights.values());
  }

  getProviderWeight(providerId: string): ProviderWeight | undefined {
    return this.providerWeights.get(providerId);
  }

  private startWeightUpdates(): void {
    this.weightUpdateInterval = setInterval(() => {
      this.updateWeights();
    }, 60000); // Update every minute
  }

  private updateWeights(): void {
    // Gradual recovery for underperforming providers
    for (const [providerId, weight] of this.providerWeights.entries()) {
      if (weight.weight < 50) {
        weight.weight = Math.min(100, weight.weight * 1.05); // 5% recovery
        this.providerWeights.set(providerId, weight);
      }
    }
  }

  destroy(): void {
    if (this.weightUpdateInterval) {
      clearInterval(this.weightUpdateInterval);
      this.weightUpdateInterval = null;
    }
  }
}

export const weightedProviderSelector = new WeightedProviderSelector();