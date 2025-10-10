import { advancedProviderRotation, type AdvancedRotationResult } from './AdvancedProviderRotation';
import { crossModuleContextManager } from './CrossModuleContextManager';
import { intelligentCacheManager } from './IntelligentCacheManager';
import logger from '@/utils/logger';

export interface SearchRequest {
  type: 'flight' | 'hotel' | 'activity';
  params: any;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[]; // IDs of searches this depends on
  userContext?: any;
}

export interface OrchestratedSearchResult {
  searchId: string;
  type: 'flight' | 'hotel' | 'activity';
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  dependencyResults?: { [key: string]: any };
  recommendations?: {
    crossService: any[];
    bundling: any[];
    upgrades: any[];
  };
}

export interface SearchDependency {
  searchId: string;
  dependsOn: string[];
  status: 'pending' | 'ready' | 'executing' | 'completed' | 'failed';
  result?: OrchestratedSearchResult;
}

export class UnifiedSearchOrchestrator {
  private activeSearches = new Map<string, SearchDependency>();
  private searchQueue: SearchRequest[] = [];
  private executionHistory = new Map<string, OrchestratedSearchResult[]>();

  async orchestrateMultiServiceSearch(requests: SearchRequest[]): Promise<OrchestratedSearchResult[]> {
    const startTime = Date.now();
    logger.info('Starting multi-service search orchestration', { requestCount: requests.length });

    try {
      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(requests);
      
      // Execute searches in optimal order
      const results = await this.executeSearchGraph(dependencyGraph);
      
      // Generate cross-service recommendations
      await this.generateCrossServiceRecommendations(results);
      
      // Store execution history for learning
      this.storeExecutionHistory(results, Date.now() - startTime);
      
      return results;
    } catch (error) {
      logger.error('Multi-service search orchestration failed:', error);
      throw error;
    }
  }

  async orchestrateDependentSearch(
    primaryRequest: SearchRequest,
    dependentRequests: SearchRequest[]
  ): Promise<OrchestratedSearchResult[]> {
    const allRequests = [primaryRequest, ...dependentRequests];
    
    // Set up dependencies
    dependentRequests.forEach(req => {
      req.dependencies = [this.generateSearchId(primaryRequest)];
    });
    
    return this.orchestrateMultiServiceSearch(allRequests);
  }

  async orchestrateFlightHotelActivitySearch(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate?: string,
    guests: number = 2,
    userPreferences?: any
  ): Promise<{
    flights: OrchestratedSearchResult[];
    hotels: OrchestratedSearchResult[];
    activities: OrchestratedSearchResult[];
    bundleRecommendations: any[];
  }> {
    const flightSearchId = 'flight_' + Date.now();
    const hotelSearchId = 'hotel_' + Date.now();
    const activitySearchId = 'activity_' + Date.now();

    const requests: SearchRequest[] = [
      {
        type: 'flight',
        params: {
          origin,
          destination,
          departureDate,
          returnDate,
          adults: guests,
          cabin: userPreferences?.cabin || 'economy'
        },
        priority: 'high',
        userContext: userPreferences
      },
      {
        type: 'hotel',
        params: {
          destination,
          checkIn: departureDate,
          checkOut: returnDate || departureDate,
          guests,
          rooms: Math.ceil(guests / 2)
        },
        priority: 'high',
        dependencies: [flightSearchId], // Wait for flight results for timing optimization
        userContext: userPreferences
      },
      {
        type: 'activity',
        params: {
          destination,
          date: departureDate,
          participants: guests,
          activityTypes: userPreferences?.interests || ['sightseeing']
        },
        priority: 'medium',
        dependencies: [hotelSearchId], // Can use hotel location for better activity suggestions
        userContext: userPreferences
      }
    ];

    const results = await this.orchestrateMultiServiceSearch(requests);
    
    const flights = results.filter(r => r.type === 'flight');
    const hotels = results.filter(r => r.type === 'hotel');
    const activities = results.filter(r => r.type === 'activity');
    
    const bundleRecommendations = await this.generateTravelBundleRecommendations(
      flights[0]?.data,
      hotels[0]?.data,
      activities[0]?.data,
      userPreferences
    );

    return {
      flights,
      hotels,
      activities,
      bundleRecommendations
    };
  }

  private buildDependencyGraph(requests: SearchRequest[]): Map<string, SearchDependency> {
    const graph = new Map<string, SearchDependency>();
    
    requests.forEach(request => {
      const searchId = this.generateSearchId(request);
      graph.set(searchId, {
        searchId,
        dependsOn: request.dependencies || [],
        status: 'pending',
        result: undefined
      });
    });

    return graph;
  }

  private async executeSearchGraph(graph: Map<string, SearchDependency>): Promise<OrchestratedSearchResult[]> {
    const results: OrchestratedSearchResult[] = [];
    const completed = new Set<string>();
    
    while (completed.size < graph.size) {
      // Find ready searches (no pending dependencies)
      const readySearches = Array.from(graph.entries())
        .filter(([id, dep]) => 
          dep.status === 'pending' && 
          dep.dependsOn.every(depId => completed.has(depId))
        );

      if (readySearches.length === 0) {
        // Deadlock or all failed - execute remaining with available data
        const remainingSearches = Array.from(graph.entries())
          .filter(([id]) => !completed.has(id));
        
        for (const [id, dep] of remainingSearches) {
          const result = await this.executeSearch(dep, graph);
          results.push(result);
          completed.add(id);
        }
        break;
      }

      // Execute ready searches in parallel
      const executePromises = readySearches.map(async ([id, dep]) => {
        dep.status = 'executing';
        const result = await this.executeSearch(dep, graph);
        dep.status = result.success ? 'completed' : 'failed';
        dep.result = result;
        completed.add(id);
        return result;
      });

      const batchResults = await Promise.all(executePromises);
      results.push(...batchResults);
    }

    return results;
  }

  private async executeSearch(
    dependency: SearchDependency,
    graph: Map<string, SearchDependency>
  ): Promise<OrchestratedSearchResult> {
    const startTime = Date.now();
    
    try {
      // Get dependency results for context
      const dependencyResults: { [key: string]: any } = {};
      for (const depId of dependency.dependsOn) {
        const depResult = graph.get(depId)?.result;
        if (depResult?.success) {
          dependencyResults[depId] = depResult.data;
        }
      }

      // Determine search type and params from searchId
      const request = this.reconstructRequestFromId(dependency.searchId);
      
      // Enhance params with dependency context
      const enhancedParams = this.enhanceParamsWithDependencies(request.params, dependencyResults);
      
      // Execute search with ML provider selection
      const result = await advancedProviderRotation.selectProviderWithML(
        request.type,
        enhancedParams,
        request.userContext
      );

      // Store in cross-module context for other services
      if (result.success) {
        await crossModuleContextManager.setModuleContext(
          request.type,
          {
            destination: enhancedParams.destination || enhancedParams.cityCode,
            dates: {
              checkIn: new Date(enhancedParams.checkIn || enhancedParams.departureDate),
              checkOut: enhancedParams.checkOut ? new Date(enhancedParams.checkOut) : undefined
            },
            travelers: {
              adults: enhancedParams.adults || enhancedParams.guests || 1,
              children: enhancedParams.children || 0
            },
            sessionId: dependency.searchId
          },
          {
            moduleType: request.type,
            lastSearched: new Date(),
            results: result.data ? [result.data] : [],
            searchParams: enhancedParams,
            userInteractions: []
          }
        );
      }

      return {
        searchId: dependency.searchId,
        type: request.type,
        success: result.success,
        data: result.data,
        error: result.error,
        executionTime: Date.now() - startTime,
        dependencyResults
      };

    } catch (error) {
      logger.error(`Search execution failed for ${dependency.searchId}:`, error);
      
      return {
        searchId: dependency.searchId,
        type: this.extractTypeFromSearchId(dependency.searchId),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  private enhanceParamsWithDependencies(params: any, dependencyResults: { [key: string]: any }): any {
    const enhanced = { ...params };
    
    // Enhance hotel search with flight arrival/departure times
    for (const [depId, depResult] of Object.entries(dependencyResults)) {
      if (depId.startsWith('flight_') && depResult?.flights?.length > 0) {
        const flight = depResult.flights[0];
        enhanced.preferredCheckInTime = flight.arrival?.time;
        enhanced.preferredCheckOutTime = flight.departure?.time;
        enhanced.airportProximity = true;
      }
      
      // Enhance activity search with hotel location
      if (depId.startsWith('hotel_') && depResult?.hotels?.length > 0) {
        const hotel = depResult.hotels[0];
        enhanced.preferredLocation = hotel.location;
        enhanced.transportationHub = hotel.nearestTransport;
      }
    }
    
    return enhanced;
  }

  private async generateCrossServiceRecommendations(results: OrchestratedSearchResult[]): Promise<void> {
    for (const result of results) {
      if (!result.success) continue;
      
      const recommendations = {
        crossService: await this.generateCrossServiceSuggestions(result, results),
        bundling: await this.generateBundlingSuggestions(result, results),
        upgrades: await this.generateUpgradeSuggestions(result)
      };
      
      result.recommendations = recommendations;
    }
  }

  private async generateCrossServiceSuggestions(
    result: OrchestratedSearchResult,
    allResults: OrchestratedSearchResult[]
  ): Promise<any[]> {
    const suggestions: any[] = [];
    
    if (result.type === 'flight' && result.data?.flights?.length > 0) {
      const destination = result.data.flights[0].destination;
      
      // Suggest hotels near airport or city center
      suggestions.push({
        type: 'hotel_suggestion',
        message: `Find accommodations in ${destination}`,
        action: 'search_hotels',
        params: { destination, proximity: 'airport' }
      });
      
      // Suggest activities based on destination
      suggestions.push({
        type: 'activity_suggestion',
        message: `Discover activities in ${destination}`,
        action: 'search_activities',
        params: { destination, category: 'popular' }
      });
    }
    
    return suggestions;
  }

  private async generateBundlingSuggestions(
    result: OrchestratedSearchResult,
    allResults: OrchestratedSearchResult[]
  ): Promise<any[]> {
    const suggestions: any[] = [];
    
    // Look for bundle opportunities across completed searches
    const flightResults = allResults.filter(r => r.type === 'flight' && r.success);
    const hotelResults = allResults.filter(r => r.type === 'hotel' && r.success);
    
    if (flightResults.length > 0 && hotelResults.length > 0) {
      suggestions.push({
        type: 'flight_hotel_bundle',
        message: 'Save 15% by booking flight and hotel together',
        savings: 0.15,
        bundlePrice: this.calculateBundlePrice(flightResults[0].data, hotelResults[0].data)
      });
    }
    
    return suggestions;
  }

  private async generateUpgradeSuggestions(result: OrchestratedSearchResult): Promise<any[]> {
    const suggestions: any[] = [];
    
    if (result.type === 'flight' && result.data?.flights?.length > 0) {
      const flight = result.data.flights[0];
      if (flight.class === 'economy') {
        suggestions.push({
          type: 'flight_upgrade',
          message: 'Upgrade to Premium Economy for extra comfort',
          upgrade: 'premium_economy',
          additionalCost: flight.price * 0.3
        });
      }
    }
    
    return suggestions;
  }

  private async generateTravelBundleRecommendations(
    flightData: any,
    hotelData: any,
    activityData: any,
    userPreferences?: any
  ): Promise<any[]> {
    const recommendations: any[] = [];
    
    if (flightData && hotelData) {
      const bundleDiscount = 0.12; // 12% bundle discount
      const flightPrice = flightData.flights?.[0]?.price || 0;
      const hotelPrice = hotelData.hotels?.[0]?.pricePerNight || 0;
      
      recommendations.push({
        type: 'flight_hotel_package',
        title: 'Flight + Hotel Package',
        description: 'Book together and save 12%',
        originalPrice: flightPrice + hotelPrice,
        bundlePrice: (flightPrice + hotelPrice) * (1 - bundleDiscount),
        savings: (flightPrice + hotelPrice) * bundleDiscount,
        items: ['flight', 'hotel']
      });
    }
    
    if (flightData && hotelData && activityData) {
      const fullBundleDiscount = 0.18; // 18% full bundle discount
      const totalPrice = (flightData.flights?.[0]?.price || 0) + 
                        (hotelData.hotels?.[0]?.pricePerNight || 0) + 
                        (activityData.activities?.[0]?.price || 0);
      
      recommendations.push({
        type: 'complete_travel_package',
        title: 'Complete Travel Package',
        description: 'Flight + Hotel + Activities - Maximum savings!',
        originalPrice: totalPrice,
        bundlePrice: totalPrice * (1 - fullBundleDiscount),
        savings: totalPrice * fullBundleDiscount,
        items: ['flight', 'hotel', 'activities'],
        featured: true
      });
    }
    
    return recommendations;
  }

  private generateSearchId(request: SearchRequest): string {
    return `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private reconstructRequestFromId(searchId: string): SearchRequest {
    const [type] = searchId.split('_');
    // This would normally be stored during orchestration
    // For now, return a basic request structure
    return {
      type: type as 'flight' | 'hotel' | 'activity',
      params: {},
      priority: 'medium'
    };
  }

  private extractTypeFromSearchId(searchId: string): 'flight' | 'hotel' | 'activity' {
    const [type] = searchId.split('_');
    return type as 'flight' | 'hotel' | 'activity';
  }

  private calculateBundlePrice(flightData: any, hotelData: any): number {
    const flightPrice = flightData.flights?.[0]?.price || 0;
    const hotelPrice = hotelData.hotels?.[0]?.pricePerNight || 0;
    return (flightPrice + hotelPrice) * 0.85; // 15% bundle discount
  }

  private storeExecutionHistory(results: OrchestratedSearchResult[], totalExecutionTime: number): void {
    const sessionId = Date.now().toString();
    this.executionHistory.set(sessionId, results);
    
    // Keep only last 50 sessions
    if (this.executionHistory.size > 50) {
      const oldestKey = Array.from(this.executionHistory.keys())[0];
      this.executionHistory.delete(oldestKey);
    }
    
    logger.info('Stored orchestration execution history', {
      sessionId,
      resultCount: results.length,
      totalExecutionTime,
      successRate: results.filter(r => r.success).length / results.length
    });
  }

  getExecutionHistory(): { [sessionId: string]: OrchestratedSearchResult[] } {
    return Object.fromEntries(this.executionHistory.entries());
  }

  getPerformanceMetrics(): {
    averageExecutionTime: number;
    successRate: number;
    serviceDistribution: { [type: string]: number };
    bundlingOpportunities: number;
  } {
    const allResults = Array.from(this.executionHistory.values()).flat();
    
    if (allResults.length === 0) {
      return {
        averageExecutionTime: 0,
        successRate: 0,
        serviceDistribution: {},
        bundlingOpportunities: 0
      };
    }
    
    const successRate = allResults.filter(r => r.success).length / allResults.length;
    const averageExecutionTime = allResults.reduce((sum, r) => sum + r.executionTime, 0) / allResults.length;
    
    const serviceDistribution = allResults.reduce((dist, r) => {
      dist[r.type] = (dist[r.type] || 0) + 1;
      return dist;
    }, {} as { [type: string]: number });
    
    const bundlingOpportunities = allResults.filter(r => 
      r.recommendations?.bundling && r.recommendations.bundling.length > 0
    ).length;
    
    return {
      averageExecutionTime,
      successRate,
      serviceDistribution,
      bundlingOpportunities
    };
  }
}

export const unifiedSearchOrchestrator = new UnifiedSearchOrchestrator();
