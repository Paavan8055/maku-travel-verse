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
  code?: string; // IATA code or other code
  type: "city" | "airport" | "landmark" | "hotel";
  coordinates?: [number, number];
  // New: better display for input while keeping `name` minimal (often city)
  displayName?: string;
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
  const GLOBAL_AIRPORTS_URL = "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"; // community-maintained
  const GLOBAL_AIRPORTS_STORAGE_KEY = "maku_global_airports_iata_v1";
  const GLOBAL_AIRPORTS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

  let GLOBAL_AIRPORTS_CACHE: Destination[] | null = null;
  let GLOBAL_AIRPORTS_LOADING: Promise<Destination[]> | null = null;
  let GLOBAL_AIRPORTS_ABORT: AbortController | null = null;

  function normalizeString(str: string | undefined) {
    return (str || "").toLowerCase();
  }

  function buildSearchKey(a: Destination) {
    return [(a as any).code || "", a.city || "", a.name || "", a.country || "", a.displayName || ""]
      .map(s => normalizeString(String(s)))
      .join(" ");
  }

  function tryLoadFromStorage(): Destination[] | null {
    try {
      const raw = localStorage.getItem(GLOBAL_AIRPORTS_STORAGE_KEY);
      if (!raw) return null;
      const { ts, list } = JSON.parse(raw) as { ts: number; list: Destination[] };
      if (Date.now() - ts > GLOBAL_AIRPORTS_TTL_MS) return null;
      // ensure search keys
      (list as any[]).forEach(d => {
        if (!(d as any)._s) (d as any)._s = buildSearchKey(d);
      });
      return list;
    } catch {
      return null;
    }
  }

  function saveToStorage(list: Destination[]) {
    try {
      const payload = JSON.stringify({
        ts: Date.now(),
        list
      });
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
      GLOBAL_AIRPORTS_LOADING = fetch(GLOBAL_AIRPORTS_URL, {
        signal: GLOBAL_AIRPORTS_ABORT.signal
      })
        .then(r => r.json())
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
                type: "airport" as const
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
          // 1) Amadeus cities/airports
          const { data, error } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
            body: {
              query: q,
              types: ['CITY', 'AIRPORT'],
              limit: 8
            }
          });

          let merged: Destination[] = [];
          if (!error && data && Array.isArray(data.results)) {
            merged = (data.results as Destination[]).map((d) => {
              // Attach a helpful displayName without changing `name` (often plain city)
              const cityOrName = d.city || d.name;
              const alreadyHasCode = /\([A-Z]{3}\)/.test(d.name);
              const withCode = d.code && d.type === "airport" && !alreadyHasCode
                ? `${cityOrName} (${d.code}) - ${d.name}`
                : d.name;
              return { ...d, displayName: withCode };
            });
          }
          
          // 2) HotelBeds destinations + hotels
          try {
            const hb = await supabase.functions.invoke('hotelbeds-autocomplete', {
              body: { query: q, limit: 8 }
            });
            if (hb?.data?.results && Array.isArray(hb.data.results)) {
              const hbResults = (hb.data.results as Destination[]).map((d) => {
                // For hotels: keep `name` as city (so parent search by destination remains functional),
                // and use displayName as "Hotel — City"
                if (d.type === "hotel" && d.displayName) return d;
                if (d.type === "city") {
                  return { ...d, displayName: d.displayName || d.name };
                }
                return d;
              });

              // Merge with Amadeus, dedupe by display text then by name
              const byKey = new Map<string, Destination>();
              [...merged, ...hbResults].forEach((s) => {
                const key = (s.displayName || s.name).toLowerCase();
                if (!byKey.has(key)) byKey.set(key, s);
              });
              merged = Array.from(byKey.values()).slice(0, 12);
            }
          } catch (e) {
            // ignore HB errors, keep Amadeus results
            console.warn("hotelbeds-autocomplete failed, using Amadeus-only suggestions", e);
          }

          if (!active) return;

          // 3) Fallback to airports dataset if nothing found
          if (merged.length === 0) {
            const qLower = q.toLowerCase();
            const global = await loadGlobalAirports();
            const dataset: Destination[] = global && global.length > 0 ? global : AIRPORTS.map(a => {
              const d: Destination = {
                id: a.iata,
                name: `${a.city} (${a.iata}) - ${a.name}`,
                city: a.city,
                country: a.country,
                code: a.iata,
                type: 'airport' as const
              };
              (d as any)._s = buildSearchKey(d);
              return d;
            });
            const matches = dataset
              .filter(d => ((d as any)._s as string).includes(qLower))
              .slice(0, 12);
            setSuggestions(matches);
            setShowSuggestions(true);
            setLoading(false);
            return;
          }

          setSuggestions(merged);
          setShowSuggestions(true);
          setLoading(false);
          return;
        } catch (_) {
          // If everything fails, try airports fallback
          const qLower = q.toLowerCase();
          const global = await loadGlobalAirports();
          const dataset: Destination[] = global && global.length > 0 ? global : AIRPORTS.map(a => {
            const d: Destination = {
              id: a.iata,
              name: `${a.city} (${a.iata}) - ${a.name}`,
              city: a.city,
              country: a.country,
              code: a.iata,
              type: 'airport' as const
            };
            (d as any)._s = buildSearchKey(d);
            return d;
          });
          if (!active) return;
          const matches = dataset
            .filter(d => ((d as any)._s as string).includes(qLower))
            .slice(0, 12);
          setSuggestions(matches);
          setShowSuggestions(true);
          setLoading(false);
        }
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

  // Format a clear label including IATA code when available
  function formatDestinationLabel(destination: Destination): string {
    // Prefer displayName if available (e.g., "Hotel — City" or "City, CC")
    if (destination.displayName) return destination.displayName;

    const cityOrName = destination.city || destination.name;
    if (destination.type === "hotel") {
      // Hotel items: show "Hotel — City" when possible
      return destination.city ? `${destination.name} — ${destination.city}` : destination.name;
    }
    if (destination.code) {
      if (destination.type === "airport") {
        const alreadyHasCode = /\([A-Z]{3}\)/.test(destination.name);
        return alreadyHasCode ? destination.name : `${cityOrName} (${destination.code}) - ${destination.name}`;
      }
      return `${cityOrName} (${destination.code})`;
    }
    return destination.name;
  }

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
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          className={cn("pl-10 pr-12", className)}
        />
        
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading places & properties…</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map(destination => (
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
            ))
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};
