import { serviceRegistry } from './ServiceRegistry';
import { dataNormalizer } from './DataNormalizer';
import { advancedCacheManager } from './AdvancedCacheManager';
import { correlationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

export class UnifiedApiClient {
  async searchFlights(params: any): Promise<any> {
    const cacheKey = `flight:${JSON.stringify(params)}`;
    const corrId = correlationId.generateId();
    
    // Check cache first
    const cached = await advancedCacheManager.get(cacheKey, { strategy: 'flight-search' });
    if (cached) return cached;
    
    // Get best endpoint
    const endpoint = serviceRegistry.selectBestEndpoint('flight', 'performance-based');
    if (!endpoint) throw new Error('No flight endpoints available');
    
    try {
      const startTime = Date.now();
      // Make API call (simplified)
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: correlationId.getHeaders()
      });
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      // Update endpoint metrics
      serviceRegistry.updateEndpointPerformance(endpoint.id, response.ok, responseTime);
      
      // Normalize data
      const normalized = await dataNormalizer.normalizeFlights({ [endpoint.provider]: data }, corrId);
      
      // Cache results
      await advancedCacheManager.set(cacheKey, normalized, { strategy: 'flight-search' });
      
      return normalized;
    } catch (error) {
      serviceRegistry.updateEndpointPerformance(endpoint.id, false, 5000);
      throw error;
    }
  }
  
  async searchHotels(params: any): Promise<any> {
    const cacheKey = `hotel:${JSON.stringify(params)}`;
    const cached = await advancedCacheManager.get(cacheKey, { strategy: 'hotel-search' });
    if (cached) return cached;
    
    const endpoint = serviceRegistry.selectBestEndpoint('hotel', 'cost-optimized');
    if (!endpoint) throw new Error('No hotel endpoints available');
    
    const corrId = correlationId.generateId();
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/hotels/search', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: correlationId.getHeaders()
      });
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      serviceRegistry.updateEndpointPerformance(endpoint.id, response.ok, responseTime);
      
      const normalized = await dataNormalizer.normalizeHotels({ [endpoint.provider]: data }, corrId);
      await advancedCacheManager.set(cacheKey, normalized, { strategy: 'hotel-search' });
      
      return normalized;
    } catch (error) {
      serviceRegistry.updateEndpointPerformance(endpoint.id, false, 5000);
      throw error;
    }
  }
}

export const unifiedApiClient = new UnifiedApiClient();