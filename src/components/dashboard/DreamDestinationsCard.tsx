import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Star, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DreamDestination {
  id: string;
  name: string;
  country: string;
  category: string;
  avg_daily_cost: number | null;
  highlights: string[] | null;
  continent: string;
}

interface DreamDestinationsCardProps {
  onExplore: (destination: DreamDestination) => void;
}

export const DreamDestinationsCard: React.FC<DreamDestinationsCardProps> = ({ onExplore }) => {
  const [destinations, setDestinations] = useState<DreamDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDreamDestinations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('dream_destinations')
          .select('id, name, country, category, avg_daily_cost, highlights, continent')
          .order('name');

        if (error) throw error;
        setDestinations(data || []);
      } catch (err) {
        setError('Failed to load dream destinations');
        console.error('Error fetching dream destinations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDreamDestinations();
  }, []);

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Dream Destinations</h3>
          <Badge variant="outline" className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-none text-xs">
            {destinations.length} Places
          </Badge>
        </div>
        
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {error}
            </div>
          ) : destinations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No dream destinations found
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {destinations.map((destination) => (
                  <div key={destination.id} className="group">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-semibold text-foreground text-sm truncate">{destination.name}</span>
                          <span className="text-xs text-muted-foreground">{destination.country}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          <span className="text-xs text-muted-foreground">{destination.category}</span>
                          {destination.avg_daily_cost && (
                            <span className="text-xs font-medium text-primary">
                              ${destination.avg_daily_cost}/day
                            </span>
                          )}
                        </div>
                        
                        {destination.highlights && destination.highlights.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {destination.highlights.slice(0, 2).map((highlight, index) => (
                              <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExplore(destination)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <Button variant="outline" className="w-full mt-4 text-sm" onClick={() => {}}>
          Explore More Destinations
        </Button>
      </CardContent>
    </Card>
  );
};