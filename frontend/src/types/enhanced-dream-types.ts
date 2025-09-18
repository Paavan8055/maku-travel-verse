// Enhanced types for AI-powered and social dream destinations system
export interface PersonalityFactor {
  factor: 'adventure' | 'culture' | 'relaxation' | 'photography' | 'food' | 'nature' | 'luxury' | 'budget';
  weight: number; // 0-1 scale
  confidence: number; // How confident we are in this factor
}

export interface SeasonData {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  suitability_score: number; // 0-100
  weather_description: string;
  crowd_level: 'low' | 'medium' | 'high';
  price_level: 'low' | 'medium' | 'high';
}

export interface CrowdData {
  month: number; // 1-12
  crowd_level: number; // 0-100
  local_events: string[];
  tourist_density: 'low' | 'medium' | 'high' | 'extreme';
}

export interface PricePattern {
  month: number;
  price_index: number; // Relative to annual average (1.0 = average)
  volatility: number; // How much prices fluctuate
  booking_window_optimal: number; // Days in advance for best prices
}

export interface CommunityRating {
  overall_score: number; // 0-5
  total_ratings: number;
  aspects: {
    photography: number;
    accessibility: number;
    value_for_money: number;
    uniqueness: number;
    local_culture: number;
  };
}

export interface EnhancedDestination {
  // Existing fields
  id: string;
  name: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  best_time_to_visit: string;
  budget_range: string;
  avg_daily_cost: number;
  highlights: string[];

  // New AI-ready fields
  personality_match_factors: PersonalityFactor[];
  optimal_seasons: SeasonData[];
  crowd_patterns: CrowdData[];
  price_volatility: PricePattern[];
  
  // New social-ready fields
  rarity_score: number; // 0-100, for gamification
  social_popularity: number; // How often shared/liked
  user_generated_tags: string[];
  community_rating: CommunityRating;
  
  // AI learning fields
  conversion_rate: number; // How often viewed leads to booking
  engagement_score: number; // Time spent viewing, interactions
  seasonal_interest: number[]; // Interest by month (12-element array)
}

// User behavior tracking for AI learning
export interface BehaviorSignal {
  signal_type: 'view' | 'bookmark' | 'share' | 'search' | 'filter' | 'time_spent';
  value: number;
  context: Record<string, any>;
  timestamp: Date;
}

export interface InteractionData {
  destination_id: string;
  interaction_type: 'view' | 'bookmark' | 'unbookmark' | 'share' | 'rate';
  duration_seconds?: number;
  device_type: 'mobile' | 'desktop' | 'tablet';
  referrer: string;
  timestamp: Date;
}

export interface CategoryWeight {
  category: string;
  weight: number; // 0-1, learned from user behavior
  confidence: number; // How sure we are about this weight
  last_updated: Date;
}

// Enhanced user profile for AI and social features
export interface UserDreamProfile {
  user_id: string;
  
  // AI learning data
  interaction_patterns: InteractionData[];
  preference_weights: CategoryWeight[];
  behavioral_signals: BehaviorSignal[];
  travel_personality?: TravelPersonality;
  
  // Social gaming data
  achievement_progress: Achievement[];
  social_connections: Connection[];
  gamification_metrics: GameMetrics;
  
  // Profile metadata
  created_at: Date;
  last_updated: Date;
  data_quality_score: number; // How good our AI model is for this user
}

export interface TravelPersonality {
  primary_type: 'adventurer' | 'cultural_explorer' | 'luxury_seeker' | 'budget_traveler' | 'photographer' | 'foodie' | 'relaxation_seeker';
  secondary_type?: string;
  confidence_score: number; // 0-1
  personality_factors: PersonalityFactor[];
  last_analyzed: Date;
}

// Gamification types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'explorer' | 'social' | 'planner' | 'adventurer' | 'cultural';
  progress: number; // 0-100
  unlocked: boolean;
  unlocked_at?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points_value: number;
}

export interface Connection {
  friend_user_id: string;
  connection_type: 'friend' | 'following' | 'travel_buddy';
  shared_dreams_count: number;
  established_at: Date;
  interaction_score: number; // How much they interact
}

export interface GameMetrics {
  total_points: number;
  level: number;
  destinations_collected: number;
  continents_unlocked: number;
  achievements_unlocked: number;
  streak_days: number;
  last_activity: Date;
  rarity_score: number; // Based on rare destinations collected
}

// API response types
export interface EnhancedDestinationResponse {
  destinations: EnhancedDestination[];
  user_context?: {
    personality_match_scores: Record<string, number>;
    recommended_destinations: string[];
    social_proof: Record<string, number>; // How many friends have this destination
  };
  metadata: {
    total_count: number;
    ai_processing_time: number;
    personalization_enabled: boolean;
  };
}

export interface UserInsights {
  travel_dna: TravelPersonality;
  next_recommended_destinations: EnhancedDestination[];
  optimal_travel_windows: {
    destination_id: string;
    optimal_months: number[];
    price_savings_potential: number;
  }[];
  social_insights: {
    friends_overlap: {
      friend_id: string;
      shared_destinations: number;
      travel_compatibility_score: number;
    }[];
    trending_in_network: EnhancedDestination[];
  };
}