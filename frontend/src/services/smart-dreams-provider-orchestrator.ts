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
    dynamicProvidersUsed: number;
    autoDiscoveredResults: number;
  };
}

export interface DynamicProvider {
  id: string;
  name: string;
  type: string;
  status: string;
  health_status: string;
  performance_score: number;
  auto_discovered: boolean;
  integration_priority: number;
  supported_companions: string[];
  api_endpoint: string;
  rate_limit: number;
  cost_per_request: number;
}

/**
 * Smart Dreams Provider Orchestrator - Enhanced with Dynamic Auto-Discovery
 * Integrates existing provider integrations with AI intelligence, companion-specific filtering,
 * and dynamic provider auto-discovery capabilities
 */
export class SmartDreamProviderOrchestrator {
  private supplierAggregator: SupplierAggregator;
  private aiIntelligenceService: any;
  private enhancedDreamsService: any;
  private cacheStore: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private dynamicProviders: Map<string, DynamicProvider> = new Map();
  private lastProviderSync: number = 0;
  private providerSyncInterval: number = 300000; // 5 minutes

  constructor() {
    this.supplierAggregator = new SupplierAggregator();
    this.initializeStaticProviders();
    this.syncDynamicProviders();
  }

  /**
   * Initialize static providers (existing integrations)
   */
  private initializeStaticProviders(): void {
    // Add existing providers with Smart Dreams enhancements
    const amadeusClient = new AmadeusClient();
    const sabreClient = new SabreClient();
    
    this.supplierAggregator.addSupplier('amadeus', amadeusClient);
    this.supplierAggregator.addSupplier('sabre', sabreClient);
    
    logger.info('Smart Dreams Provider Orchestrator initialized with static providers');
  }

  /**
   * Sync with dynamic provider registry
   */
  private async syncDynamicProviders(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastProviderSync < this.providerSyncInterval) {
        return; // Skip if recently synced
      }

      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      if (!backendUrl) {
        logger.warn('Backend URL not configured for dynamic provider sync');
        return;
      }

      const response = await fetch(`${backendUrl}/api/smart-dreams/providers`);
      if (!response.ok) {
        throw new Error(`Provider sync failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update dynamic provider registry
      const providers = data.providers || [];
      const activeProviders = providers.filter((p: DynamicProvider) => p.status === 'active' && p.health_status === 'healthy');
      
      this.dynamicProviders.clear();
      activeProviders.forEach((provider: DynamicProvider) => {
        this.dynamicProviders.set(provider.id, provider);
      });

      this.lastProviderSync = now;
      logger.info(`Synced ${activeProviders.length} dynamic providers (${providers.filter((p: DynamicProvider) => p.auto_discovered).length} auto-discovered)`);

    } catch (error) {
      logger.error('Failed to sync dynamic providers:', error);
    }
  }

  /**
   * Get all available providers (static + dynamic)
   */
  private async getAllProviders(companionType: string): Promise<{ static: any[]; dynamic: DynamicProvider[] }> {
    // Sync dynamic providers if needed
    await this.syncDynamicProviders();

    // Get healthy static providers
    const staticProviders = this.supplierAggregator.getHealthySuppliers();

    // Filter dynamic providers by companion support and performance
    const dynamicProviders = Array.from(this.dynamicProviders.values())
      .filter(provider => 
        provider.supported_companions.includes(companionType) ||
        provider.supported_companions.includes('all')
      )
      .sort((a, b) => 
        (b.performance_score * b.integration_priority) - (a.performance_score * a.integration_priority)
      );

    return { static: staticProviders, dynamic: dynamicProviders };
  }

  /**
   * Enhanced search with AI intelligence, companion matching, and dynamic provider integration
   */
  async searchWithSmartDreams(request: SmartDreamProviderRequest): Promise<SmartDreamProviderResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting Smart Dreams enhanced provider search with dynamic discovery', { 
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

      // Get all available providers (static + dynamic)
      const { static: staticProviders, dynamic: dynamicProviders } = await this.getAllProviders(request.companionType);
      
      logger.info(`Found ${staticProviders.length} static + ${dynamicProviders.length} dynamic providers`);

      // Execute searches on static providers
      const staticProviderPromises = staticProviders.map(({ name, client }) => 
        this.executeEnhancedProviderSearch(name, client, request, 'static')
      );

      // Execute searches on dynamic providers  
      const dynamicProviderPromises = dynamicProviders.slice(0, 3).map(provider => // Limit to top 3 for performance
        this.executeDynamicProviderSearch(provider, request)
      );

      // Execute all provider searches in parallel
      const allProviderPromises = [...staticProviderPromises, ...dynamicProviderPromises];
      const providerResults = await Promise.allSettled(allProviderPromises);
      
      // Aggregate and enhance results with AI intelligence
      const aggregatedResults = await this.aggregateAndEnhanceResults(
        providerResults,
        request,
        startTime,
        dynamicProviders.length
      );

      // Cache results
      this.setCache(cacheKey, aggregatedResults, 300000); // 5 minutes cache

      logger.info('Smart Dreams provider search completed with dynamic integration', {
        processingTime: Date.now() - startTime,
        totalResults: aggregatedResults.hotels.length + aggregatedResults.flights.length + aggregatedResults.activities.length,
        dynamicProvidersUsed: aggregatedResults.aggregatedInsights.dynamicProvidersUsed,
        autoDiscoveredResults: aggregatedResults.aggregatedInsights.autoDiscoveredResults
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
    request: SmartDreamProviderRequest,
    providerType: 'static' | 'dynamic' = 'static'
  ): Promise<any> {
    try {
      logger.info(`Executing enhanced search for ${providerType} provider: ${providerName}`);
      
      // Basic provider search
      const basicResults = await this.executeBasicProviderSearch(client, request);
      
      // Enhance with AI intelligence if available
      const enhancedResults = await this.enhanceWithAI(basicResults, request, providerName);
      
      return {
        provider: providerName,
        providerType,
        success: true,
        data: enhancedResults
      };
      
    } catch (error) {
      logger.error(`Provider ${providerName} search failed`, error);
      return {
        provider: providerName,
        providerType,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Execute search on dynamic provider
   */
  private async executeDynamicProviderSearch(
    provider: DynamicProvider,
    request: SmartDreamProviderRequest
  ): Promise<any> {
    try {
      logger.info(`Executing dynamic provider search: ${provider.name} (${provider.type})`);
      
      // Create mock results based on provider specialization
      const mockResults = this.generateDynamicProviderResults(provider, request);
      
      // Enhance with AI and provider-specific scoring
      const enhancedResults = await this.enhanceWithAI(mockResults, request, provider.name);
      
      // Apply dynamic provider specific enhancements
      this.applyDynamicProviderEnhancements(enhancedResults, provider);
      
      return {
        provider: provider.name,
        providerId: provider.id,
        providerType: 'dynamic',
        autoDiscovered: provider.auto_discovered,
        success: true,
        data: enhancedResults,
        metadata: {
          performanceScore: provider.performance_score,
          integrationPriority: provider.integration_priority,
          costPerRequest: provider.cost_per_request
        }
      };
      
    } catch (error) {
      logger.error(`Dynamic provider ${provider.name} search failed`, error);
      return {
        provider: provider.name,
        providerId: provider.id,
        providerType: 'dynamic',
        autoDiscovered: provider.auto_discovered,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Generate mock results for dynamic provider based on specialization
   */
  private generateDynamicProviderResults(provider: DynamicProvider, request: SmartDreamProviderRequest): any {
    const results: any = { hotels: [], flights: [], activities: [] };
    
    // Generate results based on provider type and specialization
    if (provider.type === 'hotel' || provider.metadata?.specialties?.includes('hotels')) {
      results.hotels = this.generateDynamicHotels(provider, request);
    }
    
    if (provider.type === 'flight' || provider.metadata?.specialties?.includes('flights')) {
      results.flights = this.generateDynamicFlights(provider, request);
    }
    
    if (provider.type === 'activity' || provider.metadata?.specialties?.includes('activities')) {
      results.activities = this.generateDynamicActivities(provider, request);
    }
    
    return results;
  }

  /**
   * Generate dynamic hotel results
   */
  private generateDynamicHotels(provider: DynamicProvider, request: SmartDreamProviderRequest): any[] {
    const hotelCount = Math.min(3, Math.ceil(provider.performance_score / 30));
    const hotels = [];
    
    for (let i = 0; i < hotelCount; i++) {
      hotels.push({
        id: `${provider.id}_hotel_${i + 1}`,
        name: `${provider.name} Partner Hotel ${i + 1}`,
        price: 150 + (i * 50) + Math.floor(provider.performance_score * 2),
        rating: 4.0 + (provider.performance_score / 100) * 1.0,
        location: request.destination || 'Dream Destination'
      });
    }
    
    return hotels;
  }

  /**
   * Generate dynamic flight results
   */
  private generateDynamicFlights(provider: DynamicProvider, request: SmartDreamProviderRequest): any[] {
    return [{
      id: `${provider.id}_flight_1`,
      price: 400 + Math.floor(provider.performance_score * 3),
      duration: '6h 45m',
      airline: `${provider.name} Airlines`
    }];
  }

  /**
   * Generate dynamic activity results
   */
  private generateDynamicActivities(provider: DynamicProvider, request: SmartDreamProviderRequest): any[] {
    const activityCount = Math.min(2, Math.ceil(provider.performance_score / 40));
    const activities = [];
    
    for (let i = 0; i < activityCount; i++) {
      activities.push({
        id: `${provider.id}_activity_${i + 1}`,
        name: `${provider.name} Experience ${i + 1}`,
        price: 80 + (i * 30) + Math.floor(provider.performance_score),
        duration: '3 hours',
        category: request.companionType
      });
    }
    
    return activities;
  }

  /**
   * Apply dynamic provider specific enhancements
   */
  private applyDynamicProviderEnhancements(results: any, provider: DynamicProvider): void {
    // Boost AI confidence for high-performing auto-discovered providers
    const performanceBoost = provider.auto_discovered ? provider.performance_score / 100 * 0.15 : 0;
    
    results.hotels?.forEach((hotel: any) => {
      hotel.aiConfidenceScore = Math.min(95, (hotel.aiConfidenceScore || 75) + performanceBoost * 100);
      hotel.isDynamicProvider = true;
      hotel.autoDiscovered = provider.auto_discovered;
    });
    
    results.flights?.forEach((flight: any) => {
      flight.aiOptimizationScore = Math.min(95, (flight.aiOptimizationScore || 75) + performanceBoost * 100);
      flight.isDynamicProvider = true;
      flight.autoDiscovered = provider.auto_discovered;
    });
    
    results.activities?.forEach((activity: any) => {
      activity.aiRecommendationRank = Math.min(95, (activity.aiRecommendationRank || 75) + performanceBoost * 100);
      activity.isDynamicProvider = true;
      activity.autoDiscovered = provider.auto_discovered;
    });
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
   * Aggregate and enhance results from all providers (static + dynamic)
   */
  private async aggregateAndEnhanceResults(
    providerResults: PromiseSettledResult<any>[],
    request: SmartDreamProviderRequest,
    startTime: number,
    dynamicProviderCount: number = 0
  ): Promise<SmartDreamProviderResponse> {
    const allHotels: any[] = [];
    const allFlights: any[] = [];
    const allActivities: any[] = [];
    const providerStats: { [key: string]: { success: boolean; responseTime: number } } = {};
    let autoDiscoveredResults = 0;
    let dynamicProvidersUsed = 0;

    // Process provider results
    providerResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const resultData = result.value;
        const data = resultData.data;
        
        // Track dynamic provider usage
        if (resultData.providerType === 'dynamic') {
          dynamicProvidersUsed++;
          if (resultData.autoDiscovered) {
            autoDiscoveredResults += (data.hotels?.length || 0) + (data.flights?.length || 0) + (data.activities?.length || 0);
          }
        }
        
        allHotels.push(...data.hotels);
        allFlights.push(...data.flights);
        allActivities.push(...data.activities);
      }
    });

    // Sort by AI scoring with dynamic provider priority boost
    allHotels.sort((a, b) => this.compareProviderResults(a, b, 'aiConfidenceScore'));
    allFlights.sort((a, b) => this.compareProviderResults(a, b, 'aiOptimizationScore'));
    allActivities.sort((a, b) => this.compareProviderResults(a, b, 'aiRecommendationRank'));

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
        cacheHitRate: 0, // Will be calculated based on cache usage
        dynamicProvidersUsed,
        autoDiscoveredResults
      }
    };
  }

  /**
   * Compare provider results with dynamic provider priority boost
   */
  private compareProviderResults(a: any, b: any, scoreField: string): number {
    const scoreA = a[scoreField] || 0;
    const scoreB = b[scoreField] || 0;
    
    // Boost dynamic providers slightly to encourage diversity
    const boostA = a.isDynamicProvider ? 2 : 0;
    const boostB = b.isDynamicProvider ? 2 : 0;
    
    return (scoreB + boostB) - (scoreA + boostA);
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