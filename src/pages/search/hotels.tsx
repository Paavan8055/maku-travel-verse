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

// Fallback mock hotels shown when API returns no results
const mockHotels: any[] = [
  {
    id: "h1",
    name: "Ocean Breeze Resort",
    description: "Luxury beachfront resort with stunning ocean views.",
    address: "123 Beach Rd, Seminyak",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"],
    starRating: 5,
    rating: 4.7,
    reviewCount: 1284,
    pricePerNight: 450,
    currency: "$",
    totalPrice: 3150,
    propertyType: "Resort",
    distanceFromCenter: 2.3,
    amenities: ["wifi", "pool", "restaurant", "parking"],
    cancellationPolicy: "Free cancellation",
    breakfast: true,
    deals: { type: "flash", description: "Limited time deal", savings: 130 }
  },
  {
    id: "h2",
    name: "City Lights Hotel",
    description: "Modern comfort in the heart of the city.",
    address: "45 Queen St",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop"],
    starRating: 4,
    rating: 4.3,
    reviewCount: 672,
    pricePerNight: 189,
    currency: "$",
    totalPrice: 1323,
    propertyType: "Hotel",
    distanceFromCenter: 0.8,
    amenities: ["wifi", "parking", "restaurant"],
    cancellationPolicy: "Non-refundable",
    breakfast: false
  },
  {
    id: "h3",
    name: "Riverside Boutique",
    description: "Charming boutique stay by the river.",
    address: "8 Riverside Ln",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop"],
    starRating: 3,
    rating: 4.1,
    reviewCount: 241,
    pricePerNight: 129,
    currency: "$",
    totalPrice: 903,
    propertyType: "Boutique",
    distanceFromCenter: 3.9,
    amenities: ["wifi"],
    cancellationPolicy: "Free cancellation",
    breakfast: true
  }
];
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
  const searchCriteria = {
    destination: searchParams.get("destination") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: parseInt(searchParams.get("guests") || "2")
  };
  const {
    hotels,
    loading,
    error
  } = useHotelSearch(searchCriteria);

  // Mock user travel fund balance
  const travelFundBalance = 250.00;
  const sourceHotels = (!loading && (error || hotels.length === 0)) ? mockHotels : hotels;
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

        {/* Guest Reviews Section */}
        {/* Search Results with Enhanced Layout */}
        <SearchResultsLayout results={filteredAndSortedHotels} loading={loading} filters={filters} onFiltersChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} viewMode={viewMode} onViewModeChange={setViewMode} topBanner={<>
              <SearchHeaderBand destination={searchCriteria.destination} checkIn={searchCriteria.checkIn} checkOut={searchCriteria.checkOut} guests={searchCriteria.guests} />
              
            </>} extrasBelowControls={<SortChips filters={filters} onFiltersChange={setFilters} />} sidebarAddon={<MapPreviewCard destination={searchCriteria.destination} />}>
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
                <p className="text-sm text-muted-foreground mt-2">Showing sample results instead.</p>
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
      </div>
    </div>;
};
export default HotelSearchPage;