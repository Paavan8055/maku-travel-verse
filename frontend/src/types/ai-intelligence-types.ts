// AI Intelligence types for travel DNA analysis and predictive features

export interface TravelDNA {
  user_id: string;
  primary_type: 'adventurer' | 'cultural_explorer' | 'luxury_seeker' | 'budget_traveler' | 'photographer' | 'foodie' | 'relaxation_seeker' | 'social_explorer';
  secondary_type?: string;
  confidence_score: number; // 0-1
  personality_factors: PersonalityFactor[];
  social_influence_factors: SocialInfluenceFactor[];
  behavioral_patterns: BehaviorPattern[];
  last_analyzed: Date;
  analysis_version: string; // Track AI model version
}

export interface PersonalityFactor {
  factor: 'adventure' | 'culture' | 'relaxation' | 'photography' | 'food' | 'nature' | 'luxury' | 'budget' | 'social' | 'spiritual';
  weight: number; // 0-1
  confidence: number; // How confident we are in this factor
  source: 'individual_behavior' | 'social_influence' | 'explicit_preference' | 'ai_inference';
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface SocialInfluenceFactor {
  factor_type: 'friend_influence' | 'community_trend' | 'social_proof' | 'peer_recommendation';
  influence_strength: number; // 0-1
  source_users: string[]; // IDs of influencing users
  destinations_influenced: string[]; // Destination IDs affected by this influence
  confidence: number;
}

export interface BehaviorPattern {
  pattern_type: 'browsing_behavior' | 'booking_pattern' | 'social_interaction' | 'seasonal_preference' | 'budget_behavior';
  pattern_data: Record<string, any>;
  strength: number; // 0-1
  last_updated: Date;
}

// AI-powered destination recommendations
export interface IntelligentRecommendation {
  destination_id: string;
  destination_name: string;
  country: string;
  continent: string;
  recommendation_score: number; // 0-100
  recommendation_reasons: RecommendationReason[];
  optimal_timing: OptimalTiming;
  price_insights: PriceInsight[];
  social_proof: SocialProof;
  ai_insights: AIInsight[];
  urgency_score: number; // 0-100 (how urgent is this recommendation)
  expires_at?: Date; // If time-sensitive
}

export interface RecommendationReason {
  reason_type: 'personality_match' | 'social_influence' | 'seasonal_optimal' | 'price_opportunity' | 'trending' | 'rare_find';
  reason_text: string;
  confidence: number;
  weight: number; // How much this reason contributes to the score
}

export interface OptimalTiming {
  best_months: number[]; // 1-12
  best_season: 'spring' | 'summer' | 'fall' | 'winter';
  price_optimal_window: {
    start_month: number;
    end_month: number;
    savings_percentage: number;
  };
  weather_optimal_window: {
    start_month: number;
    end_month: number;
    weather_score: number; // 0-100
  };
  crowd_optimal_window: {
    start_month: number;
    end_month: number;
    crowd_level: 'low' | 'medium' | 'high';
  };
}

export interface PriceInsight {
  insight_type: 'price_drop_predicted' | 'price_rise_expected' | 'best_booking_window' | 'seasonal_trend';
  current_price_index: number; // Relative to annual average
  predicted_price_change: number; // Percentage
  confidence: number;
  time_horizon: number; // Days in the future
  action_recommendation: string;
}

export interface SocialProof {
  friends_visited_count: number;
  friends_planning_count: number;
  community_popularity_trend: 'rising' | 'stable' | 'declining';
  recent_social_activity: {
    user_id: string;
    username: string;
    activity_type: string;
    activity_date: Date;
  }[];
  social_recommendation_score: number; // 0-100
}

export interface AIInsight {
  insight_type: 'hidden_gem' | 'trending_early' | 'perfect_match' | 'social_connection' | 'seasonal_opportunity' | 'price_alert';
  insight_text: string;
  confidence: number;
  actionable: boolean;
  expires_at?: Date;
}

// Journey optimization types
export interface IntelligentJourney {
  journey_id: string;
  user_id: string;
  selected_destinations: string[];
  optimized_route: OptimizedRoute;
  total_estimated_cost: number;
  total_duration_days: number;
  optimization_score: number; // 0-100
  created_at: Date;
  optimization_factors: OptimizationFactor[];
}

export interface OptimizedRoute {
  route_segments: RouteSegment[];
  total_distance_km: number;
  total_travel_time_hours: number;
  carbon_footprint_kg: number;
  recommended_travel_methods: TravelMethod[];
  seasonal_considerations: SeasonalConsideration[];
}

export interface RouteSegment {
  from_destination_id: string;
  to_destination_id: string;
  travel_method: 'flight' | 'train' | 'bus' | 'car' | 'ferry';
  distance_km: number;
  duration_hours: number;
  estimated_cost: number;
  carbon_footprint_kg: number;
  recommended_stops: string[]; // Optional stops along the way
}

export interface TravelMethod {
  method: 'flight' | 'train' | 'bus' | 'car' | 'ferry';
  cost_score: number; // 0-100 (lower is cheaper)
  time_score: number; // 0-100 (lower is faster)
  comfort_score: number; // 0-100 (higher is more comfortable)
  environmental_score: number; // 0-100 (higher is better for environment)
  recommended: boolean;
}

export interface SeasonalConsideration {
  destination_id: string;
  month: number;
  weather_score: number; // 0-100
  price_score: number; // 0-100 (higher is more expensive)
  crowd_score: number; // 0-100 (higher is more crowded)
  overall_desirability: number; // 0-100
}

export interface OptimizationFactor {
  factor_type: 'cost' | 'time' | 'weather' | 'crowds' | 'carbon_footprint' | 'social_preferences';
  weight: number; // 0-1
  user_specified: boolean; // Did user specify this preference
}

// Predictive intelligence types
export interface PredictiveInsight {
  insight_id: string;
  user_id: string;
  insight_type: 'next_dream_prediction' | 'price_alert' | 'optimal_booking_window' | 'trend_prediction' | 'social_recommendation';
  title: string;
  description: string;
  confidence: number; // 0-100
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionable_steps: ActionableStep[];
  predicted_value: number; // Dollar savings, probability percentage, etc.
  expires_at: Date;
  related_destinations: string[];
  ai_reasoning: string; // Explanation of how AI reached this conclusion
}

export interface ActionableStep {
  step_number: number;
  action_type: 'book_now' | 'wait_for_price_drop' | 'add_to_dreams' | 'share_with_friends' | 'research_more';
  action_text: string;
  estimated_impact: string; // "Save $200", "Avoid crowds", etc.
  deadline?: Date;
}

// AI model types
export interface AIModelConfig {
  model_name: string;
  model_version: string;
  training_data_cutoff: Date;
  supported_features: string[];
  confidence_threshold: number;
  update_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
}

export interface AIAnalysisRequest {
  user_id: string;
  analysis_type: 'travel_dna' | 'recommendations' | 'journey_optimization' | 'predictive_insights';
  input_data: Record<string, any>;
  options?: {
    include_social_data?: boolean;
    confidence_threshold?: number;
    max_results?: number;
    time_horizon_days?: number;
  };
}

export interface AIAnalysisResponse {
  request_id: string;
  analysis_type: string;
  processing_time_ms: number;
  confidence_score: number;
  results: any; // Specific to analysis type
  ai_model_used: AIModelConfig;
  data_sources: string[];
  recommendations_count: number;
  expires_at: Date;
}

// Learning and feedback types
export interface UserFeedback {
  feedback_id: string;
  user_id: string;
  feedback_type: 'recommendation_rating' | 'prediction_accuracy' | 'journey_satisfaction' | 'ai_explanation_helpful';
  target_id: string; // ID of the recommendation, prediction, etc.
  rating: number; // 1-5 or 0-100 depending on feedback_type
  feedback_text?: string;
  created_at: Date;
}

export interface AILearningData {
  user_behavior_signals: BehaviorSignal[];
  social_interaction_data: SocialInteractionData[];
  booking_outcomes: BookingOutcome[];
  feedback_data: UserFeedback[];
  external_data_signals: ExternalDataSignal[];
}

export interface SocialInteractionData {
  interaction_id: string;
  user_id: string;
  interaction_type: 'friend_recommendation' | 'social_share' | 'group_planning' | 'community_discussion';
  target_destination_id?: string;
  interaction_data: Record<string, any>;
  timestamp: Date;
}

export interface BookingOutcome {
  outcome_id: string;
  user_id: string;
  destination_id: string;
  recommendation_id?: string; // If this booking came from an AI recommendation
  booking_success: boolean;
  booking_date: Date;
  travel_date?: Date;
  satisfaction_score?: number; // Post-travel feedback
}

export interface ExternalDataSignal {
  signal_id: string;
  signal_type: 'weather_data' | 'price_data' | 'event_data' | 'trend_data' | 'news_data';
  destination_id?: string;
  signal_data: Record<string, any>;
  reliability_score: number; // 0-1
  timestamp: Date;
}

// API response types
export interface TravelDNAResponse {
  travel_dna: TravelDNA;
  confidence_breakdown: {
    individual_data_confidence: number;
    social_data_confidence: number;
    behavioral_pattern_confidence: number;
    overall_confidence: number;
  };
  recommendations_count: number;
  last_updated: Date;
  next_analysis_recommended: Date;
}

export interface IntelligentRecommendationsResponse {
  recommendations: IntelligentRecommendation[];
  user_travel_dna: TravelDNA;
  total_recommendations: number;
  personalization_factors: PersonalityFactor[];
  social_influence_summary: {
    total_social_signals: number;
    friend_influence_strength: number;
    community_trend_alignment: number;
  };
  processing_metadata: {
    analysis_time_ms: number;
    data_sources_used: string[];
    ai_model_version: string;
  };
}

export interface JourneyOptimizationResponse {
  optimized_journey: IntelligentJourney;
  alternative_routes: IntelligentJourney[];
  optimization_summary: {
    cost_savings_percentage: number;
    time_savings_percentage: number;
    carbon_reduction_percentage: number;
    weather_optimization_score: number;
  };
  recommendations: {
    best_travel_months: number[];
    recommended_duration: number;
    budget_breakdown: Record<string, number>;
  };
}

export interface PredictiveInsightsResponse {
  insights: PredictiveInsight[];
  user_prediction_accuracy: number; // Historical accuracy for this user
  total_insights: number;
  high_confidence_insights: number;
  actionable_insights: number;
  potential_savings: number; // Total potential dollar savings
  next_analysis_date: Date;
}