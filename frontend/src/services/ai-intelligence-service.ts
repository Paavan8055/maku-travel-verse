import { 
  TravelDNA, 
  IntelligentRecommendation, 
  IntelligentJourney,
  PredictiveInsight,
  TravelDNAResponse,
  IntelligentRecommendationsResponse,
  JourneyOptimizationResponse,
  PredictiveInsightsResponse,
  AIAnalysisRequest,
  AIAnalysisResponse,
  UserFeedback
} from '@/types/ai-intelligence-types';
import logger from '@/utils/logger';

class AIIntelligenceService {
  private readonly backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'https://smartjourney-6.preview.emergentagent.com';

  /**
   * Analyze user's travel DNA based on individual and social data
   */
  async analyzeTravelDNA(userId: string): Promise<TravelDNAResponse | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ai/travel-dna/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          include_social_data: true,
          include_behavioral_patterns: true,
          analysis_depth: 'comprehensive'
        })
      });

      if (response.ok) {
        return await response.json();
      }

      // Fallback to mock data for Phase 3 development
      return this.getMockTravelDNAResponse(userId);
    } catch (error) {
      logger.error('Error analyzing travel DNA:', error);
      return this.getMockTravelDNAResponse(userId);
    }
  }

  /**
   * Get AI-powered intelligent recommendations
   */
  async getIntelligentRecommendations(
    userId: string,
    options?: {
      max_results?: number;
      include_social_proof?: boolean;
      confidence_threshold?: number;
      categories?: string[];
    }
  ): Promise<IntelligentRecommendationsResponse | null> {
    try {
      const queryParams = new URLSearchParams({
        max_results: (options?.max_results || 10).toString(),
        include_social_proof: (options?.include_social_proof !== false).toString(),
        confidence_threshold: (options?.confidence_threshold || 0.7).toString(),
        ...(options?.categories && { categories: options.categories.join(',') })
      });

      const response = await fetch(`${this.backendUrl}/api/ai/recommendations/${userId}?${queryParams}`);

      if (response.ok) {
        return await response.json();
      }

      return this.getMockIntelligentRecommendations(userId);
    } catch (error) {
      logger.error('Error getting intelligent recommendations:', error);
      return this.getMockIntelligentRecommendations(userId);
    }
  }

  /**
   * Optimize multi-destination journey using AI
   */
  async optimizeJourney(
    userId: string,
    destinationIds: string[],
    preferences?: {
      optimize_for: 'cost' | 'time' | 'weather' | 'experience' | 'balanced';
      travel_style: 'budget' | 'comfort' | 'luxury';
      max_duration_days?: number;
      preferred_season?: 'spring' | 'summer' | 'fall' | 'winter';
    }
  ): Promise<JourneyOptimizationResponse | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ai/journey-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          destination_ids: destinationIds,
          preferences: preferences || { optimize_for: 'balanced', travel_style: 'comfort' }
        })
      });

      if (response.ok) {
        return await response.json();
      }

      return this.getMockJourneyOptimization(userId, destinationIds);
    } catch (error) {
      logger.error('Error optimizing journey:', error);
      return this.getMockJourneyOptimization(userId, destinationIds);
    }
  }

  /**
   * Get predictive insights for user
   */
  async getPredictiveInsights(userId: string): Promise<PredictiveInsightsResponse | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ai/predictive-insights/${userId}`);

      if (response.ok) {
        return await response.json();
      }

      return this.getMockPredictiveInsights(userId);
    } catch (error) {
      logger.error('Error getting predictive insights:', error);
      return this.getMockPredictiveInsights(userId);
    }
  }

  /**
   * Submit user feedback on AI recommendations
   */
  async submitFeedback(feedback: Omit<UserFeedback, 'feedback_id' | 'created_at'>): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ai/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });

      return response.ok;
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      return false;
    }
  }

  /**
   * Get AI explanation for a recommendation
   */
  async getRecommendationExplanation(
    userId: string, 
    recommendationId: string
  ): Promise<{ explanation: string; confidence: number } | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/ai/explain/${recommendationId}?user_id=${userId}`);

      if (response.ok) {
        return await response.json();
      }

      return {
        explanation: "This recommendation is based on your travel personality, social connections, and optimal timing factors. Our AI analyzed your preferences for cultural experiences and found this destination highly matches your interests.",
        confidence: 0.85
      };
    } catch (error) {
      logger.error('Error getting recommendation explanation:', error);
      return null;
    }
  }

  // Mock data methods for Phase 3 development
  private getMockTravelDNAResponse(userId: string): TravelDNAResponse {
    return {
      travel_dna: {
        user_id: userId,
        primary_type: 'cultural_explorer',
        secondary_type: 'photographer',
        confidence_score: 0.87,
        personality_factors: [
          {
            factor: 'culture',
            weight: 0.9,
            confidence: 0.92,
            source: 'individual_behavior',
            trend: 'increasing'
          },
          {
            factor: 'photography',
            weight: 0.8,
            confidence: 0.85,
            source: 'social_influence',
            trend: 'stable'
          },
          {
            factor: 'food',
            weight: 0.7,
            confidence: 0.78,
            source: 'explicit_preference',
            trend: 'increasing'
          },
          {
            factor: 'adventure',
            weight: 0.4,
            confidence: 0.65,
            source: 'ai_inference',
            trend: 'stable'
          }
        ],
        social_influence_factors: [
          {
            factor_type: 'friend_influence',
            influence_strength: 0.3,
            source_users: ['friend_1', 'friend_2'],
            destinations_influenced: ['kyoto', 'rome', 'paris'],
            confidence: 0.75
          }
        ],
        behavioral_patterns: [
          {
            pattern_type: 'browsing_behavior',
            pattern_data: {
              peak_browsing_hours: [19, 20, 21],
              preferred_content_types: ['cultural_sites', 'local_cuisine', 'photography_spots'],
              average_session_duration: 25.5
            },
            strength: 0.8,
            last_updated: new Date()
          }
        ],
        last_analyzed: new Date(),
        analysis_version: '3.1.0'
      },
      confidence_breakdown: {
        individual_data_confidence: 0.85,
        social_data_confidence: 0.78,
        behavioral_pattern_confidence: 0.89,
        overall_confidence: 0.87
      },
      recommendations_count: 15,
      last_updated: new Date(),
      next_analysis_recommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
  }

  private getMockIntelligentRecommendations(userId: string): IntelligentRecommendationsResponse {
    return {
      recommendations: [
        {
          destination_id: 'florence_italy',
          destination_name: 'Florence',
          country: 'Italy',
          continent: 'Europe',
          recommendation_score: 94,
          recommendation_reasons: [
            {
              reason_type: 'personality_match',
              reason_text: 'Perfect match for cultural explorers with world-class art museums and Renaissance architecture',
              confidence: 0.92,
              weight: 0.4
            },
            {
              reason_type: 'social_influence',
              reason_text: '3 of your travel buddies have this on their dream list',
              confidence: 0.85,
              weight: 0.2
            },
            {
              reason_type: 'seasonal_optimal',
              reason_text: 'April-May offers perfect weather and fewer crowds',
              confidence: 0.88,
              weight: 0.3
            },
            {
              reason_type: 'price_opportunity',
              reason_text: 'Flight prices 25% below average for next month',
              confidence: 0.78,
              weight: 0.1
            }
          ],
          optimal_timing: {
            best_months: [4, 5, 9, 10],
            best_season: 'spring',
            price_optimal_window: {
              start_month: 4,
              end_month: 5,
              savings_percentage: 25
            },
            weather_optimal_window: {
              start_month: 4,
              end_month: 6,
              weather_score: 95
            },
            crowd_optimal_window: {
              start_month: 4,
              end_month: 5,
              crowd_level: 'medium'
            }
          },
          price_insights: [
            {
              insight_type: 'price_drop_predicted',
              current_price_index: 0.85,
              predicted_price_change: -15,
              confidence: 0.82,
              time_horizon: 21,
              action_recommendation: 'Book within next 3 weeks for best prices'
            }
          ],
          social_proof: {
            friends_visited_count: 2,
            friends_planning_count: 3,
            community_popularity_trend: 'rising',
            recent_social_activity: [
              {
                user_id: 'friend_1',
                username: 'ArtLover_Anna',
                activity_type: 'added_to_dreams',
                activity_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
              }
            ],
            social_recommendation_score: 87
          },
          ai_insights: [
            {
              insight_type: 'perfect_match',
              insight_text: 'Florence combines your love for culture and photography opportunities perfectly',
              confidence: 0.91,
              actionable: true
            },
            {
              insight_type: 'social_connection',
              insight_text: 'Your friend Anna visited last month and highly recommends the Uffizi Gallery',
              confidence: 0.85,
              actionable: true
            }
          ],
          urgency_score: 75,
          expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
        },
        {
          destination_id: 'angkor_wat_cambodia',
          destination_name: 'Angkor Wat',
          country: 'Cambodia',
          continent: 'Asia',
          recommendation_score: 88,
          recommendation_reasons: [
            {
              reason_type: 'rare_find',
              reason_text: 'Unique UNESCO World Heritage site perfect for photography',
              confidence: 0.89,
              weight: 0.35
            },
            {
              reason_type: 'personality_match',
              reason_text: 'Ancient culture and spiritual significance align with your interests',
              confidence: 0.87,
              weight: 0.35
            },
            {
              reason_type: 'trending',
              reason_text: 'Rising popularity among cultural explorers like you',
              confidence: 0.82,
              weight: 0.3
            }
          ],
          optimal_timing: {
            best_months: [11, 12, 1, 2],
            best_season: 'winter',
            price_optimal_window: {
              start_month: 11,
              end_month: 1,
              savings_percentage: 20
            },
            weather_optimal_window: {
              start_month: 11,
              end_month: 3,
              weather_score: 92
            },
            crowd_optimal_window: {
              start_month: 11,
              end_month: 12,
              crowd_level: 'low'
            }
          },
          price_insights: [
            {
              insight_type: 'seasonal_trend',
              current_price_index: 1.1,
              predicted_price_change: -20,
              confidence: 0.85,
              time_horizon: 60,
              action_recommendation: 'Wait for dry season (Nov-Mar) for better prices and weather'
            }
          ],
          social_proof: {
            friends_visited_count: 0,
            friends_planning_count: 1,
            community_popularity_trend: 'rising',
            recent_social_activity: [],
            social_recommendation_score: 45
          },
          ai_insights: [
            {
              insight_type: 'hidden_gem',
              insight_text: 'Less crowded than other cultural sites but equally spectacular',
              confidence: 0.88,
              actionable: true
            }
          ],
          urgency_score: 40
        }
      ],
      user_travel_dna: {
        user_id: userId,
        primary_type: 'cultural_explorer',
        confidence_score: 0.87,
        personality_factors: [],
        social_influence_factors: [],
        behavioral_patterns: [],
        last_analyzed: new Date(),
        analysis_version: '3.1.0'
      },
      total_recommendations: 15,
      personalization_factors: [
        {
          factor: 'culture',
          weight: 0.9,
          confidence: 0.92,
          source: 'individual_behavior',
          trend: 'increasing'
        }
      ],
      social_influence_summary: {
        total_social_signals: 12,
        friend_influence_strength: 0.3,
        community_trend_alignment: 0.75
      },
      processing_metadata: {
        analysis_time_ms: 245,
        data_sources_used: ['user_behavior', 'social_data', 'price_data', 'weather_data'],
        ai_model_version: '3.1.0'
      }
    };
  }

  private getMockJourneyOptimization(userId: string, destinationIds: string[]): JourneyOptimizationResponse {
    return {
      optimized_journey: {
        journey_id: 'journey_' + Date.now(),
        user_id: userId,
        selected_destinations: destinationIds,
        optimized_route: {
          route_segments: [
            {
              from_destination_id: destinationIds[0],
              to_destination_id: destinationIds[1],
              travel_method: 'flight',
              distance_km: 1240,
              duration_hours: 2.5,
              estimated_cost: 180,
              carbon_footprint_kg: 85,
              recommended_stops: []
            }
          ],
          total_distance_km: 1240,
          total_travel_time_hours: 2.5,
          carbon_footprint_kg: 85,
          recommended_travel_methods: [
            {
              method: 'flight',
              cost_score: 60,
              time_score: 20,
              comfort_score: 80,
              environmental_score: 40,
              recommended: true
            }
          ],
          seasonal_considerations: [
            {
              destination_id: destinationIds[0],
              month: 5,
              weather_score: 90,
              price_score: 70,
              crowd_score: 60,
              overall_desirability: 85
            }
          ]
        },
        total_estimated_cost: 2400,
        total_duration_days: 14,
        optimization_score: 87,
        created_at: new Date(),
        optimization_factors: [
          {
            factor_type: 'cost',
            weight: 0.3,
            user_specified: false
          },
          {
            factor_type: 'weather',
            weight: 0.4,
            user_specified: true
          }
        ]
      },
      alternative_routes: [],
      optimization_summary: {
        cost_savings_percentage: 25,
        time_savings_percentage: 15,
        carbon_reduction_percentage: 10,
        weather_optimization_score: 92
      },
      recommendations: {
        best_travel_months: [4, 5, 9, 10],
        recommended_duration: 14,
        budget_breakdown: {
          'flights': 800,
          'accommodation': 980,
          'food': 420,
          'activities': 200
        }
      }
    };
  }

  private getMockPredictiveInsights(userId: string): PredictiveInsightsResponse {
    return {
      insights: [
        {
          insight_id: 'insight_' + Date.now(),
          user_id: userId,
          insight_type: 'price_alert',
          title: 'Price Drop Alert: Japan',
          description: 'Flight prices to Tokyo are expected to drop 30% in the next 2 weeks based on historical patterns and current booking trends.',
          confidence: 87,
          urgency: 'high',
          actionable_steps: [
            {
              step_number: 1,
              action_type: 'wait_for_price_drop',
              action_text: 'Wait 10-14 days before booking flights to Tokyo',
              estimated_impact: 'Save $400-500 on flights'
            },
            {
              step_number: 2,
              action_type: 'add_to_dreams',
              action_text: 'Add Tokyo to your dream destinations if not already there',
              estimated_impact: 'Track price changes automatically'
            }
          ],
          predicted_value: 450,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          related_destinations: ['tokyo', 'osaka', 'kyoto'],
          ai_reasoning: 'Our AI detected a pattern in airline pricing data suggesting seasonal adjustments are coming. Combined with your interest in cultural destinations, this represents a high-value opportunity.'
        },
        {
          insight_id: 'insight_' + (Date.now() + 1),
          user_id: userId,
          insight_type: 'next_dream_prediction',
          title: 'Your Next Dream: Morocco',
          description: 'Based on your travel DNA and recent browsing patterns, Morocco (specifically Marrakech) has a 78% likelihood of becoming your next dream destination.',
          confidence: 78,
          urgency: 'medium',
          actionable_steps: [
            {
              step_number: 1,
              action_type: 'research_more',
              action_text: 'Explore Marrakech cultural sites and photography opportunities',
              estimated_impact: 'Discover perfect match destination'
            }
          ],
          predicted_value: 0,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          related_destinations: ['marrakech', 'fez', 'casablanca'],
          ai_reasoning: 'Your strong preference for cultural experiences, combined with growing interest in North African destinations among similar users, indicates high alignment with Morocco.'
        }
      ],
      user_prediction_accuracy: 82,
      total_insights: 5,
      high_confidence_insights: 2,
      actionable_insights: 4,
      potential_savings: 450,
      next_analysis_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }
}

export const aiIntelligenceService = new AIIntelligenceService();