import { serviceRegistry } from './ServiceRegistry';
import { dataNormalizer } from './DataNormalizer';
import { advancedCacheManager } from './AdvancedCacheManager';
import { correlationId } from '@/utils/correlationId';
import { supabase } from '@/integrations/supabase/client';
import { useProviderRotation } from '@/hooks/useProviderRotation';
import logger from '@/utils/logger';

export class UnifiedApiClient {
  private providerRotation = new (class {
    async searchWithRotation(params: any): Promise<any> {
      const { data, error } = await supabase.functions.invoke('enhanced-provider-rotation', {
        body: params
      });
      if (error) throw new Error(error.message);
      return data;
    }

    async searchWithIntelligentRouting(params: any): Promise<any> {
      const { data, error } = await supabase.functions.invoke('intelligent-provider-router', {
        body: params
      });
      if (error) throw new Error(error.message);
      return data;
    }
  })();

  async searchFlights(params: any): Promise<any> {
    const cacheKey = `flight:${JSON.stringify(params)}`;
    const corrId = correlationId.generateId();
    
    // Check cache first
    const cached = await advancedCacheManager.get(cacheKey, { strategy: 'flight-search' });
    if (cached) return cached;
    
    try {
      // Use intelligent provider routing with enhanced selection
      const result = await this.providerRotation.searchWithIntelligentRouting({
        searchType: 'flight',
        params,
        routingPreferences: {
          strategy: 'balanced',
          maxResponseTime: 5000,
          minReliabilityScore: 90
        },
        userContext: {
          tier: 'premium' // This could be dynamic based on user
        }
      });
      
      if (result.success) {
        // Cache results if successful
        await advancedCacheManager.set(cacheKey, result.data, { strategy: 'flight-search' });
        return result.data;
      } else {
        // Fallback to basic provider rotation
        const fallbackResult = await this.providerRotation.searchWithRotation({
          searchType: 'flight',
          params,
          excludedProviders: []
        });
        
        if (fallbackResult.success) {
          await advancedCacheManager.set(cacheKey, fallbackResult.data, { strategy: 'flight-search' });
          return fallbackResult.data;
        }
        
        throw new Error(result.error || 'Flight search failed');
      }
    } catch (error) {
      logger.error('Flight search failed', { error: error.message, params, correlationId: corrId });
      throw error;
    }
  }
  
  async searchHotels(params: any): Promise<any> {
    const cacheKey = `hotel:${JSON.stringify(params)}`;
    const cached = await advancedCacheManager.get(cacheKey, { strategy: 'hotel-search' });
    if (cached) return cached;
    
    try {
      // Use provider rotation for automatic failover
      const result = await this.providerRotation.searchWithRotation({
        searchType: 'hotel',
        params,
        excludedProviders: []
      });
      
      if (result.success) {
        // Cache results if successful
        await advancedCacheManager.set(cacheKey, result.data, { strategy: 'hotel-search' });
        return result.data;
      } else {
        throw new Error(result.error || 'Hotel search failed');
      }
    } catch (error) {
      logger.error('Hotel search failed', { error: error.message, params });
      throw error;
    }
  }

  async searchActivities(params: any): Promise<any> {
    const cacheKey = `activity:${JSON.stringify(params)}`;
    const cached = await advancedCacheManager.get(cacheKey, { strategy: 'activity-search' });
    if (cached) return cached;
    
    try {
      // Use provider rotation for automatic failover
      const result = await this.providerRotation.searchWithRotation({
        searchType: 'activity',
        params,
        excludedProviders: []
      });
      
      if (result.success) {
        // Cache results if successful
        await advancedCacheManager.set(cacheKey, result.data, { strategy: 'activity-search' });
        return result.data;
      } else {
        throw new Error(result.error || 'Activity search failed');
      }
    } catch (error) {
      logger.error('Activity search failed', { error: error.message, params });
      throw error;
    }
  }
}

export const unifiedApiClient = new UnifiedApiClient();