/**
 * Cross-Selling Engine for MAKU.Travel
 * 
 * Intelligent cross-selling system that suggests relevant add-ons, upgrades,
 * and complementary services during the booking flow to maximize revenue.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Car, 
  Plane, 
  Shield, 
  Wifi, 
  Coffee, 
  Utensils, 
  MapPin, 
  Star,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CrossSellItem {
  id: string;
  type: 'insurance' | 'transfer' | 'upgrade' | 'addon' | 'experience';
  category: 'essential' | 'popular' | 'premium';
  name: string;
  description: string;
  price: number;
  currency: string;
  originalPrice?: number;
  discount?: number;
  icon: React.ComponentType<any>;
  benefits: string[];
  popularity: number; // 0-100 score
  relevanceScore: number; // 0-100 based on booking context
  timeLimit?: string; // e.g., "24 hours", "checkout only"
  bookingTypes: ('hotel' | 'flight' | 'activity')[];
  isRecommended?: boolean;
  isBestValue?: boolean;
  isLimitedTime?: boolean;
}

export interface BookingContext {
  type: 'hotel' | 'flight' | 'activity';
  destination: string;
  dates: { checkIn: string; checkOut: string } | { departure: string; return?: string };
  guests: number;
  totalValue: number;
  isInternational: boolean;
  isDomestic: boolean;
  tripDuration: number; // days
  season: 'peak' | 'shoulder' | 'off-peak';
  userProfile?: {
    loyaltyTier: string;
    previousBookings: number;
    preferredServices: string[];
  };
}

interface CrossSellSuggestions {
  essential: CrossSellItem[];
  popular: CrossSellItem[];
  premium: CrossSellItem[];
  totalPotentialValue: number;
  personalizedMessage: string;
}

/**
 * Cross-Selling Engine Class
 */
export class CrossSellingEngine {
  
  static readonly CROSS_SELL_CATALOG: CrossSellItem[] = [
    // Travel Insurance
    {
      id: 'travel-insurance-basic',
      type: 'insurance',
      category: 'essential',
      name: 'Travel Protection',
      description: 'Comprehensive coverage for trip cancellation, medical emergencies, and lost luggage',
      price: 49.99,
      currency: 'AUD',
      icon: Shield,
      benefits: ['Trip cancellation coverage', 'Medical emergency assistance', 'Lost luggage protection', '24/7 support hotline'],
      popularity: 85,
      relevanceScore: 95,
      bookingTypes: ['hotel', 'flight', 'activity'],
      isRecommended: true
    },
    {
      id: 'travel-insurance-premium',
      type: 'insurance',
      category: 'premium',
      name: 'Premium Travel Protection',
      description: 'Enhanced coverage with business equipment, rental car excess, and adventure sports',
      price: 89.99,
      currency: 'AUD',
      originalPrice: 119.99,
      discount: 25,
      icon: Shield,
      benefits: ['All basic coverage', 'Business equipment protection', 'Rental car excess waiver', 'Adventure sports coverage', 'Cancel for any reason'],
      popularity: 65,
      relevanceScore: 75,
      bookingTypes: ['hotel', 'flight', 'activity'],
      isBestValue: true
    },
    
    // Airport Transfers
    {
      id: 'airport-transfer-private',
      type: 'transfer',
      category: 'popular',
      name: 'Private Airport Transfer',
      description: 'Door-to-door private transfer with professional driver and flight tracking',
      price: 85.00,
      currency: 'AUD',
      icon: Car,
      benefits: ['Professional driver', 'Flight tracking', 'Meet & greet service', 'Child seats available', 'No surge pricing'],
      popularity: 78,
      relevanceScore: 85,
      bookingTypes: ['hotel', 'flight'],
      timeLimit: 'checkout only'
    },
    {
      id: 'airport-transfer-shared',
      type: 'transfer',
      category: 'essential',
      name: 'Shared Airport Shuttle',
      description: 'Convenient shared shuttle service to/from airport',
      price: 25.00,
      currency: 'AUD',
      icon: Users,
      benefits: ['Shared with other travelers', 'Multiple pickup times', 'Luggage assistance', 'Air-conditioned vehicle'],
      popularity: 92,
      relevanceScore: 90,
      bookingTypes: ['hotel', 'flight']
    },
    
    // Hotel Upgrades
    {
      id: 'room-upgrade-seaview',
      type: 'upgrade',
      category: 'premium',
      name: 'Ocean View Room Upgrade',
      description: 'Upgrade to a premium room with stunning ocean views',
      price: 150.00,
      currency: 'AUD',
      icon: MapPin,
      benefits: ['Ocean view balcony', 'Premium room amenities', 'Complimentary breakfast', 'Late checkout'],
      popularity: 70,
      relevanceScore: 80,
      bookingTypes: ['hotel'],
      isLimitedTime: true,
      timeLimit: '24 hours'
    },
    
    // Flight Add-ons
    {
      id: 'flight-wifi',
      type: 'addon',
      category: 'popular',
      name: 'In-Flight WiFi',
      description: 'Stay connected with high-speed internet throughout your flight',
      price: 19.99,
      currency: 'AUD',
      icon: Wifi,
      benefits: ['High-speed internet', 'Stream videos', 'Work connectivity', 'Social media access'],
      popularity: 88,
      relevanceScore: 75,
      bookingTypes: ['flight']
    },
    {
      id: 'flight-meal-upgrade',
      type: 'addon',
      category: 'popular',
      name: 'Premium Meal Service',
      description: 'Upgrade to chef-curated meals with premium ingredients',
      price: 35.00,
      currency: 'AUD',
      icon: Utensils,
      benefits: ['Chef-curated meals', 'Premium ingredients', 'Dietary accommodations', 'Complimentary beverage'],
      popularity: 72,
      relevanceScore: 65,
      bookingTypes: ['flight']
    },
    {
      id: 'priority-boarding',
      type: 'addon',
      category: 'essential',
      name: 'Priority Boarding',
      description: 'Board early and secure overhead bin space',
      price: 15.00,
      currency: 'AUD',
      icon: Plane,
      benefits: ['Early boarding', 'Guaranteed overhead space', 'Skip queues', 'Extra time to settle'],
      popularity: 85,
      relevanceScore: 80,
      bookingTypes: ['flight']
    },
    
    // Experience Add-ons
    {
      id: 'spa-package',
      type: 'experience',
      category: 'premium',
      name: 'Spa & Wellness Package',
      description: 'Relax and rejuvenate with our signature spa treatments',
      price: 180.00,
      currency: 'AUD',
      originalPrice: 220.00,
      discount: 18,
      icon: Star,
      benefits: ['60-minute massage', 'Facial treatment', 'Spa facility access', 'Healthy refreshments'],
      popularity: 65,
      relevanceScore: 70,
      bookingTypes: ['hotel']
    },
    {
      id: 'dining-package',
      type: 'experience',
      category: 'popular',
      name: 'Gourmet Dining Experience',
      description: 'Multi-course dining at award-winning restaurants',
      price: 120.00,
      currency: 'AUD',
      icon: Coffee,
      benefits: ['3-course dinner', 'Wine pairing', 'Chef recommendations', 'Priority reservations'],
      popularity: 82,
      relevanceScore: 75,
      bookingTypes: ['hotel', 'activity']
    }
  ];

  /**
   * Generate cross-sell suggestions based on booking context
   */
  static generateSuggestions(context: BookingContext): CrossSellSuggestions {
    const relevantItems = this.CROSS_SELL_CATALOG.filter(item => 
      item.bookingTypes.includes(context.type)
    );

    // Calculate relevance scores based on context
    const scoredItems = relevantItems.map(item => ({
      ...item,
      relevanceScore: this.calculateRelevanceScore(item, context)
    }));

    // Sort by relevance and popularity
    scoredItems.sort((a, b) => 
      (b.relevanceScore * 0.7 + b.popularity * 0.3) - (a.relevanceScore * 0.7 + a.popularity * 0.3)
    );

    // Categorize suggestions
    const essential = scoredItems.filter(item => item.category === 'essential').slice(0, 3);
    const popular = scoredItems.filter(item => item.category === 'popular').slice(0, 4);
    const premium = scoredItems.filter(item => item.category === 'premium').slice(0, 2);

    const totalPotentialValue = [...essential, ...popular, ...premium]
      .reduce((sum, item) => sum + item.price, 0);

    return {
      essential,
      popular,
      premium,
      totalPotentialValue,
      personalizedMessage: this.generatePersonalizedMessage(context)
    };
  }

  /**
   * Calculate relevance score based on booking context
   */
  private static calculateRelevanceScore(item: CrossSellItem, context: BookingContext): number {
    let score = item.relevanceScore;

    // Boost insurance for international travel
    if (item.type === 'insurance' && context.isInternational) {
      score += 15;
    }

    // Boost transfers for airport-related bookings
    if (item.type === 'transfer' && context.type === 'flight') {
      score += 20;
    }

    // Boost upgrades for longer stays
    if (item.type === 'upgrade' && context.tripDuration > 3) {
      score += 10;
    }

    // Boost premium items for high-value bookings
    if (item.category === 'premium' && context.totalValue > 1000) {
      score += 15;
    }

    // Boost experience packages for leisure travel
    if (item.type === 'experience' && context.tripDuration > 2) {
      score += 12;
    }

    // Consider user profile if available
    if (context.userProfile) {
      if (context.userProfile.loyaltyTier === 'premium' && item.category === 'premium') {
        score += 10;
      }
      if (context.userProfile.previousBookings > 5) {
        score += 5; // Loyal customers get slight boost for all items
      }
    }

    return Math.min(100, score);
  }

  /**
   * Generate personalized message
   */
  private static generatePersonalizedMessage(context: BookingContext): string {
    const messages = {
      hotel: `Complete your stay in ${context.destination} with these carefully selected add-ons`,
      flight: `Make your journey to ${context.destination} more comfortable with these popular options`,
      activity: `Enhance your ${context.destination} experience with these recommended services`
    };

    return messages[context.type] || 'Enhance your travel experience with these popular add-ons';
  }

  /**
   * Get trending items based on recent bookings
   */
  static getTrendingItems(): CrossSellItem[] {
    // This would typically query recent booking data
    return this.CROSS_SELL_CATALOG
      .filter(item => item.popularity > 80)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }

  /**
   * Get seasonal recommendations
   */
  static getSeasonalRecommendations(season: 'peak' | 'shoulder' | 'off-peak'): CrossSellItem[] {
    const seasonalBoosts = {
      'peak': ['travel-insurance-premium', 'airport-transfer-private'],
      'shoulder': ['travel-insurance-basic', 'flight-wifi'],
      'off-peak': ['spa-package', 'dining-package']
    };

    const boostedIds = seasonalBoosts[season] || [];
    return this.CROSS_SELL_CATALOG
      .filter(item => boostedIds.includes(item.id))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

/**
 * Cross-Sell Display Component
 */
interface CrossSellDisplayProps {
  context: BookingContext;
  onAddItem: (item: CrossSellItem) => void;
  onRemoveItem: (itemId: string) => void;
  selectedItems: string[];
  showCompact?: boolean;
}

export const CrossSellDisplay: React.FC<CrossSellDisplayProps> = ({
  context,
  onAddItem,
  onRemoveItem,
  selectedItems,
  showCompact = false
}) => {
  const [suggestions, setSuggestions] = useState<CrossSellSuggestions | null>(null);
  const [activeCategory, setActiveCategory] = useState<'essential' | 'popular' | 'premium'>('essential');
  const { toast } = useToast();

  useEffect(() => {
    const generatedSuggestions = CrossSellingEngine.generateSuggestions(context);
    setSuggestions(generatedSuggestions);
  }, [context]);

  const handleItemToggle = (item: CrossSellItem, checked: boolean) => {
    if (checked) {
      onAddItem(item);
      toast({
        title: "Added to booking",
        description: `${item.name} has been added to your booking`,
      });
    } else {
      onRemoveItem(item.id);
    }
  };

  const renderItem = (item: CrossSellItem) => {
    const isSelected = selectedItems.includes(item.id);
    const IconComponent = item.icon;

    return (
      <Card key={item.id} className={`relative transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <IconComponent className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-sm">{item.name}</h4>
                
                {item.isRecommended && (
                  <Badge variant="default" className="text-xs">Recommended</Badge>
                )}
                {item.isBestValue && (
                  <Badge variant="secondary" className="text-xs">Best Value</Badge>
                )}
                {item.isLimitedTime && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Limited Time
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
              
              {!showCompact && (
                <ul className="text-xs text-muted-foreground mb-3 space-y-1">
                  {item.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${item.originalPrice}
                    </span>
                  )}
                  <span className="font-semibold text-primary">
                    ${item.price} {item.currency}
                  </span>
                  {item.discount && (
                    <Badge variant="outline" className="text-xs">
                      {item.discount}% off
                    </Badge>
                  )}
                </div>
                
                {item.popularity > 80 && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Popular
                  </div>
                )}
              </div>
              
              {item.timeLimit && (
                <div className="text-xs text-orange-600 mt-2 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Available {item.timeLimit} only
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!suggestions) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'essential', label: 'Essential', items: suggestions.essential },
    { key: 'popular', label: 'Popular', items: suggestions.popular },
    { key: 'premium', label: 'Premium', items: suggestions.premium }
  ] as const;

  const totalSelectedValue = selectedItems.reduce((sum, itemId) => {
    const item = CrossSellingEngine.CROSS_SELL_CATALOG.find(i => i.id === itemId);
    return sum + (item?.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Enhance Your Experience</h3>
        <p className="text-sm text-muted-foreground">{suggestions.personalizedMessage}</p>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {categories.map(category => (
          <button
            key={category.key}
            onClick={() => setActiveCategory(category.key)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === category.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {category.label}
            {category.items.length > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                {category.items.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Items Display */}
      <div className="space-y-3">
        {categories
          .find(cat => cat.key === activeCategory)
          ?.items.map(renderItem)}
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Selected Add-ons</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  +${totalSelectedValue.toFixed(2)} AUD
                </div>
                <div className="text-xs text-muted-foreground">
                  Additional value
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CrossSellDisplay;