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
    propertyType: "any",
    mealPlan: "any",
    accessibility: [] as string[],
    guestRating: [0, 10]
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
      if (filters.guestRating[0] > 0 && hotel.rating < filters.guestRating[0]) return false;
      if (filters.guestRating[1] < 10 && hotel.rating > filters.guestRating[1]) return false;
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
          {/* Recommendations Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Recommended for {searchParams.get("destination")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">🏖️ Overwater Villas</h4>
                    <p className="text-xs text-muted-foreground">Experience luxury over crystal clear waters</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">🤿 Diving Packages</h4>
                    <p className="text-xs text-muted-foreground">Explore vibrant coral reefs and marine life</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">🍽️ All-Inclusive Resorts</h4>
                    <p className="text-xs text-muted-foreground">Hassle-free dining and activities</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">💑 Honeymoon Suites</h4>
                    <p className="text-xs text-muted-foreground">Romantic getaways with private beaches</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">🛥️ Island Hopping</h4>
                    <p className="text-xs text-muted-foreground">Visit multiple atolls and local islands</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-1">🌅 Sunrise Yoga</h4>
                    <p className="text-xs text-muted-foreground">Start your day with beach meditation</p>
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