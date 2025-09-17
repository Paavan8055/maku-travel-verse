import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";
import { FareSelectionDialog } from "@/features/search/components/FareSelectionDialog";
import { FlightCard } from "@/features/search/components/FlightCard";
import { PopularRoutesSection } from "@/components/search/PopularRoutesSection";
import { FeaturedDealsCarousel } from "@/components/search/FeaturedDealsCarousel";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { FlightBookingProgress } from "@/components/flight/FlightBookingProgress";
import { IntelligentSearchForm } from "@/components/flight/IntelligentSearchForm";
import { IntelligentTravelInfo } from "@/components/flight/IntelligentTravelInfo";
import { EnhancedFlightCard } from "@/components/flight/EnhancedFlightCard";
import { FlightSortingToolbar } from "@/components/flight/FlightSortingToolbar";
import ReturnFlightSearch from "@/components/flight/ReturnFlightSearch";
import { SearchResultsLayout } from "@/components/search/SearchResultsLayout";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import MultiCityFlightManager from "@/components/flight/MultiCityFlightManager";
import { IntelligentSearchControls } from "@/components/search/IntelligentSearchControls";
import { SmartCachingProvider } from "@/components/flight/SmartCachingProvider";

import { useIntelligentFlightSorting } from "@/hooks/useIntelligentFlightSorting";
import { useContextAwareFilters } from "@/hooks/useContextAwareFilters";
import { useBackgroundPerformanceTracking } from "@/hooks/useBackgroundPerformanceTracking";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Search, Plane, MapPin, Users, AlertTriangle } from "lucide-react";
import { format as formatDate } from "date-fns";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { cn } from "@/lib/utils";

interface FlightSearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

interface MultiCitySegment {
  origin: string;
  destination: string;
  date: string;
}

interface MultiCitySelection {
  segmentIndex: number;
  flight: any;
}

const FlightSearchPage = () => {
  const [tripType, setTripType] = useState("roundtrip");
  const [origin, setOrigin] = useState("SYD");
  const [destination, setDestination] = useState("MEL");
  const [originInput, setOriginInput] = useState("Sydney (SYD)");
  const [destinationInput, setDestinationInput] = useState("Melbourne (MEL)");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("economy");
  const [hasSearched, setHasSearched] = useState(false);
  
  const navigate = useNavigate();
  
  // Multi-city specific state
  const [multiCitySegments, setMultiCitySegments] = useState<MultiCitySegment[]>([
    { origin: "SYD", destination: "MEL", date: formatDate(new Date(), "yyyy-MM-dd") },
    { origin: "MEL", destination: "BNE", date: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") },
  ]);
  const [multiCitySelections, setMultiCitySelections] = useState<MultiCitySelection[]>([]);

  // Enhanced UI state
  const [showModifySearch, setShowModifySearch] = useState(false);
  const [sortBy, setSortBy] = useState("intelligent");
  const [activeFilters, setActiveFilters] = useState<Array<{key: string, label: string}>>([]);
  const [isIntelligentMode, setIsIntelligentMode] = useState(true);
  const [userContext, setUserContext] = useState({
    tripPurpose: 'leisure' as 'business' | 'leisure' | 'family',
    priceFlexibility: 'moderate' as 'budget' | 'moderate' | 'premium'
  });

  // Filter states - Set wide default range to not block results
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<string[]>([]);

  // Flight selection states
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [selectedInbound, setSelectedInbound] = useState<any>(null);
  const [showReturnFlights, setShowReturnFlights] = useState(false);
  const [fareOpen, setFareOpen] = useState(false);
  const [fareFlight, setFareFlight] = useState<any>(null);

  const searchCriteria: FlightSearchCriteria = {
    origin,
    destination,
    departureDate: departureDate ? formatDate(departureDate, "yyyy-MM-dd") : "",
    returnDate: returnDate ? formatDate(returnDate, "yyyy-MM-dd") : undefined,
    passengers: adults + children + infants,
  };

  // Search criteria for current search (outbound or return)
  const currentSearchCriteria = showReturnFlights && selectedOutbound 
    ? {
        origin: destination,
        destination: origin,
        departureDate: returnDate ? formatDate(returnDate, "yyyy-MM-dd") : "",
        passengers: adults + children + infants,
      }
    : searchCriteria;

  const { flights, loading, error } = useFlightSearch(currentSearchCriteria);

  // Auto-trigger search on page load - simplified logic
  useEffect(() => {
    if (origin && destination && departureDate && !hasSearched) {
      setHasSearched(true);
    }
  }, [origin, destination, departureDate]);

  const handleSearch = () => {
    setHasSearched(true);
    setShowModifySearch(false);
  };

  const handleRouteSelect = (route: any) => {
    setOrigin(route.departure);
    setDestination(route.destination);
    setOriginInput(`${route.departureCity} (${route.departure})`);
    setDestinationInput(`${route.destinationCity} (${route.destination})`);
    setHasSearched(true);
  };

  const handleDealSelect = (deal: any) => {
    setOrigin("SYD");
    setDestination(deal.destination);
    setOriginInput("Sydney (SYD)");
    setDestinationInput(`${deal.destinationCity} (${deal.destination})`);
    if (deal.departureDate) {
      setDepartureDate(new Date(deal.departureDate));
    }
    setHasSearched(true);
  };

  const handleOriginSelect = (destination: any) => {
    setOrigin(destination.code || destination.id);
    setOriginInput(destination.code ? `${destination.city} (${destination.code})` : destination.name);
  };

  const handleDestinationSelect = (destination: any) => {
    setDestination(destination.code || destination.id);
    setDestinationInput(destination.code ? `${destination.city} (${destination.code})` : destination.name);
  };

  const handleSelectFlight = (flight: any) => {
    if (tripType === "roundtrip") {
      if (!selectedOutbound) {
        setSelectedOutbound(flight);
      } else if (!selectedInbound) {
        setSelectedInbound(flight);
        setFareFlight(flight);
        setFareOpen(true);
      }
    } else {
      setFareFlight(flight);
      setFareOpen(true);
    }
  };

  const handleSelectFare = (flight: any, fare: any) => {
    
    // Store flight data for review page with real pricing and flight details
    const flightData = {
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      outboundFlightNumber: flight.outboundFlightNumber,
      returnFlightNumber: flight.returnFlightNumber,
      origin: flight.origin,
      destination: flight.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      stops: flight.stops,
      fareType: fare.type,
      price: fare.price,
      currency: fare.currency || 'AUD',
      date: formatDate(departureDate || new Date(), 'EEE, MMM dd'),
      segments: flight.segments,
      amenities: flight.amenities,
      // Store the real Amadeus flight offer data
      amadeusOfferId: flight.id,
      offerData: flight
    };

    if (tripType === 'roundtrip') {
      if (!selectedOutbound) {
        // First selection - outbound flight
        setSelectedOutbound({ flight, fare });
        sessionStorage.setItem('selectedOutboundFlight', JSON.stringify(flightData));
        sessionStorage.setItem('tripType', 'roundtrip');
        sessionStorage.setItem('searchCriteria', JSON.stringify(searchCriteria));
        
        // Trigger return flight search
        setShowReturnFlights(true);
        // Set up reverse search criteria for return flights
        const returnCriteria = {
          origin: destination,
          destination: origin,
          departureDate: returnDate ? formatDate(returnDate, "yyyy-MM-dd") : "",
          passengers: adults + children + infants,
        };
        sessionStorage.setItem('returnSearchCriteria', JSON.stringify(returnCriteria));
      } else {
        // Second selection - return flight  
        const returnFlightData = {
          ...flightData,
          date: formatDate(returnDate || new Date(), 'EEE, MMM dd')
        };
        setSelectedInbound({ flight, fare });
        sessionStorage.setItem('selectedInboundFlight', JSON.stringify(returnFlightData));
        
        // Navigate to review page
        navigate('/flight-booking-review');
      }
    } else if (tripType === 'multicity') {
      // Handle multi-city selections
      handleMultiCitySelect(0, { flight, fare }); // For now, treating as first segment
      if (multiCitySelections.length >= multiCitySegments.length - 1) {
        sessionStorage.setItem('multiCityFlights', JSON.stringify([...multiCitySelections, { segmentIndex: 0, flight: { flight, fare } }]));
        sessionStorage.setItem('tripType', 'multicity');
        navigate('/flight-booking-review');
      }
    } else {
      // One-way - go directly to review
      sessionStorage.setItem('selectedOutboundFlight', JSON.stringify(flightData));
      sessionStorage.setItem('tripType', tripType);
      navigate('/flight-booking-review');
    }
  };

  const handleDateChange = (date: Date) => {
    setDepartureDate(date);
    // Trigger new search with updated date
    setHasSearched(true);
  };

  const handleModifySearch = () => {
    setShowModifySearch(!showModifySearch);
  };

  const handleRemoveFilter = (filterKey: string) => {
    setActiveFilters(activeFilters.filter(f => f.key !== filterKey));
    if (filterKey.startsWith('airline-')) {
      const airline = filterKey.replace('airline-', '');
      setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
    } else if (filterKey === 'stops') {
      setSelectedStops([]);
    }
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setSelectedAirlines([]);
    setSelectedStops([]);
    setSelectedCabins([]);
    setPriceRange([0, 5000]);
  };

  const handleMultiCitySelect = (segmentIndex: number, flight: any) => {
    const newSelections = [...multiCitySelections];
    const existingIndex = newSelections.findIndex(s => s.segmentIndex === segmentIndex);
    
    if (existingIndex >= 0) {
      newSelections[existingIndex] = { segmentIndex, flight };
    } else {
      newSelections.push({ segmentIndex, flight });
    }
    
    setMultiCitySelections(newSelections);
    
    if (newSelections.length === multiCitySegments.length) {
      setFareOpen(true);
    }
  };

  // Transform a single flight for enhanced card
  const transformFlightForEnhanced = (flight: any) => {
    return {
      ...flight,
      outboundFlightNumber: flight.outboundFlightNumber,
      returnFlightNumber: flight.returnFlightNumber,
      departure: flight.departure,
      arrival: flight.arrival,
      stopoverInfo: flight.stopoverInfo,
      fareOptions: [
        {
          type: "economy" as const,
          price: flight.price,
          currency: flight.currency,
          features: ["Standard seat", "Carry-on bag", "In-flight entertainment"],
          seatsAvailable: flight.availableSeats
        },
        {
          type: "business" as const,
          price: flight.price * 2.5,
          currency: flight.currency,
          features: ["Premium seat", "Priority boarding", "Meal included", "Extra baggage"],
          seatsAvailable: Math.max(0, Math.floor(flight.availableSeats / 4))
        }
      ],
      amenities: ["WiFi", "Meal", "Entertainment"],
      duration: flight.duration || 120,
      stops: parseInt(flight.stops) || 0
    };
  };

  const enhancedFlights = flights.map(transformFlightForEnhanced);

  // Enhanced flight sorting with intelligence
  const {
    sortedFlights,
    sortingMode,
    setSortingMode,
    getRecommendations,
    updateBehaviorPattern
  } = useIntelligentFlightSorting(enhancedFlights, userContext);

  // Context-aware filtering
  const {
    activeFilters: smartFilters,
    suggestedFilters,
    getContextualFilterOptions
  } = useContextAwareFilters({
    searchContext: {
      origin,
      destination,
      tripType,
      passengers: adults + children + infants
    },
    preferences: {
      budgetRange: priceRange as [number, number]
    }
  });

  // Background performance tracking (silent - admin analytics only)
  useBackgroundPerformanceTracking('FlightSearchPage');

  // Use intelligent sorting results if enabled, otherwise use enhanced flights
  const displayFlights = isIntelligentMode ? sortedFlights : enhancedFlights;
  
  // Filter flights based on user preferences - Fixed price parsing
  const filteredFlights = displayFlights.filter(flight => {
    // Fix price parsing - handle both numbers and strings correctly
    let price = 0;
    if (typeof flight.price === 'number') {
      price = flight.price;
    } else if (typeof flight.price === 'string') {
      // Remove currency symbols and parse
      price = parseFloat(flight.price.replace(/[^0-9.]/g, ''));
    }
    
    // Skip price filter if price is 0 or invalid
    if (price > 0 && (price < priceRange[0] || price > priceRange[1])) {
      return false;
    }
    
    if (selectedAirlines.length > 0 && !selectedAirlines.includes(flight.airline)) return false;
    if (selectedStops.length > 0) {
      const stopsCount = typeof flight.stops === 'number' ? flight.stops : parseInt(flight.stops);
      const stops = stopsCount === 0 ? "nonstop" : stopsCount === 1 ? "1stop" : "2+stops";
      if (!selectedStops.includes(stops)) return false;
    }
    if (selectedCabins.length > 0 && !selectedCabins.includes(flight.cabin)) return false;
    
    return true;
  });

  const isRoundtrip = tripType === "roundtrip";
  const isMultiCity = tripType === "multicity";

  return (
    <SmartCachingProvider>
      <PerformanceWrapper componentName="FlightSearchPage">
        <div className="min-h-screen bg-background">
          <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Search Controls */}
        <IntelligentSearchForm 
          onSearch={(searchData) => {
            console.log('Search initiated:', searchData);
            // Handle search logic here
          }}
          className="mb-6"
        />
        
        {!hasSearched ? (
          <div className="space-y-8">
            <PopularRoutesSection 
              onRouteSelect={handleRouteSelect}
              origin={origin}
            />
            <FeaturedDealsCarousel 
              onDealSelect={handleDealSelect}
              origin={origin}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <IntelligentTravelInfo 
              origin={origin}
              destination={destination}
              departureDate={departureDate}
              returnDate={isRoundtrip ? returnDate : undefined}
              passengers={adults + children + infants}
              tripType={tripType}
              onModify={handleModifySearch}
              resultsCount={flights.length}
              searchContext={{
                isBusinessTravel: cabinClass === 'business',
                budgetRange: [0, 1000],
                flexibility: 'flexible'
              }}
            />
            
            {!showModifySearch && (
              <>
                <FlightSortingToolbar
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  activeFilters={activeFilters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAllFilters={handleClearAllFilters}
                  resultsCount={filteredFlights.length}
                />
              </>
            )}
          </div>
        )}

        {hasSearched && showModifySearch && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Modify your search</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <DestinationAutocomplete
                  value={originInput}
                  onChange={setOriginInput}
                  onDestinationSelect={handleOriginSelect}
                  placeholder="From where?"
                  searchType="airport"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <DestinationAutocomplete
                  value={destinationInput}
                  onChange={setDestinationInput}
                  onDestinationSelect={handleDestinationSelect}
                  placeholder="Where to?"
                  searchType="airport"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Departure</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? formatDate(departureDate, "MMM dd") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {isRoundtrip && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Return</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? formatDate(returnDate, "MMM dd") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch}>
                Update Search
              </Button>
              <Button variant="outline" onClick={() => setShowModifySearch(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Searching flights...</h3>
            <p className="text-muted-foreground">Finding the best options for your trip</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Flight Search Issue
            </h3>
            <div className="mb-4 space-y-2">
              <p className="text-muted-foreground">
                {error.includes('temporarily unavailable') 
                  ? 'Some flight providers are temporarily unavailable, but we\'re still finding flights through our active providers.'
                  : error
                }
              </p>
              {(error.includes('temporarily unavailable') || error.includes('quota')) && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mx-auto max-w-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ✅ Flight search is still working through Sabre and other active providers. You may see fewer results than usual.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleSearch} variant="outline">
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="ghost"
                className="text-sm"
              >
                Refresh Page
              </Button>
            </div>
            {error.includes('temporarily unavailable') && (
              <p className="text-xs text-muted-foreground mt-4">
                Last attempt: {new Date().toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {hasSearched && !showModifySearch && !loading && !error && (
          <div className="w-full">
            {/* Flight Booking Progress */}
            <FlightBookingProgress currentStep={1} />
            
            {/* Results Section - Full width clean layout */}
            <div className="space-y-6">
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredFlights.length} of {flights.length} flights
              </div>
              {filteredFlights.map((flight, index) => (
                <EnhancedFlightCard
                  key={`${flight.id}-${searchCriteria.origin}-${searchCriteria.destination}-${searchCriteria.departureDate}-${index}`}
                  flight={flight}
                  onSelectFare={handleSelectFare}
                  showFareOptions={true}
                />
              ))}
              {filteredFlights.length === 0 && flights.length > 0 && (
                <Card className="p-12 text-center">
                  <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No flights match your filters</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your price range or filter criteria.</p>
                  <Button onClick={handleClearAllFilters} variant="outline">
                    Clear Filters
                  </Button>
                </Card>
              )}
              {flights.length === 0 && (
                <Card className="p-12 text-center">
                  <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No flights found</h3>
                  <p className="text-muted-foreground mb-4">Try different dates or destinations.</p>
                  <Button onClick={handleSearch} variant="outline">
                    Search Again
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>


      <FareSelectionDialog
        open={fareOpen}
        onOpenChange={setFareOpen}
        flight={fareFlight}
        outbound={selectedOutbound}
        tripType={tripType}
        multiCitySelections={multiCitySelections}
      />

        </div>
      </PerformanceWrapper>
    </SmartCachingProvider>
  );
};

export default FlightSearchPage;