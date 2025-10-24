/**
 * Smart Dreams AI API Client
 * Replaces mock orchestrator with real AI scoring + provider rotation
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_URL || '';

export interface DestinationScore {
  personality_match: number;  // 0-100
  is_dream_destination: boolean;
  match_reasons: string[];
  ai_confidence: number;
  budget_fit: 'excellent' | 'good' | 'tight' | 'over_budget';
  interest_alignment: number;
  companion_suitability: number;
  scoring_method: 'ai' | 'deterministic' | 'cached';
  cache_age_hours?: number;
}

export interface ScoredDestination {
  // Original destination fields
  name: string;
  location?: string;
  price: number;
  rating: number;
  tags?: string[];
  // Added scoring fields
  personality_match: number;
  is_dream_destination: boolean;
  match_reasons: string[];
  scoring_method: string;
}

export interface SearchWithRotationResult {
  success: boolean;
  results: any[];
  provider_used: string;
  provider_type: 'local' | 'global';
  attempts: number;
  correlation_id: string;
  rotation_log: any[];
}

/**
 * Score a single destination
 */
export const scoreDestination = async (
  destination: any,
  userPreferences: any,
  userContext: any,
  useAI: boolean = true
): Promise<DestinationScore> => {
  const response = await axios.post(
    `${API_BASE}/api/smart-dreams-v2/score-destination`,
    {
      destination,
      user_preferences: userPreferences,
      user_context: userContext,
      use_ai: useAI
    }
  );
  
  return response.data;
};

/**
 * Score multiple destinations efficiently
 * AI for top 5, deterministic for rest
 */
export const scoreBatchDestinations = async (
  destinations: any[],
  userPreferences: any,
  userContext: any,
  useAIForTopN: number = 5
): Promise<ScoredDestination[]> => {
  const response = await axios.post(
    `${API_BASE}/api/smart-dreams-v2/score-batch`,
    {
      destinations,
      user_preferences: userPreferences,
      user_context: userContext,
      use_ai_for_top_n: useAIForTopN
    }
  );
  
  return response.data.destinations;
};

/**
 * Search with enforced provider rotation
 * ONLY method allowed for searches - no direct provider calls
 */
export const searchWithRotation = async (
  serviceType: 'hotels' | 'flights' | 'activities',
  searchCriteria: any,
  correlationId?: string
): Promise<SearchWithRotationResult> => {
  const response = await axios.post(
    `${API_BASE}/api/smart-dreams-v2/search-with-rotation`,
    {
      service_type: serviceType,
      search_criteria: searchCriteria,
      correlation_id: correlationId || generateCorrelationId()
    }
  );
  
  return response.data;
};

/**
 * Get cache statistics (Admin only)
 */
export const getCacheStats = async () => {
  const response = await axios.get(
    `${API_BASE}/api/smart-dreams-v2/cache-stats`
  );
  
  return response.data;
};

/**
 * Clear cache (Admin only)
 */
export const clearCache = async (destination?: string) => {
  const response = await axios.delete(
    `${API_BASE}/api/smart-dreams-v2/cache`,
    { params: { destination } }
  );
  
  return response.data;
};

/**
 * Get provider rotation statistics (Admin only)
 */
export const getRotationStats = async () => {
  const response = await axios.get(
    `${API_BASE}/api/smart-dreams-v2/rotation-stats`
  );
  
  return response.data;
};

/**
 * Generate correlation ID for request tracking
 */
export const generateCorrelationId = (): string => {
  return `sd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Example usage in Smart Dreams components:
 * 
 * // Replace mock orchestrator search
 * const searchResults = await searchWithRotation('hotels', {
 *   destination: 'Paris',
 *   check_in: '2025-06-01',
 *   check_out: '2025-06-07',
 *   guests: 2
 * });
 * 
 * // Replace random scoring
 * const scoredHotels = await scoreBatchDestinations(
 *   searchResults.results,
 *   { budget: 2000, interests: ['culture', 'food'] },
 *   { userId: user.id, travelDNA: 'Cultural Explorer' }
 * );
 * 
 * // Now scores are real, consistent, and explainable!
 */
