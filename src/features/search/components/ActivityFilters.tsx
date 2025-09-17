import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  X, 
  Star, 
  Clock, 
  DollarSign,
  Users,
  Camera,
  Mountain,
  Utensils,
  Waves,
  Building,
  MapPin
} from 'lucide-react';

export interface ActivityFilters {
  priceRange: [number, number];
  duration: string[];
  categories: string[];
  rating: number;
  groupSize: [number, number];
  difficulty: string[];
  features: string[];
  sortBy: 'price' | 'rating' | 'duration' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  onClearFilters: () => void;
  availableFilters?: {
    categories: string[];
    maxPrice: number;
    features: string[];
  };
  resultCount?: number;
}

const defaultAvailableFilters = {
  categories: ['Adventure', 'Cultural', 'Food & Drink', 'Nature', 'Sightseeing', 'Water Sports'],
  maxPrice: 500,
  features: ['Instant Confirmation', 'Free Cancellation', 'Small Group', 'Private Tour', 'Hotel Pickup']
};

export const ActivityFiltersComponent: React.FC<ActivityFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableFilters = defaultAvailableFilters,
  resultCount = 0
}) => {
  const updateFilter = <K extends keyof ActivityFilters>(
    key: K, 
    value: ActivityFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'adventure': return <Mountain className="h-4 w-4" />;
      case 'cultural': return <Building className="h-4 w-4" />;
      case 'food & drink': return <Utensils className="h-4 w-4" />;
      case 'nature': return <MapPin className="h-4 w-4" />;
      case 'sightseeing': return <Camera className="h-4 w-4" />;
      case 'water sports': return <Waves className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const hasActiveFilters = 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < availableFilters.maxPrice ||
    filters.duration.length > 0 ||
    filters.categories.length > 0 ||
    filters.rating > 0 ||
    filters.difficulty.length > 0 ||
    filters.features.length > 0;

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        {resultCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {resultCount} activities found
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sort By */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sort By</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'price', label: 'Price', icon: DollarSign },
              { value: 'rating', label: 'Rating', icon: Star },
              { value: 'duration', label: 'Duration', icon: Clock },
              { value: 'popularity', label: 'Popular', icon: Users }
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={filters.sortBy === value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  updateFilter('sortBy', value as any);
                  // Toggle order if same sort selected
                  if (filters.sortBy === value) {
                    updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
                  }
                }}
                className="justify-start"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
                {filters.sortBy === value && (
                  <span className="ml-auto text-xs">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            max={availableFilters.maxPrice}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>${availableFilters.maxPrice}</span>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Minimum Rating</Label>
          <div className="flex space-x-2">
            {[0, 3, 4, 4.5].map((rating) => (
              <Button
                key={rating}
                variant={filters.rating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('rating', rating)}
                className="flex items-center space-x-1"
              >
                <Star className="h-4 w-4" />
                <span>{rating === 0 ? 'Any' : `${rating}+`}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="space-y-2">
            {availableFilters.categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => 
                    updateFilter('categories', toggleArrayItem(filters.categories, category))
                  }
                />
                <Label 
                  htmlFor={`category-${category}`}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Duration */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Duration</Label>
          <div className="grid grid-cols-2 gap-2">
            {['1-2 hours', '3-4 hours', '5-6 hours', 'Full day', 'Multi-day'].map((duration) => (
              <Button
                key={duration}
                variant={filters.duration.includes(duration) ? "default" : "outline"}
                size="sm"
                onClick={() => 
                  updateFilter('duration', toggleArrayItem(filters.duration, duration))
                }
                className="text-xs justify-start"
              >
                <Clock className="h-4 w-4 mr-1" />
                {duration}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Difficulty */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Difficulty</Label>
          <div className="flex flex-wrap gap-2">
            {['Easy', 'Moderate', 'Challenging'].map((difficulty) => (
              <Badge
                key={difficulty}
                variant={filters.difficulty.includes(difficulty) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => 
                  updateFilter('difficulty', toggleArrayItem(filters.difficulty, difficulty))
                }
              >
                {difficulty}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Features */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Features</Label>
          <div className="space-y-2">
            {availableFilters.features.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={filters.features.includes(feature)}
                  onCheckedChange={() => 
                    updateFilter('features', toggleArrayItem(filters.features, feature))
                  }
                />
                <Label 
                  htmlFor={`feature-${feature}`}
                  className="text-sm cursor-pointer"
                >
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Group Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Group Size: {filters.groupSize[0]} - {filters.groupSize[1]} people
          </Label>
          <Slider
            value={filters.groupSize}
            onValueChange={(value) => updateFilter('groupSize', value as [number, number])}
            max={20}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 person</span>
            <span>20+ people</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};