export { DataNormalizer, dataNormalizer } from './DataNormalizer';
export { ServiceRegistry, LoadBalancer, serviceRegistry } from './ServiceRegistry';
export { AdvancedCacheManager, advancedCacheManager } from './AdvancedCacheManager';
export { UnifiedApiClient, unifiedApiClient } from './UnifiedApiClient';

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