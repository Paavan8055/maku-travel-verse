import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plane, Clock, Luggage, ChevronRight, MapPin, ArrowRightLeft, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";
import { useCurrency } from "@/features/currency/CurrencyProvider";

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

  // Inline search controls state
  const [originInput, setOriginInput] = useState(searchParams.get("origin") || "");
  const [destinationInput, setDestinationInput] = useState(searchParams.get("destination") || "");
  const [departDate, setDepartDate] = useState<Date | undefined>(
    searchParams.get("departureDate") ? new Date(searchParams.get("departureDate") as string) :
    searchParams.get("checkIn") ? new Date(searchParams.get("checkIn") as string) : undefined
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    searchParams.get("returnDate") ? new Date(searchParams.get("returnDate") as string) :
    searchParams.get("checkOut") ? new Date(searchParams.get("checkOut") as string) : undefined
  );
  const [passengersInput, setPassengersInput] = useState(searchParams.get("passengers") || searchParams.get("guests") || "1");

  // Trip options and passenger breakdown
  const [tripType, setTripType] = useState<string>(
    searchParams.get("tripType") || (searchParams.get("returnDate") ? "roundtrip" : "oneway")
  );
  const [cabinClass, setCabinClass] = useState<string>(searchParams.get("cabinClass") || "economy");
  const initialAdults = parseInt(searchParams.get("adults") || "1", 10);
  const initialChildren = parseInt(searchParams.get("children") || "0", 10);
  const initialInfants = parseInt(searchParams.get("infants") || "0", 10);
  const [adults, setAdults] = useState<number>(initialAdults);
  const [children, setChildren] = useState<number>(initialChildren);
  const [infants, setInfants] = useState<number>(initialInfants);
  const totalPassengers = adults + children + infants;
  useEffect(() => {
    setPassengersInput(String(Math.max(1, totalPassengers)));
  }, [adults, children, infants]);

  // Multi-city legs
  const [legs, setLegs] = useState<Array<{ origin: string; destination: string; date?: Date }>>(() => {
    const segsParam = searchParams.get("segments");
    if (segsParam) {
      try {
        const segs = JSON.parse(decodeURIComponent(segsParam));
        if (Array.isArray(segs)) {
          return segs.map((s: any) => ({
            origin: s.origin || "",
            destination: s.destination || "",
            date: s.date ? new Date(s.date) : undefined,
          }));
        }
      } catch {}
    }
    return [
      { origin: originInput || (searchParams.get("origin") || ""), destination: destinationInput || (searchParams.get("destination") || ""), date: departDate },
      { origin: "", destination: "", date: undefined },
    ];
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const searchCriteria = {
    origin: searchParams.get("origin") || "SYD",
    destination: searchParams.get("destination") || "BOM",
    departureDate: searchParams.get("departureDate") || searchParams.get("checkIn") || "",
    returnDate: searchParams.get("returnDate") || searchParams.get("checkOut") || "",
    passengers: parseInt(searchParams.get("passengers") || searchParams.get("guests") || "1")
  };

  const { flights, loading, error } = useFlightSearch(searchCriteria);

  const { convert, formatCurrency } = useCurrency();

  const filteredAndSortedFlights = flights
    .map((f: any) => ({ ...f, _displayPrice: convert(f.price, (f.currency || "USD")) }))
    .filter((flight: any) => {
      if (priceRange[0] > 0 && flight._displayPrice < priceRange[0]) return false;
      if (priceRange[1] < 2000 && flight._displayPrice > priceRange[1]) return false;
      const depHour = getHourFrom(flight.departureTime);
      if (depHour < departureTimeRange[0] || depHour > departureTimeRange[1]) return false;
      if (filters.stops !== "any" && flight.stops !== filters.stops) return false;
      if (filters.airline !== "any" && flight.airline !== filters.airline) return false;
      if (filters.cabin !== "any" && flight.cabin.toLowerCase() !== filters.cabin) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "price": return a._displayPrice - b._displayPrice;
        case "duration": return a.duration - b.duration;
        case "departure": return a.departureTime.localeCompare(b.departureTime);
        case "arrival": return a.arrivalTime.localeCompare(b.arrivalTime);
        default: return 0;
      }
    });

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    try {
      if (time.includes("T")) {
        const d = new Date(time);
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
      }
      return time;
    } catch {
      return time;
    }
  };
  function getHourFrom(time: string) {
    if (!time) return 0;
    try {
      if (time.includes("T")) return new Date(time).getHours();
      const [h] = time.split(":");
      return parseInt(h || "0", 10);
    } catch {
      return 0;
    }
  }
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateLabel = (time: string) => {
    try {
      if (time && time.includes("T")) {
        const d = new Date(time);
        return {
          date: format(d, "dd MMM yyyy"),
          day: format(d, "EEEE"),
          full: `${format(d, "dd MMM yyyy")} • ${format(d, "EEEE")}`,
        };
      }
    } catch {}
    return { date: "", day: "", full: "" };
  };

  const humanizeISODuration = (iso?: string) => {
    if (!iso) return "";
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const h = parseInt(m?.[1] || "0", 10);
    const min = parseInt(m?.[2] || "0", 10);
    if (!h && !min) return "";
    return `${h ? `${h}h` : ""} ${min ? `${min}m` : ""}`.trim();
  };

  const diffMinutes = (a?: string, b?: string) => {
    try {
      if (!a || !b) return 0;
      if (a.includes("T") && b.includes("T")) {
        const da = new Date(a).getTime();
        const db = new Date(b).getTime();
        return Math.max(0, Math.round((db - da) / 60000));
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const formatLayover = (arr?: string, nextDep?: string, airport?: string) => {
    const mins = diffMinutes(arr, nextDep);
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m layover${airport ? ` - ${airport}` : ""}`;
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
        {/* Search Controls */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
          {/* Top selectors: Trip type, Passengers, Cabin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Trip</label>
              <Select
                value={tripType}
                onValueChange={(v) => {
                  setTripType(v);
                  if (v !== "roundtrip") setReturnDate(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trip type" />
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
                  <Button variant="outline" className="w-full justify-between">
                    <span>{totalPassengers} {totalPassengers === 1 ? "Passenger" : "Passengers"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-3">
                    {[
                      { key: "Adults", desc: "12+", value: adults, set: setAdults, min: 1 },
                      { key: "Children", desc: "2-11", value: children, set: setChildren, min: 0 },
                      { key: "Infants", desc: "<2", value: infants, set: setInfants, min: 0 },
                    ].map((row) => (
                      <div key={row.key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{row.key}</div>
                          <div className="text-xs text-muted-foreground">{row.desc}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => row.set(Math.max(row.min, row.value - 1))}
                          >
                            −
                          </Button>
                          <div className="w-6 text-center text-sm">{row.value}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => row.set(Math.min(9, row.value + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cabin class</label>
              <Select value={cabinClass} onValueChange={setCabinClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Cabin" />
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

          {/* Trip inputs */}
          {tripType !== "multicity" ? (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <Input value={originInput} onChange={(e)=>setOriginInput(e.target.value)} placeholder="SYD" />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <Input value={destinationInput} onChange={(e)=>setDestinationInput(e.target.value)} placeholder="BOM" />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground mb-1 block">Departure</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departDate ? format(departDate, "MMM dd, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={departDate}
                      onSelect={setDepartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {tripType === "roundtrip" && (
                <div className="md:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Return</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
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
              <div className="md:col-span-1 md:col-start-6 self-end">
                <Button
                  className="w-full"
                  disabled={!((originInput || searchCriteria.origin) && (destinationInput || searchCriteria.destination))}
                  onClick={() => {
                    const origin = originInput || searchCriteria.origin;
                    const destination = destinationInput || searchCriteria.destination;

                    const chosenDepart = departDate || (searchCriteria.departureDate ? new Date(searchCriteria.departureDate) : new Date());
                    const departStr = format(chosenDepart, "yyyy-MM-dd");

                    const params = new URLSearchParams();
                    params.set("tripType", tripType);
                    params.set("origin", origin);
                    params.set("destination", destination);
                    params.set("departureDate", departStr);
                    params.set("returnDate", tripType === "roundtrip" && returnDate ? format(returnDate, "yyyy-MM-dd") : "");
                    params.set("passengers", String(totalPassengers));
                    params.set("adults", String(adults));
                    params.set("children", String(children));
                    params.set("infants", String(infants));
                    params.set("cabinClass", cabinClass);

                    navigate(`/search/flights?${params.toString()}`);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {legs.map((leg, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">From</label>
                    <Input value={leg.origin} onChange={(e)=>{
                      const v = e.target.value; setLegs((prev)=> prev.map((l,i)=> i===idx ? { ...l, origin: v } : l));
                    }} placeholder="SYD" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">To</label>
                    <Input value={leg.destination} onChange={(e)=>{
                      const v = e.target.value; setLegs((prev)=> prev.map((l,i)=> i===idx ? { ...l, destination: v } : l));
                    }} placeholder="BOM" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {leg.date ? format(leg.date, "MMM dd, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={leg.date}
                          onSelect={(d) => setLegs((prev)=> prev.map((l,i)=> i===idx ? { ...l, date: d } : l))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end gap-2">
                    {legs.length > 1 && (
                      <Button variant="outline" onClick={() => setLegs((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setLegs((prev) => prev.length >= 5 ? prev : [...prev, { origin: "", destination: "", date: undefined }])}
                >
                  Add flight
                </Button>
                <Button
                  onClick={() => {
                    const valid = legs.filter(l => l.origin && l.destination && l.date);
                    if (valid.length === 0) return;
                    const first = valid[0];
                    const params = new URLSearchParams();
                    params.set("tripType", "multicity");
                    params.set("origin", first.origin);
                    params.set("destination", first.destination);
                    params.set("departureDate", format(first.date as Date, "yyyy-MM-dd"));
                    params.set("returnDate", "");
                    params.set("passengers", String(totalPassengers));
                    params.set("adults", String(adults));
                    params.set("children", String(children));
                    params.set("infants", String(infants));
                    params.set("cabinClass", cabinClass);
                    params.set("segments", encodeURIComponent(JSON.stringify(valid.map((s) => ({ origin: s.origin, destination: s.destination, date: format(s.date as Date, "yyyy-MM-dd") })))));
                    navigate(`/search/flights?${params.toString()}`);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          )}
        </div>
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
                      <span>{formatCurrency(priceRange[0])}</span>
                      <span>{formatCurrency(priceRange[1])}</span>
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
                            <button
                              type="button"
                              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                              aria-expanded={!!expanded[flight.id]}
                              onClick={() => setExpanded((prev) => ({ ...prev, [flight.id]: !prev[flight.id] }))}
                            >
                              {expanded[flight.id] ? "Hide details" : "Show details"}
                            </button>
                          </div>

                            {expanded[flight.id] && (
                              <div className="mt-4 rounded-lg border bg-card/50 p-4">
                                <div className="grid gap-6 md:grid-cols-3 text-sm">
                                  {/* Timeline like Travala */}
                                  <div className="md:col-span-2">
                                    <div className="text-xs text-muted-foreground mb-3">
                                      {formatDateLabel(flight.departureTime).full}
                                    </div>
                                    {Array.isArray(flight.segments) && flight.segments.length > 0 ? (
                                      <ol className="relative pl-4 border-l">
                                        {flight.segments.map((seg: any, idx: number) => (
                                          <li key={idx} className="mb-6">
                                            <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <div className="font-medium text-foreground">
                                                  {formatTime(seg.departure?.time || "")} {seg.departure?.airport}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  Flight no: {seg.flightNumber || flight.flightNumber} • Cabin: {flight.cabin}
                                                </div>
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {humanizeISODuration(seg.duration)}
                                              </div>
                                            </div>
                                            <div className="mt-2">
                                              <div className="font-medium text-foreground">
                                                {formatTime(seg.arrival?.time || "")} {seg.arrival?.airport}
                                              </div>
                                              {idx < flight.segments.length - 1 && (
                                                <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                                  <Clock className="h-3.5 w-3.5" />
                                                  <span>{formatLayover(seg.arrival?.time, flight.segments[idx + 1]?.departure?.time, flight.segments[idx + 1]?.departure?.airport) || "Layover"}</span>
                                                </div>
                                              )}
                                            </div>
                                          </li>
                                        ))}
                                      </ol>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="text-sm">{flight.airline}</div>
                                        <div className="text-xs text-muted-foreground">Flight no: {flight.flightNumber} • Cabin: {flight.cabin}</div>
                                      </div>
                                    )}
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      Arrive at destination {formatDateLabel(flight.arrivalTime).full} • {flight.destination}
                                    </div>
                                  </div>

                                  {/* Side facts */}
                                  <div className="space-y-3">
                                    <div>
                                      <div className="font-medium mb-1">Baggage</div>
                                      <ul className="space-y-1 text-muted-foreground">
                                        <li>Carry-on: {flight.baggage?.carry ? "Included" : "—"}</li>
                                        <li>Checked: {flight.baggage?.checked ? "Included" : "—"}</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">Aircraft</div>
                                      <div className="text-muted-foreground">{flight.aircraft || "—"}</div>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">Seats left</div>
                                      <div className="text-muted-foreground">{flight.availableSeats}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

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