import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, MapPin, Calendar, Users, Wifi, Car, Utensils, Heart, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FeaturedListings = () => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const hotels = [
    {
      id: "h1",
      name: "Ocean View Resort & Spa",
      location: "Maldives",
      price: 350,
      originalPrice: 450,
      rating: 4.8,
      reviews: 1234,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
      amenities: [Wifi, Car, Utensils],
      verified: true,
      badge: "Best Deal",
      marketplace: "Family"
    },
    {
      id: "h2",
      name: "Mountain Lodge Retreat",
      location: "Swiss Alps",
      price: 280,
      originalPrice: 350,
      rating: 4.9,
      reviews: 892,
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
      amenities: [Wifi, Utensils],
      verified: true,
      badge: "Pet Friendly",
      marketplace: "Pet"
    },
    {
      id: "h3",
      name: "Urban Luxury Suites",
      location: "Tokyo, Japan",
      price: 220,
      originalPrice: 290,
      rating: 4.7,
      reviews: 2156,
      image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
      amenities: [Wifi, Car],
      verified: true,
      badge: "Solo Special",
      marketplace: "Solo"
    },
    {
      id: "h4",
      name: "Zen Wellness Resort",
      location: "Bali, Indonesia",
      price: 180,
      originalPrice: 240,
      rating: 4.9,
      reviews: 756,
      image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&h=300&fit=crop",
      amenities: [Wifi, Utensils],
      verified: true,
      badge: "Spiritual",
      marketplace: "Spiritual"
    }
  ];

  const flights = [
    {
      id: "f1",
      from: "New York",
      to: "Paris",
      price: 480,
      originalPrice: 620,
      airline: "Air France",
      duration: "7h 30m",
      stops: "Direct",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop"
    },
    {
      id: "f2",
      from: "London",
      to: "Tokyo",
      price: 750,
      originalPrice: 950,
      airline: "Japan Airlines",
      duration: "11h 45m",
      stops: "Direct",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1544168190-79c17527004f?w=400&h=200&fit=crop"
    }
  ];

  const activities = [
    {
      id: "a1",
      name: "Northern Lights Photography Tour",
      location: "Iceland",
      price: 120,
      originalPrice: 160,
      duration: "8 hours",
      rating: 4.9,
      reviews: 342,
      image: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=400&h=300&fit=crop"
    },
    {
      id: "a2",
      name: "Cooking Class with Local Chef",
      location: "Tuscany, Italy",
      price: 85,
      originalPrice: 110,
      duration: "4 hours",
      rating: 4.8,
      reviews: 567,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Playfair_Display']">
            Featured <span className="hero-text">Travel Deals</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hand-picked destinations and experiences with verified reviews and exclusive discounts.
          </p>
        </div>

        <Tabs defaultValue="hotels" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12 max-w-md mx-auto">
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="hotels">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotels.map((hotel, index) => (
                <Card 
                  key={hotel.id} 
                  className="travel-card overflow-hidden group cursor-pointer animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-travel-coral text-white">
                        {hotel.badge}
                      </Badge>
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
                      {hotel.amenities.map((Amenity, idx) => (
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
                        {Math.round(((hotel.originalPrice - hotel.price) / hotel.originalPrice) * 100)}% off
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="flights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flights.map((flight, index) => (
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
                    
                    <div className="absolute inset-0 flex items-center px-6">
                      <div className="text-white">
                        <div className="text-2xl font-bold">{flight.from} → {flight.to}</div>
                        <div className="text-white/90">{flight.airline}</div>
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activities">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity, index) => (
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
                        <h3 className="font-bold text-lg mb-1">{activity.name}</h3>
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
                        onClick={() => window.location.href = `/booking/activity?activityId=${activity.id}&title=${encodeURIComponent(activity.name)}&price=${activity.price}`}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default FeaturedListings;