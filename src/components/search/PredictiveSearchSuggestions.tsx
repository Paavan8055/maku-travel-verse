import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, TrendingUp, Clock, Star, Plane, Building, Camera, Sparkles } from 'lucide-react';
import { CrossModuleContextManager, crossModuleContextManager } from '@/services/core/CrossModuleContextManager';
import { IntelligentCacheManager, intelligentCacheManager } from '@/services/core/IntelligentCacheManager';

interface PredictiveSuggestion {
  id: string;
  type: 'destination' | 'date' | 'complete_search' | 'trending' | 'personal';
  title: string;
  subtitle?: string;
  confidence: number;
  popularity: number;
  metadata: any;
  icon?: React.ComponentType<any>;
}

interface SearchPattern {
  query: string;
  frequency: number;
  successRate: number;
  averagePrice: number;
  seasonality: string[];
  userType: string;
}

interface PredictiveSearchSuggestionsProps {
  searchType: 'hotel' | 'flight' | 'activity';
  currentInput: string;
  userId?: string;
  onSuggestionSelect: (suggestion: PredictiveSuggestion) => void;
  onInputChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PredictiveSearchSuggestions: React.FC<PredictiveSearchSuggestionsProps> = ({
  searchType,
  currentInput,
  userId,
  onSuggestionSelect,
  onInputChange,
  placeholder = "Where would you like to go?",
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<PredictiveSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchPatterns, setSearchPatterns] = useState<SearchPattern[]>([]);
  const [trendingDestinations, setTrendingDestinations] = useState<string[]>([]);

  // Debounce input changes
  const [debouncedInput, setDebouncedInput] = useState(currentInput);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(currentInput);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentInput]);

  // Generate suggestions when input changes
  useEffect(() => {
    if (debouncedInput.length >= 2) {
      generatePredictiveSuggestions(debouncedInput);
    } else if (debouncedInput.length === 0) {
      loadDefaultSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedInput, searchType, userId]);

  // Load initial data
  useEffect(() => {
    loadSearchPatterns();
    loadTrendingDestinations();
  }, [searchType]);

  const loadSearchPatterns = async () => {
    try {
      const patterns = await intelligentCacheManager.getSearchPatterns(searchType);
      setSearchPatterns(patterns);
    } catch (error) {
      console.error('Failed to load search patterns:', error);
    }
  };

  const loadTrendingDestinations = async () => {
    try {
      const trending = await intelligentCacheManager.getTrendingDestinations(searchType);
      setTrendingDestinations(trending);
    } catch (error) {
      console.error('Failed to load trending destinations:', error);
    }
  };

  const generatePredictiveSuggestions = async (input: string) => {
    setIsLoading(true);
    
    try {
      const suggestions: PredictiveSuggestion[] = [];
      
      // 1. Intelligent destination matching
      const destinationSuggestions = await generateDestinationSuggestions(input);
      suggestions.push(...destinationSuggestions);
      
      // 2. Personal history suggestions
      if (userId) {
        const personalSuggestions = await generatePersonalSuggestions(input, userId);
        suggestions.push(...personalSuggestions);
      }
      
      // 3. Trending and popular suggestions
      const trendingSuggestions = generateTrendingSuggestions(input);
      suggestions.push(...trendingSuggestions);
      
      // 4. Complete search suggestions
      const completeSuggestions = await generateCompleteSearchSuggestions(input);
      suggestions.push(...completeSuggestions);
      
      // 5. Predictive date suggestions
      const dateSuggestions = generateDateSuggestions(input);
      suggestions.push(...dateSuggestions);
      
      // Sort by relevance and confidence
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.confidence * b.popularity) - (a.confidence * a.popularity))
        .slice(0, 8);
      
      setSuggestions(sortedSuggestions);
      
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDestinationSuggestions = async (input: string): Promise<PredictiveSuggestion[]> => {
    const destinations = [
      { name: 'Sydney', country: 'Australia', popularity: 0.9 },
      { name: 'Melbourne', country: 'Australia', popularity: 0.8 },
      { name: 'Brisbane', country: 'Australia', popularity: 0.7 },
      { name: 'Perth', country: 'Australia', popularity: 0.6 },
      { name: 'Adelaide', country: 'Australia', popularity: 0.5 },
      { name: 'Tokyo', country: 'Japan', popularity: 0.95 },
      { name: 'Osaka', country: 'Japan', popularity: 0.8 },
      { name: 'Bangkok', country: 'Thailand', popularity: 0.85 },
      { name: 'Singapore', country: 'Singapore', popularity: 0.9 },
      { name: 'Bali', country: 'Indonesia', popularity: 0.88 }
    ];
    
    return destinations
      .filter(dest => 
        dest.name.toLowerCase().includes(input.toLowerCase()) ||
        dest.country.toLowerCase().includes(input.toLowerCase())
      )
      .map(dest => ({
        id: `dest-${dest.name}`,
        type: 'destination' as const,
        title: dest.name,
        subtitle: dest.country,
        confidence: calculateInputMatch(input, dest.name),
        popularity: dest.popularity,
        metadata: { destination: dest.name, country: dest.country },
        icon: MapPin
      }));
  };

  const generatePersonalSuggestions = async (input: string, userId: string): Promise<PredictiveSuggestion[]> => {
    try {
      const userContext = await crossModuleContextManager.getModuleContext('search_history', userId);
      
      if (!userContext?.searchHistory) return [];
      
      const recentSearches = userContext.searchHistory
        .filter((search: any) => 
          search.destination?.toLowerCase().includes(input.toLowerCase()) ||
          search.query?.toLowerCase().includes(input.toLowerCase())
        )
        .slice(0, 3);
      
      return recentSearches.map((search: any, index: number) => ({
        id: `personal-${index}`,
        type: 'personal' as const,
        title: `${search.destination || search.query}`,
        subtitle: 'From your recent searches',
        confidence: 0.9,
        popularity: 0.7,
        metadata: search,
        icon: Clock
      }));
      
    } catch (error) {
      console.error('Failed to generate personal suggestions:', error);
      return [];
    }
  };

  const generateTrendingSuggestions = (input: string): PredictiveSuggestion[] => {
    return trendingDestinations
      .filter(dest => dest.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 3)
      .map(dest => ({
        id: `trending-${dest}`,
        type: 'trending' as const,
        title: dest,
        subtitle: 'Trending destination',
        confidence: 0.8,
        popularity: 0.9,
        metadata: { destination: dest, trending: true },
        icon: TrendingUp
      }));
  };

  const generateCompleteSearchSuggestions = async (input: string): Promise<PredictiveSuggestion[]> => {
    const currentSeason = getCurrentSeason();
    const upcomingWeekend = getNextWeekend();
    
    const completeSearches = [
      {
        title: `${input} this weekend`,
        subtitle: `${formatDate(upcomingWeekend.start)} - ${formatDate(upcomingWeekend.end)}`,
        metadata: { 
          destination: input, 
          checkIn: upcomingWeekend.start, 
          checkOut: upcomingWeekend.end 
        }
      },
      {
        title: `${input} next month`,
        subtitle: 'Best rates for next month',
        metadata: { 
          destination: input, 
          month: 'next' 
        }
      },
      {
        title: `Best time to visit ${input}`,
        subtitle: `${currentSeason} recommendations`,
        metadata: { 
          destination: input, 
          season: currentSeason 
        }
      }
    ];
    
    return completeSearches.map((search, index) => ({
      id: `complete-${index}`,
      type: 'complete_search' as const,
      title: search.title,
      subtitle: search.subtitle,
      confidence: 0.7,
      popularity: 0.6,
      metadata: search.metadata,
      icon: getSearchTypeIcon()
    }));
  };

  const generateDateSuggestions = (input: string): PredictiveSuggestion[] => {
    if (!input.toLowerCase().includes('when') && !input.toLowerCase().includes('date')) {
      return [];
    }
    
    const suggestions = [
      {
        title: 'This weekend',
        subtitle: formatDateRange(getNextWeekend()),
        date: getNextWeekend()
      },
      {
        title: 'Next weekend', 
        subtitle: formatDateRange(getWeekendAfterNext()),
        date: getWeekendAfterNext()
      },
      {
        title: 'Next month',
        subtitle: 'Best availability',
        date: getNextMonth()
      }
    ];
    
    return suggestions.map((sug, index) => ({
      id: `date-${index}`,
      type: 'date' as const,
      title: sug.title,
      subtitle: sug.subtitle,
      confidence: 0.8,
      popularity: 0.7,
      metadata: sug.date,
      icon: Calendar
    }));
  };

  const loadDefaultSuggestions = () => {
    const defaultSuggestions: PredictiveSuggestion[] = [
      {
        id: 'trending-sydney',
        type: 'trending',
        title: 'Sydney',
        subtitle: 'Popular this season',
        confidence: 1,
        popularity: 0.9,
        metadata: { destination: 'Sydney' },
        icon: TrendingUp
      },
      {
        id: 'trending-melbourne',
        type: 'trending',
        title: 'Melbourne',
        subtitle: 'Great for weekend trips',
        confidence: 1,
        popularity: 0.8,
        metadata: { destination: 'Melbourne' },
        icon: MapPin
      },
      {
        id: 'weekend-deals',
        type: 'complete_search',
        title: 'Weekend getaways',
        subtitle: 'This weekend deals',
        confidence: 1,
        popularity: 0.7,
        metadata: { searchType: 'weekend' },
        icon: Calendar
      }
    ];
    
    setSuggestions(defaultSuggestions);
  };

  // Helper functions
  const calculateInputMatch = (input: string, target: string): number => {
    const inputLower = input.toLowerCase();
    const targetLower = target.toLowerCase();
    
    if (targetLower.startsWith(inputLower)) return 1;
    if (targetLower.includes(inputLower)) return 0.8;
    return 0.5;
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Autumn';
    return 'Winter';
  };

  const getNextWeekend = () => {
    const today = new Date();
    const friday = new Date(today);
    friday.setDate(today.getDate() + (5 - today.getDay()));
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    
    return { start: friday, end: sunday };
  };

  const getWeekendAfterNext = () => {
    const weekend = getNextWeekend();
    return {
      start: new Date(weekend.start.getTime() + 7 * 24 * 60 * 60 * 1000),
      end: new Date(weekend.end.getTime() + 7 * 24 * 60 * 60 * 1000)
    };
  };

  const getNextMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  const formatDateRange = (range: { start: Date; end: Date }): string => {
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  };

  const getSearchTypeIcon = () => {
    switch (searchType) {
      case 'flight': return Plane;
      case 'hotel': return Building;
      case 'activity': return Camera;
      default: return MapPin;
    }
  };

  const handleInputChange = (value: string) => {
    onInputChange(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: PredictiveSuggestion) => {
    // Track suggestion selection for learning
    intelligentCacheManager.recordSearchPattern({
      query: currentInput,
      selectedSuggestion: suggestion,
      searchType,
      userId: userId || 'anonymous',
      timestamp: new Date()
    });

    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (suggestion: PredictiveSuggestion) => {
    const Icon = suggestion.icon || MapPin;
    return <Icon className="h-4 w-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={currentInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pr-10"
        />
        <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {showSuggestions && (currentInput.length >= 0) && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                Generating smart suggestions...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="divide-y">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-accent"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`mt-0.5 ${getConfidenceColor(suggestion.confidence)}`}>
                        {getSuggestionIcon(suggestion)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{suggestion.title}</div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-muted-foreground">{suggestion.subtitle}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                        {suggestion.type === 'trending' && (
                          <TrendingUp className="h-3 w-3 text-orange-500" />
                        )}
                        {suggestion.type === 'personal' && (
                          <Star className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Start typing to see smart suggestions
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictiveSearchSuggestions;