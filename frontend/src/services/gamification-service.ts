import { supabase } from '@/integrations/supabase/client';
import { 
  Achievement, 
  UserGameStats, 
  Leaderboard, 
  SocialConnection, 
  SocialActivity,
  Challenge,
  DreamCollectionStats,
  SocialInsights,
  AchievementCheckResponse,
  GameEvent
} from '@/types/gamification-types';
import logger from '@/utils/logger';

class GamificationService {
  private readonly backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'https://api.maku.travel';

  /**
   * Get user's comprehensive game statistics
   */
  async getUserGameStats(userId: string): Promise<UserGameStats | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/stats/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback to mock data for Phase 2
      return this.getMockUserStats(userId);
    } catch (error) {
      logger.error('Error fetching user game stats:', error);
      return this.getMockUserStats(userId);
    }
  }

  /**
   * Check for achievement unlocks after user action
   */
  async checkAchievements(userId: string, actionType: string, actionData: any): Promise<AchievementCheckResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/achievements/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action_type: actionType,
          action_data: actionData,
        }),
      });

      if (response.ok) {
        return await response.json();
      }

      // Fallback to mock achievement checking
      return this.mockAchievementCheck(actionType, actionData);
    } catch (error) {
      logger.error('Error checking achievements:', error);
      return { newly_unlocked: [], progress_updates: [], points_earned: 0 };
    }
  }

  /**
   * Get available achievements for user
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/achievements/${userId}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockAchievements();
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      return this.getMockAchievements();
    }
  }

  /**
   * Get leaderboards
   */
  async getLeaderboards(type: string[] = ['global', 'weekly', 'friends']): Promise<Leaderboard[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/leaderboards?types=${type.join(',')}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockLeaderboards();
    } catch (error) {
      logger.error('Error fetching leaderboards:', error);
      return this.getMockLeaderboards();
    }
  }

  /**
   * Get social connections
   */
  async getSocialConnections(userId: string): Promise<SocialConnection[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/social/connections/${userId}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockSocialConnections();
    } catch (error) {
      logger.error('Error fetching social connections:', error);
      return this.getMockSocialConnections();
    }
  }

  /**
   * Get social activity feed
   */
  async getSocialActivityFeed(userId: string, limit: number = 20): Promise<SocialActivity[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/social/activity/${userId}?limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockSocialActivity();
    } catch (error) {
      logger.error('Error fetching social activity:', error);
      return this.getMockSocialActivity();
    }
  }

  /**
   * Get available challenges
   */
  async getChallenges(userId: string): Promise<Challenge[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/challenges/${userId}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockChallenges();
    } catch (error) {
      logger.error('Error fetching challenges:', error);
      return this.getMockChallenges();
    }
  }

  /**
   * Join a challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        return await response.json();
      }

      return { success: false, message: 'Failed to join challenge' };
    } catch (error) {
      logger.error('Error joining challenge:', error);
      return { success: false, message: 'Network error' };
    }
  }

  /**
   * Track game event
   */
  async trackGameEvent(userId: string, event: GameEvent): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/gamification/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...event,
        }),
      });
    } catch (error) {
      logger.error('Error tracking game event:', error);
    }
  }

  /**
   * Get dream collection statistics
   */
  async getDreamCollectionStats(userId: string): Promise<DreamCollectionStats> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gamification/collection-stats/${userId}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockCollectionStats();
    } catch (error) {
      logger.error('Error fetching collection stats:', error);
      return this.getMockCollectionStats();
    }
  }

  /**
   * Get social insights for user
   */
  async getSocialInsights(userId: string): Promise<SocialInsights> {
    try {
      const response = await fetch(`${this.backendUrl}/api/social/insights/${userId}`);
      if (response.ok) {
        return await response.json();
      }

      return this.getMockSocialInsights();
    } catch (error) {
      logger.error('Error fetching social insights:', error);
      return this.getMockSocialInsights();
    }
  }

  // Mock data methods for Phase 2 development
  private getMockUserStats(userId: string): UserGameStats {
    return {
      user_id: userId,
      level: 4,
      total_points: 2847,
      destinations_collected: 23,
      continents_unlocked: 5,
      achievements_unlocked: 12,
      current_streak: 7,
      longest_streak: 15,
      rarity_score: 342,
      social_score: 156,
      exploration_rank: 847,
      last_activity: new Date(),
      category_stats: {
        'beaches': { count: 8, average_rarity: 65, completion_percentage: 32 },
        'cultural': { count: 7, average_rarity: 45, completion_percentage: 28 },
        'adventure': { count: 5, average_rarity: 78, completion_percentage: 20 },
        'mountains': { count: 3, average_rarity: 82, completion_percentage: 12 },
      },
      continent_progress: {
        'Europe': { destinations_count: 9, completion_percentage: 18, rare_destinations_count: 2 },
        'Asia': { destinations_count: 7, completion_percentage: 14, rare_destinations_count: 3 },
        'North America': { destinations_count: 4, completion_percentage: 8, rare_destinations_count: 1 },
        'South America': { destinations_count: 2, completion_percentage: 4, rare_destinations_count: 1 },
        'Africa': { destinations_count: 1, completion_percentage: 2, rare_destinations_count: 1 },
      },
    };
  }

  private getMockAchievements(): Achievement[] {
    return [
      {
        id: '1',
        name: 'First Steps',
        description: 'Add your first dream destination',
        category: 'explorer',
        icon: '🎯',
        progress: 100,
        max_progress: 1,
        unlocked: true,
        unlocked_at: new Date('2024-01-15'),
        rarity: 'common',
        points_value: 50,
        requirements: [{ type: 'destinations_count', target_value: 1, current_value: 23 }],
        reward_type: 'points',
      },
      {
        id: '2',
        name: 'Continental Explorer',
        description: 'Collect destinations from 5 different continents',
        category: 'explorer',
        icon: '🌍',
        progress: 100,
        max_progress: 5,
        unlocked: true,
        unlocked_at: new Date('2024-02-20'),
        rarity: 'rare',
        points_value: 200,
        requirements: [{ type: 'continents_count', target_value: 5, current_value: 5 }],
        reward_type: 'badge',
      },
      {
        id: '3',
        name: 'Hidden Gems Hunter',
        description: 'Discover 3 legendary rarity destinations',
        category: 'adventurer',
        icon: '💎',
        progress: 67,
        max_progress: 3,
        unlocked: false,
        rarity: 'epic',
        points_value: 500,
        requirements: [{ type: 'rare_destinations', target_value: 3, current_value: 2 }],
        reward_type: 'feature_unlock',
        reward_value: 'advanced_search',
      },
      {
        id: '4',
        name: 'Social Butterfly',
        description: 'Connect with 10 travel buddies',
        category: 'social',
        icon: '👥',
        progress: 30,
        max_progress: 10,
        unlocked: false,
        rarity: 'common',
        points_value: 150,
        requirements: [{ type: 'social_interactions', target_value: 10, current_value: 3 }],
        reward_type: 'points',
      },
      {
        id: '5',
        name: 'Streak Master',
        description: 'Maintain a 30-day discovery streak',
        category: 'planner',
        icon: '🔥',
        progress: 23,
        max_progress: 30,
        unlocked: false,
        rarity: 'epic',
        points_value: 750,
        requirements: [{ type: 'streak_days', target_value: 30, current_value: 7 }],
        reward_type: 'discount',
        reward_value: 15, // 15% discount
      },
    ];
  }

  private mockAchievementCheck(actionType: string, actionData: any): AchievementCheckResponse {
    const newly_unlocked: Achievement[] = [];
    const progress_updates = [];
    let points_earned = 0;

    // Simulate achievement checking logic
    if (actionType === 'destination_bookmarked') {
      // Check if this unlocks any achievements
      const destinationCount = actionData.total_destinations || 1;
      
      if (destinationCount === 10) {
        newly_unlocked.push({
          id: 'explorer_10',
          name: 'Dream Collector',
          description: 'Collect 10 dream destinations',
          category: 'explorer',
          icon: '🏆',
          progress: 100,
          max_progress: 10,
          unlocked: true,
          unlocked_at: new Date(),
          rarity: 'common',
          points_value: 100,
          requirements: [{ type: 'destinations_count', target_value: 10, current_value: 10 }],
          reward_type: 'points',
        });
        points_earned += 100;
      }
    }

    return {
      newly_unlocked,
      progress_updates,
      points_earned,
    };
  }

  private getMockLeaderboards(): Leaderboard[] {
    return [
      {
        id: 'global_explorer',
        name: 'Global Explorers',
        description: 'Top dream collectors worldwide',
        type: 'global',
        entries: [
          {
            user_id: '1',
            username: 'WanderlustMike',
            avatar_url: '/api/placeholder/40/40?text=WM',
            score: 5420,
            rank: 1,
            change_from_last_week: 2,
            badges: ['🌍', '💎', '🏆'],
            specialization: 'Adventure Seeker',
          },
          {
            user_id: '2',
            username: 'CulturalExplorer',
            avatar_url: '/api/placeholder/40/40?text=CE',
            score: 4890,
            rank: 2,
            change_from_last_week: -1,
            badges: ['🏛️', '🎭', '📚'],
            specialization: 'Cultural Explorer',
          },
          {
            user_id: '3',
            username: 'BeachHopper',
            avatar_url: '/api/placeholder/40/40?text=BH',
            score: 4350,
            rank: 3,
            change_from_last_week: 3,
            badges: ['🏖️', '🌊', '☀️'],
            specialization: 'Beach Lover',
          },
        ],
        user_rank: 847,
        total_participants: 12453,
        updated_at: new Date(),
      },
    ];
  }

  private getMockSocialConnections(): SocialConnection[] {
    return [
      {
        connection_id: '1',
        friend_user_id: 'friend_1',
        friend_username: 'AdventureAnna',
        friend_avatar_url: '/api/placeholder/40/40?text=AA',
        connection_type: 'friend',
        established_at: new Date('2024-01-20'),
        shared_dreams_count: 15,
        travel_compatibility_score: 87,
        last_interaction: new Date('2024-03-01'),
        mutual_friends_count: 3,
        similar_personality_factors: ['adventure', 'photography'],
        potential_group_trips: 2,
        interaction_frequency: 'high',
      },
      {
        connection_id: '2',
        friend_user_id: 'friend_2',
        friend_username: 'CultureSeeker',
        friend_avatar_url: '/api/placeholder/40/40?text=CS',
        connection_type: 'travel_buddy',
        established_at: new Date('2024-02-15'),
        shared_dreams_count: 8,
        travel_compatibility_score: 92,
        last_interaction: new Date('2024-02-28'),
        mutual_friends_count: 1,
        similar_personality_factors: ['culture', 'food'],
        potential_group_trips: 1,
        interaction_frequency: 'medium',
      },
    ];
  }

  private getMockSocialActivity(): SocialActivity[] {
    return [
      {
        id: '1',
        user_id: 'friend_1',
        username: 'AdventureAnna',
        avatar_url: '/api/placeholder/40/40?text=AA',
        activity_type: 'destination_added',
        activity_data: { destination_name: 'Mount Kilimanjaro' },
        visibility: 'public',
        likes_count: 12,
        comments_count: 3,
        created_at: new Date('2024-03-01T10:30:00Z'),
        is_liked_by_user: false,
      },
      {
        id: '2',
        user_id: 'friend_2',
        username: 'CultureSeeker',
        avatar_url: '/api/placeholder/40/40?text=CS',
        activity_type: 'achievement_unlocked',
        activity_data: { achievement_name: 'Cultural Master' },
        visibility: 'friends',
        likes_count: 8,
        comments_count: 1,
        created_at: new Date('2024-02-28T15:45:00Z'),
        is_liked_by_user: true,
      },
    ];
  }

  private getMockChallenges(): Challenge[] {
    return [
      {
        id: 'march_explorer',
        title: 'March Explorer Challenge',
        description: 'Discover 5 new dream destinations this month',
        type: 'individual',
        category: 'exploration',
        difficulty: 'medium',
        target_metric: 'destinations_count',
        target_value: 5,
        current_progress: 2,
        duration_days: 31,
        starts_at: new Date('2024-03-01'),
        ends_at: new Date('2024-03-31'),
        points_reward: 250,
        badge_reward: '🌟',
        participants_count: 1247,
        is_participating: true,
        status: 'active',
      },
    ];
  }

  private getMockCollectionStats(): DreamCollectionStats {
    return {
      total_dreams: 23,
      unique_countries: 18,
      unique_continents: 5,
      rarity_breakdown: {
        common: 12,
        rare: 7,
        epic: 3,
        legendary: 1,
      },
      category_breakdown: {
        beaches: 8,
        cultural: 7,
        adventure: 5,
        mountains: 3,
      },
      average_rarity_score: 58.7,
      completion_milestones: [
        { milestone: 'First 10 Dreams', target: 10, current: 23, percentage: 100, unlocked: true },
        { milestone: 'Quarter Century', target: 25, current: 23, percentage: 92, unlocked: false },
        { milestone: 'Half Century', target: 50, current: 23, percentage: 46, unlocked: false },
        { milestone: 'Dream Master', target: 100, current: 23, percentage: 23, unlocked: false },
      ],
    };
  }

  private getMockSocialInsights(): SocialInsights {
    return {
      friends_with_shared_dreams: [],
      trending_destinations_in_network: [
        {
          destination_id: '1',
          destination_name: 'Iceland',
          friend_count: 3,
          recent_additions: 2,
        },
      ],
      group_trip_opportunities: [
        {
          suggested_destination: 'Japan',
          compatible_friends: ['AdventureAnna', 'CultureSeeker'],
          estimated_savings: 450,
          optimal_timing: 'April 2024',
        },
      ],
      social_achievements_available: [],
    };
  }
}

export const gamificationService = new GamificationService();