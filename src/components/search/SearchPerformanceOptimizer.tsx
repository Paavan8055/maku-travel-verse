import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchPerformanceOptimizerProps {
  onSearch: (query: string) => void;
  suggestions?: string[];
  recentSearches?: string[];
  trendingSearches?: string[];
  className?: string;
}

export const SearchPerformanceOptimizer: React.FC<SearchPerformanceOptimizerProps> = ({
  onSearch,
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  className
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMetrics, setSearchMetrics] = useState({
    totalSearches: 0,
    avgResponseTime: 0,
    cacheHits: 0
  });

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      onSearch(debouncedQuery);
      setSearchMetrics(prev => ({
        ...prev,
        totalSearches: prev.totalSearches + 1
      }));
    }
  }, [debouncedQuery, onSearch]);

  const filteredSuggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const allSuggestions = [
      ...suggestions,
      ...recentSearches.filter(s => s.toLowerCase().includes(query.toLowerCase())),
      ...trendingSearches.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    ];
    
    // Remove duplicates and limit to 8 suggestions
    return [...new Set(allSuggestions)].slice(0, 8);
  }, [query, suggestions, recentSearches, trendingSearches]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
    // Add small delay to prevent double-clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 100);
  }, [onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  }, [query]);

  const handleInputBlur = useCallback(() => {
    // Increased delay to prevent suggestions from disappearing before click
    setTimeout(() => setShowSuggestions(false), 300);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search destinations..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-4"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-2">
            <div className="space-y-1">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span>{suggestion}</span>
                    {recentSearches.includes(suggestion) && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        <Clock className="h-2 w-2 mr-1" />
                        Recent
                      </Badge>
                    )}
                    {trendingSearches.includes(suggestion) && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        <TrendingUp className="h-2 w-2 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-muted-foreground">
          Searches: {searchMetrics.totalSearches} | Cache hits: {searchMetrics.cacheHits}
        </div>
      )}
    </div>
  );
};

export default SearchPerformanceOptimizer;