import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { aiIntelligenceService } from '@/services/ai-intelligence-service';
import { 
  TravelDNA,
  IntelligentRecommendation,
  IntelligentJourney,
  PredictiveInsight,
  TravelDNAResponse,
  IntelligentRecommendationsResponse,
  JourneyOptimizationResponse,
  PredictiveInsightsResponse,
  UserFeedback
} from '@/types/ai-intelligence-types';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

export const useAIIntelligence = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [travelDNA, setTravelDNA] = useState<TravelDNA | null>(null);
  const [intelligentRecommendations, setIntelligentRecommendations] = useState<IntelligentRecommendation[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [currentJourney, setCurrentJourney] = useState<IntelligentJourney | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [analyzingDNA, setAnalyzingDNA] = useState(false);
  const [optimizingJourney, setOptimizingJourney] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics and metadata
  const [aiProcessingTime, setAiProcessingTime] = useState<number>(0);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<Date | null>(null);

  // Fetch travel DNA analysis
  const analyzeTravelDNA = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    try {
      setAnalyzingDNA(true);
      setError(null);

      const response = await aiIntelligenceService.analyzeTravelDNA(user.id);
      
      if (response) {
        setTravelDNA(response.travel_dna);
        setConfidenceScore(response.confidence_breakdown.overall_confidence);
        setLastAnalysisDate(response.last_updated);
        
        toast({
          title: "🧬 Travel DNA Analyzed!",
          description: `You're a ${response.travel_dna.primary_type.replace('_', ' ')} with ${Math.round(response.confidence_breakdown.overall_confidence * 100)}% confidence.`,
          duration: 4000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze travel DNA';
      setError(errorMessage);
      logger.error('Error analyzing travel DNA:', err);
    } finally {
      setAnalyzingDNA(false);
    }
  }, [user?.id, toast]);

  // Fetch intelligent recommendations
  const getIntelligentRecommendations = useCallback(async (options?: {
    max_results?: number;
    categories?: string[];
    confidence_threshold?: number;
  }) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await aiIntelligenceService.getIntelligentRecommendations(user.id, options);
      
      if (response) {
        setIntelligentRecommendations(response.recommendations);
        setAiProcessingTime(response.processing_metadata.analysis_time_ms);
        
        // Update travel DNA if included
        if (response.user_travel_dna) {
          setTravelDNA(response.user_travel_dna);
        }

        logger.info('AI recommendations loaded', {
          count: response.recommendations.length,
          processingTime: response.processing_metadata.analysis_time_ms
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get intelligent recommendations';
      setError(errorMessage);
      logger.error('Error getting recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Optimize journey with AI
  const optimizeJourney = useCallback(async (
    destinationIds: string[],
    preferences?: {
      optimize_for: 'cost' | 'time' | 'weather' | 'experience' | 'balanced';
      travel_style: 'budget' | 'comfort' | 'luxury';
      max_duration_days?: number;
      preferred_season?: 'spring' | 'summer' | 'fall' | 'winter';
    }
  ) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI journey optimization.",
        variant: "destructive",
      });
      return null;
    }

    if (destinationIds.length < 2) {
      toast({
        title: "More Destinations Needed",
        description: "Select at least 2 destinations to optimize your journey.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setOptimizingJourney(true);
      setError(null);

      const response = await aiIntelligenceService.optimizeJourney(user.id, destinationIds, preferences);
      
      if (response) {
        setCurrentJourney(response.optimized_journey);
        
        toast({
          title: "🚀 Journey Optimized!",
          description: `Saved ${response.optimization_summary.cost_savings_percentage}% on costs and ${response.optimization_summary.time_savings_percentage}% on travel time.`,
          duration: 5000,
        });

        return response;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize journey';
      setError(errorMessage);
      toast({
        title: "Optimization Failed",
        description: errorMessage,
        variant: "destructive",
      });
      logger.error('Error optimizing journey:', err);
    } finally {
      setOptimizingJourney(false);
    }

    return null;
  }, [user?.id, toast]);

  // Get predictive insights
  const getPredictiveInsights = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await aiIntelligenceService.getPredictiveInsights(user.id);
      
      if (response) {
        setPredictiveInsights(response.insights);
        
        // Show high-urgency insights as notifications
        response.insights
          .filter(insight => insight.urgency === 'high' || insight.urgency === 'critical')
          .forEach(insight => {
            toast({
              title: `🔮 ${insight.title}`,
              description: insight.description,
              duration: 8000,
            });
          });
      }
    } catch (err) {
      logger.error('Error getting predictive insights:', err);
    }
  }, [user?.id, toast]);

  // Submit feedback on AI recommendations
  const submitRecommendationFeedback = useCallback(async (
    recommendationId: string,
    rating: number,
    feedbackText?: string
  ) => {
    if (!user?.id) return false;

    try {
      const feedback: Omit<UserFeedback, 'feedback_id' | 'created_at'> = {
        user_id: user.id,
        feedback_type: 'recommendation_rating',
        target_id: recommendationId,
        rating,
        feedback_text: feedbackText
      };

      const success = await aiIntelligenceService.submitFeedback(feedback);
      
      if (success) {
        toast({
          title: "Feedback Submitted",
          description: "Thank you! Your feedback helps improve our AI recommendations.",
          duration: 3000,
        });
      }

      return success;
    } catch (err) {
      logger.error('Error submitting feedback:', err);
      return false;
    }
  }, [user?.id, toast]);

  // Get explanation for a recommendation
  const getRecommendationExplanation = useCallback(async (recommendationId: string) => {
    if (!user?.id) return null;

    try {
      return await aiIntelligenceService.getRecommendationExplanation(user.id, recommendationId);
    } catch (err) {
      logger.error('Error getting recommendation explanation:', err);
      return null;
    }
  }, [user?.id]);

  // Filter recommendations by type
  const getRecommendationsByType = useCallback((types: string[]) => {
    return intelligentRecommendations.filter(rec => 
      rec.recommendation_reasons.some(reason => types.includes(reason.reason_type))
    );
  }, [intelligentRecommendations]);

  // Get high-confidence recommendations
  const getHighConfidenceRecommendations = useCallback((threshold = 0.8) => {
    return intelligentRecommendations.filter(rec => rec.recommendation_score >= threshold * 100);
  }, [intelligentRecommendations]);

  // Get urgent recommendations
  const getUrgentRecommendations = useCallback((urgencyThreshold = 70) => {
    return intelligentRecommendations.filter(rec => rec.urgency_score >= urgencyThreshold);
  }, [intelligentRecommendations]);

  // Get recommendations with social proof
  const getSocialRecommendations = useCallback(() => {
    return intelligentRecommendations.filter(rec => 
      rec.social_proof.friends_visited_count > 0 || 
      rec.social_proof.friends_planning_count > 0 ||
      rec.social_proof.social_recommendation_score > 50
    );
  }, [intelligentRecommendations]);

  // Get actionable insights
  const getActionableInsights = useCallback(() => {
    return predictiveInsights.filter(insight => 
      insight.actionable_steps && insight.actionable_steps.length > 0
    );
  }, [predictiveInsights]);

  // Initialize AI intelligence data
  useEffect(() => {
    if (user?.id) {
      const initializeAI = async () => {
        await Promise.all([
          getIntelligentRecommendations({ max_results: 10 }),
          getPredictiveInsights()
        ]);
        
        // Analyze travel DNA if not recently done
        if (!travelDNA || !lastAnalysisDate || 
            Date.now() - lastAnalysisDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
          await analyzeTravelDNA();
        }
      };

      initializeAI();
    }
  }, [user?.id, getIntelligentRecommendations, getPredictiveInsights, analyzeTravelDNA, travelDNA, lastAnalysisDate]);

  return {
    // Data
    travelDNA,
    intelligentRecommendations,
    predictiveInsights,
    currentJourney,
    loading,
    analyzingDNA,
    optimizingJourney,
    error,

    // Metadata
    aiProcessingTime,
    confidenceScore,
    lastAnalysisDate,

    // Actions
    analyzeTravelDNA,
    getIntelligentRecommendations,
    optimizeJourney,
    getPredictiveInsights,
    submitRecommendationFeedback,
    getRecommendationExplanation,

    // Computed values
    highConfidenceRecommendations: getHighConfidenceRecommendations(),
    urgentRecommendations: getUrgentRecommendations(),
    socialRecommendations: getSocialRecommendations(),
    actionableInsights: getActionableInsights(),

    // Utilities
    getRecommendationsByType,
    getHighConfidenceRecommendations,
    getUrgentRecommendations,
    getSocialRecommendations,
    getActionableInsights,
  };
};

// Lighter hook for just travel DNA
export const useTravelDNA = () => {
  const { user } = useAuth();
  const [travelDNA, setTravelDNA] = useState<TravelDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    const fetchTravelDNA = async () => {
      if (!user?.id) return;

      try {
        const response = await aiIntelligenceService.analyzeTravelDNA(user.id);
        if (response) {
          setTravelDNA(response.travel_dna);
          setConfidence(response.confidence_breakdown.overall_confidence);
        }
      } catch (err) {
        logger.error('Error fetching travel DNA:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelDNA();
  }, [user?.id]);

  return { travelDNA, loading, confidence };
};