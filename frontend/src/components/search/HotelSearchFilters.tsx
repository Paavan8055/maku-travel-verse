/**
 * HotelSearchFilters Component
 * Author: MAKU Travel Platform
 * Created: 2025-09-05
 * Purpose: Focused filter component for hotel search with enhanced UX
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Star, Wifi, Car, Coffee, Users, Utensils, Waves } from 'lucide-react';

interface FilterState {
  priceRange: [number, number];
  starRating: number[];
  amenities: string[];
  mealTypes: string[];
  roomTypes: string[];
}

interface HotelSearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  hotelCount: number;
}

const amenityOptions = [
  { id: 'wifi', label: 'Free WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'fitness', label: 'Fitness Center', icon: Users },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
];

const mealOptions = [
  { id: 'room_only', label: 'Room Only' },
  { id: 'breakfast', label: 'Breakfast Included' },
  { id: 'half_board', label: 'Half Board' },
  { id: 'full_board', label: 'Full Board' },
  { id: 'all_inclusive', label: 'All Inclusive' },
];

const roomTypeOptions = [
  { id: 'standard', label: 'Standard Room' },
  { id: 'deluxe', label: 'Deluxe Room' },
  { id: 'suite', label: 'Suite' },
  { id: 'family', label: 'Family Room' },
  { id: 'executive', label: 'Executive Room' },
];

export const HotelSearchFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  hotelCount 
}: HotelSearchFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    if (filters.starRating.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.mealTypes.length > 0) count++;
    if (filters.roomTypes.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear all
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {hotelCount} hotel{hotelCount !== 1 ? 's' : ''} found
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price per night</Label>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              max={1000}
              min={0}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$0</span>
              <span className="font-medium">
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </span>
              <span>$1000+</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Star Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Star Rating</Label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((stars) => (
              <Button
                key={stars}
                variant={filters.starRating.includes(stars) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newRating = filters.starRating.includes(stars)
                    ? filters.starRating.filter(r => r !== stars)
                    : [...filters.starRating, stars];
                  updateFilter('starRating', newRating);
                }}
                className="flex items-center gap-1 h-8"
              >
                <span className="text-xs">{stars}</span>
                <Star className="w-3 h-3" />
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Popular Amenities */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Popular Amenities</Label>
          <div className="grid grid-cols-2 gap-2">
            {amenityOptions.map((amenity) => {
              const Icon = amenity.icon;
              return (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity.id}
                    checked={filters.amenities.includes(amenity.id)}
                    onCheckedChange={() =>
                      updateFilter('amenities', toggleArrayItem(filters.amenities, amenity.id))
                    }
                  />
                  <Label 
                    htmlFor={amenity.id} 
                    className="text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Icon className="w-3 h-3" />
                    {amenity.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expandable Additional Filters */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? 'Show Less' : 'More Filters'}
        </Button>

        {isExpanded && (
          <>
            <Separator />

            {/* Meal Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Meal Options</Label>
              <div className="space-y-2">
                {mealOptions.map((meal) => (
                  <div key={meal.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={meal.id}
                      checked={filters.mealTypes.includes(meal.id)}
                      onCheckedChange={() =>
                        updateFilter('mealTypes', toggleArrayItem(filters.mealTypes, meal.id))
                      }
                    />
                    <Label htmlFor={meal.id} className="text-xs cursor-pointer">
                      {meal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Room Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Room Types</Label>
              <div className="space-y-2">
                {roomTypeOptions.map((room) => (
                  <div key={room.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={room.id}
                      checked={filters.roomTypes.includes(room.id)}
                      onCheckedChange={() =>
                        updateFilter('roomTypes', toggleArrayItem(filters.roomTypes, room.id))
                      }
                    />
                    <Label htmlFor={room.id} className="text-xs cursor-pointer">
                      {room.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};