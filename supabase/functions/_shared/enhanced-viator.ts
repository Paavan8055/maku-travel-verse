// Enhanced Viator API Client with Rate Limiting, Circuit Breaker, and Caching
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import logger from "./logger.ts";

// Types
export interface ViatorConfig {
  apiKey: string;
  baseUrl: string;
  maxRequestsPerHour: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  pricing: {
    summary: {
      fromPrice: number;
      fromPriceBeforeDiscount?: number;
      currency: string;
    };
  };
  images: Array<{
    variants: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  }>;
  location: {
    startPoint: string;
    endPoint: string;
  };
  reviews: {
    combinedAverageRating: number;
    totalReviews: number;
  };
  cancellation: {
    refund: string;
    details: string;
  };
  itinerary: {
    hasFlexibleItinerary: boolean;
    duration: string;
  };
  inclusions: string[];
  exclusions: string[];
  additionalInfo: string[];
  logistics: {
    start: {
      time: string;
      location: string;
    };
    end: {
      time: string;
      location: string;
    };
  };
  tags: string[];
}

export interface ViatorSearchParams {
  destination: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  subcategoryId?: string;
  sortBy?: 'PRICE_FROM_LOW_TO_HIGH' | 'PRICE_FROM_HIGH_TO_LOW' | 'REVIEW_AVG_RATING_D' | 'TOTAL_REVIEWS_D';
  topX?: string;
  currencyCode?: string;
  count?: number;
  startFrom?: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime: number;
  nextAttempt: number;
}

export interface RateLimitState {
  requestCount: number;
  windowStart: number;
  queue: Array<{ resolve: Function; reject: Function; request: Function }>;
}

// Enhanced Viator API Client Class
export class EnhancedViatorClient {
  private config: ViatorConfig;
  private supabase: any;
  private circuitBreaker: CircuitBreakerState;
  private rateLimit: RateLimitState;
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor() {
    this.config = {
      apiKey: Deno.env.get('VIATOR_API_KEY') || "",
      baseUrl: "https://api.viator.com/partner",
      maxRequestsPerHour: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000 // 1 minute
    };

    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      nextAttempt: 0
    };

    this.rateLimit = {
      requestCount: 0,
      windowStart: Date.now(),
      queue: []
    };
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60 * 60 * 1000; // 1 hour

    // Reset window if expired
    if (now - this.rateLimit.windowStart > windowDuration) {
      this.rateLimit.requestCount = 0;
      this.rateLimit.windowStart = now;
    }

    // Check if we're at the limit
    if (this.rateLimit.requestCount >= this.config.maxRequestsPerHour) {
      const waitTime = windowDuration - (now - this.rateLimit.windowStart);
      logger.warn('[VIATOR] Rate limit reached, waiting', { waitTime });
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000))); // Max 5 second wait
      throw new Error('Rate limit exceeded');
    }

    this.rateLimit.requestCount++;
  }

  private async checkCircuitBreaker(): Promise<void> {
    const now = Date.now();

    if (this.circuitBreaker.state === 'OPEN') {
      if (now < this.circuitBreaker.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.circuitBreaker.state = 'HALF_OPEN';
      logger.info('[VIATOR] Circuit breaker switching to HALF_OPEN');
    }
  }

  private recordSuccess(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      logger.info('[VIATOR] Circuit breaker closed after successful request');
    }
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttempt = Date.now() + this.config.circuitBreakerTimeout;
      logger.warn('[VIATOR] Circuit breaker opened', { failures: this.circuitBreaker.failures });
    }
  }

  private getCacheKey(method: string, params: any): string {
    return `viator_${method}_${JSON.stringify(params)}`;
  }

  private async getCachedData(key: string): Promise<any | null> {
    // Check in-memory cache first
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Check database cache for search results
    if (key.includes('searchViatorProducts')) {
      try {
        const { data } = await this.supabase
          .from('viator_search_cache')
          .select('*')
          .eq('search_key', key)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (data) {
          logger.info('[VIATOR] Cache hit from database', { key });
          return {
            products: data.results,
            totalCount: data.total_count
          };
        }
      } catch (error) {
        // Cache miss, continue
      }
    }

    return null;
  }

  private async setCachedData(key: string, data: any, ttlMs: number): Promise<void> {
    const expires = Date.now() + ttlMs;
    
    // Set in-memory cache
    this.cache.set(key, { data, expires });

    // Set database cache for search results
    if (key.includes('searchViatorProducts') && data.products) {
      try {
        const searchParams = JSON.parse(key.replace('viator_searchViatorProducts_', ''));
        
        await this.supabase
          .from('viator_search_cache')
          .upsert({
            search_key: key,
            destination: searchParams.destination,
            category_id: searchParams.categoryId,
            start_date: searchParams.startDate,
            end_date: searchParams.endDate,
            results: data.products,
            total_count: data.totalCount,
            expires_at: new Date(expires).toISOString()
          });

        logger.info('[VIATOR] Cached search results to database', { 
          key, 
          resultCount: data.products.length 
        });
      } catch (error) {
        logger.error('[VIATOR] Failed to cache to database', { error: error.message });
      }
    }
  }

  private async makeRequest<T>(
    url: string, 
    options: RequestInit, 
    cacheKey?: string,
    cacheTtl: number = 3600000 // 1 hour default
  ): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = await this.getCachedData(cacheKey);
      if (cached) {
        logger.info('[VIATOR] Cache hit', { cacheKey });
        return cached;
      }
    }

    // Check circuit breaker and rate limit
    await this.checkCircuitBreaker();
    await this.checkRateLimit();

    const startTime = Date.now();
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'exp-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json;version=2.0',
            ...options.headers
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        // Record success and cache result
        this.recordSuccess();
        if (cacheKey) {
          await this.setCachedData(cacheKey, data, cacheTtl);
        }

        logger.info('[VIATOR] Request successful', { 
          url, 
          attempts: attempt + 1,
          responseTime,
          cached: false
        });

        return data;

      } catch (error) {
        attempt++;
        const isLastAttempt = attempt >= maxRetries;
        
        if (isLastAttempt) {
          this.recordFailure();
          logger.error('[VIATOR] Request failed after retries', { 
            url, 
            attempts: attempt,
            error: error.message,
            responseTime: Date.now() - startTime
          });
          throw error;
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn('[VIATOR] Request failed, retrying', { 
          attempt, 
          delay, 
          error: error.message 
        });
      }
    }

    throw new Error('Max retries reached');
  }

  async searchViatorProducts(params: ViatorSearchParams): Promise<{ products: ViatorProduct[]; totalCount: number }> {
    const url = `${this.config.baseUrl}/products/search`;
    const cacheKey = this.getCacheKey('searchViatorProducts', params);
    
    const requestBody = {
      filtering: {
        destination: params.destination,
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.categoryId && { categoryId: params.categoryId }),
        ...(params.subcategoryId && { subcategoryId: params.subcategoryId })
      },
      sorting: {
        sortBy: params.sortBy || 'REVIEW_AVG_RATING_D'
      },
      pagination: {
        count: params.count || 20,
        startFrom: params.startFrom || 0
      },
      currency: params.currencyCode || 'AUD'
    };

    logger.info('[VIATOR] Searching products', { 
      destination: params.destination,
      startDate: params.startDate,
      categoryId: params.categoryId
    });

    const data = await this.makeRequest<any>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      },
      cacheKey,
      3600000 // 1 hour cache for search results
    );

    // Store individual products in database
    if (data.products && data.products.length > 0) {
      await this.storeProducts(data.products);
    }

    return {
      products: data.products || [],
      totalCount: data.totalCount || 0
    };
  }

  async getViatorProductDetails(productCode: string): Promise<ViatorProduct> {
    const url = `${this.config.baseUrl}/products/${productCode}`;
    const cacheKey = this.getCacheKey('getViatorProductDetails', { productCode });
    
    logger.info('[VIATOR] Getting product details', { productCode });

    const data = await this.makeRequest<ViatorProduct>(
      url,
      { method: 'GET' },
      cacheKey,
      86400000 // 24 hour cache for product details (Viator recommendation)
    );

    // Store product in database
    await this.storeProducts([data]);

    return data;
  }

  private async storeProducts(products: ViatorProduct[]): Promise<void> {
    try {
      const productRecords = products.map(product => ({
        product_code: product.productCode,
        title: product.title,
        description: product.description,
        short_description: product.shortDescription,
        category_id: this.determineCategoryFromTags(product.tags),
        location: product.location,
        pricing: product.pricing,
        duration_info: { duration: product.duration, itinerary: product.itinerary },
        reviews: product.reviews,
        images: product.images,
        tags: product.tags,
        raw_data: product,
        last_updated: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('viator_activities')
        .upsert(productRecords, { onConflict: 'product_code' });

      if (error) {
        logger.error('[VIATOR] Failed to store products', { error: error.message });
      } else {
        logger.info('[VIATOR] Stored products in database', { count: productRecords.length });

        // Store pricing history
        const pricingRecords = products
          .filter(p => p.pricing?.summary?.fromPrice)
          .map(product => ({
            product_code: product.productCode,
            from_price: product.pricing.summary.fromPrice,
            currency: product.pricing.summary.currency || 'AUD'
          }));

        if (pricingRecords.length > 0) {
          await this.supabase
            .from('viator_pricing_history')
            .insert(pricingRecords);
        }
      }
    } catch (error) {
      logger.error('[VIATOR] Error storing products', { error: error.message });
    }
  }

  private determineCategoryFromTags(tags: string[]): string {
    if (!tags || tags.length === 0) return 'sightseeing';
    
    const tagString = tags.join(' ').toLowerCase();
    
    if (tagString.includes('food') || tagString.includes('culinary') || tagString.includes('wine')) return 'food';
    if (tagString.includes('adventure') || tagString.includes('outdoor') || tagString.includes('extreme')) return 'adventure';
    if (tagString.includes('cultural') || tagString.includes('museum') || tagString.includes('historic')) return 'cultural';
    if (tagString.includes('shopping') || tagString.includes('market')) return 'shopping';
    if (tagString.includes('nightlife') || tagString.includes('entertainment')) return 'nightlife';
    if (tagString.includes('wellness') || tagString.includes('spa') || tagString.includes('yoga')) return 'wellness';
    
    return 'sightseeing';
  }

  validateCredentials(): boolean {
    const isValid = !!this.config.apiKey;
    if (!isValid) {
      logger.warn('[VIATOR] API key not configured');
    }
    return isValid;
  }

  // Get circuit breaker status for monitoring
  getStatus() {
    return {
      circuitBreaker: this.circuitBreaker,
      rateLimit: {
        requestCount: this.rateLimit.requestCount,
        windowStart: this.rateLimit.windowStart,
        queueLength: this.rateLimit.queue.length
      },
      cacheSize: this.cache.size
    };
  }
}

// Transform Viator products to standardized activity format
export function transformViatorToActivity(product: ViatorProduct): any {
  const mainImage = product.images?.[0]?.variants?.find(v => v.width >= 400)?.url;
  const duration = parseDuration(product.duration || product.itinerary?.duration);
  
  return {
    id: `viator_${product.productCode}`,
    title: product.title,
    description: product.shortDescription || product.description,
    provider: 'Viator',
    location: product.location?.startPoint || 'Location TBD',
    images: mainImage ? [mainImage] : [],
    category: determineCategoryFromTags(product.tags),
    price: product.pricing?.summary?.fromPrice || 0,
    currency: product.pricing?.summary?.currency || 'AUD',
    duration: duration.display,
    durationHours: duration.hours,
    difficulty: determineDifficulty(product.tags),
    rating: product.reviews?.combinedAverageRating || 4.5,
    reviewCount: product.reviews?.totalReviews || 0,
    groupSize: {
      min: 1,
      max: 15
    },
    availability: ['daily'],
    highlights: product.additionalInfo?.slice(0, 3) || ['Premium experience', 'Expert guide', 'Small group'],
    included: product.inclusions || [],
    cancellationPolicy: product.cancellation?.details || 'Free cancellation available',
    instantConfirmation: true,
    ageGroup: 'adult',
    meetingPoint: product.logistics?.start?.location || product.location?.startPoint,
    viatorData: {
      productCode: product.productCode,
      hasFlexibleItinerary: product.itinerary?.hasFlexibleItinerary
    }
  };
}

function parseDuration(duration: string): { display: string; hours: number } {
  if (!duration) return { display: '2-3 hours', hours: 2.5 };
  
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/i);
  const dayMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:day|d)/i);
  const minuteMatch = duration.match(/(\d+)\s*(?:minute|min|m)/i);
  
  if (dayMatch) {
    const days = parseFloat(dayMatch[1]);
    return { display: `${days} day${days > 1 ? 's' : ''}`, hours: days * 8 };
  } else if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return { display: `${hours} hour${hours > 1 ? 's' : ''}`, hours };
  } else if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1]);
    const hours = minutes / 60;
    return { display: `${minutes} minutes`, hours };
  }
  
  return { display: duration, hours: 3 };
}

function determineCategoryFromTags(tags: string[]): string {
  if (!tags || tags.length === 0) return 'sightseeing';
  
  const tagString = tags.join(' ').toLowerCase();
  
  if (tagString.includes('food') || tagString.includes('culinary') || tagString.includes('wine')) return 'food';
  if (tagString.includes('adventure') || tagString.includes('outdoor') || tagString.includes('extreme')) return 'adventure';
  if (tagString.includes('cultural') || tagString.includes('museum') || tagString.includes('historic')) return 'cultural';
  if (tagString.includes('shopping') || tagString.includes('market')) return 'shopping';
  if (tagString.includes('nightlife') || tagString.includes('entertainment')) return 'nightlife';
  if (tagString.includes('wellness') || tagString.includes('spa') || tagString.includes('yoga')) return 'wellness';
  
  return 'sightseeing';
}

function determineDifficulty(tags: string[]): string {
  if (!tags || tags.length === 0) return 'Easy';
  
  const tagString = tags.join(' ').toLowerCase();
  
  if (tagString.includes('extreme') || tagString.includes('challenging') || tagString.includes('difficult')) return 'Hard';
  if (tagString.includes('moderate') || tagString.includes('active') || tagString.includes('walking')) return 'Medium';
  
  return 'Easy';
}

// Viator category mappings
export const VIATOR_CATEGORIES = {
  sightseeing: 'c1',
  adventure: 'c2', 
  cultural: 'c8',
  food: 'c9',
  shopping: 'c24',
  nightlife: 'c9',
  wellness: 'c21'
};

// Export singleton instance
export const enhancedViatorClient = new EnhancedViatorClient();