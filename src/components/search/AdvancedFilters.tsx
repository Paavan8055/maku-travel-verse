import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Star, Wifi, Car, Utensils, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/hooks/useAccessibility';

interface FilterState {
  priceRange: [number, number];
  rating: number | null;
  amenities: string[];
  propertyTypes: string[];
  mealPlans: string[];
  accessibility: string[];
  sustainability: string[];
  paymentOptions: string[];
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  searchType: 'hotels' | 'flights' | 'activities' | 'cars';
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  onFiltersChange, 
  searchType 
}) => {
  const { t } = useTranslation();
  const { accessibilityProps } = useAccessibility();
  
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    rating: null,
    amenities: [],
    propertyTypes: [],
    mealPlans: [],
    accessibility: [],
    sustainability: [],
    paymentOptions: []
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const amenityOptions = [
    { id: 'wifi', label: 'Free WiFi', icon: Wifi },
    { id: 'parking', label: 'Free Parking', icon: Car },
    { id: 'restaurant', label: 'Restaurant', icon: Utensils },
    { id: 'pool', label: 'Swimming Pool', icon: Users },
    { id: 'spa', label: 'Spa', icon: Star },
    { id: 'gym', label: 'Fitness Center', icon: Users },
  ];

  const propertyTypes = [
    'Hotel', 'Resort', 'Apartment', 'Villa', 'Hostel', 'Boutique Hotel'
  ];

  const accessibilityOptions = [
    'Wheelchair Accessible',
    'Accessible Bathroom',
    'Roll-in Shower',
    'Accessible Parking',
    'Elevator',
    'Hearing Accessible'
  ];

  const sustainabilityOptions = [
    'Green Key Certified',
    'LEED Certified',
    'Solar Powered',
    'Water Conservation',
    'Organic Food Options',
    'Local Sourcing'
  ];

  const updateFilters = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters(key, newArray);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      priceRange: [0, 1000],
      rating: null,
      amenities: [],
      propertyTypes: [],
      mealPlans: [],
      accessibility: [],
      sustainability: [],
      paymentOptions: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = 
    (filters.rating ? 1 : 0) +
    filters.amenities.length +
    filters.propertyTypes.length +
    filters.accessibility.length +
    filters.sustainability.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('accessibility.filterBy')}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              disabled={activeFiltersCount === 0}
            >
              {t('common.clear')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="advanced-filters-content"
            >
              {isExpanded ? t('common.less') : t('common.more')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent 
        id="advanced-filters-content"
        className={`space-y-6 ${!isExpanded ? 'hidden' : ''}`}
      >
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium mb-3">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Price Range (${filters.priceRange[0]} - ${filters.priceRange[1]})
          </label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilters('priceRange', value)}
            max={1000}
            min={0}
            step={10}
            className="w-full"
            aria-label="Price range filter"
          />
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Minimum Star Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={filters.rating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilters('rating', filters.rating === rating ? null : rating)}
                className="flex items-center gap-1"
                aria-pressed={filters.rating === rating}
              >
                <Star className="h-3 w-3 fill-current" />
                {rating}+
              </Button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-3">
            {amenityOptions.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={filters.amenities.includes(amenity.id)}
                  onCheckedChange={() => toggleArrayFilter('amenities', amenity.id)}
                />
                <label
                  htmlFor={amenity.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  <amenity.icon className="h-4 w-4" />
                  {amenity.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Property Types */}
        {searchType === 'hotels' && (
          <div>
            <label className="block text-sm font-medium mb-3">
              Property Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {propertyTypes.map((type) => (
                <Button
                  key={type}
                  variant={filters.propertyTypes.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('propertyTypes', type)}
                  className="text-xs"
                  aria-pressed={filters.propertyTypes.includes(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility Features */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Accessibility Features
          </label>
          <div className="space-y-2">
            {accessibilityOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`accessibility-${option}`}
                  checked={filters.accessibility.includes(option)}
                  onCheckedChange={() => toggleArrayFilter('accessibility', option)}
                />
                <label
                  htmlFor={`accessibility-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Sustainability
          </label>
          <div className="space-y-2">
            {sustainabilityOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`sustainability-${option}`}
                  checked={filters.sustainability.includes(option)}
                  onCheckedChange={() => toggleArrayFilter('sustainability', option)}
                />
                <label
                  htmlFor={`sustainability-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};