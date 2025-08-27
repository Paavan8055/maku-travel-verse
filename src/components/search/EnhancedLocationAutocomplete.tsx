import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronDown, MapPin, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface LocationOption {
  id: string;
  name: string;
  country?: string;
  region?: string;
  type: 'airport' | 'city' | 'destination';
  iataCode?: string;
  provider: 'sabre' | 'amadeus' | 'local';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface EnhancedLocationAutocompleteProps {
  placeholder?: string;
  value?: string;
  onSelect: (location: LocationOption) => void;
  className?: string;
  searchType?: 'flight' | 'hotel' | 'activity';
  disabled?: boolean;
  prioritizeProvider?: 'sabre' | 'amadeus';
}

export const EnhancedLocationAutocomplete: React.FC<EnhancedLocationAutocompleteProps> = ({
  placeholder = "Search destinations...",
  value = "",
  onSelect,
  className = "",
  searchType = 'flight',
  disabled = false,
  prioritizeProvider = 'sabre'
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Local fallback data for common destinations
  const LOCAL_DESTINATIONS: LocationOption[] = [
    { id: "syd", name: "Sydney", country: "Australia", type: "city", iataCode: "SYD", provider: "local" },
    { id: "mel", name: "Melbourne", country: "Australia", type: "city", iataCode: "MEL", provider: "local" },
    { id: "bne", name: "Brisbane", country: "Australia", type: "city", iataCode: "BNE", provider: "local" },
    { id: "per", name: "Perth", country: "Australia", type: "city", iataCode: "PER", provider: "local" },
    { id: "adl", name: "Adelaide", country: "Australia", type: "city", iataCode: "ADL", provider: "local" },
    { id: "lax", name: "Los Angeles", country: "United States", type: "airport", iataCode: "LAX", provider: "local" },
    { id: "jfk", name: "New York", country: "United States", type: "airport", iataCode: "JFK", provider: "local" },
    { id: "lhr", name: "London", country: "United Kingdom", type: "airport", iataCode: "LHR", provider: "local" },
    { id: "nrt", name: "Tokyo", country: "Japan", type: "airport", iataCode: "NRT", provider: "local" },
    { id: "sin", name: "Singapore", country: "Singapore", type: "airport", iataCode: "SIN", provider: "local" },
    { id: "bkk", name: "Bangkok", country: "Thailand", type: "airport", iataCode: "BKK", provider: "local" },
    { id: "dxb", name: "Dubai", country: "UAE", type: "airport", iataCode: "DXB", provider: "local" }
  ];

  // Enhanced search function with provider prioritization
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    let results: LocationOption[] = [];

    try {
      const normalizedQuery = searchQuery.toLowerCase().trim();

      // Priority 1: Local search for quick results
      const localResults = LOCAL_DESTINATIONS.filter(dest => 
        dest.name.toLowerCase().includes(normalizedQuery) ||
        dest.country?.toLowerCase().includes(normalizedQuery) ||
        dest.iataCode?.toLowerCase().includes(normalizedQuery)
      );

      if (localResults.length > 0) {
        results = [...localResults];
      }

      // Priority 2: Provider-specific search based on prioritizeProvider
      if (prioritizeProvider === 'sabre') {
        try {
          // Search Sabre first, then Amadeus
          const { data: sabreData, error: sabreError } = await supabase.functions.invoke('sabre-destinations-autocomplete', {
            body: { 
              query: searchQuery,
              searchType: searchType === 'flight' ? 'airport' : 'city',
              limit: 6
            }
          });

          if (!sabreError && sabreData?.success && sabreData.data) {
            const sabreResults = sabreData.data.map((item: any) => ({
              id: item.code || item.id,
              name: item.name,
              country: item.country,
              type: searchType === 'flight' ? 'airport' : 'city',
              iataCode: item.code,
              provider: 'sabre'
            })) as LocationOption[];

            // Merge with local results, avoiding duplicates
            const uniqueResults = [...results];
            sabreResults.forEach(sabreResult => {
              if (!uniqueResults.find(r => r.iataCode === sabreResult.iataCode)) {
                uniqueResults.push(sabreResult);
              }
            });
            results = uniqueResults;
          }

          // Fallback to Amadeus if Sabre fails or returns insufficient results
          if (results.length < 5) {
            const { data: amadeusData, error: amadeusError } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
              body: { 
                query: searchQuery,
                types: searchType === 'flight' ? ['AIRPORT'] : ['CITY'],
                limit: 8
              }
            });

            if (!amadeusError && amadeusData?.success && amadeusData.data) {
              const amadeusResults = amadeusData.data.map((item: any) => ({
                id: item.iataCode || item.id,
                name: item.name,
                country: item.address?.countryName,
                type: item.subType === 'AIRPORT' ? 'airport' : 'city',
                iataCode: item.iataCode,
                provider: 'amadeus',
                coordinates: item.geoCode ? {
                  latitude: item.geoCode.latitude,
                  longitude: item.geoCode.longitude
                } : undefined
              })) as LocationOption[];

              // Merge avoiding duplicates
              const uniqueResults = [...results];
              amadeusResults.forEach(amadeusResult => {
                if (!uniqueResults.find(r => r.iataCode === amadeusResult.iataCode)) {
                  uniqueResults.push(amadeusResult);
                }
              });
              results = uniqueResults;
            }
          }
        } catch (error) {
          logger.warn('Provider search failed, using local results only:', error);
        }
      } else {
        // Amadeus priority flow (similar structure, reversed order)
        try {
          const { data: amadeusData, error: amadeusError } = await supabase.functions.invoke('amadeus-locations-autocomplete', {
            body: { 
              query: searchQuery,
              types: searchType === 'flight' ? ['AIRPORT'] : ['CITY'],
              limit: 8
            }
          });

          if (!amadeusError && amadeusData?.success && amadeusData.data) {
            const amadeusResults = amadeusData.data.map((item: any) => ({
              id: item.iataCode || item.id,
              name: item.name,
              country: item.address?.countryName,
              type: item.subType === 'AIRPORT' ? 'airport' : 'city',
              iataCode: item.iataCode,
              provider: 'amadeus',
              coordinates: item.geoCode ? {
                latitude: item.geoCode.latitude,
                longitude: item.geoCode.longitude
              } : undefined
            })) as LocationOption[];

            const uniqueResults = [...results];
            amadeusResults.forEach(amadeusResult => {
              if (!uniqueResults.find(r => r.iataCode === amadeusResult.iataCode)) {
                uniqueResults.push(amadeusResult);
              }
            });
            results = uniqueResults;
          }

          // Fallback to Sabre if needed
          if (results.length < 5) {
            const { data: sabreData, error: sabreError } = await supabase.functions.invoke('sabre-destinations-autocomplete', {
              body: { 
                query: searchQuery,
                searchType: searchType === 'flight' ? 'airport' : 'city',
                limit: 6
              }
            });

            if (!sabreError && sabreData?.success && sabreData.data) {
              const sabreResults = sabreData.data.map((item: any) => ({
                id: item.code || item.id,
                name: item.name,
                country: item.country,
                type: searchType === 'flight' ? 'airport' : 'city',
                iataCode: item.code,
                provider: 'sabre'
              })) as LocationOption[];

              const uniqueResults = [...results];
              sabreResults.forEach(sabreResult => {
                if (!uniqueResults.find(r => r.iataCode === sabreResult.iataCode)) {
                  uniqueResults.push(sabreResult);
                }
              });
              results = uniqueResults;
            }
          }
        } catch (error) {
          logger.warn('Provider search failed, using local results only:', error);
        }
      }

      // Sort results: prioritized provider first, then local, then others
      results.sort((a, b) => {
        if (a.provider === prioritizeProvider && b.provider !== prioritizeProvider) return -1;
        if (b.provider === prioritizeProvider && a.provider !== prioritizeProvider) return 1;
        if (a.provider === 'local' && b.provider !== 'local') return -1;
        if (b.provider === 'local' && a.provider !== 'local') return 1;
        return 0;
      });

      setSuggestions(results.slice(0, 8));

    } catch (error) {
      logger.error('Location search error:', error);
      
      // Final fallback to local results only
      const fallbackResults = LOCAL_DESTINATIONS.filter(dest => 
        dest.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(fallbackResults.slice(0, 6));
    } finally {
      setIsLoading(false);
    }
  }, [searchType, prioritizeProvider]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchLocations]);

  const handleSelect = (location: LocationOption) => {
    setQuery(`${location.name} (${location.iataCode})`);
    setOpen(false);
    onSelect(location);
  };

  const getLocationIcon = (type: string) => {
    return type === 'airport' ? <Plane className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      sabre: 'bg-blue-100 text-blue-800',
      amadeus: 'bg-green-100 text-green-800',
      local: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={cn("text-xs px-1.5 py-0.5 rounded", colors[provider as keyof typeof colors])}>
        {provider}
      </span>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {query || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder={`Search ${searchType === 'flight' ? 'airports' : 'destinations'}...`}
            value={query}
            onValueChange={setQuery}
          />
          <CommandEmpty>
            {isLoading ? "Searching..." : "No destinations found."}
          </CommandEmpty>
          <CommandGroup>
            {suggestions.map((location) => (
              <CommandItem
                key={`${location.provider}-${location.id}`}
                onSelect={() => handleSelect(location)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {getLocationIcon(location.type)}
                  <div>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {location.country} {location.iataCode && `• ${location.iataCode}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getProviderBadge(location.provider)}
                  <Check
                    className={cn(
                      "h-4 w-4",
                      query === `${location.name} (${location.iataCode})` ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};