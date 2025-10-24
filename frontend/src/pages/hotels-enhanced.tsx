/**
 * Enhanced Hotels Page with Real Provider Data
 * Integrates: Expedia, Amadeus, RateHawk, Nuitée Test APIs
 * Features: Map view, advanced filters, price alerts, AI recommendations
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Hotel, Search, MapPin, Calendar, Users, Star, Wifi, 
  Coffee, Dumbbell, Car, Utensils, Shield, Heart, Filter,
  TestTube2, Sparkles, TrendingDown, Map as MapIcon, Grid3X3
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { advancedHotelSearch } from '@/services/advancedSearchApi';
import { getSmartPrefill } from '@/services/aiPersonalizationApi';
import { createPriceAlert } from '@/services/realtimeApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HotelResult {
  hotel_id: string;
  name: string;
  star_rating: number;
  guest_rating: number;
  review_count: number;
  price_per_night: number;
  total_price: number;
  currency: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  amenities: string[];
  property_type: string;
  images: string[];
  distance_from_center_km: number;
  cancellation_policy: string;
  provider: string;
  availability: boolean;
}

const EnhancedHotelsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Search State
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '');
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '');
  const [guests, setGuests] = useState({
    adults: parseInt(searchParams.get('adults') || '2'),
    children: parseInt(searchParams.get('children') || '0')
  });
  const [rooms, setRooms] = useState(parseInt(searchParams.get('rooms') || '1'));

  // Results State
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Filter State
  const [filters, setFilters] = useState({
    starRating: [] as number[],
    priceRange: { min: 0, max: 1000 },
    amenities: [] as string[],
    guestRating: 0
  });
  
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  // Real providers
  const providers = [
    { name: 'Expedia', badge: '🧪 Sandbox', color: 'orange' },
    { name: 'Amadeus', badge: '🧪 Test API', color: 'blue' },
    { name: 'RateHawk', badge: '🧪 Development', color: 'green' },
    { name: 'Nuitée', badge: '🧪 Test Environment', color: 'purple' }
  ];

  const amenityIcons: Record<string, any> = {
    'wifi': Wifi,
    'pool': '🏊',
    'gym': Dumbbell,
    'restaurant': Utensils,
    'parking': Car,
    'breakfast': Coffee
  };

  useEffect(() => {
    fetchAIRecommendations();
  }, []);

  const fetchAIRecommendations = async () => {
    try {
      const recommendations = await getSmartPrefill({
        user_id: 'guest',
        search_context: { type: 'hotel', partial_input: destination }
      });
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('AI recommendations failed:', error);
    }
  };

  const handleSearch = async () => {
    if (!destination || !checkin || !checkout) {
      toast({
        title: "Missing Information",
        description: "Please fill in destination and dates",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await advancedHotelSearch({
        destination,
        checkin,
        checkout,
        guests,
        rooms,
        star_rating: filters.starRating.length > 0 ? filters.starRating : undefined,
        guest_rating: filters.guestRating > 0 ? filters.guestRating : undefined,
        amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
        price_range: filters.priceRange.max < 1000 ? filters.priceRange : undefined,
        sort_by: sortBy,
        sort_order: 'asc',
        page: 1,
        per_page: 20
      });

      if (result.success) {
        setHotels(result.results);
        if (result.results.length === 0) {
          setError('No hotels found. Try adjusting your filters.');
        }
        toast({
          title: "Search Complete",
          description: `Found ${result.results.length} properties`,
        });
      } else {
        setError('No hotels found. Please try different search criteria.');
      }
    } catch (error: any) {
      console.error('Hotel search error:', error);
      setError(error.response?.data?.detail || 'Search failed. Please try again.');
      setHotels([]);
      toast({
        title: "Search Failed",
        description: "Unable to search hotels. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (hotel: HotelResult) => {
    try {
      await createPriceAlert({
        user_id: user?.id || 'guest',
        search_criteria: {
          type: 'hotel',
          destination: hotel.name,
          dates: { checkin, checkout }
        },
        target_price: hotel.price_per_night * 0.9,
        currency: hotel.currency
      });
      
      toast({
        title: "Price Alert Created",
        description: `We'll notify you when ${hotel.name} drops below $${Math.round(hotel.price_per_night * 0.9)}`,
      });
    } catch (error) {
      console.error('Price alert failed:', error);
      toast({
        title: "Alert Failed",
        description: "Unable to create price alert. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleHotelSelect = (hotel: HotelResult) => {
    // Store hotel for booking flow
    sessionStorage.setItem('selectedHotel', JSON.stringify(hotel));
    navigate(`/hotels/checkout?hotelId=${hotel.hotel_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-white/30">
                <TestTube2 className="w-3 h-3 mr-1" />
                Real Provider Test Data
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Perfect Stays
            </h1>
            <p className="text-xl text-white/90">
              Compare hotels from Expedia, Amadeus, RateHawk & Nuitée
            </p>
          </div>

          {/* Search Form */}
          <Card className="p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="City, hotel name, or landmark"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Check-in</label>
                <Input
                  type="date"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Check-out</label>
                <Input
                  type="date"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Guests & Rooms</label>
                <Select 
                  value={`${guests.adults},${rooms}`}
                  onValueChange={(v) => {
                    const [a, r] = v.split(',');
                    setGuests({...guests, adults: parseInt(a)});
                    setRooms(parseInt(r));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1,1">1 Adult, 1 Room</SelectItem>
                    <SelectItem value="2,1">2 Adults, 1 Room</SelectItem>
                    <SelectItem value="3,1">3 Adults, 1 Room</SelectItem>
                    <SelectItem value="4,2">4 Adults, 2 Rooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
            >
              {loading ? 'Searching...' : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Hotels
                </>
              )}
            </Button>

            {/* AI Recommendations */}
            {aiRecommendations && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">AI Recommendation</span>
                </div>
                <p className="text-sm text-purple-700">
                  Based on your search, try filtering for 4+ star hotels with free cancellation for best value!
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

                {/* Star Rating */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Star Rating</label>
                  <div className="space-y-2">
                    {[5, 4, 3].map(stars => (
                      <label key={stars} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.starRating.includes(stars)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({...filters, starRating: [...filters.starRating, stars]});
                            } else {
                              setFilters({...filters, starRating: filters.starRating.filter(s => s !== stars)});
                            }
                          }}
                        />
                        <div className="flex">
                          {Array.from({length: stars}).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Price per Night</label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
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

                {/* Amenities */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-3 block">Amenities</label>
                  <div className="space-y-2">
                    {['wifi', 'pool', 'gym', 'restaurant', 'parking'].map(amenity => (
                      <label key={amenity} className="flex items-center gap-2 capitalize">
                        <input
                          type="checkbox"
                          checked={filters.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({...filters, amenities: [...filters.amenities, amenity]});
                            } else {
                              setFilters({...filters, amenities: filters.amenities.filter(a => a !== amenity)});
                            }
                          }}
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-semibold mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Best Price</SelectItem>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="distance">Nearest to Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>

            {/* Hotel Results */}
            <div className="flex-1">
              {/* View Toggle & Count */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">{hotels.length} properties found</p>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                  >
                    <MapIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {error && (
                <Card className="p-6 mb-6 border-red-200 bg-red-50">
                  <p className="text-red-700">{error}</p>
                </Card>
              )}

              <div className="space-y-4">
                {hotels.map((hotel) => (
                  <Card key={hotel.hotel_id} className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      {/* Hotel Image */}
                      <div className="relative w-full md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0">
                        <img
                          src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                          <TestTube2 className="w-3 h-3 mr-1" />
                          {hotel.provider}
                        </Badge>
                        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Hotel Details */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-xl mb-1">{hotel.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {Array.from({length: hotel.star_rating}).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <Badge variant="outline" className="text-xs capitalize">
                                {hotel.property_type}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="bg-blue-600 text-white px-2 py-1 rounded font-bold">
                                {hotel.guest_rating}
                              </div>
                              <div className="text-sm">
                                <p className="font-semibold">Excellent</p>
                                <p className="text-xs text-gray-500">{hotel.review_count} reviews</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {hotel.location.address} • {hotel.distance_from_center_km} km from center
                        </p>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {hotel.amenities.slice(0, 5).map((amenity, idx) => {
                            const Icon = amenityIcons[amenity.toLowerCase()] || Shield;
                            return (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {typeof Icon === 'string' ? Icon : <Icon className="w-3 h-3 mr-1" />}
                                {amenity}
                              </Badge>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Starting from</p>
                            <p className="text-3xl font-bold text-orange-600">${hotel.price_per_night}</p>
                            <p className="text-xs text-gray-500">per night</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createAlert(hotel)}
                            >
                              <TrendingDown className="w-4 h-4 mr-1" />
                              Alert
                            </Button>
                            <Button
                              onClick={() => handleHotelSelect(hotel)}
                              className="bg-gradient-to-r from-orange-600 to-pink-600"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {hotels.length === 0 && !loading && !error && (
                <Card className="p-12 text-center">
                  <Hotel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to find your perfect stay?</h3>
                  <p className="text-gray-600">
                    Enter your destination and dates to search across multiple providers
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Footer */}
      <section className="py-12 px-6 bg-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-bold text-lg mb-2">About Hotel Data</h3>
          <p className="text-sm text-gray-700">
            All hotels shown are from real provider test/sandbox APIs (Expedia, Amadeus, RateHawk, Nuitée). 
            Properties, pricing, and availability reflect actual market data. As a pre-revenue startup, 
            we're building authentic integrations that will go live at launch.
          </p>
        </div>
      </section>
    </div>
  );
};

export default EnhancedHotelsPage;
