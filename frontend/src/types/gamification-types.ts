// Gamification system types for achievements, leaderboards, and social features

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'explorer' | 'social' | 'planner' | 'adventurer' | 'cultural' | 'photographer' | 'budget_master';
  icon: string;
  progress: number; // 0-100
  max_progress: number;
  unlocked: boolean;
  unlocked_at?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points_value: number;
  requirements: AchievementRequirement[];
  reward_type: 'points' | 'badge' | 'feature_unlock' | 'discount';
  reward_value?: any;
}

export interface AchievementRequirement {
  type: 'destinations_count' | 'continents_count' | 'social_interactions' | 'streak_days' | 'rare_destinations' | 'category_diversity';
  target_value: number;
  current_value: number;
}

export interface UserGameStats {
  user_id: string;
  level: number;
  total_points: number;
  destinations_collected: number;
  continents_unlocked: number;
  achievements_unlocked: number;
  current_streak: number;
  longest_streak: number;
  rarity_score: number;
  social_score: number;
  exploration_rank: number;
  last_activity: Date;
  
  // Category-specific stats
  category_stats: {
    [category: string]: {
      count: number;
      average_rarity: number;
      completion_percentage: number;
    };
  };
  
  // Continent-specific progress
  continent_progress: {
    [continent: string]: {
      destinations_count: number;
      completion_percentage: number;
      rare_destinations_count: number;
    };
  };
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  rank: number;
  change_from_last_week: number; // +5, -2, etc.
  badges: string[]; // Achievement icons to display
  specialization?: string; // "Cultural Explorer", "Adventure Seeker", etc.
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: 'global' | 'weekly' | 'monthly' | 'friends' | 'category';
  category?: string;
  entries: LeaderboardEntry[];
  user_rank?: number;
  total_participants: number;
  updated_at: Date;
  ends_at?: Date; // For time-limited leaderboards
}

export interface SocialConnection {
  connection_id: string;
  friend_user_id: string;
  friend_username: string;
  friend_avatar_url?: string;
  connection_type: 'friend' | 'following' | 'travel_buddy';
  established_at: Date;
  shared_dreams_count: number;
  travel_compatibility_score: number; // 0-100
  last_interaction: Date;
  
  // Rich social data
  mutual_friends_count: number;
  similar_personality_factors: string[];
  potential_group_trips: number;
  interaction_frequency: 'high' | 'medium' | 'low';
}

export interface SocialActivity {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  activity_type: 'destination_added' | 'achievement_unlocked' | 'level_up' | 'trip_planned' | 'friend_added' | 'challenge_completed';
  activity_data: {
    destination_name?: string;
    achievement_name?: string;
    level?: number;
    friend_name?: string;
    challenge_name?: string;
    [key: string]: any;
  };
  visibility: 'public' | 'friends' | 'private';
  likes_count: number;
  comments_count: number;
  created_at: Date;
  is_liked_by_user?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'group' | 'community';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  
  // Challenge specifics
  target_metric: 'destinations_count' | 'continents_count' | 'categories_diversity' | 'social_shares' | 'rare_finds';
  target_value: number;
  current_progress: number;
  
  // Timing
  duration_days: number;
  starts_at: Date;
  ends_at: Date;
  
  // Rewards
  points_reward: number;
  badge_reward?: string;
  special_unlock?: string;
  
  // Social aspects
  participants_count: number;
  max_participants?: number;
  is_participating: boolean;
  leaderboard?: LeaderboardEntry[];
  
  // Challenge state
  status: 'upcoming' | 'active' | 'completed' | 'expired';
}

export interface DreamCollectionStats {
  total_dreams: number;
  unique_countries: number;
  unique_continents: number;
  rarity_breakdown: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  category_breakdown: {
    [category: string]: number;
  };
  average_rarity_score: number;
  completion_milestones: {
    milestone: string;
    target: number;
    current: number;
    percentage: number;
    unlocked: boolean;
  }[];
}

export interface SocialInsights {
  friends_with_shared_dreams: SocialConnection[];
  trending_destinations_in_network: {
    destination_id: string;
    destination_name: string;
    friend_count: number;
    recent_additions: number;
  }[];
  group_trip_opportunities: {
    suggested_destination: string;
    compatible_friends: string[];
    estimated_savings: number;
    optimal_timing: string;
  }[];
  social_achievements_available: Achievement[];
}

// API Response types
export interface GameificationResponse {
  user_stats: UserGameStats;
  recent_achievements: Achievement[];
  available_challenges: Challenge[];
  social_activity_feed: SocialActivity[];
  leaderboards: Leaderboard[];
  social_insights: SocialInsights;
}

export interface AchievementCheckResponse {
  newly_unlocked: Achievement[];
  progress_updates: {
    achievement_id: string;
    old_progress: number;
    new_progress: number;
  }[];
  points_earned: number;
  level_up?: {
    old_level: number;
    new_level: number;
    rewards_unlocked: string[];
  };
}

// Event types for tracking user actions
export interface GameEvent {
  event_type: 'destination_bookmarked' | 'destination_shared' | 'friend_added' | 'challenge_joined' | 'social_interaction';
  event_data: Record<string, any>;
  timestamp: Date;
  user_context: {
    current_level: number;
    current_points: number;
    active_challenges: string[];
  };
}