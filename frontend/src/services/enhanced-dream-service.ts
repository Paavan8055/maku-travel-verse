import { supabase } from '@/integrations/supabase/client';
import { 
  EnhancedDestination, 
  UserDreamProfile, 
  BehaviorSignal, 
  InteractionData,
  EnhancedDestinationResponse,
  UserInsights
} from '@/types/enhanced-dream-types';
import logger from '@/utils/logger';

class EnhancedDreamService {
  private readonly BEHAVIOR_BATCH_SIZE = 10;
  private behaviorQueue: BehaviorSignal[] = [];

  /**
   * Enhanced destination fetching with AI-ready data
   */
  async getEnhancedDestinations(options?: {
    user_id?: string;
    limit?: number;
    category?: string;
    continent?: string;
    include_ai_context?: boolean;
  }): Promise<EnhancedDestinationResponse> {
    try {
      const startTime = Date.now();
      
      // Base query for destinations (only select existing columns)
      let query = supabase
        .from('dream_destinations')
        .select(`
          id, name, country, continent, category,
          description, best_time_to_visit, budget_range, avg_daily_cost,
          highlights
        `);

      // Apply filters
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.continent) {
        query = query.eq('continent', options.continent);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: destinations, error } = await query;
      
      if (error) throw error;

      // Enhance destinations with AI-ready data (add missing fields with defaults)
      const enhancedDestinations = await this.enhanceDestinationsWithAIData(destinations || []);
      
      // Get user context if requested
      let userContext;
      if (options?.include_ai_context && options?.user_id) {
        userContext = await this.getUserContext(options.user_id, enhancedDestinations);
      }

      const processingTime = Date.now() - startTime;

      return {
        destinations: enhancedDestinations,
        user_context: userContext,
        metadata: {
          total_count: enhancedDestinations.length,
          ai_processing_time: processingTime,
          personalization_enabled: !!userContext,
        },
      };
    } catch (error) {
      logger.error('Error fetching enhanced destinations:', error);
      throw new Error('Failed to fetch enhanced destinations');
    }
  }

  /**
   * Track user behavior for AI learning
   */
  async trackBehavior(userId: string, signal: Omit<BehaviorSignal, 'timestamp'>): Promise<void> {
    const behaviorSignal: BehaviorSignal = {
      ...signal,
      timestamp: new Date(),
    };

    // Add to queue for batch processing
    this.behaviorQueue.push(behaviorSignal);

    // Process batch if queue is full
    if (this.behaviorQueue.length >= this.BEHAVIOR_BATCH_SIZE) {
      await this.processBehaviorBatch(userId);
    }

    // Also store immediately for critical signals
    if (['bookmark', 'share', 'rate'].includes(signal.signal_type)) {
      await this.storeBehaviorSignal(userId, behaviorSignal);
    }
  }

  /**
   * Track detailed interactions for AI learning
   */
  async trackInteraction(userId: string, interaction: Omit<InteractionData, 'timestamp'>): Promise<void> {
    const fullInteraction: InteractionData = {
      ...interaction,
      timestamp: new Date(),
    };

    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: userId,
          destination_id: fullInteraction.destination_id,
          interaction_type: fullInteraction.interaction_type,
          duration_seconds: fullInteraction.duration_seconds,
          device_type: fullInteraction.device_type,
          referrer: fullInteraction.referrer,
          created_at: fullInteraction.timestamp.toISOString(),
        });
    } catch (error) {
      logger.error('Error tracking interaction:', error);
    }
  }

  /**
   * Get user's enhanced profile with AI insights
   */
  async getUserProfile(userId: string): Promise<UserDreamProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_dream_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!profile) {
        // Create new profile
        return await this.createUserProfile(userId);
      }

      return profile as UserDreamProfile;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Update user's dream collection with enhanced tracking
   */
  async updateDreamCollection(
    userId: string, 
    destinationId: string, 
    action: 'add' | 'remove'
  ): Promise<{ success: boolean; achievementsUnlocked?: Achievement[] }> {
    try {
      // Update the bookmark
      if (action === 'add') {
        await supabase
          .from('user_bookmarks')
          .insert({
            user_id: userId,
            destination_id: destinationId,
            notes: '',
            priority: 1,
          });
      } else {
        await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('destination_id', destinationId);
      }

      // Track the behavior
      await this.trackBehavior(userId, {
        signal_type: action === 'add' ? 'bookmark' : 'view',
        value: action === 'add' ? 1 : -1,
        context: { destinationId, action },
      });

      // Check for achievement unlocks
      const achievementsUnlocked = await this.checkAchievements(userId);

      // Update user metrics
      await this.updateGameMetrics(userId);

      return { success: true, achievementsUnlocked };
    } catch (error) {
      logger.error('Error updating dream collection:', error);
      return { success: false };
    }
  }

  /**
   * Get personalized insights for user
   */
  async getUserInsights(userId: string): Promise<UserInsights | null> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return null;

      // This will be enhanced with actual AI logic in Phase 3
      const mockInsights: UserInsights = {
        travel_dna: profile.travel_personality || {
          primary_type: 'cultural_explorer',
          confidence_score: 0.75,
          personality_factors: [
            { factor: 'culture', weight: 0.8, confidence: 0.9 },
            { factor: 'photography', weight: 0.6, confidence: 0.7 },
          ],
          last_analyzed: new Date(),
        },
        next_recommended_destinations: [],
        optimal_travel_windows: [],
        social_insights: {
          friends_overlap: [],
          trending_in_network: [],
        },
      };

      return mockInsights;
    } catch (error) {
      logger.error('Error getting user insights:', error);
      return null;
    }
  }

  // Private helper methods

  private async enhanceDestinationsWithAIData(destinations: any[]): Promise<EnhancedDestination[]> {
    return destinations.map(dest => ({
      ...dest,
      // Add AI-ready fields with default values
      personality_match_factors: [
        { factor: 'culture', weight: 0.7, confidence: 0.8 },
        { factor: 'adventure', weight: 0.5, confidence: 0.6 },
      ],
      optimal_seasons: [
        {
          season: 'spring',
          suitability_score: 85,
          weather_description: 'Perfect weather',
          crowd_level: 'medium',
          price_level: 'medium',
        },
      ],
      crowd_patterns: [
        {
          month: 6,
          crowd_level: 70,
          local_events: [],
          tourist_density: 'high',
        },
      ],
      price_volatility: [
        {
          month: 6,
          price_index: 1.2,
          volatility: 0.15,
          booking_window_optimal: 45,
        },
      ],
      rarity_score: dest.rarity_score || Math.floor(Math.random() * 100),
      social_popularity: dest.social_popularity || 0,
      user_generated_tags: dest.user_generated_tags || [],
      community_rating: {
        overall_score: 4.2,
        total_ratings: 156,
        aspects: {
          photography: 4.5,
          accessibility: 3.8,
          value_for_money: 4.0,
          uniqueness: 4.7,
          local_culture: 4.3,
        },
      },
      conversion_rate: 0.15,
      engagement_score: 0.65,
      seasonal_interest: Array.from({ length: 12 }, () => Math.random()),
    }));
  }

  private async getUserContext(userId: string, destinations: EnhancedDestination[]) {
    // Placeholder for AI-powered user context
    return {
      personality_match_scores: destinations.reduce((acc, dest) => {
        acc[dest.id] = Math.random() * 100;
        return acc;
      }, {} as Record<string, number>),
      recommended_destinations: destinations.slice(0, 5).map(d => d.id),
      social_proof: {},
    };
  }

  private async processBehaviorBatch(userId: string): Promise<void> {
    if (this.behaviorQueue.length === 0) return;

    try {
      const batch = [...this.behaviorQueue];
      this.behaviorQueue = [];

      await supabase
        .from('user_behavior_signals')
        .insert(
          batch.map(signal => ({
            user_id: userId,
            signal_type: signal.signal_type,
            value: signal.value,
            context: signal.context,
            created_at: signal.timestamp.toISOString(),
          }))
        );
    } catch (error) {
      logger.error('Error processing behavior batch:', error);
    }
  }

  private async storeBehaviorSignal(userId: string, signal: BehaviorSignal): Promise<void> {
    try {
      await supabase
        .from('user_behavior_signals')
        .insert({
          user_id: userId,
          signal_type: signal.signal_type,
          value: signal.value,
          context: signal.context,
          created_at: signal.timestamp.toISOString(),
        });
    } catch (error) {
      logger.error('Error storing behavior signal:', error);
    }
  }

  private async createUserProfile(userId: string): Promise<UserDreamProfile> {
    const newProfile: UserDreamProfile = {
      user_id: userId,
      interaction_patterns: [],
      preference_weights: [],
      behavioral_signals: [],
      achievement_progress: [],
      social_connections: [],
      gamification_metrics: {
        total_points: 0,
        level: 1,
        destinations_collected: 0,
        continents_unlocked: 0,
        achievements_unlocked: 0,
        streak_days: 0,
        last_activity: new Date(),
        rarity_score: 0,
      },
      created_at: new Date(),
      last_updated: new Date(),
      data_quality_score: 0.1, // Low initially, improves with usage
    };

    await supabase
      .from('user_dream_profiles')
      .insert(newProfile);

    return newProfile;
  }

  private async checkAchievements(userId: string): Promise<Achievement[]> {
    // Placeholder for achievement checking logic
    // Will be implemented in Phase 2
    return [];
  }

  private async updateGameMetrics(userId: string): Promise<void> {
    // Placeholder for game metrics updating
    // Will be implemented in Phase 2
  }
}

export const enhancedDreamService = new EnhancedDreamService();