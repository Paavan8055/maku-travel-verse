import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, MapPin, Calendar, Users, Wifi, Car, Utensils, Heart, Shield, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageOptimizer } from "@/components/media/ImageOptimizer";
import { useFeaturedDeals } from "@/hooks/useFeaturedDeals";

const FeaturedListings = () => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<string[]>([]);
  const { hotels, flights, activities, loading, error, lastFetched, refresh } = useFeaturedDeals();

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const getAmenityIcons = (amenities?: any[]) => {
    if (!amenities) return [Wifi, Car, Utensils];
    return [Wifi, Car, Utensils]; // Default amenities for now
  };

  const isRealTimeData = (id: string) => {
    return id.includes('live') || id.includes('demo');
  };

  const isLiveData = (id: string) => {
    return id.includes('live');
  };

  const isDemoData = (id: string) => {
    return id.includes('demo');
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-4xl md:text-5xl font-bold font-['Playfair_Display']">
              Featured <span className="hero-text">Travel Deals</span>
            </h2>
            {loading && <RefreshCw className="h-6 w-6 animate-spin text-travel-coral" />}
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4">
            Live travel deals updated in real-time from our partner networks.
          </p>
          {lastFetched && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-travel-coral" />
              <span>Last updated: {lastFetched.toLocaleTimeString()}</span>
              <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
          {error && (
            <div className="text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-full inline-block">
              Showing cached deals - {error}
            </div>
          )}
        </div>

        {/* Hotels Section */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold mb-8 text-center">Featured Hotels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Hotel loading placeholders
              [...Array(4)].map((_, index) => (
                <Card key={`hotel-skeleton-${index}`} className="travel-card overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              hotels.map((hotel, index) => (
              <Card 
                key={hotel.id} 
                className="travel-card overflow-hidden group cursor-pointer animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageOptimizer
                    src={hotel.image}
                    alt={hotel.name}
                    width={300}
                    height={192}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    quality={80}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <Badge variant="secondary" className="bg-travel-coral text-white">
                      {hotel.badge}
                    </Badge>
                    {isLiveData(hotel.id) && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    )}
                    {isDemoData(hotel.id) && (
                      <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                        API Demo
                      </Badge>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                    onClick={() => toggleFavorite(hotel.id)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        favorites.includes(hotel.id) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-white'
                      }`} 
                    />
                  </Button>

                  {/* Verified Badge */}
                  {hotel.verified && (
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      <Shield className="h-3 w-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg leading-tight">{hotel.name}</h3>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{hotel.location}</span>
                  </div>

                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 font-semibold">{hotel.rating}</span>
                      <span className="ml-1 text-sm text-muted-foreground">
                        ({hotel.reviews} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mb-4">
                    {getAmenityIcons(hotel.amenities).map((Amenity, idx) => (
                      <Amenity key={idx} className="h-4 w-4 text-muted-foreground" />
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">${hotel.price}</span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${hotel.originalPrice}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                    
                    <Badge variant="outline" className="text-travel-forest border-travel-forest">
                      {hotel.originalPrice ? Math.round(((hotel.originalPrice - hotel.price) / hotel.originalPrice) * 100) : 25}% off
                    </Badge>
                  </div>

                  <Button 
                    className="w-full mt-4 btn-primary"
                    onClick={() => window.location.href = `/booking/hotel?hotel=${encodeURIComponent(JSON.stringify({ id: hotel.id, name: hotel.name, pricePerNight: hotel.price }))}`}
                  >
                     {t('booking.bookNow')}
                  </Button>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>

        {/* Flights Section */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold mb-8 text-center">Featured Flights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              // Flight loading placeholders
              [...Array(2)].map((_, index) => (
                <Card key={`flight-skeleton-${index}`} className="travel-card overflow-hidden animate-pulse">
                  <div className="h-32 bg-muted"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              flights.map((flight, index) => (
              <Card 
                key={flight.id} 
                className="travel-card overflow-hidden animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={flight.image}
                    alt={`${flight.from} to ${flight.to}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-between px-6">
                    <div className="text-white">
                      <div className="text-2xl font-bold">{flight.from} → {flight.to}</div>
                      <div className="text-white/90">{flight.airline}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {isLiveData(flight.id) && (
                        <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      )}
                      {isDemoData(flight.id) && (
                        <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                          API Demo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-semibold">{flight.duration}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Stops</div>
                        <div className="font-semibold">{flight.stops}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 font-semibold">{flight.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl font-bold">${flight.price}</span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${flight.originalPrice}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">per person</div>
                    </div>
                    
                    <Button 
                      className="btn-primary"
                      onClick={() => window.location.href = `/booking/flight?flightId=${flight.id}&price=${flight.price}&from=${encodeURIComponent(flight.from)}&to=${encodeURIComponent(flight.to)}`}
                    >
                      Book Flight
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>

        {/* Activities Section */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold mb-8 text-center">Featured Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Activity loading placeholders
              [...Array(3)].map((_, index) => (
                <Card key={`activity-skeleton-${index}`} className="travel-card overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              activities.map((activity, index) => (
              <Card 
                key={activity.id} 
                className="travel-card overflow-hidden group cursor-pointer animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-white">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-lg flex-1">{activity.name}</h3>
                        <div className="flex flex-col gap-1 ml-2">
                          {isLiveData(activity.id) && (
                            <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          )}
                          {isDemoData(activity.id) && (
                            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                              API Demo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-white/90 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{activity.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 font-semibold">{activity.rating}</span>
                      <span className="ml-1 text-sm text-muted-foreground">
                        ({activity.reviews})
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{activity.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">${activity.price}</span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${activity.originalPrice}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">per person</div>
                    </div>
                    
                    <Button 
                      className="btn-primary"
                      onClick={() => window.location.href = `/booking/activity?activityId=${activity.id}&price=${activity.price}&name=${encodeURIComponent(activity.name)}`}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;