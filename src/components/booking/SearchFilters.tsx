import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Wifi, Car, Coffee, Dumbbell, Waves } from "lucide-react"

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void
  className?: string
}

export const SearchFilters = ({ onFiltersChange, className }: SearchFiltersProps) => {
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [starRating, setStarRating] = useState<number[]>([])
  const [amenities, setAmenities] = useState<string[]>([])

  const amenityOptions = [
    { id: 'wifi', label: 'Free WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'breakfast', label: 'Breakfast', icon: Coffee },
    { id: 'gym', label: 'Fitness Center', icon: Dumbbell },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
  ]

  const handleStarRatingChange = (rating: number) => {
    const newRatings = starRating.includes(rating) 
      ? starRating.filter(r => r !== rating)
      : [...starRating, rating]
    
    setStarRating(newRatings)
    applyFilters({ starRating: newRatings })
  }

  const handleAmenityChange = (amenityId: string) => {
    const newAmenities = amenities.includes(amenityId)
      ? amenities.filter(a => a !== amenityId)
      : [...amenities, amenityId]
    
    setAmenities(newAmenities)
    applyFilters({ amenities: newAmenities })
  }

  const handlePriceChange = (newRange: number[]) => {
    setPriceRange(newRange)
    applyFilters({ priceRange: newRange })
  }

  const applyFilters = (updates: any) => {
    onFiltersChange({
      priceRange,
      starRating,
      amenities,
      ...updates
    })
  }

  const clearFilters = () => {
    setPriceRange([0, 1000])
    setStarRating([])
    setAmenities([])
    onFiltersChange({
      priceRange: [0, 1000],
      starRating: [],
      amenities: []
    })
  }

  const activeFiltersCount = starRating.length + amenities.length + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeFiltersCount}</Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div>
          <h4 className="font-medium mb-3">Price per night</h4>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceChange}
              max={1000}
              min={0}
              step={25}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}+</span>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <h4 className="font-medium mb-3">Star Rating</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={starRating.includes(rating)}
                  onCheckedChange={() => handleStarRatingChange(rating)}
                />
                <label 
                  htmlFor={`rating-${rating}`}
                  className="flex items-center cursor-pointer"
                >
                  <div className="flex items-center">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                    {Array.from({ length: 5 - rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm">{rating} stars</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h4 className="font-medium mb-3">Amenities</h4>
          <div className="space-y-2">
            {amenityOptions.map((amenity) => {
              const Icon = amenity.icon
              return (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={amenities.includes(amenity.id)}
                    onCheckedChange={() => handleAmenityChange(amenity.id)}
                  />
                  <label 
                    htmlFor={`amenity-${amenity.id}`}
                    className="flex items-center cursor-pointer"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{amenity.label}</span>
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}