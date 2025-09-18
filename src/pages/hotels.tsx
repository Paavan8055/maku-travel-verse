import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SearchErrorBoundary } from "@/components/error-boundaries/SearchErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Star, Wifi, Car, Utensils, Dumbbell, Users, AlertTriangle } from "lucide-react";
import { useAdvancedProviderRotation } from "@/hooks/useAdvancedProviderRotation";
import { unifiedSearchOrchestrator } from "@/services/core";
import { AdaptiveResultsRanking } from "@/components/search/AdaptiveResultsRanking";
import { PersonalizedSearchExperience } from "@/components/search/PersonalizedSearchExperience";
import { PredictiveSearchSuggestions } from "@/components/search/PredictiveSearchSuggestions";
import { ContextAwareRecommendations } from "@/components/search/ContextAwareRecommendations";
import { useToast } from "@/hooks/use-toast";
import { PhotoRetriever } from "@/services/core/PhotoRetriever";

const HotelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchWithAdvancedRotation, searchState } = useAdvancedProviderRotation();
  
  // Search state
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')!) : undefined
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')!) : undefined
  );
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'));
  const [rooms, setRooms] = useState(parseInt(searchParams.get('rooms') || '1'));
  
  // Enhanced results state
  const [hotels, setHotels] = useState<any[]>([]);
  const [rankedHotels, setRankedHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);

  const photoRetriever = new PhotoRetriever();

  // Enhanced hotel search with provider rotation
  const handleHotelSearch = async () => {
    if (!destination || !checkInDate || !checkOutDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all search fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setError(null);
      setHasSearched(true);
      
      // Update URL with search parameters
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('destination', destination);
      newSearchParams.set('checkIn', format(checkInDate, 'yyyy-MM-dd'));
      newSearchParams.set('checkOut', format(checkOutDate, 'yyyy-MM-dd'));
      newSearchParams.set('guests', guests.toString());
      newSearchParams.set('rooms', rooms.toString());
      setSearchParams(newSearchParams);

      console.log('HotelsPage: Starting unified hotel search');
      
      // Generate unique search ID
      const searchId = `hotel-search-${Date.now()}`;
      setCurrentSearchId(searchId);

      // Create search request for unified orchestrator
      const searchRequest = {
        type: 'hotel' as const,
        searchType: 'hotel' as const,
        params: {
          cityCode: destination.toUpperCase(),
          checkInDate: format(checkInDate, 'yyyy-MM-dd'),
          checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
          adults: guests,
          roomQuantity: rooms,
          searchId
        },
        priority: 'high' as const,
        options: {
          enableML: true,
          cacheResults: true,
          timeoutMs: 30000,
          maxProviders: 3
        }
      };

      const results = await unifiedSearchOrchestrator.orchestrateMultiServiceSearch([searchRequest]);

      console.log('HotelsPage: Unified search results:', results);

      if (results.length > 0) {
        const hotelResult = results[0];
        
        if (hotelResult.success && hotelResult.data) {
          // Handle enhanced response structure
          let hotelData = hotelResult.data.hotels || hotelResult.data.data || hotelResult.data || [];
          
          // Normalize hotel data from different providers
          hotelData = await Promise.all(hotelData.map(async (hotel: any) => {
            // Get enhanced photos using PhotoRetriever
            const photoResult = await PhotoRetriever.getHotelPhotos(
              hotel.id || hotel.hotelId || hotel.code,
              'auto',
              true
            );
            const photos = photoResult.success ? photoResult.photos : [];

            return {
              ...hotel,
              id: hotel.id || hotel.hotelId || hotel.code || Math.random().toString(),
              name: hotel.name || 'Unknown Hotel',
              location: hotel.location || hotel.address?.city || destination,
              rating: hotel.rating || hotel.starRating || 0,
              price: hotel.price || hotel.pricing?.netAmount || hotel.minRate || 0,
              currency: hotel.currency || hotel.price?.currency || 'AUD',
              images: photos.length > 0 ? photos : (hotel.images || []),
              amenities: hotel.amenities || [],
              distance: hotel.distance || null,
              source: hotel.source || 'unified' || 'unknown',
              searchId
            };
          }));
          
          setHotels(hotelData);
          
          if (hotelData.length === 0) {
            setError('No hotels found for your search criteria. Please try different dates or destinations.');
          }
        } else {
          console.error('HotelsPage: Hotel result failed:', hotelResult.error);
          setError(hotelResult.error || 'Unable to search hotels at this time');
          setHotels([]);
        }
      } else {
        console.error('HotelsPage: Unified search failed: No results');
        setError('Unable to search hotels at this time');
        setHotels([]);
      }

    } catch (error) {
      console.error('HotelsPage: Hotel search error:', error);
      setError('An unexpected error occurred while searching for hotels');
      setHotels([]);
      
      toast({
        title: "Search Error",
        description: "Unable to search hotels. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleHotelSelect = (hotel: any) => {
    try {
      // Store selected hotel in sessionStorage
      sessionStorage.setItem('selectedHotel', JSON.stringify(hotel));
      
      console.log('HotelsPage: Hotel selected:', hotel);
      
      // Navigate to hotel booking review page
      navigate('/hotels/review');
      
    } catch (error) {
      console.error('HotelsPage: Error selecting hotel:', error);
      toast({
        title: "Selection Error",
        description: "Unable to select hotel. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Auto-search if URL has search parameters
  useEffect(() => {
    if (destination && checkInDate && checkOutDate && !hasSearched) {
      console.log('HotelsPage: Auto-searching with URL criteria');
      handleHotelSearch();
    }
  }, []);

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Wifi className="h-4 w-4" />;
    }
    if (amenityLower.includes('parking') || amenityLower.includes('garage')) {
      return <Car className="h-4 w-4" />;
    }
    if (amenityLower.includes('restaurant') || amenityLower.includes('dining')) {
      return <Utensils className="h-4 w-4" />;
    }
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
      return <Dumbbell className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
  };

  return (
    <SearchErrorBoundary>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Enhanced Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Find Your Perfect Hotel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Destination</label>
                  <Input
                    placeholder="Enter city or hotel name"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Check-in</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkInDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Check-out</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkOutDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => date <= (checkInDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Guests & Rooms</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                      placeholder="Guests"
                    />
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={rooms}
                      onChange={(e) => setRooms(parseInt(e.target.value) || 1)}
                      placeholder="Rooms"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleHotelSearch} 
                className="w-full mt-4"
                disabled={searchState.isLoading}
              >
                {searchState.isLoading ? "Searching..." : "Search Hotels"}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-6">
              {/* Search Summary */}
              {(hotels.length > 0 || error) && (
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Hotel Search Results</h2>
                  {hotels.length > 0 && (
                    <p className="text-muted-foreground">
                      {destination} • {checkInDate && format(checkInDate, 'MMM dd')} - {checkOutDate && format(checkOutDate, 'MMM dd')}
                      • {guests} guest{guests > 1 ? 's' : ''} • {rooms} room{rooms > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Enhanced Search Components */}
              {!searchState.isLoading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <PersonalizedSearchExperience
                    searchType="hotel"
                    currentSearch={{
                      destination,
                      checkInDate,
                      checkOutDate,
                      guests,
                      rooms
                    }}
                    onRecommendationSelect={(rec) => {
                      console.log('Hotel recommendation selected:', rec);
                      toast({
                        title: "Recommendation Applied",
                        description: `Applied ${rec.action} filter to your search`
                      });
                    }}
                  />
                  <PredictiveSearchSuggestions
                    searchType="hotel"
                    currentLocation={destination}
                    onSuggestionSelect={(suggestion) => {
                      console.log('Hotel suggestion selected:', suggestion);
                      setDestination(suggestion.destination || suggestion.name);
                    }}
                  />
                  <ContextAwareRecommendations
                    searchType="hotel"
                  currentContext={{
                    destination,
                    dates: { start: checkInDate || new Date(), end: checkOutDate || new Date() },
                    travelers: { adults: guests, children: 0 },
                    tripPurpose: 'leisure'
                  }}
                    onRecommendationSelect={(rec) => {
                      console.log('Context recommendation selected:', rec);
                      toast({
                        title: "Recommendation Applied",
                        description: rec.title
                      });
                    }}
                  />
                </div>
              )}

              {/* Real-time Search Progress */}
              {searchState.isLoading && (
                <div className="mb-6 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Searching for hotels...</p>
                </div>
              )}

              {/* Adaptive Results Ranking */}
              {hotels.length > 0 && !searchState.isLoading && (
                <AdaptiveResultsRanking
                  results={hotels}
                  searchParams={{
                    destination,
                    checkInDate: checkInDate ? format(checkInDate, 'yyyy-MM-dd') : '',
                    checkOutDate: checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : '',
                    guests,
                    rooms
                  }}
                  searchType="hotel"
                  onRankingComplete={setRankedHotels}
                />
              )}

              {/* Loading State */}
              {searchState.isLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Finding hotels...</h3>
                  <p className="text-muted-foreground">Searching across multiple providers</p>
                </div>
              )}

              {/* Error State */}
              {error && !searchState.isLoading && (
                <Card className="p-12 text-center">
                  <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Search Error</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleHotelSearch} variant="outline">
                    Try Again
                  </Button>
                </Card>
              )}

              {/* Hotels Grid */}
              {!searchState.isLoading && !error && hotels.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(rankedHotels.length > 0 ? rankedHotels : hotels).map((hotel) => (
                    <Card key={hotel.id} className="hover:shadow-lg transition-shadow">
                      {/* Hotel Image */}
                      {hotel.images && hotel.images[0] && (
                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                          <img
                            src={hotel.images[0].url || hotel.images[0]}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-hotel.jpg';
                            }}
                          />
                          {/* Source Badge */}
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {hotel.source || 'Hotel'}
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Hotel Info */}
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{hotel.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{hotel.location}</span>
                              {hotel.distance && (
                                <span>• {hotel.distance}km from center</span>
                              )}
                            </div>
                          </div>

                          {/* Rating */}
                          {hotel.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < hotel.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-muted-foreground">({hotel.rating}/5)</span>
                            </div>
                          )}

                          {/* Amenities */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                        {hotel.amenities.slice(0, 4).map((amenity: any, index: number) => (
                          <div key={index} className="flex items-center space-x-1 text-xs text-muted-foreground">
                            {getAmenityIcon(typeof amenity === 'string' ? amenity : amenity.name || 'Amenity')}
                            <span>{typeof amenity === 'string' ? amenity : amenity.name || 'Amenity'}</span>
                          </div>
                        ))}
                            </div>
                          )}

                          {/* Price and Book Button */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                {hotel.currency} {hotel.price}
                              </p>
                              <p className="text-xs text-muted-foreground">per night</p>
                            </div>
                            <Button onClick={() => handleHotelSelect(hotel)}>
                              Select Hotel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Search Performed Yet */}
          {!hasSearched && !searchState.isLoading && (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4M7 7h10M7 10h10M7 13h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Find Your Perfect Stay</h3>
                  <p className="text-muted-foreground">
                    Search across multiple hotel providers to find the best deals
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SearchErrorBoundary>
  );
};

export default HotelsPage;