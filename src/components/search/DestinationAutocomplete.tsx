
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, Navigation, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AIRPORTS } from "@/data/airports";
import { useHotelBedsAutocomplete } from "@/hooks/useHotelBedsAutocomplete";
import logger from '@/utils/logger';

interface Destination {
  id: string;
  name: string;
  city?: string;
  country: string;
  code?: string;
  type: "city" | "airport" | "landmark" | "hotel";
  coordinates?: { lat: number; lng: number };
  displayName?: string;
}

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onDestinationSelect: (destination: Destination) => void;
  placeholder?: string;
  className?: string;
  searchType?: "city" | "airport" | "both" | "hotel";
}

export const DestinationAutocomplete = ({
  value,
  onChange,
  onDestinationSelect,
  placeholder = "Where to?",
  className,
  searchType = "city"
}: DestinationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { searchDestinations: searchHotelBedsDestinations, isLoading: isHotelBedsLoading } = useHotelBedsAutocomplete();

  // Popular destinations for fallback
  const popularDestinations: Destination[] = [
    { id: "syd", name: "Sydney", country: "Australia", type: "city" },
    { id: "mel", name: "Melbourne", country: "Australia", type: "city" },
    { id: "bri", name: "Brisbane", country: "Australia", type: "city" },
    { id: "per", name: "Perth", country: "Australia", type: "city" },
    { id: "nyc", name: "New York", country: "United States", type: "city" },
    { id: "lon", name: "London", country: "United Kingdom", type: "city" },
    { id: "par", name: "Paris", country: "France", type: "city" },
    { id: "tok", name: "Tokyo", country: "Japan", type: "city" }
  ];

  // Enhanced local search with fuzzy matching and scoring
  const searchLocalAirports = useCallback((query: string): Destination[] => {
    if (!query?.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const results: { destination: Destination; score: number }[] = [];
    
    // Popular airports for quick access
    const popularAirports = ['SYD', 'MEL', 'BNE', 'PER', 'LAX', 'JFK', 'LHR', 'NRT', 'DXB', 'SIN'];
    
    AIRPORTS.forEach(airport => {
      if (!airport?.iata || !airport?.name || !airport?.city) return;
      
      const name = airport.name.toLowerCase();
      const city = airport.city.toLowerCase();
      const code = airport.iata.toLowerCase();
      let score = 0;
      
      // Exact IATA code match gets highest priority
      if (code === normalizedQuery) score += 1000;
      else if (code.startsWith(normalizedQuery)) score += 800;
      else if (code.includes(normalizedQuery)) score += 600;
      
      // City name matching
      if (city === normalizedQuery) score += 900;
      else if (city.startsWith(normalizedQuery)) score += 700;
      else if (city.includes(normalizedQuery)) score += 500;
      
      // Airport name matching
      if (name.startsWith(normalizedQuery)) score += 400;
      else if (name.includes(normalizedQuery)) score += 300;
      
      // Popular airport bonus
      if (popularAirports.includes(airport.iata)) score += 100;
      
      // Only include if we have a meaningful match
      if (score > 0) {
        results.push({
          destination: {
            id: airport.iata,
            name: airport.name,
            city: airport.city,
            country: airport.country,
            code: airport.iata,
            type: 'airport' as const,
            coordinates: airport.coordinates || { lat: 0, lng: 0 }
          },
          score
        });
      }
    });
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => r.destination);
  }, []);

  // Local city search for non-airport types
  const searchLocalCities = useCallback((query: string): Destination[] => {
    if (!query?.trim()) return popularDestinations.slice(0, 6);
    
    const normalizedQuery = query.toLowerCase().trim();
    
    return popularDestinations
      .filter(dest => 
        dest.name.toLowerCase().includes(normalizedQuery) ||
        dest.country.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 6);
  }, []);

  // Main search logic with local-first approach
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 1) {
        // Show popular suggestions when no input
        const defaultSuggestions = searchType === "airport" 
          ? searchLocalAirports("").slice(0, 6)
          : popularDestinations.slice(0, 6);
        setSuggestions(defaultSuggestions);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Shorter debounce for better UX
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        setSelectedIndex(-1);
        
        const q = value.trim();
        let results: Destination[] = [];

        // Always start with local search for fast results
        if (searchType === "airport") {
          results = searchLocalAirports(q);
        } else {
          results = searchLocalCities(q);
        }

        // Only call external APIs for longer queries (3+ chars) and when local results are insufficient
        if (q.length >= 3 && results.length < 3) {
          try {
            abortControllerRef.current = new AbortController();
            
            // Priority 1: Hotel search for hotel searchType
            if (searchType === "hotel") {
              try {
                const hotelBedsResults = await searchHotelBedsDestinations(q, 6);
                if (hotelBedsResults.success && hotelBedsResults.suggestions.length > 0) {
                  const hbResults = hotelBedsResults.suggestions.map(suggestion => ({
                    id: suggestion.id,
                    name: suggestion.name,
                    city: suggestion.name,
                    country: suggestion.country || '',
                    code: suggestion.code || suggestion.id,
                    type: suggestion.type === 'hotel' ? 'hotel' as const : 'city' as const,
                    coordinates: { lat: 0, lng: 0 },
                    displayName: suggestion.displayName
                  }));
                  
                  // Merge with local results, avoiding duplicates
                  hbResults.forEach((hb: Destination) => {
                    const isDuplicate = results.some(existing => 
                      existing.id === hb.id || 
                      (existing.name.toLowerCase() === hb.name.toLowerCase())
                    );
                    if (!isDuplicate) {
                      results.push(hb);
                    }
                  });
                }
              } catch (hbError) {
                if (!abortControllerRef.current?.signal.aborted) {
                  logger.warn('HotelBeds search failed:', hbError);
                }
              }

              // Fallback to Amadeus if still need more results
              if (results.length < 5 && !abortControllerRef.current?.signal.aborted) {
                try {
                  const { data: hotelData } = await supabase.functions.invoke('amadeus-hotel-autocomplete', {
                    body: { query: q, limit: 6 }
                  });

                  if (hotelData?.success && hotelData.suggestions && Array.isArray(hotelData.suggestions)) {
                    const amadeusResults = hotelData.suggestions.map((hotel: any) => ({
                      id: hotel.hotelId || hotel.id,
                      name: hotel.name,
                      city: hotel.address?.cityName || '',
                      country: hotel.address?.countryCode || '',
                      code: hotel.hotelId || hotel.id,
                      type: 'hotel' as const,
                      coordinates: hotel.geoCode ? { 
                        lat: parseFloat(hotel.geoCode.latitude), 
                        lng: parseFloat(hotel.geoCode.longitude) 
                      } : { lat: 0, lng: 0 }
                    }));
                    
                    // Merge avoiding duplicates
                    amadeusResults.forEach((amadeus: Destination) => {
                      const isDuplicate = results.some(existing => 
                        existing.id === amadeus.id || 
                        (existing.name.toLowerCase() === amadeus.name.toLowerCase())
                      );
                      if (!isDuplicate) {
                        results.push(amadeus);
                      }
                    });
                  }
                } catch (amadeusError) {
                  if (!abortControllerRef.current?.signal.aborted) {
                    logger.warn('Amadeus hotel search failed:', amadeusError);
                  }
                }
              }
            }

            // Priority 2: Airport/City search enhancement for external APIs
            if ((searchType === "airport" || searchType === "city" || searchType === "both") && 
                results.length < 5 && q.length >= 4 && !abortControllerRef.current?.signal.aborted) {
              try {
                const types = searchType === "airport" ? ['AIRPORT'] : 
                             searchType === "city" ? ['CITY'] : 
                             ['AIRPORT', 'CITY'];
                
                const { data: amadeusData } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
                  body: { 
                    query: q, 
                    types,
                    limit: 5
                  }
                });

                if (amadeusData?.results && Array.isArray(amadeusData.results)) {
                  const amadeusResults = amadeusData.results.map((d: any) => ({
                    id: d.id || d.code,
                    name: d.name,
                    city: d.city,
                    country: d.country,
                    code: d.code,
                    type: d.type?.toLowerCase() === 'airport' ? 'airport' as const : 'city' as const,
                    coordinates: d.coordinates ? { 
                      lat: d.coordinates[1], 
                      lng: d.coordinates[0] 
                    } : { lat: 0, lng: 0 }
                  }));
                  
                  // Merge with existing results, avoiding duplicates
                  amadeusResults.forEach((amadeus: Destination) => {
                    const isDuplicate = results.some(existing => 
                      existing.code === amadeus.code || 
                      (existing.name.toLowerCase() === amadeus.name.toLowerCase() && existing.city === amadeus.city)
                    );
                    if (!isDuplicate) {
                      results.push(amadeus);
                    }
                  });
                }
              } catch (amadeusError) {
                if (!abortControllerRef.current?.signal.aborted) {
                  logger.warn('Amadeus search failed:', amadeusError);
                }
              }
            }
          } catch (error) {
            if (!abortControllerRef.current?.signal.aborted) {
              logger.error('Error fetching external suggestions:', error);
            }
          }
        }

        // Ensure we always have some results
        if (results.length === 0 && q.length >= 2) {
          results = popularDestinations
            .filter(dest => 
              dest.name.toLowerCase().includes(q.toLowerCase()) ||
              dest.country.toLowerCase().includes(q.toLowerCase())
            )
            .slice(0, 5);
        }

        setSuggestions(results.slice(0, 8));
        setIsLoading(false);
      }, 250); // Reduced debounce for better responsiveness
    };

    fetchSuggestions();

    // Cleanup timeout and abort controller on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, searchType, searchLocalAirports, searchLocalCities]);

  const formatDestinationLabel = (destination: Destination) => {
    // Add visual indicators for different types
    const icon = destination.type === 'hotel' ? '🏨' : 
                 destination.type === 'airport' ? '✈️' : '🏙️';
    
    if (destination.type === 'hotel') {
      return `${icon} ${destination.name}${destination.city ? ` — ${destination.city}` : ''}`;
    }
    if (destination.code && destination.code !== destination.name) {
      return `${icon} ${destination.name} (${destination.code})`;
    }
    if (destination.city && destination.city !== destination.name) {
      return `${icon} ${destination.name}, ${destination.city}`;
    }
    return `${icon} ${destination.name}`;
  };

  const handleSuggestionClick = useCallback((destination: Destination) => {
    const label = formatDestinationLabel(destination);
    onChange(label);
    onDestinationSelect(destination);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [onChange, onDestinationSelect]);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isComposing) return;
    
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && !showSuggestions) {
        setShowSuggestions(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick, isComposing]);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const currentLocation: Destination = {
        id: "current",
        name: "Current Location",
        country: "Your Area",
        type: "city",
        coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
      };
      
      onDestinationSelect(currentLocation);
      onChange("Current Location");
      setShowSuggestions(false);
    } catch (error) {
      logger.error("Error getting location:", error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          className={cn("pl-10 pr-12", className)}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
        />
        {isGettingLocation && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
        {searchType !== "hotel" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          role="listbox"
          aria-label="Destination suggestions"
        >
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Searching destinations...</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.id}-${suggestion.type}-${index}`}
                id={`suggestion-${index}`}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center gap-3 transition-colors",
                  "hover:bg-accent/70 focus:bg-accent/70 focus:outline-none",
                  selectedIndex === index && "bg-accent/70"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {formatDestinationLabel(suggestion)}
                  </div>
                  {suggestion.country && (
                    <div className="text-sm text-muted-foreground truncate">
                      {suggestion.country}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : value.trim().length > 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No destinations found for "{value.trim()}". Try different keywords.
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Start typing to search destinations...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
