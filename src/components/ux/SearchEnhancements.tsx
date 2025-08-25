import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Star, 
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'destination' | 'hotel' | 'activity' | 'recent' | 'trending';
  icon?: React.ReactNode;
  metadata?: {
    country?: string;
    rating?: number;
    price?: string;
    popularity?: number;
  };
}

interface EnhancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  trendingSearches?: string[];
  isLoading?: boolean;
  className?: string;
}

// Enhanced search bar with intelligent suggestions
export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search destinations, hotels, activities...",
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  isLoading = false,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const debouncedValue = useDebounce(value, 300);

  // Generate smart suggestions based on input
  const smartSuggestions = useMemo(() => {
    if (!value.trim()) {
      return [
        ...recentSearches.slice(0, 3).map((search, index) => ({
          id: `recent-${index}`,
          text: search,
          type: 'recent' as const,
          icon: <Clock className="h-4 w-4" />
        })),
        ...trendingSearches.slice(0, 3).map((search, index) => ({
          id: `trending-${index}`,
          text: search,
          type: 'trending' as const,
          icon: <TrendingUp className="h-4 w-4" />
        }))
      ];
    }

    const filtered = suggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(value.toLowerCase())
    );

    return filtered.slice(0, 8);
  }, [value, suggestions, recentSearches, trendingSearches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || smartSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < smartSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(smartSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleSearch = () => {
    if (value.trim()) {
      onSearch(value);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    if (suggestion.icon) return suggestion.icon;
    
    switch (suggestion.type) {
      case 'destination': return <MapPin className="h-4 w-4" />;
      case 'hotel': return <Star className="h-4 w-4" />;
      case 'activity': return <Star className="h-4 w-4" />;
      case 'recent': return <Clock className="h-4 w-4" />;
      case 'trending': return <TrendingUp className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionBadge = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'recent': return <Badge variant="outline" className="text-xs">Recent</Badge>;
      case 'trending': return <Badge variant="secondary" className="text-xs">Trending</Badge>;
      default: return null;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className={cn(
        "relative bg-background border rounded-lg transition-all duration-200",
        isFocused ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border",
        "hover:border-primary/50"
      )}>
        <div className="flex items-center px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          
          {value && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && smartSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border rounded-lg shadow-xl max-h-80 overflow-auto"
          >
            {smartSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                ref={(el) => (suggestionRefs.current[suggestion.id] = el)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={cn(
                  "flex items-center justify-between p-3 cursor-pointer transition-colors border-b last:border-b-0",
                  selectedIndex === index
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-muted-foreground">
                    {getSuggestionIcon(suggestion)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {suggestion.text}
                    </p>
                    {suggestion.metadata && (
                      <div className="flex items-center space-x-2 mt-1">
                        {suggestion.metadata.country && (
                          <span className="text-xs text-muted-foreground">
                            {suggestion.metadata.country}
                          </span>
                        )}
                        {suggestion.metadata.rating && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs ml-1">
                              {suggestion.metadata.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {suggestion.metadata?.price && (
                    <span className="text-sm font-medium text-primary">
                      {suggestion.metadata.price}
                    </span>
                  )}
                  {getSuggestionBadge(suggestion)}
                </div>
              </motion.div>
            ))}
            
            {value && (
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearch}
                  className="w-full justify-start"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search for "{value}"
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced search filters with smart defaults
export const SmartSearchFilters = ({
  filters,
  onFiltersChange,
  className
}: {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  className?: string;
}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const filterOptions = [
    {
      key: 'priceRange',
      label: 'Price Range',
      type: 'range',
      min: 0,
      max: 1000,
      step: 50
    },
    {
      key: 'rating',
      label: 'Minimum Rating',
      type: 'rating',
      options: [1, 2, 3, 4, 5]
    },
    {
      key: 'amenities',
      label: 'Amenities',
      type: 'multiselect',
      options: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar']
    }
  ];

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    
    if (value && !activeFilters.includes(key)) {
      setActiveFilters([...activeFilters, key]);
    } else if (!value && activeFilters.includes(key)) {
      setActiveFilters(activeFilters.filter(f => f !== key));
    }
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
    setActiveFilters(activeFilters.filter(f => f !== key));
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setActiveFilters([]);
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Filters</h3>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-primary"
            >
              Clear all
            </Button>
          )}
        </div>
        
        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map(filterKey => (
              <Badge
                key={filterKey}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filterOptions.find(f => f.key === filterKey)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(filterKey)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        
        <div className="space-y-4">
          {filterOptions.map(option => (
            <div key={option.key}>
              <label className="text-sm font-medium mb-2 block">
                {option.label}
              </label>
              
              {option.type === 'range' && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    value={filters[option.key] || option.min}
                    onChange={(e) => handleFilterChange(option.key, parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${option.min}</span>
                    <span>${filters[option.key] || option.min}</span>
                    <span>${option.max}</span>
                  </div>
                </div>
              )}
              
              {option.type === 'rating' && (
                <div className="flex space-x-1">
                  {option.options?.map(rating => (
                    <Button
                      key={rating}
                      variant={filters[option.key] === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange(
                        option.key, 
                        filters[option.key] === rating ? null : rating
                      )}
                      className="flex items-center"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {rating}+
                    </Button>
                  ))}
                </div>
              )}
              
              {option.type === 'multiselect' && (
                <div className="grid grid-cols-2 gap-2">
                  {option.options?.map(opt => (
                    <Button
                      key={opt}
                      variant={
                        filters[option.key]?.includes(opt) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        const current = filters[option.key] || [];
                        const updated = current.includes(opt)
                          ? current.filter((item: string) => item !== opt)
                          : [...current, opt];
                        handleFilterChange(option.key, updated);
                      }}
                      className="text-xs"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Smart search results with advanced sorting and view modes
export const SmartSearchResults = ({
  results,
  isLoading,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  className
}: {
  results: any[];
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}) => {
  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Distance' }
  ];

  return (
    <div className={className}>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            {results.length} results found
          </h2>
          <p className="text-muted-foreground">
            Best matches for your search
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* View mode toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Results grid/list */}
      <motion.div
        className={cn(
          "transition-all duration-300",
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}
        layout
      >
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              {/* Result card component would go here */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{result.name}</h3>
                  <p className="text-muted-foreground">{result.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};