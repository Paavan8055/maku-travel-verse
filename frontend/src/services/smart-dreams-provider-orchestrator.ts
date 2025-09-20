import { SupplierAggregator } from './suppliers/SupplierAggregator';
import { AmadeusClient } from './suppliers/AmadeusClient';
import { SabreClient } from './suppliers/SabreClient';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
import logger from '@/utils/logger';

export interface SmartDreamProviderRequest {
  companionType: 'solo' | 'romantic' | 'friends' | 'family';
  travelDNA?: any;
  destination?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  budget?: {
    min: number;
    max: number;
  };
  preferences?: string[];
}

export interface SmartDreamProviderResponse {
  hotels: Array<{
    id: string;
    name: string;
    provider: string;
    price: number;
    rating: number;
    aiConfidenceScore: number;
    personalityMatch: number;
    companionSuitability: number;
    dreamDestinationMatch: boolean;
    recommendationReasons: string[];
  }>;
  flights: Array<{
    id: string;
    provider: string;
    price: number;
    duration: string;
    aiOptimizationScore: number;
    journeyFlow: number;
    companions: {
      solo: number;
      romantic: number;
      friends: number;
      family: number;
    };
  }>;
  activities: Array<{
    id: string;
    name: string;
    provider: string;
    price: number;
    personalityAlignment: number;
    companionMatch: number;
    experienceType: string;
    aiRecommendationRank: number;
  }>;
  aggregatedInsights: {
    totalOptions: number;
    avgPersonalityMatch: number;
    topRecommendationProvider: string;
    aiProcessingTime: number;
    cacheHitRate: number;
  };
}

/**
 * Smart Dreams Provider Orchestrator
 * Enhances existing provider integrations with AI intelligence and companion-specific filtering
 */
export class SmartDreamProviderOrchestrator {
  private supplierAggregator: SupplierAggregator;
  private aiIntelligenceService: any;
  private enhancedDreamsService: any;
  private cacheStore: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor() {
    this.supplierAggregator = new SupplierAggregator();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Add existing providers with Smart Dreams enhancements
    const amadeusClient = new AmadeusClient();
    const sabreClient = new SabreClient();
    
    this.supplierAggregator.addSupplier('amadeus', amadeusClient);
    this.supplierAggregator.addSupplier('sabre', sabreClient);
    
    logger.info('Smart Dreams Provider Orchestrator initialized with enhanced providers');
  }

  /**
   * Enhanced search with AI intelligence and companion matching
   */
  async searchWithSmartDreams(request: SmartDreamProviderRequest): Promise<SmartDreamProviderResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting Smart Dreams enhanced provider search', { 
        companionType: request.companionType,
        destination: request.destination 
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info('Returning cached Smart Dreams results');
        return cached;
      }

      // Get healthy providers
      const healthyProviders = this.supplierAggregator.getHealthySuppliers();
      
      // Parallel provider requests with AI enhancement
      const providerPromises = healthyProviders.map(({ name, client }) => 
        this.executeEnhancedProviderSearch(name, client, request)
      );

      const providerResults = await Promise.allSettled(providerPromises);
      
      // Aggregate and enhance results with AI intelligence
      const aggregatedResults = await this.aggregateAndEnhanceResults(
        providerResults,
        request,
        startTime
      );

      // Cache results
      this.setCache(cacheKey, aggregatedResults, 300000); // 5 minutes cache

      logger.info('Smart Dreams provider search completed', {
        processingTime: Date.now() - startTime,
        totalResults: aggregatedResults.hotels.length + aggregatedResults.flights.length + aggregatedResults.activities.length
      });

      return aggregatedResults;

    } catch (error) {
      logger.error('Smart Dreams provider search failed', error);
      throw new Error('Enhanced provider search failed: ' + (error as Error).message);
    }
  }

  /**
   * Execute enhanced provider search with AI context
   */
  private async executeEnhancedProviderSearch(
    providerName: string, 
    client: any, 
    request: SmartDreamProviderRequest
  ): Promise<any> {
    try {
      logger.info(`Executing enhanced search for provider: ${providerName}`);
      
      // Basic provider search
      const basicResults = await this.executeBasicProviderSearch(client, request);
      
      // Enhance with AI intelligence if available
      const enhancedResults = await this.enhanceWithAI(basicResults, request, providerName);
      
      return {
        provider: providerName,
        success: true,
        data: enhancedResults
      };
      
    } catch (error) {
      logger.error(`Provider ${providerName} search failed`, error);
      return {
        provider: providerName,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Execute basic provider search using existing clients
   */
  private async executeBasicProviderSearch(client: any, request: SmartDreamProviderRequest): Promise<any> {
    // Mock implementation - in production this would call actual provider APIs
    const mockResults = {
      hotels: [
        {
          id: `hotel_${Date.now()}_1`,
          name: 'Dream Resort & Spa',
          price: 299,
          rating: 4.8,
          location: request.destination || 'Paradise Island'
        },
        {
          id: `hotel_${Date.now()}_2`,
          name: 'Luxury Companion Hotel',
          price: 450,
          rating: 4.9,
          location: request.destination || 'Paradise Island'
        }
      ],
      flights: [
        {
          id: `flight_${Date.now()}_1`,
          price: 599,
          duration: '6h 30m',
          airline: 'Dream Airways'
        }
      ],
      activities: [
        {
          id: `activity_${Date.now()}_1`,
          name: 'Romantic Sunset Cruise',
          price: 120,
          duration: '3 hours',
          category: 'romantic'
        }
      ]
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockResults;
  }

  /**
   * Enhance provider results with AI intelligence
   */
  private async enhanceWithAI(
    basicResults: any, 
    request: SmartDreamProviderRequest, 
    providerName: string
  ): Promise<any> {
    try {
      // Get AI intelligence context (mock for now)
      const aiContext = await this.getAIIntelligenceContext(request);
      
      // Enhance hotels with AI scoring
      const enhancedHotels = basicResults.hotels.map((hotel: any) => ({
        ...hotel,
        provider: providerName,
        aiConfidenceScore: this.calculateAIConfidenceScore(hotel, aiContext, request.companionType),
        personalityMatch: this.calculatePersonalityMatch(hotel, request.travelDNA),
        companionSuitability: this.calculateCompanionSuitability(hotel, request.companionType),
        dreamDestinationMatch: this.isDreamDestination(hotel, request),
        recommendationReasons: this.generateRecommendationReasons(hotel, request)
      }));

      // Enhance flights with AI optimization
      const enhancedFlights = basicResults.flights.map((flight: any) => ({
        ...flight,
        provider: providerName,
        aiOptimizationScore: this.calculateFlightOptimization(flight, request),
        journeyFlow: this.calculateJourneyFlow(flight, request.companionType),
        companions: this.calculateCompanionScores(flight)
      }));

      // Enhance activities with personalization
      const enhancedActivities = basicResults.activities.map((activity: any) => ({
        ...activity,
        provider: providerName,
        personalityAlignment: this.calculatePersonalityAlignment(activity, request.travelDNA),
        companionMatch: this.calculateActivityCompanionMatch(activity, request.companionType),
        experienceType: this.categorizeExperience(activity),
        aiRecommendationRank: this.calculateRecommendationRank(activity, request)
      }));

      return {
        hotels: enhancedHotels,
        flights: enhancedFlights,
        activities: enhancedActivities
      };

    } catch (error) {
      logger.error('AI enhancement failed, returning basic results', error);
      return basicResults;
    }
  }

  /**
   * Get AI intelligence context for enhancement
   */
  private async getAIIntelligenceContext(request: SmartDreamProviderRequest): Promise<any> {
    // Mock AI context - in production this would call actual AI service
    return {
      personalityFactors: {
        adventure: 0.8,
        luxury: 0.6,
        culture: 0.7,
        relaxation: 0.5
      },
      companionPreferences: {
        [request.companionType]: 0.9
      },
      travelStyle: 'explorer',
      confidenceScore: 0.87
    };
  }

  /**
   * Calculate AI confidence score for hotels
   */
  private calculateAIConfidenceScore(hotel: any, aiContext: any, companionType: string): number {
    let score = 70; // Base score
    
    // Enhance based on AI context
    if (aiContext.personalityFactors.luxury > 0.7 && hotel.rating > 4.5) score += 15;
    if (aiContext.personalityFactors.adventure > 0.8 && hotel.name.includes('Resort')) score += 10;
    
    // Companion type matching
    if (companionType === 'romantic' && hotel.name.toLowerCase().includes('spa')) score += 10;
    if (companionType === 'family' && hotel.name.toLowerCase().includes('resort')) score += 8;
    
    return Math.min(score, 95); // Cap at 95%
  }

  /**
   * Calculate personality match score
   */
  private calculatePersonalityMatch(hotel: any, travelDNA: any): number {
    if (!travelDNA) return 75; // Default score
    
    // Mock personality matching algorithm
    return Math.round(75 + Math.random() * 20);
  }

  /**
   * Calculate companion suitability score
   */
  private calculateCompanionSuitability(hotel: any, companionType: string): number {
    const suitabilityMap: { [key: string]: { [key: string]: number } } = {
      'romantic': {
        'spa': 95,
        'resort': 85,
        'hotel': 70,
        'hostel': 40
      },
      'family': {
        'resort': 95,
        'hotel': 80,
        'spa': 60,
        'hostel': 45
      },
      'friends': {
        'hostel': 90,
        'hotel': 85,
        'resort': 75,
        'spa': 50
      },
      'solo': {
        'hostel': 85,
        'hotel': 90,
        'resort': 70,
        'spa': 95
      }
    };

    const hotelType = this.inferHotelType(hotel.name);
    return suitabilityMap[companionType]?.[hotelType] || 70;
  }

  /**
   * Infer hotel type from name
   */
  private inferHotelType(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('spa')) return 'spa';
    if (lowerName.includes('resort')) return 'resort';
    if (lowerName.includes('hostel')) return 'hostel';
    return 'hotel';
  }

  /**
   * Check if hotel matches dream destinations
   */
  private isDreamDestination(hotel: any, request: SmartDreamProviderRequest): boolean {
    // Mock dream destination matching
    return Math.random() > 0.6;
  }

  /**
   * Generate AI recommendation reasons
   */
  private generateRecommendationReasons(hotel: any, request: SmartDreamProviderRequest): string[] {
    const reasons = [];
    
    if (hotel.rating > 4.5) reasons.push('Highly rated by travelers');
    if (request.companionType === 'romantic' && hotel.name.toLowerCase().includes('spa')) {
      reasons.push('Perfect for romantic getaways');
    }
    if (request.companionType === 'family' && hotel.name.toLowerCase().includes('resort')) {
      reasons.push('Family-friendly amenities');
    }
    
    reasons.push('AI personality match detected');
    
    return reasons;
  }

  /**
   * Calculate flight optimization score
   */
  private calculateFlightOptimization(flight: any, request: SmartDreamProviderRequest): number {
    let score = 75; // Base score
    
    // Duration optimization
    const duration = this.parseDuration(flight.duration);
    if (duration < 8) score += 10; // Shorter flights get bonus
    
    // Price optimization
    if (request.budget && flight.price <= request.budget.max * 0.8) score += 15;
    
    return Math.min(score, 95);
  }

  /**
   * Parse duration string to hours
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)h/);
    return match ? parseInt(match[1]) : 8;
  }

  /**
   * Calculate journey flow score based on companion type
   */
  private calculateJourneyFlow(flight: any, companionType: string): number {
    const flowScores: { [key: string]: number } = {
      'solo': 85,      // Solo travelers prefer efficiency
      'romantic': 75,  // Couples prefer comfort
      'friends': 80,   // Friends balance fun and efficiency
      'family': 70     // Families need convenience
    };
    
    return flowScores[companionType] || 75;
  }

  /**
   * Calculate companion-specific scores for flights
   */
  private calculateCompanionScores(flight: any): { [key: string]: number } {
    return {
      solo: 80 + Math.round(Math.random() * 15),
      romantic: 75 + Math.round(Math.random() * 20),
      friends: 85 + Math.round(Math.random() * 10),
      family: 70 + Math.round(Math.random() * 25)
    };
  }

  /**
   * Calculate personality alignment for activities
   */
  private calculatePersonalityAlignment(activity: any, travelDNA: any): number {
    // Mock personality alignment
    return 75 + Math.round(Math.random() * 20);
  }

  /**
   * Calculate activity companion match
   */
  private calculateActivityCompanionMatch(activity: any, companionType: string): number {
    const activityType = activity.category || this.inferActivityType(activity.name);
    
    const matchScores: { [key: string]: { [key: string]: number } } = {
      'romantic': {
        'romantic': 95,
        'cultural': 80,
        'adventure': 60,
        'social': 50
      },
      'family': {
        'family': 95,
        'educational': 90,
        'adventure': 85,
        'cultural': 75
      },
      'friends': {
        'social': 95,
        'adventure': 90,
        'party': 95,
        'cultural': 70
      },
      'solo': {
        'cultural': 95,
        'adventure': 85,
        'educational': 90,
        'relaxation': 80
      }
    };

    return matchScores[companionType]?.[activityType] || 70;
  }

  /**
   * Infer activity type from name
   */
  private inferActivityType(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('romantic') || lowerName.includes('sunset') || lowerName.includes('cruise')) return 'romantic';
    if (lowerName.includes('museum') || lowerName.includes('cultural') || lowerName.includes('historic')) return 'cultural';
    if (lowerName.includes('adventure') || lowerName.includes('hiking') || lowerName.includes('extreme')) return 'adventure';
    if (lowerName.includes('party') || lowerName.includes('nightlife') || lowerName.includes('club')) return 'party';
    if (lowerName.includes('family') || lowerName.includes('kids') || lowerName.includes('children')) return 'family';
    return 'general';
  }

  /**
   * Categorize experience type
   */
  private categorizeExperience(activity: any): string {
    return this.inferActivityType(activity.name);
  }

  /**
   * Calculate recommendation rank
   */
  private calculateRecommendationRank(activity: any, request: SmartDreamProviderRequest): number {
    let rank = 50; // Base rank
    
    const personalityMatch = this.calculatePersonalityAlignment(activity, request.travelDNA);
    const companionMatch = this.calculateActivityCompanionMatch(activity, request.companionType);
    
    rank = Math.round((personalityMatch + companionMatch) / 2);
    
    return Math.min(rank, 95);
  }

  /**
   * Aggregate and enhance results from all providers
   */
  private async aggregateAndEnhanceResults(
    providerResults: PromiseSettledResult<any>[],
    request: SmartDreamProviderRequest,
    startTime: number
  ): Promise<SmartDreamProviderResponse> {
    const allHotels: any[] = [];
    const allFlights: any[] = [];
    const allActivities: any[] = [];
    const providerStats: { [key: string]: { success: boolean; responseTime: number } } = {};

    // Process provider results
    providerResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const data = result.value.data;
        allHotels.push(...data.hotels);
        allFlights.push(...data.flights);
        allActivities.push(...data.activities);
      }
    });

    // Sort by AI scoring
    allHotels.sort((a, b) => b.aiConfidenceScore - a.aiConfidenceScore);
    allFlights.sort((a, b) => b.aiOptimizationScore - a.aiOptimizationScore);
    allActivities.sort((a, b) => b.aiRecommendationRank - a.aiRecommendationRank);

    // Calculate aggregated insights
    const avgPersonalityMatch = allHotels.reduce((sum, hotel) => sum + hotel.personalityMatch, 0) / allHotels.length || 0;
    const topProvider = this.findTopProvider(allHotels, allFlights, allActivities);
    const processingTime = Date.now() - startTime;

    return {
      hotels: allHotels.slice(0, 20), // Limit to top 20 results
      flights: allFlights.slice(0, 10),
      activities: allActivities.slice(0, 15),
      aggregatedInsights: {
        totalOptions: allHotels.length + allFlights.length + allActivities.length,
        avgPersonalityMatch: Math.round(avgPersonalityMatch),
        topRecommendationProvider: topProvider,
        aiProcessingTime: processingTime,
        cacheHitRate: 0 // Will be calculated based on cache usage
      }
    };
  }

  /**
   * Find top performing provider
   */
  private findTopProvider(hotels: any[], flights: any[], activities: any[]): string {
    const providerScores: { [key: string]: number } = {};
    
    [...hotels, ...flights, ...activities].forEach(item => {
      const provider = item.provider;
      const score = item.aiConfidenceScore || item.aiOptimizationScore || item.aiRecommendationRank || 0;
      
      if (!providerScores[provider]) providerScores[provider] = 0;
      providerScores[provider] += score;
    });

    return Object.keys(providerScores).reduce((a, b) => 
      providerScores[a] > providerScores[b] ? a : b
    ) || 'amadeus';
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: SmartDreamProviderRequest): string {
    return `smart_dreams_${request.companionType}_${request.destination}_${request.dateRange?.start.getTime()}_${request.budget?.max}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cacheStore.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cacheStore.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cacheStore.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cacheStore.clear();
    logger.info('Smart Dreams provider cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cacheStore.size,
      keys: Array.from(this.cacheStore.keys())
    };
  }
}

// Export singleton instance
export const smartDreamProviderOrchestrator = new SmartDreamProviderOrchestrator();