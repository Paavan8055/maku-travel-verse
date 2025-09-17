import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrossModuleContextManager, crossModuleContextManager } from '@/services/core/CrossModuleContextManager';
import { MapPin, Plane, Building, Camera, Clock, Star, Users, Calendar, TrendingUp, Zap } from 'lucide-react';

interface ContextualRecommendation {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'package';
  title: string;
  description: string;
  confidence: number;
  contextReason: string;
  metadata: any;
  price?: {
    amount: number;
    currency: string;
  };
  rating?: number;
  timeToComplete?: string;
  popularity?: number;
}

interface TravelContext {
  currentSearch?: any;
  destination?: string;
  dates?: {
    start: Date;
    end: Date;
  };
  travelers?: {
    adults: number;
    children: number;
  };
  tripPurpose?: 'business' | 'leisure' | 'family' | 'adventure';
  budget?: {
    min: number;
    max: number;
  };
  previousBookings?: any[];
}

interface ContextAwareRecommendationsProps {
  userId?: string;
  currentContext: TravelContext;
  searchType: 'flight' | 'hotel' | 'activity';
  onRecommendationSelect: (recommendation: ContextualRecommendation) => void;
  maxRecommendations?: number;
  className?: string;
}

export const ContextAwareRecommendations: React.FC<ContextAwareRecommendationsProps> = ({
  userId,
  currentContext,
  searchType,
  onRecommendationSelect,
  maxRecommendations = 6,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<ContextualRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextScore, setContextScore] = useState(0);

  useEffect(() => {
    generateContextualRecommendations();
  }, [currentContext, searchType, userId]);

  const generateContextualRecommendations = async () => {
    setLoading(true);
    
    try {
      const contextualRecs: ContextualRecommendation[] = [];
      
      // 1. Cross-service recommendations
      const crossServiceRecs = await generateCrossServiceRecommendations();
      contextualRecs.push(...crossServiceRecs);
      
      // 2. Destination-based recommendations
      if (currentContext.destination) {
        const destinationRecs = generateDestinationBasedRecommendations();
        contextualRecs.push(...destinationRecs);
      }
      
      // 3. Date and season-based recommendations
      if (currentContext.dates) {
        const seasonalRecs = generateSeasonalRecommendations();
        contextualRecs.push(...seasonalRecs);
      }
      
      // 4. Travel group size recommendations
      if (currentContext.travelers) {
        const groupRecs = generateGroupSizeRecommendations();
        contextualRecs.push(...groupRecs);
      }
      
      // 5. Budget-conscious recommendations
      if (currentContext.budget) {
        const budgetRecs = generateBudgetRecommendations();
        contextualRecs.push(...budgetRecs);
      }
      
      // 6. Trip purpose recommendations
      if (currentContext.tripPurpose) {
        const purposeRecs = generatePurposeBasedRecommendations();
        contextualRecs.push(...purposeRecs);
      }
      
      // 7. Historical pattern recommendations
      if (userId) {
        const historyRecs = await generateHistoryBasedRecommendations();
        contextualRecs.push(...historyRecs);
      }
      
      // Calculate overall context score
      const score = calculateContextScore(currentContext);
      setContextScore(score);
      
      // Sort by relevance and confidence, limit results
      const sortedRecs = contextualRecs
        .sort((a, b) => (b.confidence * (b.popularity || 0.5)) - (a.confidence * (a.popularity || 0.5)))
        .slice(0, maxRecommendations);
      
      setRecommendations(sortedRecs);
      
    } catch (error) {
      console.error('Failed to generate contextual recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCrossServiceRecommendations = async (): Promise<ContextualRecommendation[]> => {
    const recommendations: ContextualRecommendation[] = [];
    
    // If searching for hotels, recommend flights and activities
    if (searchType === 'hotel' && currentContext.destination) {
      recommendations.push(
        {
          id: 'cross-flight-hotel',
          type: 'flight',
          title: `Flights to ${currentContext.destination}`,
          description: 'Complete your trip with return flights',
          confidence: 0.85,
          contextReason: 'Recommended because you\'re booking accommodation',
          metadata: { 
            crossService: true, 
            relatedTo: 'hotel',
            destination: currentContext.destination 
          },
          popularity: 0.8
        },
        {
          id: 'cross-activity-hotel',
          type: 'activity',
          title: `Things to do in ${currentContext.destination}`,
          description: 'Discover local attractions and experiences',
          confidence: 0.9,
          contextReason: 'Popular activities at your destination',
          metadata: { 
            crossService: true, 
            relatedTo: 'hotel',
            destination: currentContext.destination 
          },
          popularity: 0.85
        }
      );
    }
    
    // If searching for flights, recommend hotels and activities
    if (searchType === 'flight' && currentContext.destination) {
      recommendations.push(
        {
          id: 'cross-hotel-flight',
          type: 'hotel',
          title: `Hotels in ${currentContext.destination}`,
          description: 'Find accommodation for your trip',
          confidence: 0.9,
          contextReason: 'You\'ll need a place to stay',
          metadata: { 
            crossService: true, 
            relatedTo: 'flight',
            destination: currentContext.destination 
          },
          popularity: 0.9
        }
      );
    }
    
    // If searching for activities, recommend nearby services
    if (searchType === 'activity' && currentContext.destination) {
      recommendations.push(
        {
          id: 'cross-package-activity',
          type: 'package',
          title: `${currentContext.destination} Travel Package`,
          description: 'Flight + Hotel + Activities bundle',
          confidence: 0.75,
          contextReason: 'Save money with a complete package',
          metadata: { 
            crossService: true, 
            relatedTo: 'activity',
            destination: currentContext.destination 
          },
          popularity: 0.7,
          price: { amount: 899, currency: 'AUD' }
        }
      );
    }
    
    return recommendations;
  };

  const generateDestinationBasedRecommendations = (): ContextualRecommendation[] => {
    const destination = currentContext.destination!;
    const recommendations: ContextualRecommendation[] = [];
    
    // Destination-specific activity recommendations
    const destinationActivities = getDestinationPopularActivities(destination);
    
    destinationActivities.forEach((activity, index) => {
      recommendations.push({
        id: `dest-activity-${index}`,
        type: 'activity',
        title: activity.name,
        description: activity.description,
        confidence: 0.8,
        contextReason: `Popular in ${destination}`,
        metadata: { 
          destinationSpecific: true, 
          destination,
          category: activity.category 
        },
        rating: activity.rating,
        timeToComplete: activity.duration,
        popularity: activity.popularity,
        price: activity.price
      });
    });
    
    return recommendations;
  };

  const generateSeasonalRecommendations = (): ContextualRecommendation[] => {
    const { dates } = currentContext;
    if (!dates) return [];
    
    const month = dates.start.getMonth();
    const season = getSeason(month);
    
    const seasonalRecs: ContextualRecommendation[] = [];
    
    // Season-specific activity recommendations
    const seasonalActivities = getSeasonalActivities(season);
    
    seasonalActivities.forEach((activity, index) => {
      seasonalRecs.push({
        id: `seasonal-${index}`,
        type: 'activity',
        title: activity.name,
        description: `Perfect for ${season} travel`,
        confidence: 0.75,
        contextReason: `Ideal season for this activity`,
        metadata: { 
          seasonal: true, 
          season,
          activity: activity.type 
        },
        popularity: activity.seasonalPopularity,
        rating: activity.rating
      });
    });
    
    return seasonalRecs;
  };

  const generateGroupSizeRecommendations = (): ContextualRecommendation[] => {
    const { travelers } = currentContext;
    if (!travelers) return [];
    
    const totalTravelers = travelers.adults + travelers.children;
    const hasChildren = travelers.children > 0;
    
    const groupRecs: ContextualRecommendation[] = [];
    
    if (hasChildren) {
      groupRecs.push({
        id: 'family-activities',
        type: 'activity',
        title: 'Family-Friendly Activities',
        description: 'Perfect for families with children',
        confidence: 0.9,
        contextReason: 'Suitable for your family group',
        metadata: { 
          familyFriendly: true, 
          groupSize: totalTravelers,
          hasChildren: true 
        },
        popularity: 0.8
      });
    }
    
    if (totalTravelers >= 4) {
      groupRecs.push({
        id: 'group-hotel',
        type: 'hotel',
        title: 'Group Accommodations',
        description: 'Hotels with family rooms or suites',
        confidence: 0.85,
        contextReason: 'Suitable for larger groups',
        metadata: { 
          groupAccommodation: true, 
          groupSize: totalTravelers 
        },
        popularity: 0.7
      });
    }
    
    return groupRecs;
  };

  const generateBudgetRecommendations = (): ContextualRecommendation[] => {
    const { budget } = currentContext;
    if (!budget) return [];
    
    const recommendations: ContextualRecommendation[] = [];
    const isLowBudget = budget.max < 500;
    const isLuxury = budget.min > 1000;
    
    if (isLowBudget) {
      recommendations.push({
        id: 'budget-options',
        type: searchType,
        title: 'Budget-Friendly Options',
        description: 'Great value choices within your budget',
        confidence: 0.8,
        contextReason: 'Matches your budget preference',
        metadata: { 
          budgetOptimized: true, 
          budgetRange: budget 
        },
        popularity: 0.6,
        price: { amount: budget.max * 0.8, currency: 'AUD' }
      });
    }
    
    if (isLuxury) {
      recommendations.push({
        id: 'luxury-options',
        type: searchType,
        title: 'Luxury Experiences',
        description: 'Premium options for an exceptional experience',
        confidence: 0.85,
        contextReason: 'Premium options within your budget',
        metadata: { 
          luxury: true, 
          budgetRange: budget 
        },
        popularity: 0.7,
        rating: 4.8,
        price: { amount: budget.min * 1.2, currency: 'AUD' }
      });
    }
    
    return recommendations;
  };

  const generatePurposeBasedRecommendations = (): ContextualRecommendation[] => {
    const { tripPurpose } = currentContext;
    if (!tripPurpose) return [];
    
    const purposeRecs: ContextualRecommendation[] = [];
    
    switch (tripPurpose) {
      case 'business':
        purposeRecs.push({
          id: 'business-hotel',
          type: 'hotel',
          title: 'Business Hotels',
          description: 'Hotels with meeting facilities and fast WiFi',
          confidence: 0.9,
          contextReason: 'Ideal for business travel',
          metadata: { businessTravel: true },
          popularity: 0.8
        });
        break;
        
      case 'adventure':
        purposeRecs.push({
          id: 'adventure-activities',
          type: 'activity',
          title: 'Adventure Activities',
          description: 'Thrilling experiences and outdoor adventures',
          confidence: 0.85,
          contextReason: 'Perfect for adventure seekers',
          metadata: { adventureTravel: true },
          popularity: 0.75
        });
        break;
        
      case 'family':
        purposeRecs.push({
          id: 'family-package',
          type: 'package',
          title: 'Family Travel Package',
          description: 'Complete family-friendly travel solution',
          confidence: 0.8,
          contextReason: 'Designed for family trips',
          metadata: { familyTravel: true },
          popularity: 0.85
        });
        break;
    }
    
    return purposeRecs;
  };

  const generateHistoryBasedRecommendations = async (): Promise<ContextualRecommendation[]> => {
    try {
      const userContext = await crossModuleContextManager.getModuleContext('booking_history', userId!);
      
      if (!userContext?.bookingHistory) return [];
      
      const recentBookings = userContext.bookingHistory.slice(0, 5);
      const recommendations: ContextualRecommendation[] = [];
      
      // Analyze patterns in previous bookings
      const preferredDestinations = getFrequentDestinations(recentBookings);
      const preferredPriceRange = getPreferredPriceRange(recentBookings);
      
      if (preferredDestinations.length > 0) {
        recommendations.push({
          id: 'history-destination',
          type: searchType,
          title: `Return to ${preferredDestinations[0]}`,
          description: 'You\'ve enjoyed this destination before',
          confidence: 0.7,
          contextReason: 'Based on your booking history',
          metadata: { 
            historyBased: true, 
            previousDestination: preferredDestinations[0] 
          },
          popularity: 0.6
        });
      }
      
      return recommendations;
      
    } catch (error) {
      console.error('Failed to generate history-based recommendations:', error);
      return [];
    }
  };

  // Helper functions
  const calculateContextScore = (context: TravelContext): number => {
    let score = 0;
    let factors = 0;
    
    if (context.destination) { score += 0.2; factors++; }
    if (context.dates) { score += 0.2; factors++; }
    if (context.travelers) { score += 0.15; factors++; }
    if (context.tripPurpose) { score += 0.15; factors++; }
    if (context.budget) { score += 0.1; factors++; }
    if (context.previousBookings?.length) { score += 0.2; factors++; }
    
    return factors > 0 ? score / factors : 0;
  };

  const getDestinationPopularActivities = (destination: string) => {
    const activityMap: { [key: string]: any[] } = {
      'Sydney': [
        { name: 'Harbour Bridge Climb', description: 'Iconic bridge climbing experience', category: 'adventure', rating: 4.8, duration: '3 hours', popularity: 0.9, price: { amount: 299, currency: 'AUD' } },
        { name: 'Opera House Tour', description: 'Guided tour of the famous opera house', category: 'cultural', rating: 4.6, duration: '1 hour', popularity: 0.85, price: { amount: 89, currency: 'AUD' } }
      ],
      'Melbourne': [
        { name: 'Laneways Food Tour', description: 'Explore Melbourne\'s famous laneways and food scene', category: 'food', rating: 4.7, duration: '3 hours', popularity: 0.8, price: { amount: 159, currency: 'AUD' } }
      ]
    };
    
    return activityMap[destination] || [];
  };

  const getSeason = (month: number): string => {
    if (month >= 2 && month <= 4) return 'autumn';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  };

  const getSeasonalActivities = (season: string) => {
    const seasonalMap: { [key: string]: any[] } = {
      'summer': [
        { name: 'Beach Activities', type: 'water sports', rating: 4.5, seasonalPopularity: 0.9 },
        { name: 'Outdoor Festivals', type: 'cultural', rating: 4.3, seasonalPopularity: 0.8 }
      ],
      'winter': [
        { name: 'Wine Tasting Tours', type: 'food & drink', rating: 4.6, seasonalPopularity: 0.85 },
        { name: 'Indoor Museums', type: 'cultural', rating: 4.4, seasonalPopularity: 0.7 }
      ]
    };
    
    return seasonalMap[season] || [];
  };

  const getFrequentDestinations = (bookings: any[]): string[] => {
    const destinations: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      if (booking.destination) {
        destinations[booking.destination] = (destinations[booking.destination] || 0) + 1;
      }
    });
    
    return Object.entries(destinations)
      .sort(([,a], [,b]) => b - a)
      .map(([dest]) => dest);
  };

  const getPreferredPriceRange = (bookings: any[]): [number, number] => {
    const prices = bookings.map(b => b.price).filter(Boolean);
    if (prices.length === 0) return [0, 1000];
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, max];
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'flight': return Plane;
      case 'hotel': return Building;
      case 'activity': return Camera;
      case 'package': return Star;
      default: return MapPin;
    }
  };

  const handleRecommendationClick = (recommendation: ContextualRecommendation) => {
    // Track interaction for learning
    crossModuleContextManager.setModuleContext('recommendation_interactions', {
      recommendationId: recommendation.id,
      timestamp: new Date(),
      context: currentContext,
      action: 'clicked'
    }, {
      moduleType: 'context_recommendations',
      lastInteraction: new Date(),
      contextScore: contextScore,
      userInteractions: [{ type: 'recommendation_click', data: recommendation }]
    });

    onRecommendationSelect(recommendation);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Loading Recommendations...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span>Smart Recommendations</span>
          </span>
          <Badge variant="outline" className="text-xs">
            {Math.round(contextScore * 100)}% Context Match
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const Icon = getRecommendationIcon(rec.type);
              
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleRecommendationClick(rec)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          <p className="text-xs text-blue-600 mt-2">{rec.contextReason}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-2">
                            {Math.round(rec.confidence * 100)}%
                          </Badge>
                          {rec.price && (
                            <p className="text-sm font-medium">
                              {rec.price.currency} {rec.price.amount}
                            </p>
                          )}
                          {rec.rating && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{rec.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">Building Recommendations</h4>
            <p className="text-sm">
              Provide more search details to get personalized recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextAwareRecommendations;