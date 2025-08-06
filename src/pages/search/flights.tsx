import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { FlightCard } from "@/features/search/components/FlightCard";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";

const FlightSearchPage = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("price");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [filters, setFilters] = useState({
    stops: "any",
    airline: "any",
    departure: "any"
  });

  const searchCriteria = {
    origin: "SYD", // Default or from search params
    destination: searchParams.get("destination") || "",
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
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "duration":
          return a.duration - b.duration;
        case "departure":
          return a.departureTime.localeCompare(b.departureTime);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Flights from Sydney to {searchParams.get("destination")}
          </h1>
          <p className="text-muted-foreground">
            {searchParams.get("checkIn")} • {searchParams.get("guests")} passenger(s)
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

                <div>
                  <label className="text-sm font-medium mb-3 block">Stops</label>
                  <Select value={filters.stops} onValueChange={(value) => setFilters({...filters, stops: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any stops</SelectItem>
                      <SelectItem value="0">Direct</SelectItem>
                      <SelectItem value="1">1 stop</SelectItem>
                      <SelectItem value="2+">2+ stops</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Airline</label>
                  <Select value={filters.airline} onValueChange={(value) => setFilters({...filters, airline: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any airline</SelectItem>
                      <SelectItem value="qantas">Qantas</SelectItem>
                      <SelectItem value="jetstar">Jetstar</SelectItem>
                      <SelectItem value="virgin">Virgin Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <SortAsc className="h-5 w-5" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Best Price</SelectItem>
                    <SelectItem value="duration">Shortest Duration</SelectItem>
                    <SelectItem value="departure">Departure Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary">
                {filteredAndSortedFlights.length} flights found
              </Badge>
            </div>

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

            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Error loading flights: {error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {filteredAndSortedFlights.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} />
                ))}
                
                {filteredAndSortedFlights.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No flights found matching your criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightSearchPage;