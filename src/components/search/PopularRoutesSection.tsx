import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import destination images
import tokyoImg from '@/assets/destinations/tokyo.jpg';
import londonImg from '@/assets/destinations/london.jpg';
import bangkokImg from '@/assets/destinations/bangkok.jpg';
import newYorkImg from '@/assets/destinations/new-york.jpg';
import singaporeImg from '@/assets/destinations/singapore.jpg';
import dubaiImg from '@/assets/destinations/dubai.jpg';
import maldivesImg from '@/assets/hero-maldives.jpg';
import swissAlpsImg from '@/assets/hero-swiss-alps.jpg';

interface PopularRoute {
  id: string;
  destination: string;
  departure: string;
  price?: {
    total: string;
    currency: string;
  };
  departureDate?: string;
  returnDate?: string;
}

interface PopularRoutesSectionProps {
  onRouteSelect?: (departure: string, destination: string, departureDate?: string, returnDate?: string) => void;
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

const getDestinationImage = (code: string): string => {
  const images: Record<string, string> = {
    'NRT': tokyoImg,
    'LON': londonImg,
    'BKK': bangkokImg,
    'NYC': newYorkImg,
    'SIN': singaporeImg,
    'DXB': dubaiImg,
    'BOM': maldivesImg,
    'LAX': swissAlpsImg,
    'SYD': maldivesImg,
    'MEL': swissAlpsImg,
    'PER': dubaiImg,
    'BNE': bangkokImg,
  };
  return images[code] || maldivesImg;
};

export function PopularRoutesSection({ onRouteSelect, origin = 'SYD' }: PopularRoutesSectionProps) {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopularRoutes() {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('amadeus-flight-inspiration', {
          body: { origin, type: 'inspiration' }
        });

        if (error) {
          console.error('Error fetching popular routes:', error);
          return;
        }

        if (data?.success && data?.data?.inspiration) {
          setRoutes(data.data.inspiration);
        }
      } catch (error) {
        console.error('Error fetching popular routes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPopularRoutes();
  }, [origin]);

  const handleRouteClick = (route: PopularRoute) => {
    if (onRouteSelect) {
      onRouteSelect(route.departure, route.destination, route.departureDate, route.returnDate);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Popular Routes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-muted rounded"></div>
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
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Popular Routes</h3>
        <span className="text-sm text-muted-foreground">from {getDestinationName(origin)}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {routes.slice(0, 8).map((route) => (
          <Card key={route.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-0 bg-white shadow-lg" onClick={() => handleRouteClick(route)}>
            <div className="relative h-48 overflow-hidden">
              <img 
                src={getDestinationImage(route.destination)} 
                alt={getDestinationName(route.destination)}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="font-medium text-sm">{route.departure}</span>
                <Plane className="h-3 w-3 text-primary rotate-45" />
                <span className="font-medium text-sm">{route.destination}</span>
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <h3 className="font-bold text-lg">{getDestinationName(route.destination)}</h3>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {route.price && (
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">from</p>
                    <p className="font-bold text-xl text-primary">
                      ${route.price.total}
                    </p>
                    <p className="text-xs text-muted-foreground">{route.price.currency}</p>
                  </div>
                )}
                
                <Button 
                  variant="default" 
                  size="sm"
                  className="group-hover:bg-primary-600 transition-colors shadow-md"
                >
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}