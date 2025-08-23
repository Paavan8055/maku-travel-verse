import { serviceRegistry } from './ServiceRegistry';
import { dataNormalizer } from './DataNormalizer';
import { advancedCacheManager } from './AdvancedCacheManager';
import { correlationId } from '@/utils/correlationId';
import { supabase } from '@/integrations/supabase/client';
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
      // Make real API call via Supabase client
      const { data: responseData, error: responseError } = await supabase.functions.invoke(
        `${endpoint.provider}-flight-search`,
        {
          body: params,
          headers: correlationId.getHeaders()
        }
      );
      
      if (responseError) throw new Error(responseError.message);
      const data = responseData;
      const responseTime = Date.now() - startTime;
      
      // Update endpoint metrics
      serviceRegistry.updateEndpointPerformance(endpoint.id, responseData?.success || false, responseTime);
      
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
      const { data: responseData, error: responseError } = await supabase.functions.invoke(
        `${endpoint.provider}-hotel-search`,
        {
          body: params,
          headers: correlationId.getHeaders()
        }
      );
      
      if (responseError) throw new Error(responseError.message);
      const data = responseData;
      const responseTime = Date.now() - startTime;
      
      serviceRegistry.updateEndpointPerformance(endpoint.id, responseData?.success || false, responseTime);
      
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