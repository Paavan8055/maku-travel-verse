export { DataNormalizer, dataNormalizer } from './DataNormalizer';
export { ServiceRegistry, LoadBalancer, serviceRegistry } from './ServiceRegistry';
export { AdvancedCacheManager, advancedCacheManager } from './AdvancedCacheManager';
export { UnifiedApiClient, unifiedApiClient } from './UnifiedApiClient';
export { CircuitBreaker, CircuitBreakerRegistry, circuitBreakerRegistry } from './CircuitBreaker';
export { WeightedProviderSelector, weightedProviderSelector } from './WeightedProviderSelector';

export type { 
  UnifiedFlight, 
  UnifiedHotel, 
  UnifiedActivity 
} from './DataNormalizer';

export type { 
  ServiceEndpoint, 
  LoadBalancerStrategy 
} from './ServiceRegistry';

export type { 
  CacheItem, 
  CacheMetrics, 
  CacheStrategy 
} from './AdvancedCacheManager';

export type {
  CircuitBreakerConfig,
  CircuitBreakerMetrics,
  CircuitBreakerState
} from './CircuitBreaker';

export type {
  ProviderWeight,
  SelectionCriteria
} from './WeightedProviderSelector';