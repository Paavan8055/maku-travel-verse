import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrossModuleContextManager, crossModuleContextManager } from '@/services/core/CrossModuleContextManager';
import { IntelligentCacheManager, intelligentCacheManager } from '@/services/core/IntelligentCacheManager';
import { MapPin, Clock, Star, TrendingUp, User, Brain, Heart } from 'lucide-react';

interface PersonalizedRecommendation {
  id: string;
  type: 'hotel' | 'flight' | 'activity';
  title: string;
  description: string;
  confidence: number;
  reason: string;
  metadata: any;
}

interface UserPreferences {
  preferredDestinations: string[];
  budgetRange: [number, number];
  travelStyle: 'luxury' | 'budget' | 'adventure' | 'business' | 'family';
  interests: string[];
  seasonalPreferences: string[];
  bookingPatterns: {
    leadTime: number;
    dayOfWeek: string[];
    timeOfYear: string[];
  };
}

interface PersonalizedSearchExperienceProps {
  userId?: string;
  searchType: 'hotel' | 'flight' | 'activity';
  currentSearch?: any;
  onRecommendationSelect: (recommendation: PersonalizedRecommendation) => void;
  className?: string;
}

export const PersonalizedSearchExperience: React.FC<PersonalizedSearchExperienceProps> = ({
  userId,
  searchType,
  currentSearch,
  onRecommendationSelect,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [personalizationScore, setPersonalizationScore] = useState(0);

  useEffect(() => {
    if (userId) {
      loadUserPreferences();
      generatePersonalizedRecommendations();
    }
  }, [userId, searchType, currentSearch]);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);

      // Get user context from cross-module manager
      const userContext = await crossModuleContextManager.getModuleContext('user_preferences', userId || 'anonymous');
      
      if (userContext) {
        setUserPreferences(userContext.preferences as UserPreferences);
        setPersonalizationScore(calculatePersonalizationScore(userContext.preferences as UserPreferences));
      } else {
        // Initialize default preferences
        const defaultPreferences: UserPreferences = {
          preferredDestinations: [],
          budgetRange: [100, 1000],
          travelStyle: 'budget',
          interests: [],
          seasonalPreferences: [],
          bookingPatterns: {
            leadTime: 14,
            dayOfWeek: ['friday', 'saturday', 'sunday'],
            timeOfYear: ['summer', 'spring']
          }
        };
        setUserPreferences(defaultPreferences);
        setPersonalizationScore(0.2);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedRecommendations = async () => {
    try {
      const contextData = await crossModuleContextManager.getModuleContext(searchType, userId || 'anonymous');
      
      if (!contextData || !userPreferences) return;

      const recommendations: PersonalizedRecommendation[] = [];

      // Analyze past booking patterns
      if (contextData.searchHistory?.length > 0) {
        const recentSearches = contextData.searchHistory.slice(0, 5);
        
        // Recommend similar destinations
        const destinations = recentSearches.map((search: any) => search.destination).filter(Boolean);
        const uniqueDestinations = [...new Set(destinations)];
        
        uniqueDestinations.forEach(dest => {
          recommendations.push({
            id: `dest-${dest}`,
            type: searchType,
            title: `Similar to ${dest}`,
            description: `Based on your previous searches to ${dest}`,
            confidence: 0.8,
            reason: 'Past search pattern',
            metadata: { destination: dest, type: 'destination_pattern' }
          });
        });
      }

      // Budget-based recommendations
      if (userPreferences.budgetRange) {
        const [minBudget, maxBudget] = userPreferences.budgetRange;
        recommendations.push({
          id: 'budget-sweet-spot',
          type: searchType,
          title: `Best Value in Your Budget`,
          description: `Options between $${minBudget} - $${maxBudget} that offer excellent value`,
          confidence: 0.9,
          reason: 'Budget preference match',
          metadata: { budgetRange: userPreferences.budgetRange, type: 'budget_optimization' }
        });
      }

      // Seasonal recommendations
      const currentMonth = new Date().getMonth();
      const seasonalRecs = getSeasonalRecommendations(currentMonth, searchType, userPreferences);
      recommendations.push(...seasonalRecs);

      // Travel style recommendations
      const styleRecs = getTravelStyleRecommendations(userPreferences.travelStyle, searchType);
      recommendations.push(...styleRecs);

      // Sort by confidence and limit
      recommendations.sort((a, b) => b.confidence - a.confidence);
      setRecommendations(recommendations.slice(0, 6));

    } catch (error) {
      console.error('Failed to generate personalized recommendations:', error);
    }
  };

  const calculatePersonalizationScore = (preferences: UserPreferences): number => {
    let score = 0;
    
    if (preferences.preferredDestinations.length > 0) score += 0.2;
    if (preferences.budgetRange[0] !== 100 || preferences.budgetRange[1] !== 1000) score += 0.2;
    if (preferences.travelStyle !== 'budget') score += 0.2;
    if (preferences.interests.length > 0) score += 0.2;
    if (preferences.seasonalPreferences.length > 0) score += 0.2;
    
    return score;
  };

  const getSeasonalRecommendations = (month: number, type: string, preferences: UserPreferences): PersonalizedRecommendation[] => {
    const seasons = {
      0: 'winter', 1: 'winter', 2: 'spring', 3: 'spring', 4: 'spring',
      5: 'summer', 6: 'summer', 7: 'summer', 8: 'autumn', 9: 'autumn', 10: 'autumn', 11: 'winter'
    };
    
    const currentSeason = seasons[month as keyof typeof seasons];
    
    return [{
      id: `seasonal-${currentSeason}`,
      type: type as 'hotel' | 'flight' | 'activity',
      title: `Perfect for ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`,
      description: `Destinations and activities that are ideal for ${currentSeason} travel`,
      confidence: 0.7,
      reason: `Seasonal optimization for ${currentSeason}`,
      metadata: { season: currentSeason, type: 'seasonal' }
    }];
  };

  const getTravelStyleRecommendations = (style: string, type: string): PersonalizedRecommendation[] => {
    const styleDescriptions = {
      luxury: 'Premium options with exceptional service and amenities',
      budget: 'Great value options that maximize your travel budget',
      adventure: 'Exciting experiences for thrill-seekers and explorers',
      business: 'Convenient and efficient options for business travelers',
      family: 'Family-friendly options with activities for all ages'
    };

    return [{
      id: `style-${style}`,
      type: type as 'hotel' | 'flight' | 'activity',
      title: `${style.charAt(0).toUpperCase() + style.slice(1)} Travel`,
      description: styleDescriptions[style as keyof typeof styleDescriptions] || 'Customized for your travel style',
      confidence: 0.85,
      reason: `Matches your ${style} travel style`,
      metadata: { travelStyle: style, type: 'travel_style' }
    }];
  };

  const handleRecommendationClick = (recommendation: PersonalizedRecommendation) => {
    // Track user interaction for learning
    crossModuleContextManager.setModuleContext('user_interactions', {
      recommendation: recommendation.id,
      timestamp: new Date(),
      action: 'clicked'
    }, {
      moduleType: 'personalization',
      lastInteraction: new Date(),
      interactionCount: 1,
      preferences: userPreferences || {},
      userInteractions: [{ type: 'recommendation_click', data: recommendation }]
    });

    onRecommendationSelect(recommendation);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPersonalizationLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Excellent', color: 'text-green-600', icon: Brain };
    if (score >= 0.6) return { level: 'Good', color: 'text-blue-600', icon: User };
    if (score >= 0.4) return { level: 'Learning', color: 'text-yellow-600', icon: TrendingUp };
    return { level: 'Basic', color: 'text-gray-600', icon: Heart };
  };

  if (!userId || loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Personalizing Your Experience...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const personalizationInfo = getPersonalizationLevel(personalizationScore);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <personalizationInfo.icon className="h-5 w-5" />
            <span>Personalized for You</span>
          </span>
          <Badge variant="outline" className={personalizationInfo.color}>
            {personalizationInfo.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleRecommendationClick(rec)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    <p className="text-xs text-blue-600 mt-1">{rec.reason}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ml-2 ${getConfidenceColor(rec.confidence)}`}
                  >
                    {Math.round(rec.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Building your personalized experience...</p>
            <p className="text-xs mt-1">Search and book to see tailored recommendations</p>
          </div>
        )}

        {personalizationScore < 0.6 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Improve Your Experience</h4>
            <p className="text-xs text-blue-700">
              Complete more searches and bookings to get better personalized recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalizedSearchExperience;