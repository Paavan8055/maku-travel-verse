import logger from '@/utils/logger';

export interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  provider: string;
  type: 'flight' | 'hotel' | 'activity' | 'car' | 'transfer';
  status: 'active' | 'inactive' | 'maintenance';
  healthScore: number;
  lastHealthCheck: Date;
  capabilities: string[];
  quotas: {
    daily: number;
    remaining: number;
    resetTime: Date;
  };
  performance: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  costPerRequest: number;
  priority: number;
  version: string;
  metadata: Record<string, any>;
}

export interface LoadBalancerStrategy {
  name: string;
  selectEndpoint(endpoints: ServiceEndpoint[], criteria?: any): ServiceEndpoint | null;
}

export class RoundRobinStrategy implements LoadBalancerStrategy {
  name = 'round-robin';
  private currentIndex = 0;

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint | null {
    if (endpoints.length === 0) return null;
    
    const endpoint = endpoints[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % endpoints.length;
    return endpoint;
  }
}

export class HealthBasedStrategy implements LoadBalancerStrategy {
  name = 'health-based';

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint | null {
    if (endpoints.length === 0) return null;
    
    // Filter healthy endpoints (health score > 30)
    const healthyEndpoints = endpoints.filter(ep => 
      ep.status === 'active' && 
      ep.healthScore > 30 &&
      ep.quotas.remaining > 0
    );
    
    if (healthyEndpoints.length === 0) return null;
    
    // Sort by health score and performance
    healthyEndpoints.sort((a, b) => {
      const scoreA = a.healthScore * 0.6 + (100 - a.performance.avgResponseTime / 10) * 0.4;
      const scoreB = b.healthScore * 0.6 + (100 - b.performance.avgResponseTime / 10) * 0.4;
      return scoreB - scoreA;
    });
    
    return healthyEndpoints[0];
  }
}

export class CostOptimizedStrategy implements LoadBalancerStrategy {
  name = 'cost-optimized';

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint | null {
    if (endpoints.length === 0) return null;
    
    // Filter available endpoints
    const availableEndpoints = endpoints.filter(ep => 
      ep.status === 'active' && 
      ep.healthScore > 20 &&
      ep.quotas.remaining > 0
    );
    
    if (availableEndpoints.length === 0) return null;
    
    // Sort by cost and success rate
    availableEndpoints.sort((a, b) => {
      const scoreA = (100 - a.costPerRequest) * 0.7 + a.performance.successRate * 0.3;
      const scoreB = (100 - b.costPerRequest) * 0.7 + b.performance.successRate * 0.3;
      return scoreB - scoreA;
    });
    
    return availableEndpoints[0];
  }
}

export class PerformanceBasedStrategy implements LoadBalancerStrategy {
  name = 'performance-based';

  selectEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint | null {
    if (endpoints.length === 0) return null;
    
    // Filter high-performance endpoints
    const performantEndpoints = endpoints.filter(ep => 
      ep.status === 'active' && 
      ep.healthScore > 50 &&
      ep.performance.successRate > 90 &&
      ep.quotas.remaining > 0
    );
    
    if (performantEndpoints.length === 0) {
      // Fallback to any available endpoint
      return endpoints.find(ep => 
        ep.status === 'active' && 
        ep.quotas.remaining > 0
      ) || null;
    }
    
    // Sort by response time and success rate
    performantEndpoints.sort((a, b) => {
      const scoreA = a.performance.successRate * 0.6 + (1000 / a.performance.avgResponseTime) * 0.4;
      const scoreB = b.performance.successRate * 0.6 + (1000 / b.performance.avgResponseTime) * 0.4;
      return scoreB - scoreA;
    });
    
    return performantEndpoints[0];
  }
}

export class LoadBalancer {
  private strategies: Map<string, LoadBalancerStrategy> = new Map();
  private defaultStrategy = 'health-based';

  constructor() {
    this.strategies.set('round-robin', new RoundRobinStrategy());
    this.strategies.set('health-based', new HealthBasedStrategy());
    this.strategies.set('cost-optimized', new CostOptimizedStrategy());
    this.strategies.set('performance-based', new PerformanceBasedStrategy());
  }

  selectEndpoint(
    endpoints: ServiceEndpoint[], 
    strategy: string = this.defaultStrategy,
    criteria?: any
  ): ServiceEndpoint | null {
    const strategyImpl = this.strategies.get(strategy);
    if (!strategyImpl) {
      logger.warn(`Unknown load balancing strategy: ${strategy}, using default`);
      return this.strategies.get(this.defaultStrategy)!.selectEndpoint(endpoints, criteria);
    }
    
    return strategyImpl.selectEndpoint(endpoints, criteria);
  }

  addStrategy(strategy: LoadBalancerStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  setDefaultStrategy(strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.defaultStrategy = strategyName;
    }
  }
}

export class ServiceRegistry {
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private loadBalancer = new LoadBalancer();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHealthChecks();
  }

  registerEndpoint(endpoint: ServiceEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
    logger.info(`Registered service endpoint: ${endpoint.name}`, { 
      id: endpoint.id, 
      provider: endpoint.provider,
      type: endpoint.type 
    });
  }

  unregisterEndpoint(endpointId: string): void {
    if (this.endpoints.delete(endpointId)) {
      logger.info(`Unregistered service endpoint: ${endpointId}`);
    }
  }

  getEndpoint(endpointId: string): ServiceEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  getEndpointsByType(type: ServiceEndpoint['type']): ServiceEndpoint[] {
    return Array.from(this.endpoints.values()).filter(ep => ep.type === type);
  }

  getEndpointsByProvider(provider: string): ServiceEndpoint[] {
    return Array.from(this.endpoints.values()).filter(ep => ep.provider === provider);
  }

  selectBestEndpoint(
    type: ServiceEndpoint['type'],
    strategy: string = 'health-based',
    criteria?: any
  ): ServiceEndpoint | null {
    const endpoints = this.getEndpointsByType(type);
    return this.loadBalancer.selectEndpoint(endpoints, strategy, criteria);
  }

  updateEndpointHealth(endpointId: string, healthScore: number, responseTime?: number): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    endpoint.healthScore = Math.max(0, Math.min(100, healthScore));
    endpoint.lastHealthCheck = new Date();
    
    if (responseTime !== undefined) {
      // Update moving average of response time
      endpoint.performance.avgResponseTime = 
        (endpoint.performance.avgResponseTime * 0.8) + (responseTime * 0.2);
    }

    this.endpoints.set(endpointId, endpoint);
  }

  updateEndpointQuota(endpointId: string, remaining: number): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    endpoint.quotas.remaining = remaining;
    this.endpoints.set(endpointId, endpoint);
  }

  updateEndpointPerformance(
    endpointId: string, 
    success: boolean, 
    responseTime: number
  ): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    // Update success rate (moving average)
    const currentSuccessRate = endpoint.performance.successRate;
    endpoint.performance.successRate = 
      (currentSuccessRate * 0.9) + (success ? 100 : 0) * 0.1;

    // Update error rate
    endpoint.performance.errorRate = 100 - endpoint.performance.successRate;

    // Update response time
    endpoint.performance.avgResponseTime = 
      (endpoint.performance.avgResponseTime * 0.8) + (responseTime * 0.2);

    this.endpoints.set(endpointId, endpoint);
  }

  getServiceHealth(): { healthy: number; degraded: number; unhealthy: number; total: number } {
    const endpoints = Array.from(this.endpoints.values());
    
    return {
      healthy: endpoints.filter(ep => ep.healthScore >= 70 && ep.status === 'active').length,
      degraded: endpoints.filter(ep => ep.healthScore >= 30 && ep.healthScore < 70 && ep.status === 'active').length,
      unhealthy: endpoints.filter(ep => ep.healthScore < 30 || ep.status !== 'active').length,
      total: endpoints.length
    };
  }

  getAllEndpoints(): ServiceEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    const endpoints = Array.from(this.endpoints.values());
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        
        // Simulate health check - in real implementation, call endpoint
        const isHealthy = await this.checkEndpointHealth(endpoint);
        const responseTime = Date.now() - startTime;
        
        const healthScore = isHealthy ? 
          Math.min(100, endpoint.healthScore + 5) : 
          Math.max(0, endpoint.healthScore - 10);
        
        this.updateEndpointHealth(endpoint.id, healthScore, responseTime);
        
      } catch (error) {
        logger.error(`Health check failed for endpoint ${endpoint.id}:`, error);
        this.updateEndpointHealth(endpoint.id, Math.max(0, endpoint.healthScore - 20));
      }
    }
  }

  private async checkEndpointHealth(endpoint: ServiceEndpoint): Promise<boolean> {
    // Implement actual health check logic here
    // For now, simulate based on current health score
    return endpoint.healthScore > 30 && endpoint.status === 'active';
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Global registry instance
export const serviceRegistry = new ServiceRegistry();

// Register provider rotation endpoints (production system)
const defaultEndpoints: Omit<ServiceEndpoint, 'id'>[] = [
  {
    name: 'Flight Provider Rotation',
    url: '/provider-rotation',
    provider: 'rotation-system',
    type: 'flight',
    status: 'active',
    healthScore: 95,
    lastHealthCheck: new Date(),
    capabilities: ['search', 'booking', 'cancellation', 'provider-fallback', 'quota-management'],
    quotas: {
      daily: 50000, // Combined quota across all providers
      remaining: 45000,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    performance: {
      avgResponseTime: 420,
      successRate: 98.8,
      errorRate: 1.2
    },
    costPerRequest: 0.018,
    priority: 1,
    version: '2.0.0',
    metadata: { searchType: 'flight', supportsFallback: true }
  },
  {
    name: 'Hotel Provider Rotation',
    url: '/provider-rotation',
    provider: 'rotation-system',
    type: 'hotel',
    status: 'active',
    healthScore: 96,
    lastHealthCheck: new Date(),
    capabilities: ['search', 'booking', 'cancellation', 'provider-fallback', 'quota-management'],
    quotas: {
      daily: 60000, // Combined quota across all providers
      remaining: 52000,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    performance: {
      avgResponseTime: 380,
      successRate: 99.1,
      errorRate: 0.9
    },
    costPerRequest: 0.015,
    priority: 1,
    version: '2.0.0',
    metadata: { searchType: 'hotel', supportsFallback: true }
  },
  {
    name: 'Activity Provider Rotation',
    url: '/provider-rotation',
    provider: 'rotation-system',
    type: 'activity',
    status: 'active',
    healthScore: 92,
    lastHealthCheck: new Date(),
    capabilities: ['search', 'booking', 'provider-fallback', 'quota-management'],
    quotas: {
      daily: 25000, // Combined quota across all providers
      remaining: 19000,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    performance: {
      avgResponseTime: 580,
      successRate: 96.5,
      errorRate: 3.5
    },
    costPerRequest: 0.022,
    priority: 1,
    version: '2.0.0',
    metadata: { searchType: 'activity', supportsFallback: true }
  }
];

// Register default endpoints
defaultEndpoints.forEach((endpoint, index) => {
  serviceRegistry.registerEndpoint({
    ...endpoint,
    id: `endpoint-${index + 1}`
  });
});