// Enhanced destination autocomplete with geolocation API integration
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AIRPORTS } from "@/data/airports";

interface Destination {
  id: string;
  name: string;
  city?: string;
  country: string;
  code?: string; // IATA code
  type: "city" | "airport" | "landmark";
  coordinates?: [number, number];
}

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onDestinationSelect: (destination: Destination) => void;
  placeholder?: string;
  className?: string;
}

export const DestinationAutocomplete = ({
  value,
  onChange,
  onDestinationSelect,
  placeholder = "Where to?",
  className
}: DestinationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Using AIRPORTS dataset for autocomplete

  useEffect(() => {
    if (value.trim().length >= 2) {
      setLoading(true);
      const timeoutId = setTimeout(() => {
        const q = value.toLowerCase();
        const airportMatches = AIRPORTS.filter(a =>
          a.iata.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q)
        ).slice(0, 8).map(a => ({
          id: a.iata,
          name: `${a.city} (${a.iata}) - ${a.name}`,
          city: a.city,
          country: a.country,
          code: a.iata,
          type: "airport" as const,
        }));

        const cityMap = new Map<string, { city: string; country: string }>();
        AIRPORTS.forEach(a => {
          const key = `${a.city}|${a.country}`;
          if (!cityMap.has(key)) cityMap.set(key, { city: a.city, country: a.country });
        });
        const cityMatches = Array.from(cityMap.values())
          .filter(c => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
          .slice(0, 5)
          .map((c, idx) => ({
            id: `city-${c.city}-${idx}`,
            name: `${c.city}, ${c.country}`,
            city: c.city,
            country: c.country,
            type: "city" as const,
          }));

        const merged = [...airportMatches, ...cityMatches].slice(0, 10);
        setSuggestions(merged);
        setShowSuggestions(true);
        setLoading(false);
      }, 250);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Mock reverse geocoding - In production, use a real service
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

  const handleSuggestionClick = (destination: Destination) => {
    onChange(destination.name);
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
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          className={cn("pl-10 pr-12", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          title="Use current location"
        >
          {gettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Searching destinations...</p>
            </div>
          ) : (
            suggestions.map((destination) => (
              <button
                key={destination.id}
                onClick={() => handleSuggestionClick(destination)}
                className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center space-x-3 border-b border-border last:border-b-0"
              >
                <span className="text-lg">{getTypeIcon(destination.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{destination.name}</div>
                    <div className="text-sm text-muted-foreground">{destination.type === 'airport' ? destination.country : destination.country}</div>
                  </div>
                <span className="text-xs text-muted-foreground capitalize">{destination.type}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};