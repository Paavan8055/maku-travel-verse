import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Star, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';

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
  const { destinations, loading, error, viewDestination } = useEnhancedDreams({ 
    limit: 10,
    includeAIContext: true 
  });

  // Convert enhanced destinations to legacy format for compatibility
  const legacyDestinations: DreamDestination[] = destinations.map(dest => ({
    id: dest.id,
    name: dest.name,
    country: dest.country,
    category: dest.category,
    avg_daily_cost: dest.avg_daily_cost,
    highlights: dest.highlights,
    continent: dest.continent,
  }));

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart Dream Destinations
          </h3>
          <Badge variant="outline" className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-none text-xs">
            {legacyDestinations.length} Places
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
          ) : legacyDestinations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No dream destinations found
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {legacyDestinations.map((destination, index) => {
                  const enhancedDest = destinations[index];
                  return (
                  <Card key={destination.id} className="group border border-border/50 hover:border-border transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
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
                    </CardContent>
                  </Card>
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