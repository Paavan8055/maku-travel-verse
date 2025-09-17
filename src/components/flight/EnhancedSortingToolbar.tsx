import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowUpDown, 
  Filter, 
  X, 
  Clock, 
  DollarSign, 
  MapPin, 
  Zap,
  TrendingUp,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface FilterChip {
  key: string;
  label: string;
  removable?: boolean;
}

interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  filters: string[];
  icon: React.ReactNode;
}

interface EnhancedSortingToolbarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  activeFilters: FilterChip[];
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  resultsCount: number;
  searchContext?: {
    isBusinessTravel?: boolean;
    budgetRange?: [number, number];
    timeConstraints?: boolean;
  };
  className?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { 
    value: "smart", 
    label: "Best Value", 
    icon: <Zap className="h-4 w-4" />,
    description: "AI-optimized balance of price, time, and convenience"
  },
  { 
    value: "price_asc", 
    label: "Lowest Price", 
    icon: <DollarSign className="h-4 w-4" />,
    description: "Most affordable options first"
  },
  { 
    value: "duration_asc", 
    label: "Shortest Duration", 
    icon: <Clock className="h-4 w-4" />,
    description: "Fastest total travel time"
  },
  { 
    value: "departure_asc", 
    label: "Earliest Departure", 
    icon: <ArrowUpDown className="h-4 w-4" />,
    description: "Morning departures first"
  },
  { 
    value: "stops_asc", 
    label: "Fewest Stops", 
    icon: <MapPin className="h-4 w-4" />,
    description: "Direct and minimal connections"
  },
];

const SMART_RECOMMENDATIONS: SmartRecommendation[] = [
  {
    id: 'business-optimal',
    title: 'Business Travel',
    description: 'Morning departures, major airlines, flexible tickets',
    filters: ['departure_early', 'refundable', 'major_airline'],
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'budget-friendly',
    title: 'Budget Saver',
    description: 'Best prices, any time, basic amenities',
    filters: ['price_low', 'budget_airline'],
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: 'time-saver',
    title: 'Time Efficient',
    description: 'Direct flights, minimal layovers',
    filters: ['direct_only', 'short_layover'],
    icon: <Clock className="h-4 w-4" />
  }
];

export const EnhancedSortingToolbar = ({
  sortBy,
  onSortChange,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  resultsCount,
  searchContext,
  className
}: EnhancedSortingToolbarProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const getRecommendedSort = () => {
    if (searchContext?.isBusinessTravel) return 'smart';
    if (searchContext?.timeConstraints) return 'duration_asc';
    if (searchContext?.budgetRange && searchContext.budgetRange[1] < 500) return 'price_asc';
    return 'smart';
  };

  const recommendedSort = getRecommendedSort();
  const currentSort = SORT_OPTIONS.find(opt => opt.value === sortBy);

  return (
    <div className={cn("bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b pb-4 mb-6", className)}>
      {/* Main toolbar */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-6">
          {/* Results count with visual emphasis */}
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">
              {resultsCount.toLocaleString()}
            </h2>
            <span className="text-muted-foreground">
              flight{resultsCount !== 1 ? 's' : ''} found
            </span>
            {resultsCount > 100 && (
              <Badge variant="secondary" className="text-xs">
                Great selection
              </Badge>
            )}
          </div>
          
          {/* Enhanced sorting */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start">
                  {currentSort?.icon}
                  <span className="ml-2">{currentSort?.label || 'Select'}</span>
                  {sortBy === recommendedSort && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <div className="space-y-1">
                  {SORT_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={sortBy === option.value ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => onSortChange(option.value)}
                    >
                      <div className="flex items-start space-x-3">
                        {option.icon}
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{option.label}</span>
                            {option.value === recommendedSort && (
                              <Badge variant="outline" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Smart recommendations and filters */}
        <div className="flex items-center space-x-2">
          <Popover open={showRecommendations} onOpenChange={setShowRecommendations}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Quick Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Smart Recommendations</h4>
                {SMART_RECOMMENDATIONS.map((rec) => (
                  <Button
                    key={rec.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => {
                      // Apply recommended filters
                      setShowRecommendations(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {rec.icon}
                      <div className="text-left">
                        <span className="font-medium text-sm">{rec.title}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            All Filters
          </Button>
        </div>
      </div>

      {/* Active Filters with enhanced styling */}
      {activeFilters.length > 0 && (
        <div className="flex items-center space-x-2 flex-wrap gap-2 pt-2">
          <span className="text-sm text-muted-foreground">Applied:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center space-x-1 pr-1 bg-primary/10 text-primary border-primary/20"
            >
              <span>{filter.label}</span>
              {filter.removable !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-primary/20"
                  onClick={() => onRemoveFilter(filter.key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};