import { useState } from "react";
import { Filter, MapPin, Star, Wifi, Car, Utensils, Heart, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

const Hotels = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([50, 500]);
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
      id: "1",
      name: "Ocean Breeze Resort",
      location: "Maldives",
      price: 450,
      originalPrice: 580,
      rating: 4.8,
      reviews: 1234,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
      amenities: ["Free WiFi", "Pool", "Spa", "Restaurant"],
      verified: true,
      distance: "2.5 km from center"
    },
    // Add more hotels...
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-8 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 font-['Playfair_Display']">
            Hotels in <span className="hero-text">Maldives</span>
          </h1>
          <p className="text-muted-foreground">
            Found 1,247 hotels • Check-in: Mar 15 • Check-out: Mar 22 • 2 guests
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 space-y-6">
            <Card className="travel-card">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </h3>

                {/* Price Range */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Price Range</h4>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Star Rating</h4>
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center space-x-2">
                      <Checkbox id={`${stars}-star`} />
                      <label htmlFor={`${stars}-star`} className="flex items-center cursor-pointer">
                        {Array.from({ length: stars }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        ))}
                        <span className="ml-2 text-sm">& up</span>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Amenities</h4>
                  {["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Beach Access"].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox id={amenity} />
                      <label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Sort and View Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <Select defaultValue="recommended">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hotel Cards */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="travel-card overflow-hidden group cursor-pointer">
                  <div className={`${viewMode === "list" ? "flex" : ""}`}>
                    <div className={`relative overflow-hidden ${viewMode === "list" ? "w-80 h-60" : "h-64"}`}>
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      
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

                      {hotel.verified && (
                        <Badge className="absolute bottom-3 left-3 bg-green-500">
                          Verified
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold">{hotel.name}</h3>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-2xl font-bold">${hotel.price}</span>
                            <span className="text-sm text-muted-foreground line-through">
                              ${hotel.originalPrice}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">per night</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{hotel.location} • {hotel.distance}</span>
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

                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        className="w-full btn-primary"
                        onClick={() => window.location.href = `/booking/select?type=hotel&id=${hotel.id}`}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hotels;