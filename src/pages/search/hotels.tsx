import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Wallet, Heart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { SearchErrorBoundary } from "@/components/error/SearchErrorBoundary";
import { HotelCard } from "@/features/search/components/HotelCard";
import { SessionRecoveryBanner } from "@/components/SessionRecoveryBanner";
import { HotelCardSkeleton } from "@/components/booking/HotelCardSkeleton";
import { SearchFilters } from "@/components/booking/SearchFilters";
import { useHealthStatus } from "@/hooks/useHealthStatus";
import { LoadingSpinner, PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { useHotelSearch } from "@/features/search/hooks/useHotelSearch";
import { SearchResultsLayout } from "@/components/search/SearchResultsLayout";
import { TravelFundBalance, SaveSearchActions, UrgencyBadge, GuestReviewSnippet, BestPriceGuarantee } from "@/components/search/ConversionEnhancements";
import SearchHeaderBand from "@/components/search/SearchHeaderBand";
import MemberPriceBanner from "@/components/search/MemberPriceBanner";
import SortChips from "@/components/search/SortChips";
import MapPreviewCard from "@/components/search/MapPreviewCard";
import { InteractiveHotelMap } from "@/components/maps/InteractiveHotelMap";

import { PopularHotelsSection } from "@/components/search/PopularHotelsSection";
import { FeaturedHotelDeals } from "@/components/search/FeaturedHotelDeals";
import { SystemHealthIndicator } from "@/components/SystemHealthIndicator";
import { RealTimeOccupancy } from "@/components/hotel/RealTimeOccupancy";
import { DateFlexibilityMatrix } from "@/components/hotel/DateFlexibilityMatrix";
import { PredictivePricing } from "@/components/hotel/PredictivePricing";
import { CompactSearchToolbar } from "@/components/hotel/CompactSearchToolbar";
import { SmartRecommendations } from "@/components/ota/SmartRecommendations";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import OneClickBooking from "@/features/bookingEnhancements/components/OneClickBooking";
import MobileBookingOptimization from "@/components/mobile/MobileBookingOptimization";
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import SmartUpselling from "@/components/conversion/SmartUpselling";
import ConversionTracker from "@/components/analytics/ConversionTracker";
import { AmadeusOptimizer } from "@/components/api/AmadeusOptimizer";
import { SearchPerformanceOptimizer } from "@/components/search/SearchPerformanceOptimizer";
import { PersonalizationEngine } from "@/components/personalization/PersonalizationEngine";
import { RevenueOptimizer } from "@/components/revenue/RevenueOptimizer";

import { MultiPropertyBooking } from "@/components/enterprise/MultiPropertyBooking";
import { LoyaltyProgramIntegration } from "@/components/loyalty/LoyaltyProgramIntegration";
import { CurrencyProvider } from "@/components/localization/MultiCurrencySupport";
import HotelSearchBar from "@/components/search/HotelSearchBar";
import { IntelligentHotelInfo } from "@/components/travel/IntelligentHotelInfo";
import { IntelligentHotelSearchForm } from "@/components/search/IntelligentHotelSearchForm";
import { useBackgroundPerformanceTracking } from "@/hooks/useBackgroundPerformanceTracking";



// Mock data removed - now using only real Amadeus data
const HotelSearchPage = () => {
  const [searchParams] = useSearchParams();
  const { measureInteraction } = useBackgroundPerformanceTracking('HotelSearchPage');
  const [sortBy, setSortBy] = useState("price");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [fundApplied, setFundApplied] = useState(false);
  const { healthStatus } = useHealthStatus();
  const [filters, setFilters] = useState({
    priceRange: [0, 1000] as [number, number],
    starRating: [] as string[],
    guestRating: [0, 10] as [number, number],
    amenities: [] as string[],
    propertyTypes: [] as string[],
    distanceFromCenter: 50
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [abTestVariant, setAbTestVariant] = useState<string>('');
  
  const destination = searchParams.get("destination") || "";
  
  const [userPreferences, setUserPreferences] = useState({
    priceRange: [0, 1000] as [number, number],
    amenities: [] as string[],
    travelStyle: 'leisure' as 'leisure' | 'business' | 'family',
    starRating: 4,
    location: destination,
    previousBookings: [] as any[]
  });
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = parseInt(searchParams.get("guests") || "2");
  const adults = parseInt(searchParams.get("adults") || searchParams.get("guests") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const hotelName = searchParams.get("hotelName") || "";

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
    guests: adults + children, // Use calculated total
    hotelName: hotelName || undefined
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

  return (
    <CurrencyProvider>
      <AccessibilityProvider>
        <SearchErrorBoundary searchType="hotel">
        <ErrorBoundary>
          <PerformanceWrapper componentName="HotelSearchPage">
            <MobileBookingOptimization 
              onBookingStart={() => console.log('Mobile booking started')}
              onBookingComplete={() => console.log('Mobile booking completed')}
            >
              <div className="min-h-screen bg-background">
                <Navbar />
                <SessionRecoveryBanner />
        
        <div className="container mx-auto px-4 py-8">
          {/* Intelligent Hotel Search Form */}
          <div className="mb-6">
            <IntelligentHotelSearchForm 
              onSearch={(params) => {
                const newParams = new URLSearchParams(params);
                newParams.set('searched', 'true');
                window.location.href = `/search/hotels?${newParams.toString()}`;
              }}
            />
          </div>

        
        {/* Compact Advanced Features Toolbar */}
        <CompactSearchToolbar 
          destination={destination}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onDestinationChange={(dest) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('destination', dest);
            window.location.href = `/search/hotels?${newParams.toString()}`;
          }}
          onLocationSelect={(location) => console.log('Location selected:', location)}
          selectedAccessibility={[]}
          onAccessibilityChange={(filters) => console.log('Accessibility filters:', filters)}
          className="mb-6"
        />

        {!hasSearched ? (
          <div className="space-y-8">
            <PopularHotelsSection onHotelSelect={handleHotelSelect} />
            <FeaturedHotelDeals onDealSelect={handleDealSelect} />
            
            {/* Loyalty Program Integration */}
            <LoyaltyProgramIntegration 
              onPointsRedeem={(points) => console.log('Points redeemed:', points)}
            />
            
            {/* Multi-Property Booking for Packages - Moved to bottom */}
            <MultiPropertyBooking 
              onPackageSelect={(pkg) => console.log('Package selected:', pkg)}
            />
          </div>
        ) : (
          <SearchResultsLayout results={filteredAndSortedHotels} loading={loading} filters={filters} onFiltersChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} viewMode={viewMode} onViewModeChange={setViewMode} topBanner={<>
              <SearchHeaderBand destination={destination} checkIn={checkIn} checkOut={checkOut} guests={guests} hotelName={hotelName} />
              <SystemHealthIndicator />
            </>} extrasBelowControls={<SortChips filters={filters} onFiltersChange={setFilters} />} sidebarAddon={<MapPreviewCard destination={destination} />}>
          {loading && <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <HotelCardSkeleton key={i} />
              ))}
            </div>}

          {error && <Card>
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">⚠️</div>
                  <h3 className="text-xl font-semibold">Unable to load hotels</h3>
                  <p className="text-destructive">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    This could be due to a network connectivity issue or our booking service being temporarily unavailable.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('searched');
                        window.location.href = `/search/hotels?${newParams.toString()}`;
                      }}
                      className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    >
                      Modify Search
                    </button>
                  </div>
                  {healthStatus && healthStatus.status !== 'healthy' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Service Status:</strong> Some of our booking services are currently experiencing issues. 
                      Please try again in a few minutes.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>}

          {!loading && !error && viewMode === "list" && <div className="space-y-6">
              {/* Revenue Optimizer for the results */}
              <RevenueOptimizer 
                basePrice={filteredAndSortedHotels.length > 0 ? filteredAndSortedHotels[0].pricePerNight : 100}
                className="mb-4" 
              />
              
              {filteredAndSortedHotels.map((hotel, index) => <div key={hotel.id} className="relative">
                  {/* Enhanced Hotel Card with Conversion Features */}
                  <div className="space-y-3">
                    {/* Compact Enhanced Features - show both for first result only */}
                    {index === 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                        <RealTimeOccupancy hotelId={hotel.id} />
                        <PredictivePricing 
                          hotelId={hotel.id}
                          currentPrice={hotel.pricePerNight}
                          checkInDate={checkIn}
                        />
                      </div>
                    )}
                    
                    {/* Urgency Badges */}
                    <div className="flex items-center space-x-2">
                      {index === 0 && <UrgencyBadge type="rooms_left" value={3} />}
                      {hotel.deals && <UrgencyBadge type="flash_deal" endTime={new Date(Date.now() + 2 * 60 * 60 * 1000)} />}
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

          {!loading && !error && viewMode === "map" && (
            <div className="space-y-4">
              <InteractiveHotelMap 
                hotels={filteredAndSortedHotels}
                destination={destination}
                onHotelSelect={(hotel) => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('hotelName', hotel.name);
                  window.location.href = `/search/hotels?${newParams.toString()}`;
                }}
              />
              {filteredAndSortedHotels.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                      <div className="text-6xl">🗺️</div>
                      <h3 className="text-xl font-semibold">No hotels to display on map</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria to find hotels in this area.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          </SearchResultsLayout>
        )}
        
        {/* Smart Recommendations Sidebar */}
        {hasSearched && filteredAndSortedHotels.length > 0 && (
          <div className="mt-8">
            <SmartRecommendations 
              currentLocation={destination}
              searchCriteria={{ checkIn, checkOut, guests }}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
        
        {/* Personalized for You - Bottom of Page */}
        {hasSearched && filteredAndSortedHotels.length > 0 && (
          <div className="mt-8">
            <PersonalizationEngine 
              userPreferences={userPreferences}
              onRecommendationClick={(rec) => console.log('Recommendation clicked:', rec)}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
            </div>
            
            {/* Performance and Analytics Monitors */}
            <PerformanceMonitor>
              <div></div>
            </PerformanceMonitor>
            <ConversionTracker 
              sessionId={`search-${Date.now()}`}
              currentStep={hasSearched ? 'results' : 'search'}
              isVisible={process.env.NODE_ENV === 'development'}
              onOptimizationSuggestion={(suggestion) => console.log('Optimization:', suggestion)}
            />
            
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-4 mb-6">
                {/* Search Performance Optimizer - Development Tool */}
                <SearchPerformanceOptimizer 
                  onSearch={(query) => {
                    if (query.length >= 2) {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('destination', query);
                      newParams.set('searched', 'true');
                      window.location.href = `/search/hotels?${newParams.toString()}`;
                    }
                  }}
                  suggestions={['New York', 'Paris', 'Tokyo', 'London']}
                  recentSearches={['Miami', 'Barcelona']}
                  trendingSearches={['Dubai', 'Rome']}
                  className="mb-4"
                />
                {/* API Optimization Component - Development Tool */}
                <AmadeusOptimizer onApiStatusChange={setApiStatus} />
                
                
              </div>
            )}
          </div>
        </MobileBookingOptimization>
      </PerformanceWrapper>
    </ErrorBoundary>
    </SearchErrorBoundary>
  </AccessibilityProvider>
</CurrencyProvider>
  );
};
export default HotelSearchPage;
