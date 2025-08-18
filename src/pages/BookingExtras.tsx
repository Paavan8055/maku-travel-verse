import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Car, Coffee, Utensils, Heart, Shield, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { OneClickBooking } from "@/features/bookingEnhancements/components";

interface Extra {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: "transport" | "dining" | "wellness" | "protection";
  icon: any;
  options?: { id: string; name: string; price: number }[];
  perPerson?: boolean;
  quantity?: number;
}

const BookingExtrasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedExtras, setSelectedExtras] = useState<Record<string, any>>({});

  // Get booking details from URL parameters
  const hotelData = searchParams.get('hotel');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const rooms = parseInt(searchParams.get('rooms') || '1');
  const selectedRoomData = searchParams.get('selectedRoom');

  let hotel: any = {};
  let selectedRoom: any = {};
  
  try {
    if (hotelData) hotel = JSON.parse(decodeURIComponent(hotelData));
    if (selectedRoomData) selectedRoom = JSON.parse(decodeURIComponent(selectedRoomData));
  } catch (error) {
    console.error('Error parsing booking data:', error);
  }

  const basePrice = selectedRoom.price || hotel.totalPrice || 399;
  const fundContribution = 50; // From session storage in real implementation

  const extras: Extra[] = [
    {
      id: "airport_transfer",
      name: "Airport Transfer",
      description: "Premium car service to/from airport",
      price: 89,
      currency: "AUD",
      category: "transport",
      icon: Car,
      options: [
        { id: "economy", name: "Economy Car", price: 89 },
        { id: "premium", name: "Premium Car", price: 149 },
        { id: "luxury", name: "Luxury Vehicle", price: 249 }
      ]
    },
    {
      id: "breakfast",
      name: "Continental Breakfast",
      description: "Daily breakfast for all guests",
      price: 35,
      currency: "AUD",
      category: "dining",
      icon: Coffee,
      perPerson: true
    },
    {
      id: "dinner_package",
      name: "3-Course Dinner",
      description: "Premium dining experience at hotel restaurant",
      price: 95,
      currency: "AUD",
      category: "dining",
      icon: Utensils,
      perPerson: true
    },
    {
      id: "spa_package",
      name: "Spa & Wellness Package",
      description: "Access to spa facilities and one 60-min treatment",
      price: 185,
      currency: "AUD",
      category: "wellness",
      icon: Heart,
      perPerson: true
    },
    {
      id: "travel_insurance",
      name: "Travel Protection",
      description: "Comprehensive travel insurance coverage",
      price: 45,
      currency: "AUD",
      category: "protection",
      icon: Shield
    },
    {
      id: "early_checkin",
      name: "Early Check-in",
      description: "Guaranteed check-in from 12:00 PM",
      price: 25,
      currency: "AUD",
      category: "transport",
      icon: Plane
    }
  ];

  const toggleExtra = (extraId: string, option?: any) => {
    setSelectedExtras(prev => {
      const newExtras = { ...prev };
      if (newExtras[extraId]) {
        delete newExtras[extraId];
      } else {
        newExtras[extraId] = {
          ...extras.find(e => e.id === extraId),
          selectedOption: option,
          quantity: 1
        };
      }
      return newExtras;
    });
  };

  const updateQuantity = (extraId: string, quantity: number) => {
    setSelectedExtras(prev => ({
      ...prev,
      [extraId]: {
        ...prev[extraId],
        quantity: Math.max(1, quantity)
      }
    }));
  };

  const getExtraPrice = (extra: any) => {
    const basePrice = extra.selectedOption ? extra.selectedOption.price : extra.price;
    const quantity = extra.quantity || 1;
    const multiplier = extra.perPerson ? adults : 1;
    return basePrice * quantity * multiplier;
  };

  const getTotalExtrasPrice = () => {
    return Object.values(selectedExtras).reduce((total: number, extra: any) => {
      return total + getExtraPrice(extra);
    }, 0);
  };

  const getTotalPrice = () => {
    return basePrice + getTotalExtrasPrice() + fundContribution;
  };

  const handleContinue = () => {
    // Save extras to session storage
    sessionStorage.setItem('selectedExtras', JSON.stringify(selectedExtras));
    
    // Navigate to guest details page
    const params = new URLSearchParams(searchParams);
    navigate(`/booking/hotel?${params.toString()}`);
  };

  const getIconComponent = (IconComponent: any) => <IconComponent className="h-5 w-5" />;

  const categorizeExtras = (category: string) => 
    extras.filter(extra => extra.category === category);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Room Selection</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Extras</h1>
            <p className="text-muted-foreground">Enhance your stay with optional services</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Extras Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <span>Recommended</span>
                <Badge variant="secondary">Most Popular</Badge>
              </h2>
              <div className="space-y-4">
                {extras.slice(0, 2).map((extra) => (
                  <Card key={extra.id} className="border-2 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            {getIconComponent(extra.icon)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{extra.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {extra.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                {extra.currency}{extra.price}
                              </span>
                              {extra.perPerson && (
                                <span className="text-sm text-muted-foreground">per person</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={!!selectedExtras[extra.id]}
                          onCheckedChange={() => toggleExtra(extra.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Transport & Convenience */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Transport & Convenience</h2>
              <div className="space-y-4">
                {categorizeExtras("transport").map((extra) => (
                  <Card key={extra.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-muted rounded-lg">
                            {getIconComponent(extra.icon)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{extra.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {extra.description}
                            </p>
                            
                            {/* Options for airport transfer */}
                            {extra.options && selectedExtras[extra.id] && (
                              <div className="space-y-2 mt-3">
                                <p className="text-sm font-medium">Select vehicle type:</p>
                                {extra.options.map((option) => (
                                  <label key={option.id} className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name={`${extra.id}_option`}
                                      checked={selectedExtras[extra.id]?.selectedOption?.id === option.id}
                                      onChange={() => toggleExtra(extra.id, option)}
                                      className="radio"
                                    />
                                    <span className="text-sm">
                                      {option.name} - {extra.currency}{option.price}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                {extra.currency}{extra.price}
                              </span>
                              {extra.perPerson && (
                                <span className="text-sm text-muted-foreground">per person</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={!!selectedExtras[extra.id]}
                          onCheckedChange={() => toggleExtra(extra.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Wellness & Dining */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Wellness & Dining</h2>
              <div className="space-y-4">
                {[...categorizeExtras("dining"), ...categorizeExtras("wellness"), ...categorizeExtras("protection")].map((extra) => (
                  <Card key={extra.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-muted rounded-lg">
                            {getIconComponent(extra.icon)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{extra.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {extra.description}
                            </p>
                            
                            {/* Quantity selector for per-person items */}
                            {selectedExtras[extra.id] && extra.perPerson && (
                              <div className="flex items-center space-x-2 mt-3">
                                <span className="text-sm">Quantity:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(extra.id, (selectedExtras[extra.id]?.quantity || 1) - 1)}
                                  disabled={(selectedExtras[extra.id]?.quantity || 1) <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">
                                  {selectedExtras[extra.id]?.quantity || 1}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(extra.id, (selectedExtras[extra.id]?.quantity || 1) + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                {extra.currency}{extra.price}
                              </span>
                              {extra.perPerson && (
                                <span className="text-sm text-muted-foreground">per person</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={!!selectedExtras[extra.id]}
                          onCheckedChange={() => toggleExtra(extra.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Room ({rooms} night{rooms > 1 ? 's' : ''})</span>
                  <span>AUD{basePrice}</span>
                </div>
                
                {Object.values(selectedExtras).map((extra: any) => (
                  <div key={extra.id} className="flex justify-between text-sm">
                    <span>
                      {extra.name}
                      {extra.quantity > 1 && ` (×${extra.quantity})`}
                      {extra.perPerson && ` (${adults} guests)`}
                    </span>
                    <span>AUD{getExtraPrice(extra)}</span>
                  </div>
                ))}
                
                {fundContribution > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Fund Contribution</span>
                    <span>AUD{fundContribution}</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>AUD{getTotalPrice()}</span>
                  </div>
                </div>

                <OneClickBooking bookingData={{
                  destination: hotel.address || 'Hotel',
                  checkIn: checkIn || '',
                  checkOut: checkOut || '',
                  guests: adults
                }} />
                
                <Button className="w-full" onClick={handleContinue}>
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingExtrasPage;