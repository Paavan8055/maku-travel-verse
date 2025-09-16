import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plane, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LocationOption {
  id: string;
  name: string;
  code: string;
  type: 'airport' | 'city';
  country?: string;
  region?: string;
  provider: 'sabre' | 'amadeus' | 'local';
}

interface LocationAutocompleteProps {
  placeholder?: string;
  value?: string;
  onSelect: (location: LocationOption) => void;
  className?: string;
  searchType?: 'flight' | 'hotel' | 'activity';
  disabled?: boolean;
}

export const LocationAutocompleteV2: React.FC<LocationAutocompleteProps> = ({
  placeholder = "Search destinations...",
  value = "",
  onSelect,
  className = "",
  searchType = 'flight',
  disabled = false
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Prioritize Sabre for flights, then Amadeus fallback
  const searchLocations = async (searchQuery: string): Promise<LocationOption[]> => {
    if (searchQuery.length < 2) return [];

    setIsLoading(true);
    const results: LocationOption[] = [];

    try {
      // 1. Try Sabre first (prioritized for flights)
      if (searchType === 'flight') {
        try {
          const { data: sabreData } = await supabase.functions.invoke('sabre-location-search', {
            body: { query: searchQuery, type: searchType }
          });
          
          if (sabreData?.locations) {
            results.push(...sabreData.locations.slice(0, 8).map((loc: any) => ({
              id: `sabre-${loc.code}`,
              name: loc.name,
              code: loc.code,
              type: loc.type || 'airport',
              country: loc.country,
              region: loc.region,
              provider: 'sabre' as const
            })));
          }
        } catch (error) {
          console.warn('Sabre location search failed:', error);
        }
      }

      // 2. Amadeus fallback or parallel search for hotels/activities
      if (results.length < 5) {
        try {
          const { data: amadeusData } = await supabase.functions.invoke('amadeus-location-search', {
            body: { query: searchQuery, type: searchType }
          });
          
          if (amadeusData?.locations) {
            const amadeusResults = amadeusData.locations.slice(0, 10 - results.length).map((loc: any) => ({
              id: `amadeus-${loc.iataCode || loc.code}`,
              name: loc.name,
              code: loc.iataCode || loc.code,
              type: loc.subType === 'AIRPORT' ? 'airport' : 'city',
              country: loc.address?.countryName,
              region: loc.address?.regionCode,
              provider: 'amadeus' as const
            }));
            
            results.push(...amadeusResults);
          }
        } catch (error) {
          console.warn('Amadeus location search failed:', error);
        }
      }

      // 3. Local database fallback
      if (results.length < 3) {
        const { data: localData } = await supabase
          .from(searchType === 'flight' ? 'airports' : 'cities')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,iata_code.ilike.%${searchQuery}%`)
          .limit(8 - results.length);

        if (localData) {
          const localResults = localData.map((loc: any) => ({
            id: `local-${loc.iata_code}`,
            name: loc.name,
            code: loc.iata_code,
            type: (searchType === 'flight' ? 'airport' : 'city') as 'airport' | 'city',
            country: loc.country_code,
            provider: 'local' as const
          }));
          
          results.push(...localResults);
        }
      }

      // Remove duplicates based on IATA code
      const uniqueResults = results.filter((item, index, self) => 
        index === self.findIndex(i => i.code === item.code)
      );

      return uniqueResults.slice(0, 10);

    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    if (newQuery.length >= 2) {
      setIsOpen(true);
      const results = await searchLocations(newQuery);
      setSuggestions(results);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  const handleSelect = (location: LocationOption) => {
    setQuery(`${location.name} (${location.code})`);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(location);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

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
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocationIcon = (type: string, provider: string) => {
    if (type === 'airport') return <Plane className="h-4 w-4 text-blue-500" />;
    if (type === 'city') return <Building className="h-4 w-4 text-green-500" />;
    return <MapPin className="h-4 w-4 text-gray-500" />;
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      sabre: 'bg-blue-100 text-blue-800',
      amadeus: 'bg-purple-100 text-purple-800',
      local: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors[provider as keyof typeof colors]}`}>
        {provider.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full",
          isLoading && "animate-pulse",
          className
        )}
        autoComplete="off"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((location, index) => (
            <div
              key={location.id}
              ref={el => suggestionRefs.current[index] = el}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-700",
                selectedIndex === index && "bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => handleSelect(location)}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getLocationIcon(location.type, location.provider)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {location.name}
                  </div>
                  {location.country && (
                    <div className="text-xs text-gray-500 truncate">
                      {location.code} • {location.country}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {getProviderBadge(location.provider)}
                <span className="text-xs font-mono text-gray-400">
                  {location.code}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && suggestions.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
          <div className="text-sm text-gray-500 text-center">
            No locations found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};