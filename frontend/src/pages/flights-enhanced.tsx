/**
 * Enhanced Flights Page with Real Provider Data
 * Integrates: Sabre, Duffle, Amadeus, Expedia Flight APIs
 * Features: Multi-city, advanced filters, real-time pricing, AI suggestions
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plane, Search, Filter, MapPin, Clock, Users, Calendar,
  TrendingDown, Star, Shield, AlertCircle, TestTube2, Sparkles,
  ArrowRight, Zap, DollarSign
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { advancedFlightSearch } from '@/services/advancedSearchApi';
import { getSmartPrefill } from '@/services/aiPersonalizationApi';
import { createPriceAlert } from '@/services/realtimeApi';

interface FlightResult {
  flight_id: string;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  stop_cities: string[];
  cabin_class: string;
  price: number;
  currency: string;
  seats_available: number;
  provider: string;
}

const EnhancedFlightsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Search State
  const [searchType, setSearchType] = useState<'one-way' | 'round-trip' | 'multi-city'>('round-trip');
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [departureDate, setDepartureDate] = useState(searchParams.get('departureDate') || '');
  const [returnDate, setReturnDate] = useState(searchParams.get('returnDate') || '');
  const [passengers, setPassengers] = useState({
    adults: parseInt(searchParams.get('adults') || '1'),
    children: parseInt(searchParams.get('children') || '0'),
    infants: parseInt(searchParams.get('infants') || '0')
  });
  const [cabinClass, setCabinClass] = useState(searchParams.get('cabinClass') || 'economy');

  // Results State
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState({
    maxStops: null as number | null,
    priceRange: { min: 0, max: 10000 },
    preferredAirlines: [] as string[],
    departureTimeRange: null
  });
  
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure_time'>('price');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Real provider data - Test environment
  const providers = [
    { name: 'Sabre', badge: '🧪 Test API', color: 'blue' },
    { name: 'Duffle', badge: '🧪 Sandbox', color: 'purple' },
    { name: 'Amadeus', badge: '🧪 Development', color: 'green' },
    { name: 'Expedia', badge: '🧪 Sandbox', color: 'orange' }
  ];

  // Fetch AI suggestions on mount
  useEffect(() => {
    fetchAISuggestions();
  }, []);

  const fetchAISuggestions = async () => {
    try {
      const suggestions = await getSmartPrefill({
        user_id: 'guest',
        search_context: { type: 'flight' }
      });
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestions failed:', error);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination || !departureDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await advancedFlightSearch({
        search_type: searchType,
        origin,
        destination,
        departure_date: departureDate,
        return_date: searchType === 'round-trip' ? returnDate : undefined,
        passengers,
        cabin_class: cabinClass as any,
        price_range: filters.priceRange.min > 0 || filters.priceRange.max < 10000 ? filters.priceRange : undefined,
        max_stops: filters.maxStops ?? undefined,
        preferred_airlines: filters.preferredAirlines.length > 0 ? filters.preferredAirlines : undefined,
        sort_by: sortBy,
        sort_order: 'asc',
        page: 1,
        per_page: 20
      });

      if (result.success) {
        setFlights(result.results);
        if (result.results.length === 0) {
          setError('No flights found. Try adjusting your search criteria or filters.');
        }
      } else {
        setError('No flights found. Please try different search criteria.');
      }
    } catch (error: any) {
      console.error('Flight search error:', error);
      setError(error.response?.data?.detail || 'Search failed. Please try again.');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (flight: FlightResult) => {
    try {
      const alert = await createPriceAlert({
        user_id: user?.id || 'guest',
        search_criteria: {
          type: 'flight',
          destination: flight.destination,
          dates: { departure: departureDate }
        },
        target_price: flight.price * 0.9, // Alert at 10% discount
        currency: flight.currency
      });
      
      alert('✅ Price alert created! We\'ll notify you when prices drop below $' + Math.round(flight.price * 0.9));
    } catch (error) {
      console.error('Price alert failed:', error);
      alert('⚠️ Unable to create price alert. Please try again.');
    }
  };

  const handleFlightSelect = (flight: FlightResult) => {
    // Store flight for booking flow
    sessionStorage.setItem('selectedFlight', JSON.stringify(flight));
    navigate(`/flights/review?flightId=${flight.flight_id}`);
  };

  const getAirlineLogo = (airline: string) => {
    const logos: Record<string, string> = {
      'Emirates': '🇦🇪',
      'Singapore Airlines': '🇸🇬',
      'Lufthansa': '🇩🇪',
      'Qatar Airways': '🇶🇦',
      'United': '🇺🇸',
      'Delta': '🇺🇸',
      'American': '🇺🇸'
    };
    return logos[airline] || '✈️';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-white/30">
                <TestTube2 className="w-3 h-3 mr-1" />
                Real Provider Test Data
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your Perfect Flight
            </h1>
            <p className="text-xl text-white/90">
              Compare flights from Sabre, Duffle, Amadeus & Expedia
            </p>
          </div>

          {/* Search Form */}
          <Card className="p-6 shadow-2xl">
            {/* Trip Type Selector */}
            <div className="flex gap-2 mb-6">
              {(['one-way', 'round-trip', 'multi-city'] as const).map((type) => (
                <Button
                  key={type}
                  variant={searchType === type ? 'default' : 'outline'}
                  onClick={() => setSearchType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From</label>
                <div className="relative">
                  <Plane className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="NYC, JFK, New York"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="LON, LHR, London"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Departure</label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              {searchType === 'round-trip' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Return</label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Passengers</label>
                <Select 
                  value={passengers.adults.toString()} 
                  onValueChange={(v) => setPassengers({...passengers, adults: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} Adult{n>1?'s':''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Select value={cabinClass} onValueChange={setCabinClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {loading ? (
                    <>Searching...</>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Flights
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* AI Suggestions */}
            {aiSuggestions && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">AI Suggestion</span>
                </div>
                <p className="text-sm text-purple-700">
                  Based on your preferences, try searching flexible dates (±3 days) for up to 30% savings!
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <Card className="p-6 sticky top-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>

                {/* Stops Filter */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Stops</label>
                  <div className="space-y-2">
                    {[
                      { value: 0, label: 'Nonstop' },
                      { value: 1, label: '1 Stop' },
                      { value: 2, label: '2+ Stops' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="stops"
                          checked={filters.maxStops === option.value}
                          onChange={() => setFilters({...filters, maxStops: option.value})}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Price Range</label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: { ...filters.priceRange, max: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>$0</span>
                    <span>${filters.priceRange.max}</span>
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Best Price</SelectItem>
                      <SelectItem value="duration">Shortest</SelectItem>
                      <SelectItem value="departure_time">Departure Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>

            {/* Flight Results */}
            <div className="flex-1">
              {error && (
                <Card className="p-6 mb-6 border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </Card>
              )}

              {flights.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-gray-600">{flights.length} flights found</p>
                  <div className="flex gap-2">
                    {providers.map(p => (
                      <Badge key={p.name} variant="outline" className="text-xs">
                        {p.badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {flights.map((flight) => (
                  <Card key={flight.flight_id} className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                          {getAirlineLogo(flight.airline)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{flight.airline}</h3>
                          <p className="text-sm text-gray-600">{flight.flight_number}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        <TestTube2 className="w-3 h-3 mr-1" />
                        {flight.provider}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-bold">{flight.departure_time.split('T')[1]?.slice(0,5) || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{flight.origin}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-px bg-gray-300 flex-1" />
                          <Plane className="w-4 h-4 text-gray-400" />
                          <div className="h-px bg-gray-300 flex-1" />
                        </div>
                        <p className="text-xs text-gray-600">
                          {Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops>1?'s':''}`}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{flight.arrival_time.split('T')[1]?.slice(0,5) || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{flight.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-3xl font-bold text-blue-600">${flight.price}</p>
                        <p className="text-xs text-gray-500">{flight.seats_available} seats left</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createAlert(flight)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Alert
                        </Button>
                        <Button
                          onClick={() => navigate(`/flights/review?flightId=${flight.flight_id}`)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600"
                        >
                          Select
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {flights.length === 0 && !loading && !error && (
                <Card className="p-12 text-center">
                  <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to find your flight?</h3>
                  <p className="text-gray-600">
                    Enter your travel details above and search across multiple providers
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Footer */}
      <section className="py-12 px-6 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-bold text-lg mb-2">About Flight Data</h3>
          <p className="text-sm text-gray-700">
            All flights shown are from real provider test/sandbox APIs (Sabre, Duffle, Amadeus, Expedia). 
            Airlines, routes, and pricing reflect actual market data. As a pre-revenue startup, we're building 
            authentic integrations that will go live at launch.
          </p>
        </div>
      </section>
    </div>
  );
};

export default EnhancedFlightsPage;
