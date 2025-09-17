import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MapPin, Calendar, Users, Plane, Building, MapIcon, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { advancedCacheManager } from '@/features/search/lib/AdvancedCacheManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Destination {
  id: string;
  name: string;
  code?: string;
  country: string;
  type: 'city' | 'airport' | 'landmark' | 'region';
  coordinates?: [number, number];
  popularity?: number;
  description?: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'destination' | 'query';
  icon: React.ReactNode;
  metadata?: any;
}

interface GlobalDestinationSearchProps {
  onSearch: (searchData: {
    destination: string;
    searchType: 'unified' | 'flight' | 'hotel' | 'activity';
    dates?: { checkIn: Date; checkOut?: Date };
    travelers?: { adults: number; children: number };
  }) => void;
  placeholder?: string;
  initialSearchType?: 'unified' | 'flight' | 'hotel' | 'activity';
  showTypeSelector?: boolean;
  className?: string;
}

export const GlobalDestinationSearch: React.FC<GlobalDestinationSearchProps> = ({
  onSearch,
  placeholder = "Where would you like to go?",
  initialSearchType = 'unified',
  showTypeSelector = true,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState(initialSearchType);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 300);
  const { toast } = useToast();

  // Load user preferences and search history
  useEffect(() => {
    loadUserPreferences();
    loadTrendingSearches();
  }, []);

  // Handle destination search with intelligent suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchDestinations(debouncedQuery);
    } else {
      setDestinations([]);
      generateDefaultSuggestions();
    }
  }, [debouncedQuery]);

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: preferences } = await supabase
        .from('user_search_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferences) {
        const searchPatterns = preferences.search_patterns as any;
        const recent = searchPatterns?.recent_searches || [];
        setRecentSearches(recent.slice(0, 5));
      }
    } catch (error) {
      console.warn('Could not load user preferences:', error);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      const cacheStats = await advancedCacheManager.getStats();
      setTrendingSearches(cacheStats.popularQueries.slice(0, 8));
    } catch (error) {
      console.warn('Could not load trending searches:', error);
      // Fallback trending searches
      setTrendingSearches([
        'Sydney', 'Melbourne', 'Brisbane', 'Perth', 
        'Gold Coast', 'Adelaide', 'Hobart', 'Darwin'
      ]);
    }
  };

  const searchDestinations = useCallback(async (searchQuery: string) => {
    setLoading(true);
    
    try {
      // First try cache
      const cachedResults = await advancedCacheManager.get(
        `destinations:${searchQuery}`,
        'destination'
      );

      if (cachedResults) {
        setDestinations(cachedResults);
        generateSuggestions(cachedResults, searchQuery);
        setLoading(false);
        return;
      }

      // Simulate destination search (in real app, this would call your destination API)
      const mockDestinations: Destination[] = [
        {
          id: 'syd',
          name: 'Sydney',
          code: 'SYD',
          country: 'Australia',
          type: 'city' as const,
          coordinates: [-33.8688, 151.2093],
          popularity: 95,
          description: 'Harbor city with iconic Opera House'
        },
        {
          id: 'mel',
          name: 'Melbourne',
          code: 'MEL',
          country: 'Australia',
          type: 'city' as const,
          coordinates: [-37.8136, 144.9631],
          popularity: 88,
          description: 'Cultural capital with great coffee'
        },
        {
          id: 'bne',
          name: 'Brisbane',
          code: 'BNE',
          country: 'Australia',
          type: 'city' as const,
          coordinates: [-27.4705, 153.0260],
          popularity: 75,
          description: 'Subtropical capital of Queensland'
        }
      ].filter(dest => 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Cache the results
      await advancedCacheManager.set(
        `destinations:${searchQuery}`,
        'destination',
        mockDestinations,
        { ttl: 3600 }
      );

      setDestinations(mockDestinations);
      generateSuggestions(mockDestinations, searchQuery);

    } catch (error) {
      console.error('Destination search failed:', error);
      toast({
        title: "Search Error",
        description: "Could not load destination suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const generateSuggestions = useCallback((destResults: Destination[], searchQuery: string) => {
    const newSuggestions: SearchSuggestion[] = [];

    // Add destination suggestions
    destResults.slice(0, 5).forEach(dest => {
      newSuggestions.push({
        id: `dest-${dest.id}`,
        text: `${dest.name}${dest.code ? ` (${dest.code})` : ''}, ${dest.country}`,
        type: 'destination',
        icon: dest.type === 'city' ? <Building className="h-4 w-4" /> : <MapPin className="h-4 w-4" />,
        metadata: dest
      });
    });

    // Add smart query suggestions
    if (searchQuery.length >= 3) {
      const queryTypes = [
        { type: 'flight', text: `Flights to ${searchQuery}`, icon: <Plane className="h-4 w-4" /> },
        { type: 'hotel', text: `Hotels in ${searchQuery}`, icon: <Building className="h-4 w-4" /> },
        { type: 'activity', text: `Activities in ${searchQuery}`, icon: <MapIcon className="h-4 w-4" /> }
      ];

      queryTypes.forEach(qt => {
        newSuggestions.push({
          id: `query-${qt.type}`,
          text: qt.text,
          type: 'query',
          icon: qt.icon,
          metadata: { searchType: qt.type, destination: searchQuery }
        });
      });
    }

    setSuggestions(newSuggestions);
    setShowSuggestions(true);
  }, []);

  const generateDefaultSuggestions = useCallback(() => {
    const defaultSuggestions: SearchSuggestion[] = [];

    // Recent searches
    recentSearches.forEach(search => {
      defaultSuggestions.push({
        id: `recent-${search}`,
        text: search,
        type: 'recent',
        icon: <Clock className="h-4 w-4" />
      });
    });

    // Trending searches
    trendingSearches.slice(0, 6).forEach(search => {
      defaultSuggestions.push({
        id: `trending-${search}`,
        text: search,
        type: 'trending',
        icon: <TrendingUp className="h-4 w-4" />
      });
    });

    setSuggestions(defaultSuggestions.slice(0, 10));
  }, [recentSearches, trendingSearches]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'destination' && suggestion.metadata) {
      setQuery(suggestion.metadata.name);
      setShowSuggestions(false);
    } else if (suggestion.type === 'query' && suggestion.metadata) {
      setQuery(suggestion.metadata.destination);
      setSearchType(suggestion.metadata.searchType);
      setShowSuggestions(false);
      // Auto-trigger search
      setTimeout(() => handleSearch(), 100);
    } else {
      setQuery(suggestion.text);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a destination to search",
        variant: "destructive"
      });
      return;
    }

    // Save to recent searches
    await saveToRecentSearches(query);

    // Perform the search
    onSearch({
      destination: query,
      searchType,
      dates: checkIn ? { 
        checkIn, 
        checkOut: checkOut || addDays(checkIn, searchType === 'hotel' ? 1 : 0)
      } : undefined,
      travelers: { adults, children }
    });

    setShowSuggestions(false);
  };

  const saveToRecentSearches = async (searchQuery: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updatedRecent);

      // Update user preferences
      await supabase
        .from('user_search_preferences')
        .upsert({
          user_id: user.id,
          search_patterns: {
            recent_searches: updatedRecent,
            last_search_type: searchType
          }
        });
    } catch (error) {
      console.warn('Could not save search history:', error);
    }
  };

  const searchTypes = [
    { id: 'unified', label: 'All', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'flight', label: 'Flights', icon: <Plane className="h-4 w-4" /> },
    { id: 'hotel', label: 'Hotels', icon: <Building className="h-4 w-4" /> },
    { id: 'activity', label: 'Activities', icon: <MapIcon className="h-4 w-4" /> }
  ];

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search Type Selector */}
          {showTypeSelector && (
            <div className="flex space-x-2">
              {searchTypes.map(type => (
                <Button
                  key={type.id}
                  variant={searchType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchType(type.id as any)}
                  className="flex items-center space-x-2"
                >
                  {type.icon}
                  <span>{type.label}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Main Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                className="pl-10 h-12 text-lg"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
                <CardContent className="p-2">
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center space-x-3 p-3 hover:bg-accent rounded-md cursor-pointer group"
                    >
                      <div className="text-muted-foreground group-hover:text-foreground">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm">{suggestion.text}</span>
                      </div>
                      {suggestion.type === 'recent' && (
                        <Badge variant="secondary" className="text-xs">Recent</Badge>
                      )}
                      {suggestion.type === 'trending' && (
                        <Badge variant="outline" className="text-xs">Trending</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Date and Traveler Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check-in Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start h-12">
                  <Calendar className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, "MMM dd") : "Check-in"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Check-out Date (for hotels) */}
            {searchType === 'hotel' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start h-12">
                    <Calendar className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "MMM dd") : "Check-out"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => date < (checkIn || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Travelers */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start h-12">
                  <Users className="mr-2 h-4 w-4" />
                  {adults + children} {adults + children === 1 ? 'Traveler' : 'Travelers'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Adults</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{adults}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Children</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{children}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChildren(Math.min(9, children + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            size="lg"
            className="w-full h-12 text-lg"
            disabled={!query.trim()}
          >
            <Search className="mr-2 h-5 w-5" />
            Search {searchType === 'unified' ? 'Everything' : searchTypes.find(t => t.id === searchType)?.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};