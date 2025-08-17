import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
          <Card key={route.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleRouteClick(route)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{route.departure}</span>
                  <Plane className="h-4 w-4 text-muted-foreground rotate-45" />
                  <span className="font-medium text-sm">{route.destination}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">{getDestinationName(route.destination)}</p>
              </div>
              
              <div className="flex items-center justify-between">
                {route.price && (
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">from</p>
                    <p className="font-semibold text-lg text-primary">
                      {route.price.currency} ${route.price.total}
                    </p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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