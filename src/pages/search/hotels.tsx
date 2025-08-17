import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Wallet, Heart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { HotelCard } from "@/features/search/components/HotelCard";
import { useHotelSearch } from "@/features/search/hooks/useHotelSearch";
import { SearchResultsLayout } from "@/components/search/SearchResultsLayout";
import { TravelFundBalance, SaveSearchActions, UrgencyBadge, GuestReviewSnippet, BestPriceGuarantee } from "@/components/search/ConversionEnhancements";
import SearchHeaderBand from "@/components/search/SearchHeaderBand";
import MemberPriceBanner from "@/components/search/MemberPriceBanner";
import SortChips from "@/components/search/SortChips";
import MapPreviewCard from "@/components/search/MapPreviewCard";
import HotelSearchBar from "@/components/search/HotelSearchBar";
import { PopularHotelsSection } from "@/components/search/PopularHotelsSection";
import { FeaturedHotelDeals } from "@/components/search/FeaturedHotelDeals";

// Mock data removed - now using only real Amadeus data
const HotelSearchPage = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("price");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [fundApplied, setFundApplied] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000] as [number, number],
    starRating: [] as string[],
    guestRating: [0, 10] as [number, number],
    amenities: [] as string[],
    propertyTypes: [] as string[],
    distanceFromCenter: 50
  });
  const [hasSearched, setHasSearched] = useState(false);
  
  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = parseInt(searchParams.get("guests") || "2");

  // Check if user came from a search (URL has 'searched' param)
  useEffect(() => {
    if (searchParams.get('searched') === 'true' && destination && checkIn && checkOut) {
      setHasSearched(true);
    }
  }, [searchParams, destination, checkIn, checkOut]);

  const { hotels, loading, error } = useHotelSearch(hasSearched ? {
    destination,
    checkIn,
    checkOut,
    guests,
  } : null);

  const handleHotelSelect = (location: string, hotelName?: string) => {
    // This will be handled by the search bar or navigation
    setHasSearched(true);
  };

  const handleDealSelect = (location: string, hotelName?: string, checkIn?: string) => {
    // This will be handled by the search bar or navigation
    setHasSearched(true);
  };

  // Mock user travel fund balance
  const travelFundBalance = 250.00;
  const sourceHotels = hotels; // Only use real hotel data from Amadeus APIs
  const filteredAndSortedHotels = sourceHotels.filter(hotel => {
    if (filters.priceRange[0] > 0 && hotel.pricePerNight < filters.priceRange[0]) return false;
    if (filters.priceRange[1] < 1000 && hotel.pricePerNight > filters.priceRange[1]) return false;
    if (filters.starRating.length > 0 && !filters.starRating.includes(hotel.starRating.toString())) return false;
    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(hotel.propertyType)) return false;
    if (filters.guestRating[0] > 0 && hotel.rating < filters.guestRating[0]) return false;
    if (filters.guestRating[1] < 10 && hotel.rating > filters.guestRating[1]) return false;
    if (filters.amenities.length > 0 && !filters.amenities.some(amenity => hotel.amenities.includes(amenity))) return false;
    if (hotel.distanceFromCenter > filters.distanceFromCenter) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.pricePerNight - b.pricePerNight;
      case "rating":
        return b.rating - a.rating;
      case "distance":
        return a.distanceFromCenter - b.distanceFromCenter;
      case "stars":
        return b.starRating - a.starRating;
      case "deals":
        return (b.deals ? b.deals.savings : 0) - (a.deals ? a.deals.savings : 0);
      default:
        return 0;
    }
  });

  // Mock guest reviews for demonstration
  const mockReviews = [{
    author: "Sarah M.",
    rating: 5,
    text: "Absolutely stunning location with incredible service. The overwater villa was a dream come true!",
    verified: true
  }, {
    author: "James K.",
    rating: 4,
    text: "Great hotel, beautiful beaches and excellent food. Would definitely come back.",
    verified: true
  }, {
    author: "Emma L.",
    rating: 5,
    text: "Perfect honeymoon destination. Staff went above and beyond to make our stay special.",
    verified: false
  }];
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Search Actions */}
        <HotelSearchBar />

        {!hasSearched ? (
          <div className="space-y-8">
            <PopularHotelsSection onHotelSelect={handleHotelSelect} />
            <FeaturedHotelDeals onDealSelect={handleDealSelect} />
          </div>
        ) : (
          <SearchResultsLayout results={filteredAndSortedHotels} loading={loading} filters={filters} onFiltersChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} viewMode={viewMode} onViewModeChange={setViewMode} topBanner={<>
              <SearchHeaderBand destination={destination} checkIn={checkIn} checkOut={checkOut} guests={guests} />
            </>} extrasBelowControls={<SortChips filters={filters} onFiltersChange={setFilters} />} sidebarAddon={<MapPreviewCard destination={destination} />}>
          {loading && <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>)}
            </div>}

          {error && <Card>
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Error loading hotels: {error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please try searching for a specific destination or check your search criteria.
                </p>
              </CardContent>
            </Card>}

          {!loading && !error && viewMode === "list" && <div className="space-y-6">
              {filteredAndSortedHotels.map((hotel, index) => <div key={hotel.id} className="relative">
                  {/* Enhanced Hotel Card with Conversion Features */}
                  <div className="space-y-3">
                    {/* Urgency Badges */}
                    <div className="flex items-center space-x-2">
                      {index === 0 && <UrgencyBadge type="rooms_left" value={3} />}
                      {hotel.deals && <UrgencyBadge type="flash_deal" endTime={new Date(Date.now() + 2 * 60 * 60 * 1000)} // 2 hours from now
                />}
                      {index === 1 && <UrgencyBadge type="last_booking" value={7} />}
                      {index === 2 && <UrgencyBadge type="high_demand" />}
                    </div>
                    
                    <HotelCard hotel={hotel} />
                  </div>
                </div>)}
              
              {filteredAndSortedHotels.length === 0 && <Card>
                  <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                      <div className="text-6xl">🔍</div>
                      <h3 className="text-xl font-semibold">No hotels found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search criteria to find more options.
                      </p>
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => setFilters({
                    priceRange: [0, 1000],
                    starRating: [],
                    guestRating: [0, 10],
                    amenities: [],
                    propertyTypes: [],
                    distanceFromCenter: 50
                  })} className="text-primary hover:underline text-sm">
                          Clear all filters
                        </button>
                        <span className="text-muted-foreground">•</span>
                        <button onClick={() => window.history.back()} className="text-primary hover:underline text-sm">
                          Try a different search
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>}
            </div>}

          {!loading && !error && viewMode === "map" && <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">🗺️</div>
                  <h3 className="text-xl font-semibold">Map View</h3>
                  <p className="text-muted-foreground">
                    Interactive map with price pins coming soon! For now, switch back to list view to see all hotels.
                  </p>
                </div>
              </CardContent>
            </Card>}
          </SearchResultsLayout>
        )}
      </div>
    </div>;
};
export default HotelSearchPage;