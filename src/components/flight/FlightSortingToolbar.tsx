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
  { value: "duration_asc", label: "Duration" },
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
    <div className={cn("bg-background sticky top-0 z-10 border-b border-border pb-4 mb-6", className)}>
      {/* Main toolbar */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-semibold text-foreground">
            {resultsCount} flight{resultsCount !== 1 ? 's' : ''} found
          </h2>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[160px] border-border">
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
        
        <Button variant="outline" size="sm" className="border-border hover:border-primary">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center space-x-2 flex-wrap gap-2 pt-2">
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