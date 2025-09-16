/**
 * HotelSearchResults Component
 * Author: MAKU Travel Platform
 * Created: 2025-09-05
 * Purpose: Focused results display component for hotel search
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee,
  Heart,
  ExternalLink,
  Grid3X3,
  List,
  SortAsc
} from 'lucide-react';
import { HotelCard } from '@/features/search/components/HotelCard';

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: {
    amount: number;
    currency: string;
    period: string;
  };
  image: string;
  amenities: string[];
  description: string;
  distance?: string;
}

interface HotelSearchResultsProps {
  hotels: Hotel[];
  loading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onHotelSelect: (hotel: Hotel) => void;
}

const sortOptions = [
  { value: 'price', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'rating', label: 'Rating (High to Low)' },
  { value: 'distance', label: 'Distance' },
  { value: 'popular', label: 'Most Popular' },
];

export const HotelSearchResults = ({ 
  hotels, 
  loading, 
  sortBy, 
  onSortChange,
  viewMode,
  onViewModeChange,
  onHotelSelect
}: HotelSearchResultsProps) => {
  const [favoriteHotels, setFavoriteHotels] = useState<Set<string>>(new Set());

  const toggleFavorite = (hotelId: string) => {
    const newFavorites = new Set(favoriteHotels);
    if (newFavorites.has(hotelId)) {
      newFavorites.delete(hotelId);
    } else {
      newFavorites.add(hotelId);
    }
    setFavoriteHotels(newFavorites);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-48 h-32 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-8 bg-muted rounded w-32 mt-4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search criteria to find more options.
          </p>
          <Button variant="outline">
            <SortAsc className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found
          </h2>
          <Badge variant="secondary" className="text-xs">
            Updated just now
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Separator orientation="vertical" className="h-6" />

          {/* View Mode Toggle */}
          <div className="flex border rounded overflow-hidden">
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="px-2 rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="px-2 rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
          : "space-y-4"
      }>
        {hotels.map((hotel) => (
          <Card 
            key={hotel.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onHotelSelect(hotel)}
          >
            <CardContent className="p-0">
              <div className={viewMode === 'grid' ? "space-y-4" : "flex gap-4"}>
                {/* Hotel Image */}
                <div className={`relative ${viewMode === 'grid' ? 'h-48' : 'w-48 h-32'}`}>
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(hotel.id);
                    }}
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        favoriteHotels.has(hotel.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-gray-600'
                      }`}
                    />
                  </Button>
                </div>

                {/* Hotel Details */}
                <div className="flex-1 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg leading-tight">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {hotel.location}
                        {hotel.distance && (
                          <span className="ml-2 text-xs">• {hotel.distance}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {hotel.price.currency}{hotel.price.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per {hotel.price.period}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(hotel.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{hotel.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({hotel.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {hotel.description}
                  </p>

                  {/* Amenities */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {hotel.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity === 'wifi' && <Wifi className="w-3 h-3 mr-1" />}
                        {amenity === 'parking' && <Car className="w-3 h-3 mr-1" />}
                        {amenity === 'breakfast' && <Coffee className="w-3 h-3 mr-1" />}
                        {amenity}
                      </Badge>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{hotel.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onHotelSelect(hotel);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle external link
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hotels.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline">
            Load More Hotels
          </Button>
        </div>
      )}
    </div>
  );
};