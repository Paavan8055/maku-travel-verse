import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Filter, SortAsc, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { useCarSearch } from "@/features/search/hooks/useCarSearch";

const CarSearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("price");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [filters, setFilters] = useState({
    category: [] as string[],
    vendor: [] as string[],
    fuelType: "any",
    transmission: "any",
    features: [] as string[]
  });

  // State for search criteria
  const [pickUpLocation, setPickUpLocation] = useState(searchParams.get("pickUpLocation") || "");
  const [dropOffLocation, setDropOffLocation] = useState(searchParams.get("dropOffLocation") || "");
  const [pickUpDate, setPickUpDate] = useState(searchParams.get("pickUpDate") || "");
  const [pickUpTime, setPickUpTime] = useState(searchParams.get("pickUpTime") || "10:00");
  const [dropOffDate, setDropOffDate] = useState(searchParams.get("dropOffDate") || "");
  const [dropOffTime, setDropOffTime] = useState(searchParams.get("dropOffTime") || "10:00");
  const [driverAge, setDriverAge] = useState(parseInt(searchParams.get("driverAge") || "30"));

  const searchCriteria = {
    pickUpLocation,
    dropOffLocation,
    pickUpDate,
    pickUpTime,
    dropOffDate,
    dropOffTime,
    driverAge
  };

  const { cars, loading, error } = useCarSearch(searchCriteria);

  const filteredAndSortedCars = cars
    .filter(car => {
      if (priceRange[0] > 0 && car.price.amount < priceRange[0]) return false;
      if (priceRange[1] < 500 && car.price.amount > priceRange[1]) return false;
      if (filters.category.length > 0 && !filters.category.includes(car.vehicle.category)) return false;
      if (filters.vendor.length > 0 && !filters.vendor.includes(car.vendor.name)) return false;
      if (filters.fuelType !== "any" && car.vehicle.fuelType !== filters.fuelType) return false;
      if (filters.transmission !== "any" && car.vehicle.transmission !== filters.transmission) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price.amount - b.price.amount;
        case "category":
          return a.vehicle.category.localeCompare(b.vehicle.category);
        case "vendor":
          return a.vendor.name.localeCompare(b.vendor.name);
        default:
          return 0;
      }
    });

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFilters({...filters, category: [...filters.category, category]});
    } else {
      setFilters({...filters, category: filters.category.filter(c => c !== category)});
    }
  };

  const handleVendorChange = (vendor: string, checked: boolean) => {
    if (checked) {
      setFilters({...filters, vendor: [...filters.vendor, vendor]});
    } else {
      setFilters({...filters, vendor: filters.vendor.filter(v => v !== vendor)});
    }
  };

  const handleSearch = () => {
    // Validate required fields
    if (!pickUpLocation || !pickUpDate || !dropOffDate) {
      alert('Please fill in pickup location and both dates before searching.');
      return;
    }

    if (new Date(dropOffDate) <= new Date(pickUpDate)) {
      alert('Drop-off date must be after pickup date.');
      return;
    }

    const params = new URLSearchParams();
    if (pickUpLocation) params.set("pickUpLocation", pickUpLocation);
    if (dropOffLocation) params.set("dropOffLocation", dropOffLocation);
    if (pickUpDate) params.set("pickUpDate", pickUpDate);
    if (pickUpTime) params.set("pickUpTime", pickUpTime);
    if (dropOffDate) params.set("dropOffDate", dropOffDate);
    if (dropOffTime) params.set("dropOffTime", dropOffTime);
    if (driverAge) params.set("driverAge", driverAge.toString());
    
    navigate(`/search/cars?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="pickUpLocation">Pick-up Location</Label>
                <Input
                  id="pickUpLocation"
                  value={pickUpLocation}
                  onChange={(e) => setPickUpLocation(e.target.value)}
                  placeholder="City or Airport"
                />
              </div>
              <div>
                <Label htmlFor="dropOffLocation">Drop-off Location</Label>
                <Input
                  id="dropOffLocation"
                  value={dropOffLocation}
                  onChange={(e) => setDropOffLocation(e.target.value)}
                  placeholder="Same as pickup"
                />
              </div>
              <div>
                <Label htmlFor="pickUpDate">Pick-up Date & Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="pickUpDate"
                    type="date"
                    value={pickUpDate}
                    onChange={(e) => setPickUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <Input
                    type="time"
                    value={pickUpTime}
                    onChange={(e) => setPickUpTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dropOffDate">Drop-off Date & Time</Label>
                <div className="flex gap-2">
                  <Input
                    id="dropOffDate"
                    type="date"
                    value={dropOffDate}
                    onChange={(e) => setDropOffDate(e.target.value)}
                    min={pickUpDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                  <Input
                    type="time"
                    value={dropOffTime}
                    onChange={(e) => setDropOffTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <Label htmlFor="driverAge">Driver Age</Label>
                <Input
                  id="driverAge"
                  type="number"
                  min="18"
                  max="100"
                  value={driverAge}
                  onChange={(e) => setDriverAge(parseInt(e.target.value) || 30)}
                  className="w-24"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={!pickUpLocation || !pickUpDate || !dropOffDate}
              >
                Search Cars
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Car Rentals in {pickUpLocation || "your location"}
          </h1>
          <p className="text-muted-foreground">
            {pickUpDate && `${new Date(pickUpDate).toLocaleDateString()} • `}
            {Math.ceil((new Date(dropOffDate).getTime() - new Date(pickUpDate).getTime()) / (1000 * 60 * 60 * 24)) || 1} day(s)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">Price Range (per day)</label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    step={25}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Car Category</label>
                  <div className="space-y-2">
                    {["Economy", "Compact", "Intermediate", "Standard", "Full Size", "Premium", "Luxury", "SUV"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.category.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                        />
                        <label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Rental Company</label>
                  <div className="space-y-2">
                    {["Hertz", "Avis", "Enterprise", "Budget", "Europcar"].map((vendor) => (
                      <div key={vendor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`vendor-${vendor}`}
                          checked={filters.vendor.includes(vendor)}
                          onCheckedChange={(checked) => handleVendorChange(vendor, checked as boolean)}
                        />
                        <label htmlFor={`vendor-${vendor}`} className="text-sm">
                          {vendor}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Fuel Type</label>
                  <Select value={filters.fuelType} onValueChange={(value) => setFilters({...filters, fuelType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any fuel type</SelectItem>
                      <SelectItem value="Gasoline">Gasoline</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Transmission</label>
                  <Select value={filters.transmission} onValueChange={(value) => setFilters({...filters, transmission: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any transmission</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <SortAsc className="h-5 w-5" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Best Price</SelectItem>
                    <SelectItem value="category">Car Category</SelectItem>
                    <SelectItem value="vendor">Rental Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary">
                {filteredAndSortedCars.length} cars found
              </Badge>
            </div>

            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 bg-muted rounded"></div>
                        <div className="flex-1">
                          <div className="h-6 bg-muted rounded mb-2"></div>
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="w-24">
                          <div className="h-8 bg-muted rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Error loading cars: {error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {filteredAndSortedCars.map((car) => (
                  <Card key={car.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="w-32 h-20 flex-shrink-0">
                          <img
                            src={car.vehicle.imageURL || "/placeholder.svg"}
                            alt={car.vehicle.description}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{car.vehicle.category}</h3>
                              <p className="text-sm text-muted-foreground">{car.vehicle.description}</p>
                              <p className="text-sm font-medium text-primary">{car.vendor.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">${car.price.amount}</p>
                              <p className="text-sm text-muted-foreground">total</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <span>👥</span>
                              <span>{car.vehicle.seats} seats</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>🚪</span>
                              <span>{car.vehicle.doors} doors</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>⛽</span>
                              <span>{car.vehicle.fuelType}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>⚙️</span>
                              <span>{car.vehicle.transmission}</span>
                            </div>
                            {car.vehicle.airConditioning && (
                              <div className="flex items-center gap-1">
                                <span>❄️</span>
                                <span>A/C</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{car.pickUp.address}</span>
                            </div>
                            <Button 
                              onClick={() => navigate(`/booking/car?carId=${car.id}`)}
                            >
                              Select Car
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredAndSortedCars.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No cars found matching your criteria</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarSearchPage;