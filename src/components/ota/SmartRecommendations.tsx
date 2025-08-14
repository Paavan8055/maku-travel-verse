import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { analyticsAPI, activityAPI } from '@/lib/otaDataClient';
import { useAuth } from '@/features/auth/context/AuthContext';

interface SmartRecommendationsProps {
  currentLocation?: string;
  searchCriteria?: any;
  className?: string;
}

interface Recommendation {
  id: string;
  type: 'hotel' | 'flight' | 'activity';
  title: string;
  description: string;
  price: number;
  location: string;
  image: string;
  score: number;
  reasons: string[];
  savings?: number;
  urgency?: string;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  currentLocation,
  searchCriteria,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
    generateRecommendations();
  }, [user, currentLocation, searchCriteria]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const analytics = await analyticsAPI.fetchTravelAnalytics(user.id);
      setUserProfile(analytics);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const generateRecommendations = () => {
    // Simulate AI-powered recommendations based on user behavior and preferences
    const mockRecommendations: Recommendation[] = [
      {
        id: 'rec1',
        type: 'hotel',
        title: 'The Langham, Sydney',
        description: 'Luxury harbor views perfect for romantic getaways',
        price: 289,
        location: 'Sydney, Australia',
        image: '/api/placeholder/300/200',
        score: 9.2,
        reasons: ['Matches your luxury preferences', 'Popular with couples', 'Great harbor views'],
        savings: 45,
        urgency: 'Limited time offer'
      },
      {
        id: 'rec2',
        type: 'flight',
        title: 'Direct flights to Tokyo',
        description: 'Experience cherry blossom season',
        price: 756,
        location: 'Tokyo, Japan',
        image: '/api/placeholder/300/200',
        score: 8.8,
        reasons: ['Based on your search history', 'Seasonal recommendation', 'Great value'],
        savings: 120
      },
      {
        id: 'rec3',
        type: 'activity',
        title: 'Blue Mountains Adventure',
        description: 'Scenic railway and bushwalking',
        price: 89,
        location: 'Blue Mountains, Australia',
        image: '/api/placeholder/300/200',
        score: 9.1,
        reasons: ['Perfect for nature lovers', 'Close to your location', 'Highly rated']
      },
      {
        id: 'rec4',
        type: 'hotel',
        title: 'Budget-friendly CBD Stay',
        description: 'Modern hotel with excellent transport links',
        price: 125,
        location: 'Melbourne, Australia',
        image: '/api/placeholder/300/200',
        score: 8.5,
        reasons: ['Great value option', 'Convenient location', 'Recent positive reviews'],
        urgency: 'Only 2 rooms left'
      }
    ];

    setRecommendations(mockRecommendations);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return MapPin;
      case 'flight':
        return Clock;
      case 'activity':
        return Users;
      default:
        return Sparkles;
    }
  };

  const handleRecommendationClick = (recommendation: Recommendation) => {
    // Log interaction for future recommendations
    activityAPI.logActivity({
      activity_type: 'recommendation_click',
      item_type: recommendation.type,
      item_id: recommendation.id,
      item_data: recommendation
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Smart Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
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
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recommendations.map((rec) => {
          const TypeIcon = getTypeIcon(rec.type);
          
          return (
            <div
              key={rec.id}
              className="flex gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleRecommendationClick(rec)}
            >
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <TypeIcon className="w-8 h-8 text-muted" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted">{rec.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${rec.price}</div>
                    {rec.savings && (
                      <Badge variant="secondary" className="text-xs">
                        Save ${rec.savings}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {rec.score}/10
                  </Badge>
                  <span className="text-xs text-muted">{rec.location}</span>
                  {rec.urgency && (
                    <Badge variant="destructive" className="text-xs">
                      {rec.urgency}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted font-medium">Why we recommend this:</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.reasons.slice(0, 2).map((reason, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <Button variant="outline" className="w-full mt-4">
          View All Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};