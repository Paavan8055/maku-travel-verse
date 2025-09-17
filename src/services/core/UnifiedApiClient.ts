import { serviceRegistry } from './ServiceRegistry';
import { dataNormalizer } from './DataNormalizer';
import { advancedCacheManager } from './AdvancedCacheManager';
import { intelligentCacheManager } from './IntelligentCacheManager';
import { crossModuleContextManager } from './CrossModuleContextManager';
import { correlationId } from '@/utils/correlationId';
import { supabase } from '@/integrations/supabase/client';
import { useProviderRotation } from '@/hooks/useProviderRotation';
import logger from '@/utils/logger';

export class UnifiedApiClient {
  private providerRotation = new (class {
    async searchWithRotation(params: any): Promise<any> {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: params
      });
      if (error) throw new Error(error.message);
      return data;
    }
  })();

  async searchFlights(params: any): Promise<any> {
    const corrId = correlationId.generateId();
    const startTime = Date.now();
    
    // Check intelligent cache first with quality scoring
    const cached = await intelligentCacheManager.getIntelligentCache(params, 'flight', {
      maxAge: 1, // Flights expire quickly
      quality: 'high'
    });
    
    if (cached && cached.qualityScore > 70) {
      logger.info('Flight search cache hit', { 
        provider: cached.providerId, 
        quality: cached.qualityScore,
        age: cached.ageHours 
      });
      
      // Update cross-module context
      await crossModuleContextManager.setModuleContext('flight', {
        destination: params.destination,
        dates: {
          checkIn: new Date(params.departureDate),
          checkOut: params.returnDate ? new Date(params.returnDate) : undefined
        },
        travelers: {
          adults: params.adults || 1,
          children: params.children || 0
        }
      }, {
        moduleType: 'flight',
        lastSearched: new Date(),
        searchParams: params,
        results: cached.data
      });
      
      return cached.data;
    }
    
    try {
      // Trigger cache warming for popular destinations
      intelligentCacheManager.warmCache(params.destination, 'flight');
      
      // Use provider rotation for automatic failover
      const result = await this.providerRotation.searchWithRotation({
        searchType: 'flight',
        params,
        excludedProviders: []
      });
      
      const responseTime = Date.now() - startTime;
      
      if (result.success && result.data) {
        // Store in intelligent cache with quality assessment
        await intelligentCacheManager.setIntelligentCache(
          params, 
          'flight', 
          result.providerId || 'unknown',
          result.data,
          { maxAge: 1 }
        );
        
        // Update cross-module context for smart suggestions
        await crossModuleContextManager.setModuleContext('flight', {
          destination: params.destination,
          dates: {
            checkIn: new Date(params.departureDate),
            checkOut: params.returnDate ? new Date(params.returnDate) : undefined
          },
          travelers: {
            adults: params.adults || 1,
            children: params.children || 0
          }
        }, {
          moduleType: 'flight',
          lastSearched: new Date(),
          searchParams: params,
          results: result.data
        });
        
        return result.data;
      } else {
        throw new Error(result.error || 'Flight search failed');
      }
    } catch (error) {
      logger.error('Flight search failed', { 
        error: error.message, 
        params, 
        corrId,
        responseTime: Date.now() - startTime
      });
      throw error;
    }
  }
  
  async searchHotels(params: any): Promise<any> {
    const startTime = Date.now();
    
    // Check intelligent cache with extended validity for hotels
    const cached = await intelligentCacheManager.getIntelligentCache(params, 'hotel', {
      maxAge: 6, // Hotels can be cached longer
      quality: 'medium'
    });
    
    if (cached && cached.qualityScore > 60) {
      logger.info('Hotel search cache hit', { 
        provider: cached.providerId, 
        quality: cached.qualityScore,
        age: cached.ageHours 
      });
      
      // Update cross-module context
      await crossModuleContextManager.setModuleContext('hotel', {
        destination: params.destination,
        dates: {
          checkIn: new Date(params.checkInDate),
          checkOut: new Date(params.checkOutDate)
        },
        travelers: {
          adults: params.adults || 1,
          children: params.children || 0
        }
      }, {
        moduleType: 'hotel',
        lastSearched: new Date(),
        searchParams: params,
        results: cached.data
      });
      
      return cached.data;
    }
    
    try {
      // Trigger cache warming
      intelligentCacheManager.warmCache(params.destination, 'hotel');
      
      // Use provider rotation for automatic failover
      const result = await this.providerRotation.searchWithRotation({
        searchType: 'hotel',
        params,
        excludedProviders: []
      });
      
      const responseTime = Date.now() - startTime;
      
      if (result.success && result.data) {
        // Store in intelligent cache
        await intelligentCacheManager.setIntelligentCache(
          params, 
          'hotel', 
          result.providerId || 'unknown',
          result.data,
          { maxAge: 6 }
        );
        
        // Update cross-module context
        await crossModuleContextManager.setModuleContext('hotel', {
          destination: params.destination,
          dates: {
            checkIn: new Date(params.checkInDate),
            checkOut: new Date(params.checkOutDate)
          },
          travelers: {
            adults: params.adults || 1,
            children: params.children || 0
          }
        }, {
          moduleType: 'hotel',
          lastSearched: new Date(),
          searchParams: params,
          results: result.data
        });
        
        return result.data;
      } else {
        throw new Error(result.error || 'Hotel search failed');
      }
    } catch (error) {
      logger.error('Hotel search failed', { 
        error: error.message, 
        params,
        responseTime: Date.now() - startTime
      });
      throw error;
    }
  }

  async searchActivities(params: any): Promise<any> {
    const startTime = Date.now();
    
    // Check intelligent cache for activities
    const cached = await intelligentCacheManager.getIntelligentCache(params, 'activity', {
      maxAge: 2, // Activities have moderate cache duration
      quality: 'medium'
    });
    
    if (cached && cached.qualityScore > 50) {
      logger.info('Activity search cache hit', { 
        provider: cached.providerId, 
        quality: cached.qualityScore,
        age: cached.ageHours 
      });
      
      // Update cross-module context
      await crossModuleContextManager.setModuleContext('activity', {
        destination: params.destination,
        dates: {
          checkIn: new Date(params.date)
        },
        travelers: {
          adults: Math.max(1, params.participants - (params.children || 0)),
          children: params.children || 0
        }
      }, {
        moduleType: 'activity',
        lastSearched: new Date(),
        searchParams: params,
        results: cached.data
      });
      
      return cached.data;
    }
    
    try {
      // Trigger cache warming
      intelligentCacheManager.warmCache(params.destination, 'activity');
      
      // Use provider rotation for automatic failover
      const result = await this.providerRotation.searchWithRotation({
        searchType: 'activity',
        params,
        excludedProviders: []
      });
      
      const responseTime = Date.now() - startTime;
      
      if (result.success && result.data) {
        // Store in intelligent cache
        await intelligentCacheManager.setIntelligentCache(
          params, 
          'activity', 
          result.providerId || 'unknown',
          result.data,
          { maxAge: 2 }
        );
        
        // Update cross-module context
        await crossModuleContextManager.setModuleContext('activity', {
          destination: params.destination,
          dates: {
            checkIn: new Date(params.date)
          },
          travelers: {
            adults: Math.max(1, params.participants - (params.children || 0)),
            children: params.children || 0
          }
        }, {
          moduleType: 'activity',
          lastSearched: new Date(),
          searchParams: params,
          results: result.data
        });
        
        return result.data;
      } else {
        throw new Error(result.error || 'Activity search failed');
      }
    } catch (error) {
      logger.error('Activity search failed', { 
        error: error.message, 
        params,
        responseTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Get cross-module suggestions based on current context
   */
  async getCrossModuleSuggestions(
    currentModule: 'flight' | 'hotel' | 'activity'
  ): Promise<Array<{ type: string; suggestion: string; confidence: number }>> {
    return await crossModuleContextManager.getSmartSuggestions(currentModule);
  }

  /**
   * Get cache performance statistics
   */
  async getCacheStats(): Promise<any> {
    return await intelligentCacheManager.getCacheStats();
  }
}

export const unifiedApiClient = new UnifiedApiClient();