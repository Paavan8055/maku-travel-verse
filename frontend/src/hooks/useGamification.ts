import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { gamificationService } from '@/services/gamification-service';
import { 
  Achievement, 
  UserGameStats, 
  Leaderboard, 
  SocialConnection, 
  SocialActivity,
  Challenge,
  DreamCollectionStats,
  SocialInsights,
  AchievementCheckResponse 
} from '@/types/gamification-types';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [userStats, setUserStats] = useState<UserGameStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [socialActivity, setSocialActivity] = useState<SocialActivity[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [collectionStats, setCollectionStats] = useState<DreamCollectionStats | null>(null);
  const [socialInsights, setSocialInsights] = useState<SocialInsights | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all gamification data
  const fetchGamificationData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [
        stats,
        userAchievements,
        leaderboardData,
        connections,
        activity,
        challengeData,
        collectionData,
        insights,
      ] = await Promise.all([
        gamificationService.getUserGameStats(user.id),
        gamificationService.getUserAchievements(user.id),
        gamificationService.getLeaderboards(['global', 'weekly', 'friends']),
        gamificationService.getSocialConnections(user.id),
        gamificationService.getSocialActivityFeed(user.id, 20),
        gamificationService.getChallenges(user.id),
        gamificationService.getDreamCollectionStats(user.id),
        gamificationService.getSocialInsights(user.id),
      ]);

      setUserStats(stats);
      setAchievements(userAchievements);
      setLeaderboards(leaderboardData);
      setSocialConnections(connections);
      setSocialActivity(activity);
      setChallenges(challengeData);
      setCollectionStats(collectionData);
      setSocialInsights(insights);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gamification data';
      setError(errorMessage);
      logger.error('Error fetching gamification data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Track achievement progress after user actions
  const checkAchievements = useCallback(async (
    actionType: string, 
    actionData: any
  ): Promise<AchievementCheckResponse | null> => {
    if (!user?.id) return null;

    try {
      const result = await gamificationService.checkAchievements(user.id, actionType, actionData);
      
      // Show achievement unlock notifications
      if (result.newly_unlocked.length > 0) {
        result.newly_unlocked.forEach((achievement) => {
          toast({
            title: "🏆 Achievement Unlocked!",
            description: `${achievement.name}: ${achievement.description}`,
            duration: 5000,
          });
        });

        // Refresh achievements data
        const updatedAchievements = await gamificationService.getUserAchievements(user.id);
        setAchievements(updatedAchievements);
      }

      // Show points earned
      if (result.points_earned > 0) {
        toast({
          title: "✨ Points Earned!",
          description: `You earned ${result.points_earned} points!`,
          duration: 3000,
        });
      }

      // Show level up notification
      if (result.level_up) {
        toast({
          title: "🎉 Level Up!",
          description: `Welcome to Level ${result.level_up.new_level}!`,
          duration: 6000,
        });

        // Refresh user stats
        const updatedStats = await gamificationService.getUserGameStats(user.id);
        setUserStats(updatedStats);
      }

      return result;
    } catch (err) {
      logger.error('Error checking achievements:', err);
      return null;
    }
  }, [user?.id, toast]);

  // Join a challenge
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join challenges.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await gamificationService.joinChallenge(user.id, challengeId);
      
      if (result.success) {
        toast({
          title: "Challenge Joined!",
          description: result.message,
        });

        // Refresh challenges data
        const updatedChallenges = await gamificationService.getChallenges(user.id);
        setChallenges(updatedChallenges);

        // Track the event
        await gamificationService.trackGameEvent(user.id, {
          event_type: 'challenge_joined',
          event_data: { challenge_id: challengeId },
          timestamp: new Date(),
          user_context: {
            current_level: userStats?.level || 1,
            current_points: userStats?.total_points || 0,
            active_challenges: challenges.filter(c => c.is_participating).map(c => c.id),
          },
        });

        return true;
      } else {
        toast({
          title: "Failed to Join Challenge",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, userStats, challenges, toast]);

  // Track game events
  const trackGameEvent = useCallback(async (
    eventType: 'destination_bookmarked' | 'destination_shared' | 'friend_added' | 'challenge_joined' | 'social_interaction',
    eventData: any
  ) => {
    if (!user?.id) return;

    try {
      await gamificationService.trackGameEvent(user.id, {
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date(),
        user_context: {
          current_level: userStats?.level || 1,
          current_points: userStats?.total_points || 0,
          active_challenges: challenges.filter(c => c.is_participating).map(c => c.id),
        },
      });
    } catch (err) {
      logger.error('Error tracking game event:', err);
    }
  }, [user?.id, userStats, challenges]);

  // Calculate level progress
  const getLevelProgress = useCallback(() => {
    if (!userStats) return { current: 0, next: 0, progress: 0 };

    const currentLevelPoints = (userStats.level - 1) * 1000; // Simple: 1000 points per level
    const nextLevelPoints = userStats.level * 1000;
    const progress = ((userStats.total_points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

    return {
      current: currentLevelPoints,
      next: nextLevelPoints,
      progress: Math.min(Math.max(progress, 0), 100),
    };
  }, [userStats]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category?: string) => {
    if (!category) return achievements;
    return achievements.filter(achievement => achievement.category === category);
  }, [achievements]);

  // Get unlocked achievements
  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter(achievement => achievement.unlocked);
  }, [achievements]);

  // Get available (not unlocked) achievements
  const getAvailableAchievements = useCallback(() => {
    return achievements.filter(achievement => !achievement.unlocked);
  }, [achievements]);

  // Get recent achievements (unlocked in last 7 days)
  const getRecentAchievements = useCallback(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return achievements.filter(
      achievement => achievement.unlocked && 
      achievement.unlocked_at && 
      new Date(achievement.unlocked_at) > sevenDaysAgo
    );
  }, [achievements]);

  // Get active challenges
  const getActiveChallenges = useCallback(() => {
    return challenges.filter(challenge => challenge.status === 'active' && challenge.is_participating);
  }, [challenges]);

  // Get available challenges (not participating)
  const getAvailableChallenges = useCallback(() => {
    return challenges.filter(challenge => challenge.status === 'active' && !challenge.is_participating);
  }, [challenges]);

  // Initialize data on mount
  useEffect(() => {
    if (user?.id) {
      fetchGamificationData();
    }
  }, [user?.id, fetchGamificationData]);

  // Refresh data every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchGamificationData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.id, fetchGamificationData]);

  return {
    // Data
    userStats,
    achievements,
    leaderboards,
    socialConnections,
    socialActivity,
    challenges,
    collectionStats,
    socialInsights,
    loading,
    error,

    // Actions
    checkAchievements,
    joinChallenge,
    trackGameEvent,
    refetch: fetchGamificationData,

    // Computed values
    levelProgress: getLevelProgress(),
    unlockedAchievements: getUnlockedAchievements(),
    availableAchievements: getAvailableAchievements(),
    recentAchievements: getRecentAchievements(),
    activeChallenges: getActiveChallenges(),
    availableChallenges: getAvailableChallenges(),

    // Utilities
    getAchievementsByCategory,
  };
};

// Hook for quick gamification stats (lighter version)
export const useGamificationStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserGameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        const userStats = await gamificationService.getUserGameStats(user.id);
        setStats(userStats);
      } catch (err) {
        logger.error('Error fetching gamification stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  return { stats, loading };
};