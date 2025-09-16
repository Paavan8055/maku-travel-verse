import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Building, 
  Users, 
  Wifi, 
  Car, 
  Utensils, 
  Dumbbell, 
  MapPin, 
  Star,
  Calendar,
  Package,
  Plane,
  Camera,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedHotelSearchProps {
  initialCriteria: {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  };
  onSearch: (criteria: any) => void;
  onPackageSearch?: (criteria: any) => void;
}

interface RoomConfiguration {
  adults: number;
  children: number;
  childAges: number[];
}

export const AdvancedHotelSearch: React.FC<AdvancedHotelSearchProps> = ({
  initialCriteria,
  onSearch,
  onPackageSearch
}) => {
  const [searchMode, setSearchMode] = useState<'hotels' | 'packages' | 'groups'>('hotels');
  const [rooms, setRooms] = useState<RoomConfiguration[]>([
    { adults: 2, children: 0, childAges: [] }
  ]);
  
  // Filters
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [starRating, setStarRating] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [roomPreferences, setRoomPreferences] = useState<string[]>([]);
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<string[]>([]);
  const [sustainabilityFeatures, setSustainabilityFeatures] = useState<string[]>([]);
  
  // Advanced options
  const [brandPreferences, setBrandPreferences] = useState<string[]>([]);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<string[]>([]);
  const [dealTypes, setDealTypes] = useState<string[]>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [paymentOptions, setPaymentOptions] = useState<string[]>([]);

  // Package search options
  const [includeFlights, setIncludeFlights] = useState(false);
  const [includeCarRental, setIncludeCarRental] = useState(false);
  const [includeActivities, setIncludeActivities] = useState(false);
  const [flightOrigin, setFlightOrigin] = useState('');

  // Group booking
  const [groupSize, setGroupSize] = useState(10);
  const [isGroupBooking, setIsGroupBooking] = useState(false);

  const propertyTypeOptions = [
    'Hotel', 'Resort', 'Apartment', 'Villa', 'Boutique', 'Business', 'Luxury', 'Budget'
  ];

  const amenityOptions = [
    'Free WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room Service',
    'Business Center', 'Pet Friendly', 'Airport Shuttle', 'Parking', 'Beach Access'
  ];

  const roomPreferenceOptions = [
    'Ocean View', 'City View', 'Mountain View', 'Garden View', 'Balcony', 'Terrace',
    'King Bed', 'Twin Beds', 'Sofa Bed', 'Kitchenette', 'Separate Living Area'
  ];

  const accessibilityOptions = [
    'Wheelchair Accessible', 'Roll-in Shower', 'Grab Bars', 'Accessible Parking',
    'Braille Signage', 'Audio Visual Alerts', 'Service Animal Friendly'
  ];

  const sustainabilityOptions = [
    'Green Certified', 'Solar Power', 'Water Conservation', 'Organic Food',
    'Local Sourcing', 'Waste Reduction', 'Electric Vehicle Charging'
  ];

  const brandOptions = [
    'Marriott', 'Hilton', 'Hyatt', 'AccorHotels', 'IHG', 'Wyndham', 'Choice Hotels'
  ];

  const loyaltyOptions = [
    'Marriott Bonvoy', 'Hilton Honors', 'World of Hyatt', 'IHG Rewards',
    'Wyndham Rewards', 'Choice Privileges'
  ];

  const dealTypeOptions = [
    'Early Bird', 'Last Minute', 'Extended Stay', 'Weekend Getaway',
    'Business Travel', 'Romance Package', 'Family Deal'
  ];

  const addRoom = () => {
    setRooms([...rooms, { adults: 2, children: 0, childAges: [] }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  const updateRoom = (index: number, updates: Partial<RoomConfiguration>) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], ...updates };
    setRooms(newRooms);
  };

  const updateChildAges = (roomIndex: number, childIndex: number, age: number) => {
    const newRooms = [...rooms];
    const newChildAges = [...newRooms[roomIndex].childAges];
    newChildAges[childIndex] = age;
    newRooms[roomIndex].childAges = newChildAges;
    setRooms(newRooms);
  };

  const handleSearch = useCallback(() => {
    const searchCriteria = {
      ...initialCriteria,
      rooms,
      filters: {
        priceRange,
        starRating,
        propertyTypes,
        amenities,
        roomPreferences,
        accessibilityFeatures,
        sustainabilityFeatures,
        brandPreferences,
        loyaltyPrograms,
        dealTypes,
        cancellationPolicy,
        paymentOptions
      },
      groupBooking: {
        enabled: isGroupBooking,
        size: groupSize
      }
    };

    if (searchMode === 'packages') {
      const packageCriteria = {
        ...searchCriteria,
        packages: {
          flights: includeFlights ? { origin: flightOrigin } : null,
          carRental: includeCarRental,
          activities: includeActivities
        }
      };
      onPackageSearch?.(packageCriteria);
    } else {
      onSearch(searchCriteria);
    }
  }, [
    initialCriteria, rooms, priceRange, starRating, propertyTypes, amenities,
    roomPreferences, accessibilityFeatures, sustainabilityFeatures,
    brandPreferences, loyaltyPrograms, dealTypes, cancellationPolicy,
    paymentOptions, isGroupBooking, groupSize, searchMode, includeFlights,
    includeCarRental, includeActivities, flightOrigin, onSearch, onPackageSearch
  ]);

  const toggleFilter = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Search Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Hotel Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={searchMode} onValueChange={(value: any) => setSearchMode(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Hotels Only
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Hotel + Extras
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Group Booking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hotels" className="mt-6">
              <div className="space-y-6">
                {/* Room Configuration */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Room Configuration</Label>
                    <Button variant="outline" size="sm" onClick={addRoom}>
                      Add Room
                    </Button>
                  </div>
                  
                  {rooms.map((room, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                          <div>
                            <Label>Adults</Label>
                            <Select
                              value={room.adults.toString()}
                              onValueChange={(value) => updateRoom(index, { adults: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4].map(num => (
                                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Children</Label>
                            <Select
                              value={room.children.toString()}
                              onValueChange={(value) => {
                                const childCount = parseInt(value);
                                const childAges = Array(childCount).fill(5);
                                updateRoom(index, { children: childCount, childAges });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3].map(num => (
                                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {room.children > 0 && (
                            <div>
                              <Label>Child Ages</Label>
                              <div className="flex gap-2">
                                {Array(room.children).fill(0).map((_, childIndex) => (
                                  <Select
                                    key={childIndex}
                                    value={(room.childAges[childIndex] || 5).toString()}
                                    onValueChange={(value) => updateChildAges(index, childIndex, parseInt(value))}
                                  >
                                    <SelectTrigger className="w-16">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 18 }, (_, i) => (
                                        <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {rooms.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoom(index)}
                            className="ml-2"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (per night)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={2000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <Label>Star Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(stars => (
                      <button
                        key={stars}
                        onClick={() => toggleFilter(stars.toString(), setStarRating)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors",
                          starRating.includes(stars.toString())
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{stars}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="packages" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className={cn("p-4 cursor-pointer transition-colors", includeFlights && "border-primary bg-primary/5")}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={includeFlights}
                        onCheckedChange={(checked) => setIncludeFlights(checked === true)}
                      />
                      <Plane className="h-5 w-5" />
                      <Label>Include Flights</Label>
                    </div>
                    {includeFlights && (
                      <div className="mt-3">
                        <Input
                          placeholder="Origin airport (SYD)"
                          value={flightOrigin}
                          onChange={(e) => setFlightOrigin(e.target.value)}
                        />
                      </div>
                    )}
                  </Card>

                  <Card className={cn("p-4 cursor-pointer transition-colors", includeCarRental && "border-primary bg-primary/5")}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={includeCarRental}
                        onCheckedChange={(checked) => setIncludeCarRental(checked === true)}
                      />
                      <Car className="h-5 w-5" />
                      <Label>Car Rental</Label>
                    </div>
                  </Card>

                  <Card className={cn("p-4 cursor-pointer transition-colors", includeActivities && "border-primary bg-primary/5")}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={includeActivities}
                        onCheckedChange={(checked) => setIncludeActivities(checked === true)}
                      />
                      <Camera className="h-5 w-5" />
                      <Label>Activities & Tours</Label>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isGroupBooking}
                    onCheckedChange={(checked) => setIsGroupBooking(checked === true)}
                  />
                  <Label>Enable group booking rates</Label>
                </div>

                {isGroupBooking && (
                  <div className="space-y-4">
                    <div>
                      <Label>Total Group Size</Label>
                      <Slider
                        value={[groupSize]}
                        onValueChange={(value) => setGroupSize(value[0])}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        {groupSize} people
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Group Booking Benefits</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Special group rates</li>
                        <li>• Flexible cancellation policies</li>
                        <li>• Dedicated group coordinator</li>
                        <li>• Meeting room discounts</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Types */}
          <div className="space-y-2">
            <Label>Property Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {propertyTypeOptions.map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type, setPropertyTypes)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    propertyTypes.includes(type)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {amenityOptions.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => toggleFilter(amenity, setAmenities)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors",
                    amenities.includes(amenity)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {amenity.includes('WiFi') && <Wifi className="h-4 w-4" />}
                  {amenity.includes('Restaurant') && <Utensils className="h-4 w-4" />}
                  {amenity.includes('Gym') && <Dumbbell className="h-4 w-4" />}
                  {amenity.includes('Parking') && <Car className="h-4 w-4" />}
                  <span>{amenity}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Preferences */}
          <div className="space-y-2">
            <Label>Room Preferences</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {roomPreferenceOptions.map(pref => (
                <button
                  key={pref}
                  onClick={() => toggleFilter(pref, setRoomPreferences)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    roomPreferences.includes(pref)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Features */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Accessibility Features
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {accessibilityOptions.map(feature => (
                <button
                  key={feature}
                  onClick={() => toggleFilter(feature, setAccessibilityFeatures)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors text-left",
                    accessibilityFeatures.includes(feature)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Button */}
      <Button onClick={handleSearch} size="lg" className="w-full">
        Search {searchMode === 'packages' ? 'Packages' : searchMode === 'groups' ? 'Group Rates' : 'Hotels'}
      </Button>
    </div>
  );
};