export { DataNormalizer, dataNormalizer } from './DataNormalizer';
export { ServiceRegistry, LoadBalancer, serviceRegistry } from './ServiceRegistry';
export { AdvancedCacheManager, advancedCacheManager } from './AdvancedCacheManager';
export { UnifiedApiClient, unifiedApiClient } from './UnifiedApiClient';
export { CircuitBreaker, CircuitBreakerRegistry, circuitBreakerRegistry } from './CircuitBreaker';
export { WeightedProviderSelector, weightedProviderSelector } from './WeightedProviderSelector';
export { IntelligentCacheManager, intelligentCacheManager } from './IntelligentCacheManager';
export { CrossModuleContextManager, crossModuleContextManager } from './CrossModuleContextManager';
export { AdvancedProviderRotation, advancedProviderRotation } from './AdvancedProviderRotation';
export { UnifiedSearchOrchestrator, unifiedSearchOrchestrator } from './UnifiedSearchOrchestrator';
export { DataQualityValidator, dataQualityValidator } from './DataQualityValidator';

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