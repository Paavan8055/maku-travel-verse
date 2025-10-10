import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  X, 
  Calendar,
  Hash,
  Type
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
}

interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

interface Filter {
  key: string;
  value: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
}

interface EnhancedSearchProps<T> {
  data: T[];
  onFilteredData: (filtered: T[]) => void;
  searchFields: string[];
  filterOptions: FilterOption[];
  sortOptions: SortOption[];
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function EnhancedSearch<T extends Record<string, any>>({
  data,
  onFilteredData,
  searchFields,
  filterOptions,
  sortOptions,
  placeholder = "Search...",
  className,
  debounceMs = 300
}: EnhancedSearchProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      processData();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilters, sortBy, data]);

  const processData = () => {
    let filtered = [...data];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = getNestedValue(item, field);
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    activeFilters.forEach(filter => {
      filtered = filtered.filter(item => {
        const value = getNestedValue(item, filter.key);
        return applyFilter(value, filter.value, filter.operator);
      });
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = getNestedValue(a, sortBy.key);
        const bValue = getNestedValue(b, sortBy.key);
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortBy.direction === 'desc' ? -comparison : comparison;
      });
    }

    onFilteredData(filtered);
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const applyFilter = (value: any, filterValue: string, operator: string): boolean => {
    const val = String(value).toLowerCase();
    const filter = filterValue.toLowerCase();

    switch (operator) {
      case 'equals':
        return val === filter;
      case 'contains':
        return val.includes(filter);
      case 'gt':
        return Number(value) > Number(filterValue);
      case 'lt':
        return Number(value) < Number(filterValue);
      case 'gte':
        return Number(value) >= Number(filterValue);
      case 'lte':
        return Number(value) <= Number(filterValue);
      default:
        return true;
    }
  };

  const addFilter = (option: FilterOption, value: string) => {
    if (!value.trim()) return;

    const operator = option.type === 'number' ? 'gte' : 'contains';
    const newFilter: Filter = {
      key: option.key,
      value,
      operator
    };

    setActiveFilters(prev => {
      const existing = prev.findIndex(f => f.key === option.key);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newFilter;
        return updated;
      }
      return [...prev, newFilter];
    });
  };

  const removeFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveFilters([]);
    setSortBy(null);
  };

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const resultsCount = useMemo(() => {
    const count = data.length;
    if (searchQuery.trim() || activeFilters.length > 0) {
      // This would be calculated in processData, but for display we'll estimate
      return count;
    }
    return count;
  }, [data.length, searchQuery, activeFilters]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Add Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filterOptions.map(option => (
                <DropdownMenuItem key={option.key} className="flex flex-col items-start p-3">
                  <div className="flex items-center gap-2 mb-2 w-full">
                    {getFilterIcon(option.type)}
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <Input
                    placeholder={`Filter by ${option.label.toLowerCase()}...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addFilter(option, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full"
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {sortBy ? (
                  sortBy.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map(option => (
                <DropdownMenuItem
                  key={`${option.key}-${option.direction}`}
                  onClick={() => setSortBy(option)}
                  className="flex items-center gap-2"
                >
                  {option.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  {option.label}
                </DropdownMenuItem>
              ))}
              {sortBy && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy(null)}>
                    Clear Sort
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchQuery || activeFilters.length > 0 || sortBy) && (
            <Button variant="ghost" onClick={clearAllFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => {
            const option = filterOptions.find(o => o.key === filter.key);
            return (
              <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
                {option?.label}: {filter.value}
                <button onClick={() => removeFilter(filter.key)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {resultsCount.toLocaleString()} results
        {searchQuery && ` for "${searchQuery}"`}
      </div>
    </div>
  );
}