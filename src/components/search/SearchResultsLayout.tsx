// Search results layout with filters, sorting, and list/map toggle
import { useState } from "react";
import { Filter, SortAsc, Grid, Map, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SearchFilters {
  priceRange: [number, number];
  starRating: string[];
  guestRating: [number, number];
  amenities: string[];
  propertyTypes: string[];
  distanceFromCenter: number;
}

interface SearchResultsLayoutProps {
  results: any[];
  loading: boolean;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "list" | "map";
  onViewModeChange: (mode: "list" | "map") => void;
  children: React.ReactNode;
}

export const SearchResultsLayout = ({
  results,
  loading,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  children
}: SearchResultsLayoutProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleStarRatingChange = (rating: string, checked: boolean) => {
    const newRatings = checked
      ? [...filters.starRating, rating]
      : filters.starRating.filter(r => r !== rating);
    onFiltersChange({ ...filters, starRating: newRatings });
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const newAmenities = checked
      ? [...filters.amenities, amenity]
      : filters.amenities.filter(a => a !== amenity);
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.propertyTypes, type]
      : filters.propertyTypes.filter(t => t !== type);
    onFiltersChange({ ...filters, propertyTypes: newTypes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      priceRange: [0, 1000],
      starRating: [],
      guestRating: [0, 10],
      amenities: [],
      propertyTypes: [],
      distanceFromCenter: 50
    });
  };

  const activeFiltersCount = 
    filters.starRating.length +
    filters.amenities.length +
    filters.propertyTypes.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 1 : 0) +
    (filters.guestRating[0] > 0 || filters.guestRating[1] < 10 ? 1 : 0) +
    (filters.distanceFromCenter < 50 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Price per night</h4>
        <div className="px-3">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
            max={1000}
            min={0}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}+</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Star Rating */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Hotel Class</h4>
        {["5", "4", "3", "2", "1"].map((stars) => (
          <div key={stars} className="flex items-center space-x-2">
            <Checkbox
              id={`stars-${stars}`}
              checked={filters.starRating.includes(stars)}
              onCheckedChange={(checked) => handleStarRatingChange(stars, checked as boolean)}
            />
            <label htmlFor={`stars-${stars}`} className="text-sm flex items-center space-x-1">
              <span>{stars}</span>
              <div className="flex">
                {Array.from({ length: parseInt(stars) }, (_, i) => (
                  <span key={i} className="text-yellow-400 text-xs">★</span>
                ))}
              </div>
            </label>
          </div>
        ))}
      </div>

      <Separator />

      {/* Guest Rating */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Guest Rating</h4>
        <div className="px-3">
          <Slider
            value={filters.guestRating}
            onValueChange={(value) => onFiltersChange({ ...filters, guestRating: value as [number, number] })}
            max={10}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{filters.guestRating[0]}</span>
            <span>{filters.guestRating[1]}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Property Types */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Property Type</h4>
        {["Hotel", "Resort", "Apartment", "Villa", "Hostel"].map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type}`}
              checked={filters.propertyTypes.includes(type)}
              onCheckedChange={(checked) => handlePropertyTypeChange(type, checked as boolean)}
            />
            <label htmlFor={`type-${type}`} className="text-sm">
              {type}
            </label>
          </div>
        ))}
      </div>

      <Separator />

      {/* Amenities */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Amenities</h4>
        {["WiFi", "Pool", "Gym", "Spa", "Parking", "Restaurant", "Bar", "Room Service", "Airport Shuttle", "Pet Friendly"].map((amenity) => (
          <div key={amenity} className="flex items-center space-x-2">
            <Checkbox
              id={`amenity-${amenity}`}
              checked={filters.amenities.includes(amenity)}
              onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
            />
            <label htmlFor={`amenity-${amenity}`} className="text-sm">
              {amenity}
            </label>
          </div>
        ))}
      </div>

      <Separator />

      {/* Distance from Center */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Distance from Center</h4>
        <div className="px-3">
          <Slider
            value={[filters.distanceFromCenter]}
            onValueChange={(value) => onFiltersChange({ ...filters, distanceFromCenter: value[0] })}
            max={50}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0 km</span>
            <span>{filters.distanceFromCenter} km</span>
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Filters */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Sliders className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4" />
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Best Price</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="stars">Hotel Class</SelectItem>
                <SelectItem value="deals">Best Deals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("list")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("map")}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>

          {/* Results Count */}
          <Badge variant="secondary">
            {results.length} {results.length === 1 ? "property" : "properties"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden sm:block lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterContent />
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
};