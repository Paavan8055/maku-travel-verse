import { useState, useCallback } from 'react';
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

export interface SmartDreamProviderResult {
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
    location: string;
    amenities: string[];
  }>;
  flights: Array<{
    id: string;
    provider: string;
    price: number;
    duration: string;
    aiOptimizationScore: number;
    journeyFlow: number;
    airline: string;
    companions: {
      solo: number;
      romantic: number;
      friends: number;
      family: number;
    };
    route: string;
    departureTime: string;
    arrivalTime: string;
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
    duration: string;
    category: string;
    description: string;
    highlights: string[];
  }>;
  aggregatedInsights: {
    totalOptions: number;
    avgPersonalityMatch: number;
    topRecommendationProvider: string;
    aiProcessingTime: number;
    cacheHitRate: number;
    companionOptimization: {
      primaryMatches: number;
      aiConfidenceAvg: number;
      journeyFlowScore: number;
    };
  };
  searchMetadata: {
    companionType: string;
    destination?: string;
    searchTimestamp: string;
    providersQueried: string[];
    aiEnhancementEnabled: boolean;
  };
}

export const useSmartDreamProviders = () => {
  const [results, setResults] = useState<SmartDreamProviderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SmartDreamProviderRequest[]>([]);

  const searchProviders = useCallback(async (request: SmartDreamProviderRequest): Promise<SmartDreamProviderResult | null> => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Starting Smart Dreams provider search', { 
        companionType: request.companionType,
        destination: request.destination 
      });

      // Get backend URL from environment
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      // Prepare request payload
      const payload = {
        companion_type: request.companionType,
        travel_dna: request.travelDNA,
        destination: request.destination,
        date_range: request.dateRange ? {
          start: request.dateRange.start.toISOString(),
          end: request.dateRange.end.toISOString()
        } : null,
        budget: request.budget,
        preferences: request.preferences
      };

      // Make API call to Smart Dreams enhanced provider search
      const response = await fetch(`${backendUrl}/api/smart-dreams/provider-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Provider search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Transform response to match frontend interface
      const transformedResult: SmartDreamProviderResult = {
        hotels: data.hotels.map((hotel: any) => ({
          id: hotel.id,
          name: hotel.name,
          provider: hotel.provider,
          price: hotel.price,
          rating: hotel.rating,
          aiConfidenceScore: hotel.ai_confidence_score,
          personalityMatch: hotel.personality_match,
          companionSuitability: hotel.companion_suitability,
          dreamDestinationMatch: hotel.dream_destination_match,
          recommendationReasons: hotel.recommendation_reasons,
          location: hotel.location,
          amenities: hotel.amenities
        })),
        flights: data.flights.map((flight: any) => ({
          id: flight.id,
          provider: flight.provider,
          price: flight.price,
          duration: flight.duration,
          aiOptimizationScore: flight.ai_optimization_score,
          journeyFlow: flight.journey_flow,
          airline: flight.airline,
          companions: flight.companions,
          route: flight.route,
          departureTime: flight.departure_time,
          arrivalTime: flight.arrival_time
        })),
        activities: data.activities.map((activity: any) => ({
          id: activity.id,
          name: activity.name,
          provider: activity.provider,
          price: activity.price,
          personalityAlignment: activity.personality_alignment,
          companionMatch: activity.companion_match,
          experienceType: activity.experience_type,
          aiRecommendationRank: activity.ai_recommendation_rank,
          duration: activity.duration,
          category: activity.category,
          description: activity.description,
          highlights: activity.highlights
        })),
        aggregatedInsights: {
          totalOptions: data.aggregated_insights.total_options,
          avgPersonalityMatch: data.aggregated_insights.avg_personality_match,
          topRecommendationProvider: data.aggregated_insights.top_recommendation_provider,
          aiProcessingTime: data.aggregated_insights.ai_processing_time,
          cacheHitRate: data.aggregated_insights.cache_hit_rate,
          companionOptimization: data.aggregated_insights.companion_optimization
        },
        searchMetadata: {
          companionType: data.search_metadata.companion_type,
          destination: data.search_metadata.destination,
          searchTimestamp: data.search_metadata.search_timestamp,
          providersQueried: data.search_metadata.providers_queried,
          aiEnhancementEnabled: data.search_metadata.ai_enhancement_enabled
        }
      };

      setResults(transformedResult);
      
      // Add to search history
      setSearchHistory(prev => [request, ...prev.slice(0, 9)]); // Keep last 10 searches

      logger.info('Smart Dreams provider search completed successfully', {
        totalResults: transformedResult.aggregatedInsights.totalOptions,
        processingTime: transformedResult.aggregatedInsights.aiProcessingTime,
        topProvider: transformedResult.aggregatedInsights.topRecommendationProvider
      });

      return transformedResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Provider search failed';
      setError(errorMessage);
      logger.error('Smart Dreams provider search failed', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const getTopRecommendations = useCallback((type: 'hotels' | 'flights' | 'activities', limit = 5) => {
    if (!results) return [];

    switch (type) {
      case 'hotels':
        return results.hotels
          .sort((a, b) => b.aiConfidenceScore - a.aiConfidenceScore)
          .slice(0, limit);
      case 'flights':
        return results.flights
          .sort((a, b) => b.aiOptimizationScore - a.aiOptimizationScore)
          .slice(0, limit);
      case 'activities':
        return results.activities
          .sort((a, b) => b.aiRecommendationRank - a.aiRecommendationRank)
          .slice(0, limit);
      default:
        return [];
    }
  }, [results]);

  const getRecommendationsByCompanion = useCallback((companionType: string) => {
    if (!results) return { hotels: [], flights: [], activities: [] };

    return {
      hotels: results.hotels.filter(hotel => hotel.companionSuitability > 80),
      flights: results.flights.filter(flight => flight.companions[companionType as keyof typeof flight.companions] > 80),
      activities: results.activities.filter(activity => activity.companionMatch > 80)
    };
  }, [results]);

  const getProviderStats = useCallback(() => {
    if (!results) return {};

    const stats: { [key: string]: { hotels: number; flights: number; activities: number; avgScore: number } } = {};

    // Count by provider
    [...results.hotels, ...results.flights, ...results.activities].forEach(item => {
      if (!stats[item.provider]) {
        stats[item.provider] = { hotels: 0, flights: 0, activities: 0, avgScore: 0 };
      }
    });

    results.hotels.forEach(hotel => {
      stats[hotel.provider].hotels++;
    });

    results.flights.forEach(flight => {
      stats[flight.provider].flights++;
    });

    results.activities.forEach(activity => {
      stats[activity.provider].activities++;
    });

    // Calculate average scores
    Object.keys(stats).forEach(provider => {
      const providerItems = [
        ...results.hotels.filter(h => h.provider === provider),
        ...results.flights.filter(f => f.provider === provider),
        ...results.activities.filter(a => a.provider === provider)
      ];

      const totalScore = providerItems.reduce((sum, item) => {
        const score = (item as any).aiConfidenceScore || (item as any).aiOptimizationScore || (item as any).aiRecommendationRank || 0;
        return sum + score;
      }, 0);

      stats[provider].avgScore = providerItems.length > 0 ? Math.round(totalScore / providerItems.length) : 0;
    });

    return stats;
  }, [results]);

  return {
    // Data
    results,
    loading,
    error,
    searchHistory,

    // Actions
    searchProviders,
    clearResults,
    clearSearchHistory,

    // Computed
    getTopRecommendations,
    getRecommendationsByCompanion,
    getProviderStats,

    // State info
    hasResults: !!results,
    totalResults: results?.aggregatedInsights.totalOptions || 0,
    aiProcessingTime: results?.aggregatedInsights.aiProcessingTime || 0,
    topProvider: results?.aggregatedInsights.topRecommendationProvider
  };
};

export default useSmartDreamProviders;