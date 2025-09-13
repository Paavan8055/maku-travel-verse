
import { useState } from "react";
import { usePerformanceOptimizer } from "@/hooks/usePerformanceOptimizer";
import { useTranslation } from "react-i18next";
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
import MultiCitySegments, { type Segment } from "@/components/search/MultiCitySegments";
import { ActivitySearchBar } from "@/components/search/ActivitySearchBar";
import { MobileSearchSheet } from "@/components/MobileSearchSheet";

const SearchSection = () => {
  const { t } = useTranslation();
  // EMERGENCY: Removed duplicate performance monitoring - already handled by HomePage wrapper
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
const [segments, setSegments] = useState<Segment[]>([
  { from: "", to: "", date: undefined },
  { from: "", to: "", date: undefined },
]);

// Activities state
const [activityDestination, setActivityDestination] = useState("");
const [activityCheckIn, setActivityCheckIn] = useState<Date>();
const [activityCheckOut, setActivityCheckOut] = useState<Date>();
const [activityAdults, setActivityAdults] = useState(2);
const [activityChildren, setActivityChildren] = useState(0);

  const searchTabs = [
    { id: "hotels", label: t('navigation.hotels'), icon: Building },
    { id: "flights", label: t('navigation.flights'), icon: Plane },
    { id: "cars", label: t('navigation.cars'), icon: Car },
    { id: "activities", label: t('navigation.activities'), icon: Camera }
  ];

  const popularDestinations = [
    "Paris, France",
    "Tokyo, Japan",
    "New York, USA",
    "Bali, Indonesia",
    "Rome, Italy",
    "Dubai, UAE"
  ];

  const handleHotelSearch = () => {
    if (!destination || !checkIn || !checkOut) {
      return; // Basic validation
    }
    
    const params = new URLSearchParams();
    
    params.set("destination", destination);
    params.set("checkIn", format(checkIn, "yyyy-MM-dd"));
    params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
    
    // Enhanced parameter handling with proper adult/children separation
    const guestCount = parseInt(guests);
    const adultsCount = Math.max(1, Math.min(guestCount, 8)); // Max 8 adults
    const childrenCount = Math.max(0, guestCount - adultsCount);
    
    params.set("adults", String(adultsCount));
    params.set("children", String(childrenCount));
    params.set("rooms", "1");
    params.set("guests", guests); // Keep for backward compatibility
    params.set("searched", "true");
    
    window.location.href = `/search/hotels?${params.toString()}`;
  };

  return (
    <section className="relative -mt-16 z-30 px-6">
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
<DestinationAutocomplete
  value={destination}
  onChange={setDestination}
  onDestinationSelect={(d) => setDestination(d.code ? `${d.city ?? d.name} (${d.code})` : d.name)}
  placeholder={t('search.destination')}
  className="search-input"
/>
                </div>

                {/* Check-in Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="search-input justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {checkIn ? format(checkIn, "MMM dd") : t('search.checkIn')}
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
                      {checkOut ? format(checkOut, "MMM dd") : t('search.checkOut')}
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
                   <SelectTrigger className="search-input" aria-label="Select number of guests">
                     <Users className="mr-2 h-4 w-4" />
                     <SelectValue placeholder={t('search.guests')} />
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

              <div className="flex justify-center gap-4">
                <Button 
                  className="btn-primary text-lg px-12 py-4"
                  onClick={handleHotelSearch}
                >
                  <Search className="mr-2 h-5 w-5" />
                  {t('search.searchHotels')}
                </Button>
                
                <div className="md:hidden">
                  <MobileSearchSheet 
                    trigger={
                      <Button variant="outline" size="lg" className="p-4">
                        <Search className="h-5 w-5" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flights" className="space-y-6">
              {tripType !== "multicity" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  {/* From */}
                  <DestinationAutocomplete
                    value={flightFrom}
                    onChange={setFlightFrom}
                    onDestinationSelect={(d) => setFlightFrom(d.code ? `${d.city || d.name} (${d.code})` : d.name)}
                    placeholder={t('search.departure')}
                    className="search-input"
                    searchType="airport"
                  />

                  {/* To */}
                  <DestinationAutocomplete
                    value={flightTo}
                    onChange={setFlightTo}
                    onDestinationSelect={(d) => setFlightTo(d.code ? `${d.city || d.name} (${d.code})` : d.name)}
                    placeholder={t('search.destination')}
                    className="search-input"
                    searchType="airport"
                  />

                  {/* Departure */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="search-input justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {flightDepart ? format(flightDepart, "MMM dd") : t('search.departure')}
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
                          {flightReturn ? format(flightReturn, "MMM dd") : t('search.return')}
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
              ) : (
                <div className="space-y-4">
                  {/* Trip Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  {/* Segments */}
                  <MultiCitySegments
                    segments={segments}
                    onChange={setSegments}
                    onAdd={() => setSegments((s) => [...s, { from: "", to: "", date: undefined }])}
                    onRemove={(idx) => setSegments((s) => s.filter((_, i) => i !== idx))}
                  />
                </div>
              )}

              <div className="flex justify-center">
                <Button 
                  className="btn-primary text-lg px-12 py-4"
                  disabled={
                    tripType === "multicity"
                      ? !(segments.length >= 2 && segments.every((s) => s.from && s.to && s.date))
                      : (!flightFrom || !flightTo || !flightDepart || (tripType === "roundtrip" && !flightReturn))
                  }
                  onClick={() => {
                    const toCode = (text: string) => {
                      if (!text) return "";
                      const m = text.match(/\(([A-Za-z0-9]{3,4})\)/);
                      if (m) return m[1].toUpperCase();
                      const t = text.trim().toUpperCase();
                      if (t.length === 3) return t;
                      // fallback: take last 3 letters if looks like "City (CODE)" wasn't used
                      return t.slice(-3);
                    };

                    const base: Record<string, string> = {
                      cabinClass: cabinClass,
                      tripType: tripType,
                      passengers: String(adults + children + infants),
                      adults: String(adults),
                      children: String(children),
                      infants: String(infants),
                    };

                    if (tripType === "multicity") {
                      const segs = segments.map((s) => ({
                        origin: toCode(s.from),
                        destination: toCode(s.to),
                        date: s.date ? format(s.date, "yyyy-MM-dd") : "",
                      }));
                      const params = new URLSearchParams(base);
                      params.set("segments", JSON.stringify(segs));
                      window.location.href = `/search/flights?${params.toString()}`;
                    } else {
                      const params = new URLSearchParams({
                        ...base,
                        origin: toCode(flightFrom),
                        destination: toCode(flightTo),
                        departureDate: flightDepart ? format(flightDepart, "yyyy-MM-dd") : "",
                        returnDate: tripType === "roundtrip" && flightReturn ? format(flightReturn, "yyyy-MM-dd") : "",
                      });
                      window.location.href = `/search/flights?${params.toString()}`;
                    }
                  }}
                >
                  <Search className="mr-2 h-5 w-5" />
                  {t('search.searchFlights')}
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
                  onClick={() => window.location.href = `/search/cars`}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search Cars
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-6">
              <ActivitySearchBar
                destination={activityDestination}
                setDestination={setActivityDestination}
                checkIn={activityCheckIn}
                setCheckIn={setActivityCheckIn}
                checkOut={activityCheckOut}
                setCheckOut={setActivityCheckOut}
                adults={activityAdults}
                setAdults={setActivityAdults}
                children={activityChildren}
                setChildren={setActivityChildren}
                onSearch={() => {
                  const params = new URLSearchParams({
                    destination: activityDestination,
                    checkIn: activityCheckIn ? format(activityCheckIn, "yyyy-MM-dd") : "",
                    checkOut: activityCheckOut ? format(activityCheckOut, "yyyy-MM-dd") : "",
                    guests: String(activityAdults + activityChildren),
                    adults: String(activityAdults),
                    children: String(activityChildren)
                  });
                  window.location.href = `/search/activities?${params.toString()}`;
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;
