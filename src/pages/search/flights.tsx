import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plane, Clock, Luggage, ChevronRight, MapPin, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";

const FlightSearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("price");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [departureTimeRange, setDepartureTimeRange] = useState([0, 24]);
  const [filters, setFilters] = useState({
    stops: "any",
    airline: "any",
    cabin: "any",
    baggage: "any"
  });

  const searchCriteria = {
    origin: searchParams.get("origin") || "SYD",
    destination: searchParams.get("destination") || "BOM",
    departureDate: searchParams.get("checkIn") || "",
    returnDate: searchParams.get("checkOut") || "",
    passengers: parseInt(searchParams.get("guests") || "1")
  };

  const { flights, loading, error } = useFlightSearch(searchCriteria);

  const filteredAndSortedFlights = flights
    .filter(flight => {
      if (priceRange[0] > 0 && flight.price < priceRange[0]) return false;
      if (priceRange[1] < 2000 && flight.price > priceRange[1]) return false;
      if (filters.stops !== "any" && flight.stops !== filters.stops) return false;
      if (filters.airline !== "any" && flight.airline !== filters.airline) return false;
      if (filters.cabin !== "any" && flight.cabin.toLowerCase() !== filters.cabin) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price": return a.price - b.price;
        case "duration": return a.duration - b.duration;
        case "departure": return a.departureTime.localeCompare(b.departureTime);
        case "arrival": return a.arrivalTime.localeCompare(b.arrivalTime);
        default: return 0;
      }
    });

  const formatTime = (time: string) => time;
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleSelectFlight = (flight: any) => {
    navigate(`/booking-select?type=flight&id=${flight.id}&origin=${searchCriteria.origin}&destination=${searchCriteria.destination}`);
  };

  const sortTabs = [
    { key: "price", label: "Best Price" },
    { key: "flights", label: "Best Flights" },
    { key: "duration", label: "Shortest Duration" },
    { key: "departure", label: "Departure Time" },
    { key: "arrival", label: "Arrival Time" }
  ];

  // SEO: dynamic title and meta description
  useEffect(() => {
    const title = `Flights ${searchCriteria.origin} → ${searchCriteria.destination} | Maku.travel`;
    const when = searchCriteria.departureDate ? ` on ${searchCriteria.departureDate}` : '';
    const description = `Compare fares and book flights from ${searchCriteria.origin} to ${searchCriteria.destination}${when}. Live results powered by Amadeus.`;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.setAttribute('rel', 'canonical');
      document.head.appendChild(canon);
    }
    canon.setAttribute('href', window.location.origin + '/search/flights');
  }, [searchCriteria.origin, searchCriteria.destination, searchCriteria.departureDate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <Plane className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium text-primary">Departing flight</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center">
            <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
              <Plane className="h-5 w-5" />
            </div>
            <span className="ml-2 text-muted-foreground">Returning flight</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center">
            <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="ml-2 text-muted-foreground">Customize your trip</span>
          </div>
        </div>

        {/* Flight Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {filteredAndSortedFlights.length} flights from {searchCriteria.origin} to {searchCriteria.destination}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Filter departing flight</h3>
                
                <div className="space-y-6">
                  {/* Price Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Price</label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={2000}
                      step={50}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm">
                      <span>US$ {priceRange[0]}</span>
                      <span>US$ {priceRange[1]}</span>
                    </div>
                  </div>

                  {/* Time Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Time</label>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Departure - 00:00 - 23:59</div>
                        <Slider
                          value={departureTimeRange}
                          onValueChange={setDepartureTimeRange}
                          max={24}
                          step={1}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm">
                          <span>{departureTimeRange[0]}:00</span>
                          <span>{departureTimeRange[1]}:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                {/* Sort Tabs */}
                <div className="border-b">
                  <div className="flex">
                    <div className="text-sm text-muted-foreground p-4">Sort by</div>
                    {sortTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSortBy(tab.key)}
                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                          sortBy === tab.key
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flight List */}
                <div className="p-6">
                  <div className="space-y-4">
                    {loading && (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                              <div className="h-20 bg-muted rounded"></div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {!loading && !error && filteredAndSortedFlights.map((flight) => (
                      <Card key={flight.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            {/* Airline Info */}
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center">
                                <span className="text-orange-600 font-bold text-xs">{flight.airlineCode}</span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{flight.airline}</div>
                                <div className="text-xs text-muted-foreground">{flight.flightNumber}</div>
                              </div>
                            </div>

                            {/* Flight Details */}
                            <div className="flex items-center space-x-8 flex-1 justify-center">
                              <div className="text-center">
                                <div className="text-xl font-bold">{formatTime(flight.departureTime)}</div>
                                <div className="text-sm text-muted-foreground">{flight.origin}</div>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Plane className="h-4 w-4 text-muted-foreground" />
                                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                                  <Plane className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-sm text-muted-foreground">{formatDuration(flight.duration)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {flight.stops === "0" ? "Direct" : `(${flight.stops} stop)`}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xl font-bold">{formatTime(flight.arrivalTime)}</div>
                                <div className="text-sm text-muted-foreground">{flight.destination}</div>
                              </div>
                            </div>

                            {/* Price and Action */}
                            <div className="text-right space-y-2">
                              <div>
                                <div className="text-sm text-muted-foreground">from</div>
                                <div className="text-xl font-bold text-primary">US${flight.price}</div>
                                <div className="text-sm text-muted-foreground">Total round trip price</div>
                              </div>
                              <Button onClick={() => handleSelectFlight(flight)} className="w-full">
                                Select flight
                              </Button>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Luggage className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-600">Carry-on bag included</span>
                              </div>
                              {flight.baggage?.checked && (
                                <div className="flex items-center space-x-1">
                                  <Luggage className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm text-blue-600">Checked bag included</span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Show details
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {!loading && !error && filteredAndSortedFlights.length === 0 && (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">No flights found matching your criteria</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightSearchPage;