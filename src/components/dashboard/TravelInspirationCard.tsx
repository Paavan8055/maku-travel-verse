import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, ArrowRight } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  country: string;
  rating: number;
  price: string;
  highlights: string[];
  image: string;
}

interface TravelInspirationCardProps {
  onExplore: (destination: Destination) => void;
}

export const TravelInspirationCard: React.FC<TravelInspirationCardProps> = ({ onExplore }) => {
  // Mock destinations - in production, this would come from an API
  const destinations: Destination[] = [
    {
      id: '1',
      name: 'Santorini',
      country: 'Greece',
      rating: 4.8,
      price: 'From $299',
      highlights: ['Stunning sunsets', 'White architecture', 'Wine tours'],
      image: '/api/placeholder/300/200'
    },
    {
      id: '2',
      name: 'Kyoto',
      country: 'Japan',
      rating: 4.9,
      price: 'From $399',
      highlights: ['Ancient temples', 'Cherry blossoms', 'Traditional culture'],
      image: '/api/placeholder/300/200'
    }
  ];

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Travel Inspiration</h3>
          <Badge variant="outline" className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-none text-xs">
            Trending
          </Badge>
        </div>
        
        <div className="space-y-3 flex-1">
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
                    <span className="text-xs text-muted-foreground">{destination.rating}</span>
                    <span className="text-xs font-medium text-primary">{destination.price}</span>
                  </div>
                  
                  <div className="flex gap-1 flex-wrap">
                    {destination.highlights.slice(0, 2).map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
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
        
        <Button variant="outline" className="w-full mt-4 text-sm" onClick={() => {}}>
          Explore More Destinations
        </Button>
      </CardContent>
    </Card>
  );
};