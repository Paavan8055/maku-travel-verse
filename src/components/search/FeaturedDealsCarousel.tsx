import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Calendar, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedDeal {
  id: string;
  destination: string;
  departure: string;
  price: {
    total: string;
    currency: string;
  };
  departureDate?: string;
  returnDate?: string;
  savings?: string;
  airline?: string;
}

interface FeaturedDealsCarouselProps {
  onDealSelect?: (departure: string, destination: string, departureDate?: string, returnDate?: string) => void;
  origin?: string;
}

const getDestinationName = (code: string): string => {
  const destinations: Record<string, string> = {
    'BOM': 'Mumbai',
    'LON': 'London', 
    'NYC': 'New York',
    'BKK': 'Bangkok',
    'LAX': 'Los Angeles',
    'SIN': 'Singapore',
    'NRT': 'Tokyo',
    'DXB': 'Dubai',
    'SYD': 'Sydney',
    'MEL': 'Melbourne',
    'PER': 'Perth',
    'BNE': 'Brisbane',
  };
  return destinations[code] || code;
};

const calculateSavings = (price: string): string => {
  const priceNum = parseInt(price);
  const savings = Math.floor(priceNum * 0.15); // Mock 15% savings
  return savings.toString();
};

export function FeaturedDealsCarousel({ onDealSelect, origin = 'SYD' }: FeaturedDealsCarouselProps) {
  const [deals, setDeals] = useState<FeaturedDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedDeals() {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('amadeus-flight-inspiration', {
          body: { origin, type: 'inspiration' }
        });

        if (error) {
          console.error('Error fetching featured deals:', error);
          return;
        }

        if (data?.success && data?.data?.inspiration) {
          // Transform inspiration data into deals with savings
          const dealsData = data.data.inspiration.map((item: any) => ({
            ...item,
            savings: item.price ? calculateSavings(item.price.total) : '50',
            airline: ['Qantas', 'Emirates', 'Singapore Airlines', 'Thai Airways'][Math.floor(Math.random() * 4)]
          }));
          setDeals(dealsData);
        }
      } catch (error) {
        console.error('Error fetching featured deals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedDeals();
  }, [origin]);

  const handleDealClick = (deal: FeaturedDeal) => {
    if (onDealSelect) {
      onDealSelect(deal.departure, deal.destination, deal.departureDate, deal.returnDate);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Featured Deals</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex-shrink-0 w-80 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Featured Deals</h3>
        <Badge variant="secondary" className="bg-primary/10 text-primary">Limited Time</Badge>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {deals.slice(0, 6).map((deal) => (
          <Card 
            key={deal.id} 
            className="flex-shrink-0 w-80 hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-primary"
            onClick={() => handleDealClick(deal)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="destructive" className="bg-gradient-to-r from-orange-500 to-red-500">
                  Save ${deal.savings}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(deal.departureDate)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="text-center">
                  <p className="font-semibold text-lg">{deal.departure}</p>
                  <p className="text-xs text-muted-foreground">{getDestinationName(deal.departure)}</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Plane className="h-6 w-6 text-primary rotate-45" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{deal.destination}</p>
                  <p className="text-xs text-muted-foreground">{getDestinationName(deal.destination)}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {deal.airline && (
                  <p className="text-sm text-muted-foreground">{deal.airline}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    ${(parseInt(deal.price.total) + parseInt(deal.savings || '0')).toString()}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ${deal.price.total}
                  </span>
                  <span className="text-sm text-muted-foreground">{deal.price.currency}</span>
                </div>
              </div>
              
              <Button 
                className="w-full group-hover:bg-primary-600 transition-colors" 
                size="lg"
              >
                Book Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}