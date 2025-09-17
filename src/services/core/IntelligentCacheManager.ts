import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

export interface CacheOptions {
  maxAge?: number; // hours
  quality?: 'high' | 'medium' | 'low';
  forceRefresh?: boolean;
  geographic?: string;
  seasonal?: any;
}

export interface CachedResponse {
  data: any;
  providerId: string;
  qualityScore: number;
  ageHours: number;
  hitCount: number;
}

export class IntelligentCacheManager {
  private static instance: IntelligentCacheManager;

  static getInstance(): IntelligentCacheManager {
    if (!IntelligentCacheManager.instance) {
      IntelligentCacheManager.instance = new IntelligentCacheManager();
    }
    return IntelligentCacheManager.instance;
  }

  /**
   * Generate a consistent hash for search parameters
   */
  private generateQueryHash(params: any, searchType: string): string {
    // Normalize parameters to ensure consistent hashing
    const normalizedParams = this.normalizeSearchParams(params, searchType);
    const hashInput = `${searchType}::${JSON.stringify(normalizedParams)}`;
    
    // Use a simple hash function for browser compatibility
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Normalize search parameters for consistent caching
   */
  private normalizeSearchParams(params: any, searchType: string): any {
    const normalized: any = {};

    switch (searchType) {
      case 'flight':
        normalized.origin = params.origin?.toLowerCase();
        normalized.destination = params.destination?.toLowerCase();
        normalized.departureDate = params.departureDate;
        normalized.returnDate = params.returnDate;
        normalized.adults = params.adults || 1;
        normalized.children = params.children || 0;
        normalized.cabin = params.cabin?.toLowerCase() || 'economy';
        break;
      
      case 'hotel':
        normalized.destination = params.destination?.toLowerCase();
        normalized.checkInDate = params.checkInDate;
        normalized.checkOutDate = params.checkOutDate;
        normalized.adults = params.adults || 1;
        normalized.children = params.children || 0;
        normalized.rooms = params.rooms || 1;
        break;
      
      case 'activity':
        normalized.destination = params.destination?.toLowerCase();
        normalized.date = params.date;
        normalized.participants = params.participants || 1;
        break;
    }

    return normalized;
  }

  /**
   * Get cached data with intelligence
   */
  async getIntelligentCache(
    params: any, 
    searchType: string, 
    options: CacheOptions = {}
  ): Promise<CachedResponse | null> {
    try {
      const queryHash = this.generateQueryHash(params, searchType);
      const maxAge = options.maxAge || 24;

      // Use the database function to get intelligent cache data
      const { data, error } = await supabase.rpc('get_intelligent_cache_data', {
        p_query_hash: queryHash,
        p_max_age_hours: maxAge
      });

      if (error) {
        logger.error('Cache retrieval error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Get the best quality response
      const bestResponse = data[0];
      
      // Update hit count
      await this.updateCacheHitCount(queryHash, bestResponse.provider_id);

      return {
        data: bestResponse.response_data,
        providerId: bestResponse.provider_id,
        qualityScore: bestResponse.quality_score,
        ageHours: bestResponse.age_hours,
        hitCount: 0 // Will be updated
      };
    } catch (error) {
      logger.error('Intelligent cache get error:', error);
      return null;
    }
  }

  /**
   * Store data in intelligent cache
   */
  async setIntelligentCache(
    params: any,
    searchType: string,
    providerId: string,
    data: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const queryHash = this.generateQueryHash(params, searchType);
      const normalizedParams = this.normalizeSearchParams(params, searchType);
      
      // Calculate quality score based on data completeness and structure
      const qualityScore = this.calculateQualityScore(data, searchType);
      
      // Default cache expiry: 2 hours for activities, 6 hours for hotels, 1 hour for flights
      const defaultHours = searchType === 'flight' ? 1 : searchType === 'hotel' ? 6 : 2;
      const expiryHours = options.maxAge || defaultHours;
      const expiresAt = new Date(Date.now() + (expiryHours * 60 * 60 * 1000)).toISOString();

      // Extract geographic context
      const geographic = this.extractGeographicContext(normalizedParams, searchType);

      // Store unified search query first
      const { error: queryError } = await supabase
        .from('unified_search_queries')
        .upsert({
          query_hash: queryHash,
          search_type: searchType,
          normalized_params: normalizedParams,
          geographic_region: geographic,
          seasonal_context: options.seasonal || {},
          user_segment: 'standard' // Could be enhanced with user profiling
        });

      if (queryError && !queryError.message.includes('duplicate key')) {
        logger.error('Query storage error:', queryError);
      }

      // Store cache response
      const { error: cacheError } = await supabase
        .from('provider_response_cache')
        .insert({
          query_hash: queryHash,
          provider_id: providerId,
          response_data: data,
          response_quality_score: qualityScore,
          geographic_relevance: { region: geographic },
          price_competitiveness: this.calculatePriceCompetitiveness(data, searchType),
          expires_at: expiresAt
        });

      if (cacheError) {
        logger.error('Cache storage error:', cacheError);
        return false;
      }

      // Update search audit with cache information
      await this.updateSearchAudit(searchType, normalizedParams, providerId, qualityScore);

      return true;
    } catch (error) {
      logger.error('Intelligent cache set error:', error);
      return false;
    }
  }

  /**
   * Calculate quality score based on data completeness
   */
  private calculateQualityScore(data: any, searchType: string): number {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0;
    }

    let score = 50; // Base score
    const sampleItem = data[0];

    switch (searchType) {
      case 'flight':
        if (sampleItem.price?.total) score += 20;
        if (sampleItem.duration) score += 10;
        if (sampleItem.carrier) score += 10;
        if (sampleItem.departure && sampleItem.arrival) score += 10;
        break;
      
      case 'hotel':
        if (sampleItem.price?.total) score += 20;
        if (sampleItem.rating) score += 10;
        if (sampleItem.amenities?.length > 0) score += 10;
        if (sampleItem.images?.length > 0) score += 10;
        break;
      
      case 'activity':
        if (sampleItem.price) score += 20;
        if (sampleItem.rating) score += 10;
        if (sampleItem.description) score += 10;
        if (sampleItem.duration) score += 10;
        break;
    }

    // Bonus for result count
    score += Math.min(20, data.length * 2);

    return Math.min(100, score);
  }

  /**
   * Calculate price competitiveness score
   */
  private calculatePriceCompetitiveness(data: any, searchType: string): number {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0;
    }

    const prices = data
      .map(item => {
        switch (searchType) {
          case 'flight':
            return item.price?.total || 0;
          case 'hotel':
            return item.price?.total || item.totalPrice || 0;
          case 'activity':
            return item.price || 0;
          default:
            return 0;
        }
      })
      .filter(price => price > 0);

    if (prices.length === 0) return 0;

    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    
    // Higher score for better price range
    return Math.round((minPrice / avgPrice) * 100);
  }

  /**
   * Extract geographic context from parameters
   */
  private extractGeographicContext(params: any, searchType: string): string {
    switch (searchType) {
      case 'flight':
        return `${params.origin}-${params.destination}`;
      case 'hotel':
      case 'activity':
        return params.destination || 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Update cache hit count
   */
  private async updateCacheHitCount(queryHash: string, providerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_response_cache')
        .update({ 
          last_validated: new Date().toISOString()
        })
        .match({ query_hash: queryHash, provider_id: providerId });

      if (error) {
        logger.warn('Hit count update error:', error);
      }
    } catch (error) {
      logger.warn('Hit count update failed:', error);
    }
  }

  /**
   * Update search audit with cache information
   */
  private async updateSearchAudit(
    searchType: string, 
    params: any, 
    providerId: string, 
    qualityScore: number
  ): Promise<void> {
    try {
      await supabase
        .from('search_audit')
        .insert({
          product: searchType,
          params: params,
          result_count: Array.isArray(params) ? params.length : 1,
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
          provider_used: providerId,
          quality_score: qualityScore,
          cache_hit: false // This is a new cache entry
        });
    } catch (error) {
      logger.warn('Search audit update failed:', error);
    }
  }

  /**
   * Preload popular searches based on patterns
   */
  async warmCache(destination: string, searchType: string): Promise<void> {
    try {
      // Get warming schedule for this destination
      const { data: schedules } = await supabase
        .from('cache_warming_schedule')
        .select('*')
        .eq('destination', destination.toLowerCase())
        .eq('search_type', searchType)
        .lte('next_warm_at', new Date().toISOString())
        .order('priority_level', { ascending: false })
        .limit(5);

      if (!schedules || schedules.length === 0) {
        return;
      }

      // Process warming schedules
      for (const schedule of schedules) {
        const params = schedule.warm_parameters;
        const queryHash = this.generateQueryHash(params, searchType);
        
        // Check if we already have recent cache
        const existing = await this.getIntelligentCache(params, searchType, { maxAge: 6 });
        
        if (!existing) {
          // This would trigger a background search to warm the cache
          logger.info('Cache warming needed for:', { destination, searchType, params });
        }

        // Update next warm time
        const nextWarmAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // Next day
        await supabase
          .from('cache_warming_schedule')
          .update({ 
            next_warm_at: nextWarmAt.toISOString(),
            last_warmed_at: new Date().toISOString()
          })
          .eq('id', schedule.id);
      }
    } catch (error) {
      logger.error('Cache warming error:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<any> {
    try {
      const { data: stats } = await supabase
        .from('provider_response_cache')
        .select('provider_id, response_quality_score, hit_count')
        .gte('expires_at', new Date().toISOString());

      if (!stats) return null;

      const summary = stats.reduce((acc, item) => {
        if (!acc[item.provider_id]) {
          acc[item.provider_id] = {
            count: 0,
            avgQuality: 0,
            totalHits: 0
          };
        }
        
        acc[item.provider_id].count++;
        acc[item.provider_id].avgQuality += item.response_quality_score;
        acc[item.provider_id].totalHits += item.hit_count;
        
        return acc;
      }, {} as any);

      // Calculate averages
      Object.keys(summary).forEach(providerId => {
        summary[providerId].avgQuality = Math.round(
          summary[providerId].avgQuality / summary[providerId].count
        );
      });

      return summary;
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }
}

export const intelligentCacheManager = IntelligentCacheManager.getInstance();