import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SortAsc, Map, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
import { HotelCard } from "@/features/search/components/HotelCard";
import { useHotelSearch } from "@/features/search/hooks/useHotelSearch";

const HotelSearchPage = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("price");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [filters, setFilters] = useState({
    starRating: [] as string[],
    amenities: [] as string[],
    propertyType: "any"
  });

  const searchCriteria = {
    destination: searchParams.get("destination") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: parseInt(searchParams.get("guests") || "2")
  };

  const { hotels, loading, error } = useHotelSearch(searchCriteria);

  const filteredAndSortedHotels = hotels
    .filter(hotel => {
      if (priceRange[0] > 0 && hotel.pricePerNight < priceRange[0]) return false;
      if (priceRange[1] < 500 && hotel.pricePerNight > priceRange[1]) return false;
      if (filters.starRating.length > 0 && !filters.starRating.includes(hotel.starRating.toString())) return false;
      if (filters.propertyType !== "any" && hotel.propertyType !== filters.propertyType) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.pricePerNight - b.pricePerNight;
        case "rating":
          return b.rating - a.rating;
        case "distance":
          return a.distanceFromCenter - b.distanceFromCenter;
        default:
          return 0;
      }
    });

  const handleStarRatingChange = (rating: string, checked: boolean) => {
    if (checked) {
      setFilters({...filters, starRating: [...filters.starRating, rating]});
    } else {
      setFilters({...filters, starRating: filters.starRating.filter(r => r !== rating)});
    }
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setFilters({...filters, amenities: [...filters.amenities, amenity]});
    } else {
      setFilters({...filters, amenities: filters.amenities.filter(a => a !== amenity)});
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hotels in {searchParams.get("destination")}
          </h1>
          <p className="text-muted-foreground">
            {searchParams.get("checkIn")} - {searchParams.get("checkOut")} • {searchParams.get("guests")} guest(s)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">Price per night</label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    step={25}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Star Rating</label>
                  <div className="space-y-2">
                    {["5", "4", "3", "2", "1"].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={filters.starRating.includes(rating)}
                          onCheckedChange={(checked) => handleStarRatingChange(rating, checked as boolean)}
                        />
                        <label htmlFor={`rating-${rating}`} className="text-sm">
                          {rating} {"★".repeat(parseInt(rating))}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Property Type</label>
                  <Select value={filters.propertyType} onValueChange={(value) => setFilters({...filters, propertyType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="boutique">Boutique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Amenities</label>
                  <div className="space-y-2">
                    {["WiFi", "Pool", "Gym", "Spa", "Parking", "Restaurant"].map((amenity) => (
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-5 w-5" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Best Price</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Badge variant="secondary">
                {filteredAndSortedHotels.length} properties found
              </Badge>
            </div>

            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Error loading hotels: {error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && viewMode === "grid" && (
              <div className="space-y-4">
                {filteredAndSortedHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
                
                {filteredAndSortedHotels.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No hotels found matching your criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {!loading && !error && viewMode === "map" && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Map view coming soon...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchPage;