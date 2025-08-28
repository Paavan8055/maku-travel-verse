
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Enhanced airport search function
  const searchLocalAirports = (query: string): Destination[] => {
    const normalizedQuery = query.toLowerCase().trim();
    
    return AIRPORTS.filter(airport => {
      // Match against airport name, city, IATA code, or combinations
      const nameMatch = airport.name.toLowerCase().includes(normalizedQuery);
      const cityMatch = airport.city.toLowerCase().includes(normalizedQuery);
      const codeMatch = airport.iata.toLowerCase().includes(normalizedQuery);
      
      // Handle specific format searches like "Sydney (SYD)" or "Melbourne (MEL)"
      const cityCodePattern = new RegExp(`${airport.city.toLowerCase()}.*\\(${airport.iata.toLowerCase()}\\)`);
      const formatMatch = cityCodePattern.test(normalizedQuery);
      
      // Handle IATA code searches
      const iataOnlyMatch = normalizedQuery === airport.iata.toLowerCase();
      
      return nameMatch || cityMatch || codeMatch || formatMatch || iataOnlyMatch;
    }).slice(0, 8).map(airport => ({
      id: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      code: airport.iata,
      type: 'airport' as const,
      coordinates: { lat: 0, lng: 0 }
    }));
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce API calls
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        const q = value.trim();
        let results: Destination[] = [];

        try {
          // Priority 1: Hotel search for hotel searchType - Try HotelBeds first, then Amadeus
          if (searchType === "hotel") {
            // Try HotelBeds first for hotel search
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
                results = [...hbResults];
                console.log('Found HotelBeds results:', results.length);
              }
            } catch (hbError) {
              logger.warn('HotelBeds search failed, trying Amadeus:', hbError);
            }

            // Fallback to Amadeus if HotelBeds didn't return enough results
            if (results.length < 3) {
              try {
                const { data: hotelData } = await supabase.functions.invoke('amadeus-hotel-autocomplete', {
                  body: { query: q, limit: 8 }
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
                  
                  // Merge with HotelBeds results, avoiding duplicates
                  amadeusResults.forEach((amadeus: Destination) => {
                    const isDuplicate = results.some(existing => 
                      existing.id === amadeus.id || 
                      (existing.name.toLowerCase() === amadeus.name.toLowerCase() && existing.city === amadeus.city)
                    );
                    if (!isDuplicate) {
                      results.push(amadeus);
                    }
                  });
                  console.log('Added Amadeus hotel results, total:', results.length);
                }
              } catch (amadeusError) {
                logger.warn('Amadeus hotel search failed:', amadeusError);
              }
            }
          }

          // Priority 2: Local airport search for airport searchType (enhanced fallback)
          if (searchType === "airport") {
            const localAirports = searchLocalAirports(q);
            if (localAirports.length > 0) {
              console.log('Found local airports:', localAirports.length);
              results = [...localAirports];
            }

            // If local search found results, still try Amadeus but don't overwrite good local results
            if (results.length < 3) {
              try {
                const { data: amadeusData } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
                  body: { 
                    query: q, 
                    types: ['AIRPORT'],
                    limit: 8 
                  }
                });

                if (amadeusData?.results && Array.isArray(amadeusData.results)) {
                  const amadeusResults = amadeusData.results.map((d: any) => ({
                    id: d.id || d.code,
                    name: d.name,
                    city: d.city,
                    country: d.country,
                    code: d.code,
                    type: 'airport' as const,
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
                logger.warn('Amadeus airport search failed, using local results:', amadeusError);
              }
            }
          }

          // Priority 3: City/destination search (fallback for hotels or primary for cities)
          if ((searchType === "city" || searchType === "both") && results.length < 3) {
            try {
              const { data: amadeusData } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
                body: { 
                  query: q, 
                  types: ['CITY'],
                  limit: 8 
                }
              });

              if (amadeusData?.results && Array.isArray(amadeusData.results)) {
                const amadeusResults = amadeusData.results.map((d: any) => ({
                  id: d.id,
                  name: d.name,
                  city: d.city,
                  country: d.country,
                  code: d.code,
                  type: 'city' as const,
                  coordinates: d.coordinates ? { 
                    lat: d.coordinates[1], 
                    lng: d.coordinates[0] 
                  } : { lat: 0, lng: 0 }
                }));
                
                // Merge with existing results, avoiding duplicates
                amadeusResults.forEach((amadeus: Destination) => {
                  const isDuplicate = results.some(existing => 
                    existing.id === amadeus.id || 
                    (existing.name.toLowerCase() === amadeus.name.toLowerCase() && existing.city === amadeus.city)
                  );
                  if (!isDuplicate) {
                    results.push(amadeus);
                  }
                });
              }
            } catch (amadeusError) {
              logger.warn('Amadeus city search failed:', amadeusError);
            }
          }

          // Priority 4: Popular destinations fallback
          if (results.length === 0) {
            const popularMatches = popularDestinations
              .filter(dest => 
                dest.name.toLowerCase().includes(q.toLowerCase()) ||
                dest.country.toLowerCase().includes(q.toLowerCase())
              )
              .slice(0, 5);
            results = [...popularMatches];
          }

          setSuggestions(results.slice(0, 8));
        } catch (error) {
          logger.error('Error fetching suggestions:', error);
          
          // Final fallback: if everything fails and it's an airport search, use local data
          if (searchType === "airport") {
            const localFallback = searchLocalAirports(q);
            setSuggestions(localFallback);
          } else {
            setSuggestions([]);
          }
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms debounce
    };

    fetchSuggestions();

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, searchType]);

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

  const handleSuggestionClick = (destination: Destination) => {
    const label = formatDestinationLabel(destination);
    onChange(label);
    onDestinationSelect(destination);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

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
          onFocus={() => {
            if (value.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          className={cn("pl-10 pr-12", className)}
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
                className="w-full px-4 py-3 text-left hover:bg-accent/50 flex items-center gap-3 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
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
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No destinations found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
