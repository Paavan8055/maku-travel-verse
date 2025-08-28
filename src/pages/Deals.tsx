import { useState } from "react";
import { Clock, Star, MapPin, Percent, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";

const DealsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("discount");

  const deals = [
    {
      id: 1,
      type: "hotel",
      title: "Luxury Resort in Bali",
      location: "Ubud, Bali",
      originalPrice: 450,
      salePrice: 289,
      discount: 36,
      rating: 4.8,
      reviews: 1240,
      image: "/api/placeholder/400/250",
      validUntil: "2024-02-15",
      features: ["Free Breakfast", "Spa Access", "Pool"],
      description: "5-star luxury resort with infinity pool and traditional Balinese architecture"
    },
    {
      id: 2,
      type: "flight",
      title: "Round Trip to Tokyo",
      location: "Tokyo, Japan",
      originalPrice: 899,
      salePrice: 649,
      discount: 28,
      rating: 4.6,
      reviews: 890,
      image: "/api/placeholder/400/250",
      validUntil: "2024-02-20",
      features: ["Direct Flight", "Flexible Dates", "Extra Baggage"],
      description: "Non-stop flights with premium airline, flexible booking options"
    },
    {
      id: 3,
      type: "activity",
      title: "Northern Lights Tour",
      location: "Reykjavik, Iceland",
      originalPrice: 195,
      salePrice: 149,
      discount: 24,
      rating: 4.9,
      reviews: 567,
      image: "/api/placeholder/400/250",
      validUntil: "2024-02-10",
      features: ["Guide Included", "Transport", "Hot Chocolate"],
      description: "Professional guide, warm transportation, and guaranteed sighting or money back"
    },
    {
      id: 4,
      type: "package",
      title: "Paris Romance Package",
      location: "Paris, France",
      originalPrice: 1299,
      salePrice: 899,
      discount: 31,
      rating: 4.7,
      reviews: 445,
      image: "/api/placeholder/400/250",
      validUntil: "2024-02-25",
      features: ["Hotel + Flight", "City Tour", "Seine Cruise"],
      description: "Complete romantic getaway with luxury accommodation and exclusive experiences"
    },
    {
      id: 5,
      type: "car",
      title: "Luxury Car Rental Deal",
      location: "Los Angeles, USA",
      originalPrice: 89,
      salePrice: 59,
      discount: 34,
      rating: 4.5,
      reviews: 234,
      image: "/api/placeholder/400/250",
      validUntil: "2024-02-18",
      features: ["Premium Car", "Free GPS", "Insurance"],
      description: "High-end vehicle rental with comprehensive insurance and 24/7 support"
    }
  ];

  const filteredDeals = deals.filter(deal => 
    selectedCategory === "all" || deal.type === selectedCategory
  );

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    switch (sortBy) {
      case "discount":
        return b.discount - a.discount;
      case "price":
        return a.salePrice - b.salePrice;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hotel": return "🏨";
      case "flight": return "✈️";
      case "activity": return "🎯";
      case "package": return "📦";
      case "car": return "🚗";
      default: return "💎";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hotel": return "bg-travel-ocean text-white";
      case "flight": return "bg-travel-sky text-white";
      case "activity": return "bg-travel-coral text-white";
      case "package": return "bg-travel-gold text-white";
      case "car": return "bg-travel-forest text-white";
      default: return "bg-primary text-white";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            🔥 Hot Deals & Special Offers
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing discounts on hotels, flights, activities, and vacation packages. 
            Limited time offers - book now and save big on your next adventure!
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-6 md:w-auto">
              <TabsTrigger value="all">All Deals</TabsTrigger>
              <TabsTrigger value="hotel">Hotels</TabsTrigger>
              <TabsTrigger value="flight">Flights</TabsTrigger>
              <TabsTrigger value="activity">Activities</TabsTrigger>
              <TabsTrigger value="package">Packages</TabsTrigger>
              <TabsTrigger value="car">Car Rental</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Best Discount</SelectItem>
                  <SelectItem value="price">Lowest Price</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDeals.map((deal) => (
            <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-travel-sky to-travel-ocean flex items-center justify-center">
                  <span className="text-6xl">{getTypeIcon(deal.type)}</span>
                </div>
                
                {/* Discount Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-travel-coral text-white font-bold">
                    <Percent className="mr-1 h-3 w-3" />
                    {deal.discount}% OFF
                  </Badge>
                </div>
                
                {/* Deal Type Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className={getTypeColor(deal.type)}>
                    {deal.type.charAt(0).toUpperCase() + deal.type.slice(1)}
                  </Badge>
                </div>
                
                {/* Countdown Timer */}
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  <Clock className="inline mr-1 h-3 w-3" />
                  Ends {deal.validUntil}
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {deal.title}
                  </h3>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="mr-1 h-3 w-3" />
                    {deal.location}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {deal.description}
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {deal.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 font-medium">{deal.rating}</span>
                  <span className="ml-1 text-muted-foreground text-sm">
                    ({deal.reviews} reviews)
                  </span>
                </div>
                
                {/* Pricing */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground line-through">
                      ${deal.originalPrice}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ${deal.salePrice}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Save ${deal.originalPrice - deal.salePrice}
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-travel-coral hover:bg-travel-coral/90">
                  Book This Deal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-travel-sky to-travel-ocean text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">Don't Miss Out!</h2>
              <p className="text-lg mb-6 opacity-90">
                New deals are added daily. Subscribe to our newsletter and never miss a great offer.
              </p>
              <Button size="lg" variant="secondary">
                Subscribe for Deal Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;