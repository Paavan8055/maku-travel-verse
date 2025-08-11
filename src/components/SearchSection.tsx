import { useState } from "react";
import { Search, Calendar, Users, MapPin, Plane, Building, Car, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import FlightPassengerSelector from "@/components/search/FlightPassengerSelector";

const SearchSection = () => {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [activeTab, setActiveTab] = useState("hotels");
  // Flights state
  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [flightDepart, setFlightDepart] = useState<Date>();
  const [flightReturn, setFlightReturn] = useState<Date>();
const [flightPassengers, setFlightPassengers] = useState("1");
const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">("roundtrip");
const [cabinClass, setCabinClass] = useState("economy");
const [adults, setAdults] = useState(1);
const [children, setChildren] = useState(0);
const [infants, setInfants] = useState(0);

  const searchTabs = [
    { id: "hotels", label: "Hotels", icon: Building },
    { id: "flights", label: "Flights", icon: Plane },
    { id: "cars", label: "Cars", icon: Car },
    { id: "activities", label: "Activities", icon: Camera }
  ];

  const popularDestinations = [
    "Paris, France",
    "Tokyo, Japan",
    "New York, USA",
    "Bali, Indonesia",
    "Rome, Italy",
    "Dubai, UAE"
  ];

  return (
    <section className="relative -mt-32 z-30 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="travel-card bg-white p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              {searchTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="hotels" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Destination Input */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="search-input pl-11"
                  />
                  {destination && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                      {popularDestinations
                        .filter(dest => dest.toLowerCase().includes(destination.toLowerCase()))
                        .map((dest, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-muted cursor-pointer flex items-center space-x-2"
                            onClick={() => setDestination(dest)}
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{dest}</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Check-in Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="search-input justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {checkIn ? format(checkIn, "MMM dd") : "Check-in"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Check-out Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="search-input justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {checkOut ? format(checkOut, "MMM dd") : "Check-out"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Guests */}
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger className="search-input">
                    <Users className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Guests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4">4 Guests</SelectItem>
                    <SelectItem value="5">5+ Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button 
                  className="btn-primary text-lg px-12 py-4"
                  onClick={() => window.location.href = `/search?type=hotels&destination=${encodeURIComponent(destination)}`}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Hotels
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="flights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {/* From */}
                <DestinationAutocomplete
                  value={flightFrom}
                  onChange={setFlightFrom}
                  onDestinationSelect={(d) => setFlightFrom(d.code ? `${d.city} (${d.code})` : d.name)}
                  placeholder="From"
                  className="search-input"
                />

                {/* To */}
                <DestinationAutocomplete
                  value={flightTo}
                  onChange={setFlightTo}
                  onDestinationSelect={(d) => setFlightTo(d.code ? `${d.city} (${d.code})` : d.name)}
                  placeholder="To"
                  className="search-input"
                />

                {/* Departure */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="search-input justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {flightDepart ? format(flightDepart, "MMM dd") : "Departure"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={flightDepart}
                      onSelect={setFlightDepart}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Return (only for roundtrip) */}
                {tripType === "roundtrip" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="search-input justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {flightReturn ? format(flightReturn, "MMM dd") : "Return"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={flightReturn}
                        onSelect={setFlightReturn}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {/* Trip Type */}
                <Select value={tripType} onValueChange={(val) => setTripType(val as typeof tripType)}>
                  <SelectTrigger className="search-input">
                    <SelectValue placeholder="Trip type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oneway">One-way</SelectItem>
                    <SelectItem value="roundtrip">Round-trip</SelectItem>
                    <SelectItem value="multicity">Multi-city</SelectItem>
                  </SelectContent>
                </Select>

                {/* Cabin Class */}
                <Select value={cabinClass} onValueChange={setCabinClass}>
                  <SelectTrigger className="search-input">
                    <SelectValue placeholder="Cabin class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First</SelectItem>
                  </SelectContent>
                </Select>

                {/* Passengers */}
                <FlightPassengerSelector
                  adults={adults}
                  children={children}
                  infants={infants}
                  onChange={({ adults: a, children: c, infants: i }) => {
                    setAdults(a);
                    setChildren(c);
                    setInfants(i);
                  }}
                />
              </div>

              <div className="flex justify-center">
                <Button 
                  className="btn-primary text-lg px-12 py-4"
                  disabled={!flightFrom || !flightTo || (!flightDepart && tripType !== "multicity")}
                  onClick={() => {
                    const params = new URLSearchParams({
                      origin: flightFrom,
                      destination: flightTo,
                      departureDate: flightDepart ? format(flightDepart, "yyyy-MM-dd") : "",
                      returnDate: tripType === "roundtrip" && flightReturn ? format(flightReturn, "yyyy-MM-dd") : "",
                      passengers: String(adults + children + infants),
                      adults: String(adults),
                      children: String(children),
                      infants: String(infants),
                      cabin: cabinClass,
                      trip: tripType,
                    });
                    window.location.href = `/search?type=flights&${params.toString()}`;
                  }}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Flights
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="cars" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Pickup location"
                    className="search-input pl-11"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="search-input justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      Pickup date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="search-input justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      Return date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Select defaultValue="economy">
                  <SelectTrigger className="search-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="mid-size">Mid-size</SelectItem>
                    <SelectItem value="full-size">Full-size</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button 
                  className="btn-primary text-lg px-12 py-4"
                  onClick={() => window.location.href = `/search?type=cars`}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Cars
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Destination"
                    className="search-input pl-11"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="search-input justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      Activity date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Select defaultValue="any">
                  <SelectTrigger className="search-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any activity</SelectItem>
                    <SelectItem value="tours">Tours</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="food">Food & Drink</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button 
                  className="btn-primary text-lg px-12 py-4"
                  onClick={() => window.location.href = `/search?type=activities`}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Activities
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;