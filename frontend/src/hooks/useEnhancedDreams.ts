import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { enhancedDreamService } from '@/services/enhanced-dream-service';
import { 
  EnhancedDestination, 
  UserDreamProfile, 
  UserInsights,
  Achievement
} from '@/types/enhanced-dream-types';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface UseEnhancedDreamsOptions {
  category?: string;
  continent?: string;
  limit?: number;
  includeAIContext?: boolean;
}

export const useEnhancedDreams = (options: UseEnhancedDreamsOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [destinations, setDestinations] = useState<EnhancedDestination[]>([]);
  const [userProfile, setUserProfile] = useState<UserDreamProfile | null>(null);
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [behaviorTracking, setBehaviorTracking] = useState(true);

  // Fetch enhanced destinations
  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await enhancedDreamService.getEnhancedDestinations({
        user_id: user?.id,
        limit: options.limit,
        category: options.category,
        continent: options.continent,
        include_ai_context: options.includeAIContext,
      });

      setDestinations(response.destinations);
      
      if (response.user_context) {
        logger.info('AI context loaded', { 
          personalizedDestinations: response.user_context.recommended_destinations?.length 
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch destinations';
      setError(errorMessage);
      logger.error('Error fetching enhanced destinations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.limit, options.category, options.continent, options.includeAIContext]);

  // Fetch user profile and insights
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [profile, insights] = await Promise.all([
        enhancedDreamService.getUserProfile(user.id),
        enhancedDreamService.getUserInsights(user.id),
      ]);

      setUserProfile(profile);
      setUserInsights(insights);
    } catch (err) {
      logger.error('Error fetching user data:', err);
    }
  }, [user?.id]);

  // Track user behavior
  const trackBehavior = useCallback(async (
    signalType: 'view' | 'bookmark' | 'share' | 'search' | 'filter' | 'time_spent',
    value: number,
    context: Record<string, any> = {}
  ) => {
    if (!user?.id || !behaviorTracking) return;

    try {
      await enhancedDreamService.trackBehavior(user.id, {
        signal_type: signalType,
        value,
        context,
      });
    } catch (err) {
      logger.error('Error tracking behavior:', err);
    }
  }, [user?.id, behaviorTracking]);

  // Track detailed interactions
  const trackInteraction = useCallback(async (
    destinationId: string,
    interactionType: 'view' | 'bookmark' | 'unbookmark' | 'share' | 'rate',
    durationSeconds?: number
  ) => {
    if (!user?.id || !behaviorTracking) return;

    try {
      await enhancedDreamService.trackInteraction(user.id, {
        destination_id: destinationId,
        interaction_type: interactionType,
        duration_seconds: durationSeconds,
        device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        referrer: document.referrer,
      });
    } catch (err) {
      logger.error('Error tracking interaction:', err);
    }
  }, [user?.id, behaviorTracking]);

  // Update dream collection (bookmark/unbookmark)
  const updateDreamCollection = useCallback(async (
    destinationId: string,
    action: 'add' | 'remove'
  ) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your dream destinations.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      const result = await enhancedDreamService.updateDreamCollection(
        user.id,
        destinationId,
        action
      );

      if (result.success) {
        // Track the interaction
        await trackInteraction(destinationId, action === 'add' ? 'bookmark' : 'unbookmark');

        // Show success message
        toast({
          title: action === 'add' ? "Added to Dreams" : "Removed from Dreams",
          description: action === 'add' 
            ? "Destination added to your dream collection!" 
            : "Destination removed from your collection.",
        });

        // Show achievement notifications
        if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
          result.achievementsUnlocked.forEach((achievement: Achievement) => {
            toast({
              title: "🏆 Achievement Unlocked!",
              description: `${achievement.name}: ${achievement.description}`,
              duration: 5000,
            });
          });
        }

        // Refresh user data to reflect changes
        await fetchUserData();
      } else {
        throw new Error('Failed to update dream collection');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collection';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false };
    }
  }, [user?.id, trackInteraction, fetchUserData, toast]);

  // View destination (tracks behavior)
  const viewDestination = useCallback(async (
    destination: EnhancedDestination,
    durationSeconds?: number
  ) => {
    // Track the view
    await trackInteraction(destination.id, 'view', durationSeconds);
    
    // Track behavior signal
    await trackBehavior('view', 1, {
      destinationId: destination.id,
      category: destination.category,
      continent: destination.continent,
      rarityScore: destination.rarity_score,
    });
  }, [trackInteraction, trackBehavior]);

  // Search destinations (tracks behavior)
  const searchDestinations = useCallback(async (query: string) => {
    await trackBehavior('search', 1, { query });
  }, [trackBehavior]);

  // Filter destinations (tracks behavior)
  const filterDestinations = useCallback(async (filters: Record<string, any>) => {
    await trackBehavior('filter', 1, filters);
  }, [trackBehavior]);

  // Initialize data on mount
  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id, fetchUserData]);

  return {
    // Data
    destinations,
    userProfile,
    userInsights,
    loading,
    error,

    // Actions
    updateDreamCollection,
    viewDestination,
    searchDestinations,
    filterDestinations,
    trackBehavior,
    trackInteraction,

    // Utils
    refetch: fetchDestinations,
    refreshUserData: fetchUserData,
    setBehaviorTracking,
    behaviorTracking,
  };
};

// Hook for user dream statistics and insights
export const useUserDreamStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDreams: 0,
    continentsCount: 0,
    averageRarityScore: 0,
    totalPoints: 0,
    level: 1,
    achievementsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        const profile = await enhancedDreamService.getUserProfile(user.id);
        if (profile) {
          setStats({
            totalDreams: profile.gamification_metrics.destinations_collected,
            continentsCount: profile.gamification_metrics.continents_unlocked,
            averageRarityScore: profile.gamification_metrics.rarity_score,
            totalPoints: profile.gamification_metrics.total_points,
            level: profile.gamification_metrics.level,
            achievementsCount: profile.gamification_metrics.achievements_unlocked,
          });
        }
      } catch (err) {
        logger.error('Error fetching user stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  return { stats, loading };
};