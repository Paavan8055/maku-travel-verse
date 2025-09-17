import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EnhancedActivity } from '@/features/search/hooks/useEnhancedActivitySearch';

interface UserPreferences {
  preferredCategories: string[];
  priceRange: [number, number];
  preferredDuration: string[];
  previousDestinations: string[];
  bookingHistory: any[];
}

interface RecommendationContext {
  destination?: string;
  travelDates?: [string, string];
  groupSize?: number;
  occasion?: string;
}

interface Recommendation {
  activity: EnhancedActivity;
  score: number;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface UsePersonalizedRecommendationsReturn {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  generateRecommendations: (context?: RecommendationContext) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  getUserPreferences: () => Promise<UserPreferences | null>;
  refreshRecommendations: () => void;
}

export const usePersonalizedRecommendations = (): UsePersonalizedRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user preferences from booking history and explicit preferences
  const getUserPreferences = useCallback(async (): Promise<UserPreferences | null> => {
    if (!user) return null;

    try {
      // For now, use localStorage until database types are updated
      const savedPrefs = localStorage.getItem(`preferences_${user.id}`);
      const prefsData = savedPrefs ? JSON.parse(savedPrefs) : null;

      // Get booking history for implicit preferences
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get wishlist for preference insights  
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      const wishlistData = savedWishlist ? JSON.parse(savedWishlist) : [];

      // Analyze booking history to extract preferences
      const bookingHistory = bookingsData || [];
      const categoryCounts: { [key: string]: number } = {};
      const destinations = new Set<string>();
      const pricePoints: number[] = [];

      bookingHistory.forEach(booking => {
        if (booking.booking_type === 'activity') {
          const activityData = booking.booking_data as any;
          if (activityData?.category) {
            categoryCounts[activityData.category] = (categoryCounts[activityData.category] || 0) + 1;
          }
          if (activityData?.destination) {
            destinations.add(activityData.destination);
          }
          if (booking.total_amount) {
            pricePoints.push(booking.total_amount);
          }
        }
      });

      // Include wishlist preferences
      if (Array.isArray(wishlistData)) {
        wishlistData.forEach((item: any) => {
          if (item.category) {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 0.5; // Lower weight
          }
        });
      }

      // Determine preferred categories (top 3)
      const preferredCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Calculate price range from booking history
      const avgPrice = pricePoints.length > 0 
        ? pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length
        : 100;
      const priceRange: [number, number] = [
        Math.max(0, avgPrice * 0.7),
        avgPrice * 1.5
      ];

      return {
        preferredCategories: prefsData?.categories || preferredCategories,
        priceRange: prefsData?.priceRange || priceRange,
        preferredDuration: prefsData?.duration || [],
        previousDestinations: Array.from(destinations),
        bookingHistory
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }, [user]);

  // Generate personalized recommendations
  const generateRecommendations = useCallback(async (context?: RecommendationContext) => {
    if (!user) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user preferences
      const preferences = await getUserPreferences();
      if (!preferences) {
        throw new Error('Unable to load user preferences');
      }

      // Call the recommendation engine edge function
      const { data, error: functionError } = await supabase.functions.invoke('recommendation-engine', {
        body: {
          userId: user.id,
          preferences,
          context: context || {},
          limit: 10
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      // Process recommendations with scoring
      const processedRecommendations: Recommendation[] = (data.recommendations || []).map((rec: any) => ({
        activity: rec.activity,
        score: rec.score || 0.5,
        reasons: rec.reasons || [],
        confidence: rec.confidence || 'medium'
      }));

      // Sort by score
      processedRecommendations.sort((a, b) => b.score - a.score);

      setRecommendations(processedRecommendations);

      // Log recommendation generation for analytics
      await supabase.functions.invoke('user-analytics', {
        body: {
          userId: user.id,
          event: 'recommendations_generated',
          data: {
            count: processedRecommendations.length,
            context,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      
      // Fallback: generate basic recommendations based on popular activities
      generateFallbackRecommendations();
    } finally {
      setLoading(false);
    }
  }, [user, getUserPreferences]);

  // Generate fallback recommendations when personalized engine fails
  const generateFallbackRecommendations = useCallback(async () => {
    try {
      // Get popular activities as fallback
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'activity',
          params: {
            destination: 'sydney', // default
            date: new Date().toISOString().split('T')[0],
            participants: 2
          }
        }
      });

      if (!error && data?.activities) {
        const fallbackRecommendations: Recommendation[] = data.activities
          .slice(0, 6)
          .map((activity: any, index: number) => ({
            activity,
            score: 0.8 - (index * 0.1),
            reasons: ['Popular activity', 'Highly rated'],
            confidence: 'medium' as const
          }));

        setRecommendations(fallbackRecommendations);
      }
    } catch (error) {
      console.error('Fallback recommendations failed:', error);
    }
  }, []);

  // Update user preferences  
  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      // Use localStorage for now
      localStorage.setItem(`preferences_${user.id}`, JSON.stringify(preferences));

      toast({
        title: "Preferences updated",
        description: "Your activity preferences have been saved"
      });

      // Refresh recommendations with new preferences
      generateRecommendations();
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences", 
        variant: "destructive"
      });
    }
  }, [user, generateRecommendations, toast]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  // Auto-generate recommendations on user change
  useEffect(() => {
    if (user) {
      generateRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [user, generateRecommendations]);

  return {
    recommendations,
    loading,
    error,
    generateRecommendations,
    updatePreferences,
    getUserPreferences,
    refreshRecommendations
  };
};