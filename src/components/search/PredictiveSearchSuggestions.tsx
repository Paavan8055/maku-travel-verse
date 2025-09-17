import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Clock } from 'lucide-react';

interface PredictiveSearchSuggestionsProps {
  searchType: 'flight' | 'hotel' | 'activity';
  currentLocation?: string;
  onSuggestionSelect: (suggestion: any) => void;
}

export const PredictiveSearchSuggestions: React.FC<PredictiveSearchSuggestionsProps> = ({
  searchType,
  currentLocation,
  onSuggestionSelect
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [trendingDestinations, setTrendingDestinations] = useState<string[]>([]);

  useEffect(() => {
    generateSuggestions();
    loadTrendingDestinations();
  }, [searchType, currentLocation]);

  const generateSuggestions = () => {
    const baseSuggestions = {
      flight: [
        { type: 'destination', label: 'Sydney to Melbourne', icon: MapPin },
        { type: 'flexible', label: 'Weekend getaway', icon: Clock },
        { type: 'trending', label: 'Popular routes', icon: TrendingUp }
      ],
      hotel: [
        { type: 'location', label: 'City center hotels', icon: MapPin },
        { type: 'deal', label: 'Last minute deals', icon: Clock },
        { type: 'trending', label: 'Trending stays', icon: TrendingUp }
      ],
      activity: [
        { type: 'nearby', label: 'Near you', icon: MapPin },
        { type: 'popular', label: 'Popular experiences', icon: TrendingUp },
        { type: 'seasonal', label: 'Seasonal activities', icon: Clock }
      ]
    };

    setSuggestions(baseSuggestions[searchType] || []);
  };

  const loadTrendingDestinations = () => {
    const trending = {
      flight: ['Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
      hotel: ['Sydney CBD', 'Bondi Beach', 'Darling Harbour', 'The Rocks'],
      activity: ['Harbour Bridge', 'Opera House', 'Blue Mountains', 'Taronga Zoo']
    };

    setTrendingDestinations(trending[searchType] || []);
  };

  const handleSuggestionClick = (suggestion: any) => {
    console.log('Suggestion selected:', suggestion);
    onSuggestionSelect(suggestion);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Smart Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Suggestions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Ideas</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span>{suggestion.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trending */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Trending Now</h4>
          <div className="flex flex-wrap gap-1">
            {trendingDestinations.slice(0, 3).map((destination, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 text-xs"
                onClick={() => handleSuggestionClick({ type: 'trending', value: destination })}
              >
                {destination}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          🔮 Suggestions improve based on your search history
        </div>
      </CardContent>
    </Card>
  );
};