
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AIRPORTS } from "@/data/airports";

interface Destination {
  id: string;
  name: string;
  city?: string;
  country: string;
  code?: string;
  type: "city" | "airport" | "landmark" | "hotel";
  coordinates?: [number, number];
  displayName?: string;
}

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onDestinationSelect: (destination: Destination) => void;
  placeholder?: string;
  className?: string;
  searchType?: "city" | "airport" | "both";
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
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Popular destinations based on search type
  const getPopularDestinations = (): Destination[] => {
    if (searchType === "airport") {
      return AIRPORTS.slice(0, 8).map(airport => ({
        id: airport.iata.toLowerCase(),
        name: airport.name,
        city: airport.city,
        country: airport.country,
        code: airport.iata,
        type: "airport" as const,
        displayName: `${airport.city} (${airport.iata}) - ${airport.name}`
      }));
    }
    
    // Default city destinations
    return [
      { id: "syd", name: "Sydney", country: "Australia", type: "city", displayName: "Sydney, Australia" },
      { id: "mel", name: "Melbourne", country: "Australia", type: "city", displayName: "Melbourne, Australia" },
      { id: "bri", name: "Brisbane", country: "Australia", type: "city", displayName: "Brisbane, Australia" },
      { id: "per", name: "Perth", country: "Australia", type: "city", displayName: "Perth, Australia" },
      { id: "nyc", name: "New York", country: "United States", type: "city", displayName: "New York, United States" },
      { id: "lon", name: "London", country: "United Kingdom", type: "city", displayName: "London, United Kingdom" },
      { id: "par", name: "Paris", country: "France", type: "city", displayName: "Paris, France" },
      { id: "tok", name: "Tokyo", country: "Japan", type: "city", displayName: "Tokyo, Japan" }
    ];
  };

  const popularDestinations = getPopularDestinations();

  useEffect(() => {
    let active = true;
    const q = value.trim();
    
    if (q.length >= 2) {
      setLoading(true);
      const timeoutId = setTimeout(async () => {
        try {
          console.log("Searching for destinations:", q);
          
          // Try Amadeus first (most reliable)
          const searchTypes = searchType === "airport" ? ['AIRPORT'] : 
                             searchType === "both" ? ['CITY', 'AIRPORT'] : ['CITY'];
          
          const { data: amadeusData, error: amadeusError } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
            body: {
              query: q,
              types: searchTypes,
              limit: 8
            }
          });

          let results: Destination[] = [];

          if (!amadeusError && amadeusData?.results && Array.isArray(amadeusData.results)) {
            results = amadeusData.results.map((d: any) => ({
              ...d,
              displayName: d.city || d.name
            }));
            console.log("Amadeus results:", results.length);
          }

          // Try HotelBeds as supplementary (but don't fail if it doesn't work)
          try {
            const { data: hotelbedsData } = await supabase.functions.invoke('hotelbeds-autocomplete', {
              body: { query: q, limit: 6 }
            });

            if (hotelbedsData?.results && Array.isArray(hotelbedsData.results)) {
              const hotelbedsResults = hotelbedsData.results.map((d: any) => ({
                ...d,
                displayName: d.displayName || d.name
              }));
              
              // Merge results, avoiding duplicates
              const combinedResults = [...results];
              hotelbedsResults.forEach((hb: Destination) => {
                const isDuplicate = combinedResults.some(existing => 
                  existing.name.toLowerCase() === hb.name.toLowerCase() ||
                  (existing.displayName?.toLowerCase() === hb.displayName?.toLowerCase())
                );
                if (!isDuplicate) {
                  combinedResults.push(hb);
                }
              });
              results = combinedResults.slice(0, 12);
              console.log("Combined results with HotelBeds:", results.length);
            }
          } catch (hbError) {
            console.warn("HotelBeds failed, using Amadeus only:", hbError);
          }

          // If no results, try popular destinations that match the query
          if (results.length === 0) {
            const popularMatches = popularDestinations.filter(dest =>
              dest.name.toLowerCase().includes(q.toLowerCase()) ||
              dest.country.toLowerCase().includes(q.toLowerCase())
            );
            results = popularMatches.slice(0, 6);
            console.log("Using popular destinations fallback:", results.length);
          }

          if (!active) return;

          setSuggestions(results);
          setShowSuggestions(true);
          setLoading(false);
        } catch (error) {
          console.error("Search error:", error);
          if (!active) return;
          
          // Fallback to popular destinations on error
          const popularMatches = popularDestinations.filter(dest =>
            dest.name.toLowerCase().includes(q.toLowerCase()) ||
            dest.country.toLowerCase().includes(q.toLowerCase())
          );
          setSuggestions(popularMatches.slice(0, 6));
          setShowSuggestions(true);
          setLoading(false);
        }
      }, 300);

      return () => {
        active = false;
        clearTimeout(timeoutId);
      };
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  }, [value]);

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const mockLocation = {
        id: "current",
        name: "Current Location",
        country: "Your Area",
        type: "city" as const,
        coordinates: [position.coords.longitude, position.coords.latitude] as [number, number]
      };
      onDestinationSelect(mockLocation);
      onChange("Current Location");
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setGettingLocation(false);
    }
  };

  const formatDestinationLabel = (destination: Destination): string => {
    if (destination.displayName) return destination.displayName;
    
    const cityOrName = destination.city || destination.name;
    if (destination.type === "airport" && destination.code) {
      return `${cityOrName} (${destination.code}) - ${destination.name}`;
    }
    if (destination.type === "hotel") {
      return destination.city ? `${destination.name} — ${destination.city}` : destination.name;
    }
    if (destination.code) {
      return `${cityOrName} (${destination.code})`;
    }
    return destination.country ? `${destination.name}, ${destination.country}` : destination.name;
  };

  const handleSuggestionClick = (destination: Destination) => {
    const label = formatDestinationLabel(destination);
    onChange(label);
    onDestinationSelect(destination);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "airport":
        return "✈️";
      case "landmark":
        return "🏛️";
      case "hotel":
        return "🏨";
      default:
        return "🏙️";
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
            } else if (value.length === 0) {
              // Show popular destinations when focused with empty input
              setSuggestions(popularDestinations.slice(0, 6));
              setShowSuggestions(true);
            }
          }}
          className={cn("pl-10 pr-12", className)}
        />
        {gettingLocation && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading destinations…</p>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {value.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground bg-muted/50 border-b">
                  Popular destinations
                </div>
              )}
              {suggestions.map(destination => (
                <button
                  key={destination.id}
                  onClick={() => handleSuggestionClick(destination)}
                  className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center space-x-3 border-b border-border last:border-b-0"
                >
                  <span className="text-lg">{getTypeIcon(destination.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {formatDestinationLabel(destination)}
                    </div>
                    <div className="text-sm text-muted-foreground">{destination.country}</div>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{destination.type}</span>
                </button>
              ))}
            </>
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No destinations found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
