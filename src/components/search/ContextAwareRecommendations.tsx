import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface TravelContext {
  destination?: string;
  dates?: {
    start: Date;
    end: Date;
  };
  travelers?: {
    adults: number;
    children: number;
  };
  tripPurpose?: string;
}

interface ContextAwareRecommendationsProps {
  currentContext: TravelContext;
  searchType: 'flight' | 'hotel' | 'activity';
  onRecommendationSelect: (recommendation: any) => void;
}

export const ContextAwareRecommendations: React.FC<ContextAwareRecommendationsProps> = ({
  currentContext,
  searchType,
  onRecommendationSelect
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateContextualRecommendations();
  }, [currentContext, searchType]);

  const generateContextualRecommendations = () => {
    setLoading(true);
    
    setTimeout(() => {
      const recs = generateRecommendationsForContext();
      setRecommendations(recs);
      setLoading(false);
    }, 800);
  };

  const generateRecommendationsForContext = () => {
    const { destination, travelers, tripPurpose } = currentContext;
    
    const baseRecommendations = {
      flight: [
        {
          type: 'flight_upgrade',
          title: 'Premium Economy',
          description: 'Extra comfort for your journey',
          price: '+$150',
          rating: 4.5,
          category: 'comfort'
        },
        {
          type: 'flight_timing',
          title: 'Morning Departure',
          description: 'Arrive refreshed with more day time',
          price: 'Same price',
          rating: 4.2,
          category: 'convenience'
        }
      ],
      hotel: [
        {
          type: 'hotel_location',
          title: 'City Center Stay',
          description: 'Walk to main attractions',
          price: 'From $180/night',
          rating: 4.3,
          category: 'location'
        },
        {
          type: 'hotel_amenity',
          title: 'Pool & Spa Hotel',
          description: 'Perfect for relaxation',
          price: 'From $220/night',
          rating: 4.6,
          category: 'amenities'
        }
      ],
      activity: [
        {
          type: 'activity_popular',
          title: 'Harbour Bridge Climb',
          description: 'Iconic Sydney experience',
          price: 'From $150',
          rating: 4.8,
          category: 'iconic'
        },
        {
          type: 'activity_family',
          title: 'Taronga Zoo',
          description: travelers?.children ? 'Great for families' : 'Wildlife experience',
          price: 'From $45',
          rating: 4.4,
          category: 'family'
        }
      ]
    };

    return baseRecommendations[searchType] || [];
  };

  const handleRecommendationClick = (recommendation: any) => {
    console.log('Context recommendation selected:', recommendation);
    onRecommendationSelect(recommendation);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Finding perfect matches...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recommended for You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={index} className="border rounded p-3 hover:bg-muted/50 cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-sm">{rec.title}</h4>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rec.rating}</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
            
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="text-xs">{rec.category}</Badge>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-6"
                onClick={() => handleRecommendationClick(rec)}
              >
                {rec.price}
              </Button>
            </div>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Start searching to see personalized recommendations
          </div>
        )}
      </CardContent>
    </Card>
  );
};