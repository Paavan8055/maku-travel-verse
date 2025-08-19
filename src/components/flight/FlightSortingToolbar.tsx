import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

interface FilterChip {
  key: string;
  label: string;
  removable?: boolean;
}

interface FlightSortingToolbarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  activeFilters: FilterChip[];
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  resultsCount: number;
  className?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "duration_asc", label: "Duration: Shortest" },
  { value: "departure_asc", label: "Departure: Earliest" },
  { value: "departure_desc", label: "Departure: Latest" },
  { value: "stops_asc", label: "Stops: Fewest" },
];

export const FlightSortingToolbar = ({
  sortBy,
  onSortChange,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  resultsCount,
  className
}: FlightSortingToolbarProps) => {
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {/* Sort and Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            {resultsCount} flight{resultsCount !== 1 ? 's' : ''} found
          </p>
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center space-x-1 pr-1"
            >
              <span>{filter.label}</span>
              {filter.removable !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
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