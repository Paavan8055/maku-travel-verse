// Enhanced destination autocomplete with geolocation API integration
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AIRPORTS } from "@/data/airports";
import { supabase } from "@/integrations/supabase/client";

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

// Global airports loader with localStorage TTL cache
const GLOBAL_AIRPORTS_URL =
  "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"; // community-maintained
const GLOBAL_AIRPORTS_STORAGE_KEY = "maku_global_airports_iata_v1";
const GLOBAL_AIRPORTS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

let GLOBAL_AIRPORTS_CACHE: Destination[] | null = null;
let GLOBAL_AIRPORTS_LOADING: Promise<Destination[]> | null = null;
let GLOBAL_AIRPORTS_ABORT: AbortController | null = null;

function normalizeString(str: string | undefined) {
  return (str || "").toLowerCase();
}

function buildSearchKey(a: Destination) {
  return [
    (a as any).code || "",
    a.city || "",
    a.name || "",
    a.country || ""
  ]
    .map((s) => normalizeString(String(s)))
    .join(" ");
}

function tryLoadFromStorage(): Destination[] | null {
  try {
    const raw = localStorage.getItem(GLOBAL_AIRPORTS_STORAGE_KEY);
    if (!raw) return null;
    const { ts, list } = JSON.parse(raw) as { ts: number; list: Destination[] };
    if (Date.now() - ts > GLOBAL_AIRPORTS_TTL_MS) return null;
    // ensure search keys
    (list as any[]).forEach((d) => {
      if (!(d as any)._s) (d as any)._s = buildSearchKey(d);
    });
    return list;
  } catch {
    return null;
  }
}

function saveToStorage(list: Destination[]) {
  try {
    const payload = JSON.stringify({ ts: Date.now(), list });
    localStorage.setItem(GLOBAL_AIRPORTS_STORAGE_KEY, payload);
  } catch {
    // storage full or disabled; ignore
  }
}

async function loadGlobalAirports(): Promise<Destination[]> {
  if (GLOBAL_AIRPORTS_CACHE) return GLOBAL_AIRPORTS_CACHE;
  const fromStorage = tryLoadFromStorage();
  if (fromStorage) {
    GLOBAL_AIRPORTS_CACHE = fromStorage;
    return fromStorage;
  }
  if (!GLOBAL_AIRPORTS_LOADING) {
    GLOBAL_AIRPORTS_ABORT = new AbortController();
    GLOBAL_AIRPORTS_LOADING = fetch(GLOBAL_AIRPORTS_URL, { signal: GLOBAL_AIRPORTS_ABORT.signal })
      .then((r) => r.json())
      .then((data: Record<string, any>) => {
        // Transform into Destination[]; keep only entries with IATA code
        const list: Destination[] = Object.values(data)
          .filter((a: any) => a && a.iata && String(a.iata).length === 3)
          .map((a: any) => {
            const d: Destination = {
              id: a.iata,
              name: `${a.city || a.name} (${a.iata}) - ${a.name}`.trim(),
              city: a.city || undefined,
              country: a.country || "",
              code: a.iata,
              type: "airport" as const,
            };
            (d as any)._s = buildSearchKey(d);
            return d;
          });
        GLOBAL_AIRPORTS_CACHE = list;
        saveToStorage(list);
        return list;
      })
      .catch(() => {
        GLOBAL_AIRPORTS_CACHE = [];
        return [];
      });
  }
  return GLOBAL_AIRPORTS_LOADING;
}

useEffect(() => {
  let active = true;
  const q = value.trim();
  if (q.length >= 2) {
    setLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        // 1) Try server-powered Amadeus autocomplete first
        const { data, error } = await supabase.functions.invoke(
          'amadeus-locations-autocomplete',
          { body: { query: q, types: ['CITY','AIRPORT'], limit: 12 } }
        );

        if (!active) return;

        if (!error && data && Array.isArray(data.results) && data.results.length > 0) {
          setSuggestions(data.results as Destination[]);
          setShowSuggestions(true);
          setLoading(false);
          return;
        }
      } catch (_) {
        // ignore and fall back
      }

      // 2) Fallback: local/global dataset search
      const qLower = q.toLowerCase();
      const global = await loadGlobalAirports();
      const dataset: Destination[] = (global && global.length > 0)
        ? global
        : AIRPORTS.map((a) => {
            const d: Destination = {
              id: a.iata,
              name: `${a.city} (${a.iata}) - ${a.name}`,
              city: a.city,
              country: a.country,
              code: a.iata,
              type: 'airport' as const,
            };
            (d as any)._s = buildSearchKey(d);
            return d;
          });

      if (!active) return;

      const matches = dataset
        .filter((d) => ((d as any)._s as string).includes(qLower))
        .slice(0, 12);

      setSuggestions(matches);
      setShowSuggestions(true);
      setLoading(false);
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
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

{showSuggestions && (
  <div
    ref={suggestionsRef}
    className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
  >
    {loading ? (
      <div className="p-4 text-center">
        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading airports…</p>
      </div>
    ) : suggestions.length > 0 ? (
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
    ) : (
      <div className="p-3 text-center text-sm text-muted-foreground">No matches found</div>
    )}
  </div>
)}
    </div>
  );
};