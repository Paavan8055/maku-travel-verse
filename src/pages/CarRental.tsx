import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Car, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

const CarRentalPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const searchCriteria = {
    pickup: searchParams.get("pickup") || "",
    dropoff: searchParams.get("dropoff") || "",
    pickupDate: searchParams.get("pickupDate") || "",
    dropoffDate: searchParams.get("dropoffDate") || "",
    driverAge: searchParams.get("driverAge") || "25"
  };

  const carCategories = [
    { name: "Economy", price: 45, features: ["Manual", "AC", "2 doors"], image: "🚗" },
    { name: "Compact", price: 55, features: ["Manual", "AC", "4 doors"], image: "🚙" },
    { name: "Mid-size", price: 75, features: ["Automatic", "AC", "4 doors"], image: "🚘" },
    { name: "Full-size", price: 95, features: ["Automatic", "AC", "5 doors"], image: "🚖" },
    { name: "Premium", price: 125, features: ["Automatic", "AC", "Leather"], image: "🚗" },
    { name: "SUV", price: 145, features: ["Automatic", "AC", "7 seats"], image: "🚙" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Car Rental</h1>
          <p className="text-muted-foreground">Find the perfect car for your journey</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search for Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Pick-up Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="City or airport"
                    defaultValue={searchCriteria.pickup}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Drop-off Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Same as pick-up"
                    defaultValue={searchCriteria.dropoff}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Pick-up Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date"
                    defaultValue={searchCriteria.pickupDate}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Drop-off Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date"
                    defaultValue={searchCriteria.dropoffDate}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Driver Age</label>
                <Select defaultValue={searchCriteria.driverAge}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="21">21-24</SelectItem>
                    <SelectItem value="25">25-65</SelectItem>
                    <SelectItem value="65">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button className="mt-4 w-full md:w-auto">
              <Car className="mr-2 h-4 w-4" />
              Search Cars
            </Button>
          </CardContent>
        </Card>

        {/* Car Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carCategories.map((category) => (
            <Card key={category.name} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{category.image}</div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-muted-foreground text-sm">or similar</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  {category.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Badge variant="outline" className="mr-2">✓</Badge>
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">${category.price}</div>
                      <div className="text-sm text-muted-foreground">per day</div>
                    </div>
                    <Badge className="bg-travel-ocean text-white">
                      <Users className="mr-1 h-3 w-3" />
                      4 seats
                    </Badge>
                  </div>
                  
                  <Button className="w-full">
                    Select Car
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-travel-sky/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-travel-sky" />
            </div>
            <h3 className="font-semibold mb-2">Wide Selection</h3>
            <p className="text-muted-foreground">Choose from economy to luxury vehicles</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-travel-coral/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-travel-coral" />
            </div>
            <h3 className="font-semibold mb-2">Convenient Locations</h3>
            <p className="text-muted-foreground">Pick up at airports and city centers</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-travel-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-travel-gold" />
            </div>
            <h3 className="font-semibold mb-2">24/7 Support</h3>
            <p className="text-muted-foreground">Get help whenever you need it</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarRentalPage;