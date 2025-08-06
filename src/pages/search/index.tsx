import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";

const SearchHub = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("type") || "flights";

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");

  const handleSearch = (searchType: string) => {
    const params = new URLSearchParams({
      destination,
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : "",
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : "",
      guests,
    });

    navigate(`/search/${searchType}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
            Search & Book Your Perfect Trip
          </h1>

          <Tabs value={activeTab} onValueChange={(value) => navigate(`?type=${value}`)}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="flights" className="flex items-center gap-2">
                ✈️ Flights
              </TabsTrigger>
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                🏨 Hotels
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                🎯 Activities
              </TabsTrigger>
            </TabsList>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Where to?"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Check-in</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Check-out</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Guests</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger>
                      <Users className="mr-2 h-4 w-4" />
                      <SelectValue />
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
              </div>

              <TabsContent value="flights" className="mt-0">
                <Button 
                  onClick={() => handleSearch("flights")} 
                  className="w-full"
                  disabled={!destination || !checkIn}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Flights
                </Button>
              </TabsContent>

              <TabsContent value="hotels" className="mt-0">
                <Button 
                  onClick={() => handleSearch("hotels")} 
                  className="w-full"
                  disabled={!destination || !checkIn || !checkOut}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Hotels
                </Button>
              </TabsContent>

              <TabsContent value="activities" className="mt-0">
                <Button 
                  onClick={() => handleSearch("activities")} 
                  className="w-full"
                  disabled={!destination || !checkIn}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Activities
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SearchHub;