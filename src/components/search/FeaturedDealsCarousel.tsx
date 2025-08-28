import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Calendar, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logger from "@/utils/logger";

// Import destination images
import tokyoImg from '@/assets/destinations/tokyo.jpg';
import londonImg from '@/assets/destinations/london.jpg';
import bangkokImg from '@/assets/destinations/bangkok.jpg';
import newYorkImg from '@/assets/destinations/new-york.jpg';
import singaporeImg from '@/assets/destinations/singapore.jpg';
import dubaiImg from '@/assets/destinations/dubai.jpg';
import mumbaiImg from '@/assets/destinations/mumbai.jpg';
import losAngelesImg from '@/assets/destinations/los-angeles.jpg';
import sydneyImg from '@/assets/destinations/sydney.jpg';
import melbourneImg from '@/assets/destinations/melbourne.jpg';
import perthImg from '@/assets/destinations/perth.jpg';
import brisbaneImg from '@/assets/destinations/brisbane.jpg';
import maldivesImg from '@/assets/hero-maldives.jpg';

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

const getDestinationImage = (code: string): string => {
  const images: Record<string, string> = {
    'NRT': tokyoImg,
    'LON': londonImg,
    'BKK': bangkokImg,
    'NYC': newYorkImg,
    'SIN': singaporeImg,
    'DXB': dubaiImg,
    'BOM': mumbaiImg,
    'LAX': losAngelesImg,
    'SYD': sydneyImg,
    'MEL': melbourneImg,
    'PER': perthImg,
    'BNE': brisbaneImg,
  };
  return images[code] || maldivesImg;
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
          logger.error('Error fetching featured deals:', error);
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
        logger.error('Error fetching featured deals:', error);
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
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {deals.slice(0, 6).map((deal) => (
          <Card 
            key={deal.id} 
            className="flex-shrink-0 w-96 hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden border-0 bg-white shadow-xl"
            onClick={() => handleDealClick(deal)}
          >
            <div className="relative h-56 overflow-hidden">
              <img 
                src={getDestinationImage(deal.destination)} 
                alt={getDestinationName(deal.destination)}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Savings badge */}
              <Badge className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-3 py-1">
                Save ${deal.savings}
              </Badge>
              
              {/* Date */}
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(deal.departureDate)}</span>
              </div>
              
              {/* Route indicator */}
              <div className="absolute bottom-20 left-4 right-4">
                <div className="flex items-center justify-between text-white">
                  <div className="text-center">
                    <p className="font-bold text-lg">{deal.departure}</p>
                    <p className="text-xs opacity-90">{getDestinationName(deal.departure)}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-px bg-white/50"></div>
                    <Plane className="h-5 w-5 mx-2 rotate-45" />
                    <div className="w-8 h-px bg-white/50"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{deal.destination}</p>
                    <p className="text-xs opacity-90">{getDestinationName(deal.destination)}</p>
                  </div>
                </div>
              </div>
              
              {/* Destination name */}
              <div className="absolute bottom-4 left-4">
                <h3 className="font-bold text-2xl text-white">{getDestinationName(deal.destination)}</h3>
                {deal.airline && (
                  <p className="text-sm text-white/80">{deal.airline}</p>
                )}
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground line-through">
                      ${(parseInt(deal.price.total) + parseInt(deal.savings || '0')).toString()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">
                      ${deal.price.total}
                    </span>
                    <span className="text-sm text-muted-foreground">{deal.price.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">per person</p>
                </div>
                
                <Button 
                  className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all" 
                  size="lg"
                >
                  Book Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}