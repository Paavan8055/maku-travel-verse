import React, { useEffect, useState, useMemo } from 'react';
import { Heart, Star, MapPin, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserPreferences {
  priceRange: [number, number];
  amenities: string[];
  starRating: number;
  location: string;
  travelStyle: 'business' | 'leisure' | 'family' | 'luxury';
  previousBookings: any[];
}

interface PersonalizedRecommendation {
  id: string;
  type: 'hotel' | 'destination' | 'deal';
  title: string;
  description: string;
  score: number;
  reason: string;
  image: string;
  price?: number;
  originalPrice?: number;
}

interface PersonalizationEngineProps {
  userPreferences?: UserPreferences;
  onRecommendationClick?: (recommendation: PersonalizedRecommendation) => void;
  className?: string;
}

export const PersonalizationEngine: React.FC<PersonalizationEngineProps> = ({
  userPreferences,
  onRecommendationClick,
  className
}) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate personalized recommendations based on user data
  const generateRecommendations = useMemo(() => {
    if (!userPreferences) return [];

    const mockRecommendations: PersonalizedRecommendation[] = [
      {
        id: '1',
        type: 'hotel',
        title: 'The Grand Luxury Hotel',
        description: 'Perfect for business travelers with excellent amenities',
        score: 95,
        reason: 'Matches your business travel preferences',
        image: '/api/placeholder/300/200',
        price: 250,
        originalPrice: 300
      },
      {
        id: '2',
        type: 'destination',
        title: 'Dubai Business District',
        description: 'Top destination for business travelers',
        score: 88,
        reason: 'Popular among business travelers like you',
        image: '/api/placeholder/300/200'
      },
      {
        id: '3',
        type: 'deal',
        title: 'Weekend Getaway Package',
        description: 'Special offer for frequent travelers',
        score: 82,
        reason: 'Exclusive deal based on your booking history',
        image: '/api/placeholder/300/200',
        price: 180,
        originalPrice: 240
      }
    ];

    // Filter and sort based on user preferences
    return mockRecommendations
      .filter(rec => {
        if (rec.type === 'hotel' && rec.price) {
          return rec.price >= userPreferences.priceRange[0] && 
                 rec.price <= userPreferences.priceRange[1];
        }
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [userPreferences]);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRecommendations(generateRecommendations);
      setIsLoading(false);
    }, 1000);
  }, [generateRecommendations]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <MapPin className="h-4 w-4" />;
      case 'destination': return <Star className="h-4 w-4" />;
      case 'deal': return <Sparkles className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'destination': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'deal': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Personalized for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg"></div>
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
          <Sparkles className="h-5 w-5 text-primary" />
          Personalized for You
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Recommendations based on your preferences and booking history
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className="flex gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onRecommendationClick?.(rec)}
            >
              <div className="w-20 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                <img 
                  src={rec.image} 
                  alt={rec.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${getTypeColor(rec.type)}`}
                  >
                    {getTypeIcon(rec.type)}
                    {rec.type}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {rec.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {rec.score}% match
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {rec.reason}
                    </span>
                  </div>
                  
                  {rec.price && (
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        ${rec.price}
                      </div>
                      {rec.originalPrice && (
                        <div className="text-xs text-muted-foreground line-through">
                          ${rec.originalPrice}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {recommendations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No personalized recommendations available yet.</p>
              <p className="text-sm">Complete your profile to get better suggestions!</p>
            </div>
          )}
        </div>
        
        {recommendations.length > 0 && (
          <Button variant="outline" className="w-full mt-4">
            <Clock className="h-4 w-4 mr-2" />
            View More Recommendations
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalizationEngine;