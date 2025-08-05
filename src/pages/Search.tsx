import { useState } from "react";
import { Search, Calendar, Users, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

const SearchPage = () => {
  const [searchType, setSearchType] = useState<"hotels" | "flights" | "cars">("hotels");
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [fundBalance] = useState(1250); // Mock fund balance

  const smartSuggestions = [
    { location: "Bali, Indonesia", type: "Spiritual", savings: "15% off" },
    { location: "Gold Coast, Australia", type: "Family", savings: "Group fund applies" },
    { location: "Tokyo, Japan", type: "Solo", savings: "Single room deals" },
    { location: "Sydney, Australia", type: "Pet", savings: "Pet-friendly certified" }
  ];

  const handleSearch = () => {
    // Navigate to results page
    window.location.href = `/booking/select?type=${searchType}&destination=${destination}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header with Fund Balance */}
      <div className="pt-24 pb-8 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 font-['Playfair_Display']">
                Search & <span className="hero-text">Book</span>
              </h1>
              <p className="text-muted-foreground">
                Find the perfect stay, flight, or car rental for your journey
              </p>
            </div>
            
            {/* Travel Fund Balance */}
            <Card className="travel-card">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Travel Fund Balance</p>
                  <p className="text-2xl font-bold text-primary">${fundBalance}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Manage Fund
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* Search Form */}
        <Card className="travel-card mb-8">
          <CardContent className="p-6">
            {/* Search Type Tabs */}
            <div className="flex space-x-4 mb-6">
              {(['hotels', 'flights', 'cars'] as const).map((type) => (
                <Button
                  key={type}
                  variant={searchType === type ? "default" : "ghost"}
                  onClick={() => setSearchType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  {searchType === 'flights' ? 'From / To' : 'Destination'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchType === 'flights' ? 'Sydney to Bali' : 'Where to?'}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {searchType === 'flights' ? 'Departure' : 'Check-in'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {searchType === 'flights' ? 'Return' : 'Check-out'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {searchType === 'cars' ? 'Driver Age' : 'Guests'}
                </label>
                <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {searchType === 'cars' ? `${num + 17} years` : `${num} guest${num > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full mt-6 btn-primary h-12">
              <Search className="h-4 w-4 mr-2" />
              Search {searchType}
            </Button>
          </CardContent>
        </Card>

        {/* Smart Suggestions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Smart Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {smartSuggestions.map((suggestion, index) => (
              <Card key={index} className="travel-card cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{suggestion.location}</h3>
                    <Badge variant="secondary">{suggestion.type}</Badge>
                  </div>
                  <p className="text-sm text-primary font-medium">{suggestion.savings}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Searches</h2>
          <div className="space-y-3">
            {['Hotels in Bali • Mar 15-22 • 2 guests', 'Flights Sydney to Tokyo • Apr 1 • 1 passenger'].map((search, index) => (
              <Card key={index} className="travel-card cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p>{search}</p>
                    <Button variant="ghost" size="sm">Search Again</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;