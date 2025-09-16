import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Heart, MapPin, Star, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/hooks/useAccessibility';

interface Recommendation {
  id: string;
  type: 'trending' | 'personalized' | 'deals' | 'similar';
  title: string;
  subtitle: string;
  location: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  reasons: string[];
  savings?: string;
  urgency?: string;
}

interface SmartRecommendationsProps {
  userPreferences?: {
    marketplace?: 'family' | 'solo' | 'pet' | 'spiritual';
    previousSearches?: string[];
    favoriteDestinations?: string[];
    budgetRange?: [number, number];
  };
  searchContext?: {
    destination?: string;
    dates?: string;
    guests?: number;
  };
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  userPreferences = {},
  searchContext = {}
}) => {
  const { t } = useTranslation();
  const { accessibilityProps } = useAccessibility();

  const recommendations: Recommendation[] = [
    {
      id: 'rec1',
      type: 'personalized',
      title: 'Zen Garden Resort',
      subtitle: 'Perfect for spiritual retreats',
      location: 'Ubud, Bali',
      price: 180,
      originalPrice: 240,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=300&h=200&fit=crop&fm=webp&q=80',
      reasons: ['Matches your spiritual travel preference', 'Highly rated meditation facilities', 'Similar to your previous bookings'],
      savings: '25% off',
      urgency: '3 rooms left at this price'
    },
    {
      id: 'rec2',
      type: 'trending',
      title: 'Aurora Lodge',
      subtitle: 'Trending destination',
      location: 'Tromso, Norway',
      price: 350,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=300&h=200&fit=crop&fm=webp&q=80',
      reasons: ['#1 trending destination this month', 'Perfect for Northern Lights viewing', 'Booking surge: +200%'],
      urgency: 'Booking fast'
    },
    {
      id: 'rec3',
      type: 'deals',
      title: 'Family Paradise Resort',
      subtitle: 'Amazing deal',
      location: 'Gold Coast, Australia',
      price: 220,
      originalPrice: 320,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&fm=webp&q=80',
      reasons: ['Kids stay free', 'Family-friendly amenities', 'Pool and beach access'],
      savings: '31% off',
      urgency: 'Sale ends in 2 days'
    },
    {
      id: 'rec4',
      type: 'similar',
      title: 'Urban Luxury Suites',
      subtitle: 'Similar to your recent searches',
      location: 'Tokyo, Japan',
      price: 280,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&h=200&fit=crop&fm=webp&q=80',
      reasons: ['Similar to "Tokyo hotels"', 'Central location', 'Business traveler favorite'],
    }
  ];

  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      case 'personalized':
        return <Heart className="h-4 w-4" />;
      case 'deals':
        return <DollarSign className="h-4 w-4" />;
      case 'similar':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getRecommendationBadgeColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'trending':
        return 'bg-orange-500';
      case 'personalized':
        return 'bg-pink-500';
      case 'deals':
        return 'bg-green-500';
      case 'similar':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Smart Recommendations</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <Card 
            key={rec.id} 
            className="travel-card overflow-hidden group cursor-pointer animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
            role="article"
            aria-labelledby={`rec-title-${rec.id}`}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={rec.image}
                alt={rec.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Type Badge */}
              <div className="absolute top-3 left-3">
                <Badge 
                  className={`${getRecommendationBadgeColor(rec.type)} text-white flex items-center gap-1`}
                >
                  {getRecommendationIcon(rec.type)}
                  {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                </Badge>
              </div>

              {/* Savings Badge */}
              {rec.savings && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    {rec.savings}
                  </Badge>
                </div>
              )}

              {/* Urgency Badge */}
              {rec.urgency && (
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge variant="destructive" className="w-full justify-center">
                    {rec.urgency}
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="mb-3">
                <h4 id={`rec-title-${rec.id}`} className="font-bold text-lg leading-tight">
                  {rec.title}
                </h4>
                <p className="text-sm text-muted-foreground">{rec.subtitle}</p>
                
                <div className="flex items-center text-muted-foreground text-sm mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{rec.location}</span>
                </div>
              </div>

              <div className="flex items-center mb-3">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-semibold">{rec.rating}</span>
              </div>

              {/* Reasons */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Why we recommend this:</p>
                <ul className="space-y-1">
                  {rec.reasons.slice(0, 2).map((reason, idx) => (
                    <li key={idx} className="text-xs text-foreground flex items-center">
                      <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">${rec.price}</span>
                    {rec.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${rec.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">per night</div>
                </div>
                
                <Button size="sm" className="btn-primary">
                  {t('common.view')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};