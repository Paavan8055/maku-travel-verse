import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";
import { FareSelectionDialog } from "@/features/search/components/FareSelectionDialog";
import { FlightCard } from "@/features/search/components/FlightCard";
import { PopularRoutesSection } from "@/components/search/PopularRoutesSection";
import { FeaturedDealsCarousel } from "@/components/search/FeaturedDealsCarousel";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { FlightBookingProgress } from "@/components/flight/FlightBookingProgress";
import { FlightRouteHeader } from "@/components/flight/FlightRouteHeader";
import { DateFlexibilityCalendar } from "@/components/flight/DateFlexibilityCalendar";
import { EnhancedFlightCard } from "@/components/flight/EnhancedFlightCard";
import { FlightSortingToolbar } from "@/components/flight/FlightSortingToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Search, Plane, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
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
  
  // Multi-city specific state
  const [multiCitySegments, setMultiCitySegments] = useState<MultiCitySegment[]>([
    { origin: "SYD", destination: "MEL", date: format(new Date(), "yyyy-MM-dd") },
    { origin: "MEL", destination: "BNE", date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") },
  ]);
  const [multiCitySelections, setMultiCitySelections] = useState<MultiCitySelection[]>([]);

  // Enhanced UI state
  const [showModifySearch, setShowModifySearch] = useState(false);
  const [sortBy, setSortBy] = useState("price_asc");
  const [activeFilters, setActiveFilters] = useState<Array<{key: string, label: string}>>([]);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [selectedCabins, setSelectedCabins] = useState<string[]>([]);

  // Flight selection states
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [fareOpen, setFareOpen] = useState(false);
  const [fareFlight, setFareFlight] = useState<any>(null);

  const searchCriteria: FlightSearchCriteria = {
    origin,
    destination,
    departureDate: departureDate ? format(departureDate, "yyyy-MM-dd") : "",
    returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
    passengers: adults + children + infants,
  };

  const { flights, loading, error } = useFlightSearch(hasSearched ? searchCriteria : null);

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
      } else if (!selectedReturn) {
        setSelectedReturn(flight);
        setFareFlight(flight);
        setFareOpen(true);
      }
    } else {
      setFareFlight(flight);
      setFareOpen(true);
    }
  };

  const handleSelectFare = (flight: any, fareType: string) => {
    console.log("Selected fare:", fareType, "for flight:", flight.id);
    setFareFlight({ ...flight, selectedFare: fareType });
    setFareOpen(true);
  };

  const handleDateChange = (date: Date, flights?: { departure?: any; return?: any }) => {
    setDepartureDate(date);
    if (flights?.departure) {
      setSelectedOutbound(flights.departure);
    }
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
    setPriceRange([0, 2000]);
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

  // Transform flights data for enhanced cards
  const transformFlightsForEnhanced = (flights: any[]) => {
    return flights.map(flight => ({
      ...flight,
      fareOptions: [
        {
          type: "economy" as const,
          price: flight.price,
          currency: flight.currency,
          features: ["Standard seat", "Carry-on bag", "In-flight entertainment"],
          available: true,
          seatsLeft: flight.availableSeats
        },
        {
          type: "business" as const,
          price: flight.price * 2.5,
          currency: flight.currency,
          features: ["Premium seat", "Priority boarding", "Meal included", "Extra baggage"],
          available: Math.random() > 0.3,
          seatsLeft: Math.max(0, Math.floor(flight.availableSeats / 4))
        },
        {
          type: "first" as const,
          price: flight.price * 4,
          currency: flight.currency,
          features: ["Luxury suite", "Premium dining", "Lounge access", "Concierge service"],
          available: Math.random() > 0.6,
          seatsLeft: Math.max(0, Math.floor(flight.availableSeats / 8))
        }
      ],
      amenities: ["WiFi", "Meal", "Entertainment"],
      onTimePerformance: Math.floor(Math.random() * 20) + 80
    }));
  };

  const enhancedFlights = transformFlightsForEnhanced(flights);

  // Filter flights based on user preferences
  const filteredFlights = enhancedFlights.filter(flight => {
    const priceStr = typeof flight.price === 'string' ? flight.price : flight.price.toString();
    const price = parseInt(priceStr.replace(/[^0-9]/g, ''));
    if (price < priceRange[0] || price > priceRange[1]) return false;
    
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {hasSearched && (
        <FlightBookingProgress currentStep={1} />
      )}
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Search Controls */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
          {/* Trip Type and Passenger Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Trip</label>
              <Select value={tripType} onValueChange={setTripType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oneway">One-way</SelectItem>
                  <SelectItem value="roundtrip">Round trip</SelectItem>
                  <SelectItem value="multicity">Multi-city</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Passengers</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    {adults + children + infants} passenger{adults + children + infants !== 1 ? 's' : ''}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Adults</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setAdults(Math.max(1, adults - 1))}>-</Button>
                        <span className="w-8 text-center">{adults}</span>
                        <Button size="sm" variant="outline" onClick={() => setAdults(adults + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Children</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setChildren(Math.max(0, children - 1))}>-</Button>
                        <span className="w-8 text-center">{children}</span>
                        <Button size="sm" variant="outline" onClick={() => setChildren(children + 1)}>+</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Infants</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setInfants(Math.max(0, infants - 1))}>-</Button>
                        <span className="w-8 text-center">{infants}</span>
                        <Button size="sm" variant="outline" onClick={() => setInfants(infants + 1)}>+</Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cabin</label>
              <Select value={cabinClass} onValueChange={setCabinClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Origin and Destination */}
          {!isMultiCity ? (
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
                      {departureDate ? format(departureDate, "MMM dd") : "Select date"}
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
                        {returnDate ? format(returnDate, "MMM dd") : "Select date"}
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
          ) : (
            <div className="space-y-3">
              {multiCitySegments.map((segment, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">From</label>
                    <Input value={segment.origin} readOnly />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">To</label>
                    <Input value={segment.destination} readOnly />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <Input type="date" value={segment.date} readOnly />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleSearch} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Search flights
          </Button>
        </div>

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
            <FlightRouteHeader 
              origin={origin}
              destination={destination}
              departureDate={departureDate}
              returnDate={isRoundtrip ? returnDate : undefined}
              passengers={adults + children + infants}
              tripType={tripType}
              onModify={handleModifySearch}
            />
            
            {!showModifySearch && (
              <>
                <DateFlexibilityCalendar 
                  selectedDate={departureDate}
                  onDateSelect={handleDateChange}
                  origin={origin}
                  destination={destination}
                  tripType={tripType}
                />
                
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
                      {departureDate ? format(departureDate, "MMM dd") : "Select date"}
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
                        {returnDate ? format(returnDate, "MMM dd") : "Select date"}
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

        {hasSearched && !showModifySearch && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Price Range</label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={2000}
                      step={50}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Airlines Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Airlines</label>
                    <div className="space-y-2">
                      {["Qantas", "Virgin Australia", "Jetstar"].map((airline) => (
                        <div key={airline} className="flex items-center space-x-2">
                          <Checkbox
                            id={airline}
                            checked={selectedAirlines.includes(airline)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAirlines([...selectedAirlines, airline]);
                              } else {
                                setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
                              }
                            }}
                          />
                          <label htmlFor={airline} className="text-sm">{airline}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Stops Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Stops</label>
                    <div className="space-y-2">
                      {[
                        { value: "nonstop", label: "Nonstop" },
                        { value: "1stop", label: "1 stop" },
                        { value: "2+stops", label: "2+ stops" }
                      ].map((stop) => (
                        <div key={stop.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={stop.value}
                            checked={selectedStops.includes(stop.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStops([...selectedStops, stop.value]);
                              } else {
                                setSelectedStops(selectedStops.filter(s => s !== stop.value));
                              }
                            }}
                          />
                          <label htmlFor={stop.value} className="text-sm">{stop.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="h-32 animate-pulse bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredFlights.map((flight, index) => (
                    <EnhancedFlightCard
                      key={`${flight.id}-${index}`}
                      flight={flight}
                      onSelectFare={handleSelectFare}
                      showFareOptions={true}
                    />
                  ))}
                  {filteredFlights.length === 0 && !loading && (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No flights found matching your criteria.</p>
                    </Card>
                  )}
                </div>
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
  );
};

export default FlightSearchPage;