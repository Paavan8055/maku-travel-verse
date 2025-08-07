// Enhanced destination autocomplete with geolocation API integration
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Destination {
  id: string;
  name: string;
  country: string;
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

  // Mock destinations database - In production, this would come from your geolocation API
  const mockDestinations: Destination[] = [
    { id: "1", name: "Paris", country: "France", type: "city", coordinates: [2.3522, 48.8566] },
    { id: "2", name: "Tokyo", country: "Japan", type: "city", coordinates: [139.6917, 35.6895] },
    { id: "3", name: "New York", country: "United States", type: "city", coordinates: [-74.0060, 40.7128] },
    { id: "4", name: "London", country: "United Kingdom", type: "city", coordinates: [-0.1276, 51.5074] },
    { id: "5", name: "Sydney", country: "Australia", type: "city", coordinates: [151.2093, -33.8688] },
    { id: "6", name: "Dubai", country: "UAE", type: "city", coordinates: [55.2708, 25.2048] },
    { id: "7", name: "Bali", country: "Indonesia", type: "city", coordinates: [115.0920, -8.4095] },
    { id: "8", name: "Rome", country: "Italy", type: "city", coordinates: [12.4964, 41.9028] },
    { id: "9", name: "Barcelona", country: "Spain", type: "city", coordinates: [2.1734, 41.3851] },
    { id: "10", name: "Maldives", country: "Maldives", type: "city", coordinates: [73.2207, 3.2028] }
  ];

  useEffect(() => {
    if (value.length >= 2) {
      setLoading(true);
      // Simulate API delay
      const timeoutId = setTimeout(() => {
        const filtered = mockDestinations.filter(dest =>
          dest.name.toLowerCase().includes(value.toLowerCase()) ||
          dest.country.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
        setLoading(false);
      }, 300);

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
                  <div className="text-sm text-muted-foreground">{destination.country}</div>
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