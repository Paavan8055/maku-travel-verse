import { useState } from "react";
import { ChevronLeft, Plus, Minus, Shield, Car, Plane, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";

const BookingExtrasPage = () => {
  const [selectedExtras, setSelectedExtras] = useState<Record<string, any>>({});
  const [basePrice] = useState(3150); // 7 nights × $450
  const [fundContribution] = useState(50);

  const extras = [
    {
      id: "insurance",
      name: "Travel Insurance",
      description: "Comprehensive coverage for cancellation, medical emergencies, and trip delays",
      price: 89,
      icon: Shield,
      category: "protection",
      recommended: true,
      savings: "Save up to $5,000 in emergency costs"
    },
    {
      id: "airport-transfer",
      name: "Airport Transfer",
      description: "Private car service from Ngurah Rai Airport to hotel",
      price: 45,
      icon: Car,
      category: "transport",
      options: [
        { id: "standard", name: "Standard Car", price: 45 },
        { id: "luxury", name: "Luxury Vehicle", price: 85 },
        { id: "shared", name: "Shared Shuttle", price: 25 }
      ]
    },
    {
      id: "early-checkin",
      name: "Early Check-in",
      description: "Guaranteed room availability from 12:00 PM (standard is 3:00 PM)",
      price: 35,
      icon: Plus,
      category: "convenience"
    },
    {
      id: "late-checkout",
      name: "Late Check-out",
      description: "Keep your room until 6:00 PM (standard is 11:00 AM)",
      price: 25,
      icon: Minus,
      category: "convenience"
    },
    {
      id: "spa-package",
      name: "Spa Wellness Package",
      description: "60-minute couples massage and access to spa facilities",
      price: 180,
      icon: Plus,
      category: "wellness",
      savings: "Save $40 vs booking separately"
    },
    {
      id: "meal-plan",
      name: "All-Inclusive Dining",
      description: "Breakfast, lunch, dinner and premium beverages included",
      price: 95,
      priceType: "per person per day",
      icon: Utensils,
      category: "dining",
      quantity: true
    }
  ];

  const toggleExtra = (extraId: string, option?: any) => {
    setSelectedExtras(prev => {
      const newExtras = { ...prev };
      
      if (newExtras[extraId]) {
        // Remove if already selected
        delete newExtras[extraId];
      } else {
        // Add with option or default
        const extra = extras.find(e => e.id === extraId);
        newExtras[extraId] = {
          ...extra,
          selectedOption: option || (extra?.options ? extra.options[0] : null),
          quantity: extra?.quantity ? 2 : 1 // Default 2 for per-person items
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
    if (extra.selectedOption) {
      return extra.selectedOption.price * (extra.quantity || 1);
    }
    return extra.price * (extra.quantity || 1);
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
    const queryParams = new URLSearchParams({
      basePrice: basePrice.toString(),
      extrasPrice: getTotalExtrasPrice().toString(),
      fundContribution: fundContribution.toString(),
      total: getTotalPrice().toString(),
      extras: JSON.stringify(selectedExtras)
    });
    
    window.location.href = `/booking/checkout?${queryParams}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Room Selection
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Enhance Your <span className="hero-text">Stay</span></h1>
          <p className="text-muted-foreground">
            Add extras and services to make your trip even more memorable
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Extras Selection */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Recommended */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Badge className="mr-2 bg-primary">Recommended</Badge>
                  Popular Add-ons
                </h2>
                
                <div className="grid gap-4">
                  {extras.filter(extra => extra.recommended).map((extra) => {
                    const Icon = extra.icon;
                    const isSelected = selectedExtras[extra.id];
                    
                    return (
                      <Card 
                        key={extra.id}
                        className={`travel-card cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => toggleExtra(extra.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-bold mb-1">{extra.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {extra.description}
                                </p>
                                {extra.savings && (
                                  <p className="text-sm text-green-600 font-medium">
                                    {extra.savings}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <p className="text-lg font-bold">${extra.price}</p>
                                  {extra.priceType && (
                                    <p className="text-xs text-muted-foreground">{extra.priceType}</p>
                                  )}
                                </div>
                                <Switch 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleExtra(extra.id)}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Transport & Convenience */}
              <div>
                <h2 className="text-xl font-bold mb-4">Transport & Convenience</h2>
                
                <div className="grid gap-4">
                  {extras.filter(extra => ['transport', 'convenience'].includes(extra.category)).map((extra) => {
                    const Icon = extra.icon;
                    const isSelected = selectedExtras[extra.id];
                    
                    return (
                      <Card 
                        key={extra.id}
                        className={`travel-card transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="p-2 bg-muted rounded-lg">
                                <Icon className="h-6 w-6" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-bold mb-1">{extra.name}</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {extra.description}
                                </p>
                                
                                {/* Options for transport */}
                                {extra.options && isSelected && (
                                  <div className="space-y-2">
                                    {extra.options.map((option: any) => (
                                      <div 
                                        key={option.id}
                                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                                        onClick={() => {
                                          setSelectedExtras(prev => ({
                                            ...prev,
                                            [extra.id]: {
                                              ...prev[extra.id],
                                              selectedOption: option
                                            }
                                          }));
                                        }}
                                      >
                                        <span className="text-sm">{option.name}</span>
                                        <span className="text-sm font-medium">${option.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <p className="text-lg font-bold">${extra.price}</p>
                                </div>
                                <Switch 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleExtra(extra.id)}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Wellness & Dining */}
              <div>
                <h2 className="text-xl font-bold mb-4">Wellness & Dining</h2>
                
                <div className="grid gap-4">
                  {extras.filter(extra => ['wellness', 'dining'].includes(extra.category)).map((extra) => {
                    const Icon = extra.icon;
                    const isSelected = selectedExtras[extra.id];
                    
                    return (
                      <Card 
                        key={extra.id}
                        className={`travel-card transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="p-2 bg-muted rounded-lg">
                                <Icon className="h-6 w-6" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-bold mb-1">{extra.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {extra.description}
                                </p>
                                {extra.savings && (
                                  <p className="text-sm text-green-600 font-medium">
                                    {extra.savings}
                                  </p>
                                )}
                                
                                {/* Quantity selector for per-person items */}
                                {extra.quantity && isSelected && (
                                  <div className="flex items-center space-x-2 mt-3">
                                    <span className="text-sm">Guests:</span>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(extra.id, (selectedExtras[extra.id]?.quantity || 1) - 1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center">
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
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <p className="text-lg font-bold">${extra.price}</p>
                                  {extra.priceType && (
                                    <p className="text-xs text-muted-foreground">{extra.priceType}</p>
                                  )}
                                </div>
                                <Switch 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleExtra(extra.id)}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Price Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Room (7 nights)</span>
                    <span>${basePrice}</span>
                  </div>
                  
                  {Object.entries(selectedExtras).map(([id, extra]: [string, any]) => (
                    <div key={id} className="flex justify-between text-sm">
                      <span>
                        {extra.name}
                        {extra.quantity > 1 && ` (×${extra.quantity})`}
                      </span>
                      <span>${getExtraPrice(extra)}</span>
                    </div>
                  ))}
                  
                  {fundContribution > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Fund Contribution</span>
                      <span>+${fundContribution}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${getTotalPrice()}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Includes all taxes and fees
                  </div>
                </div>

                <Button onClick={handleContinue} className="w-full mt-6 btn-primary h-12">
                  Continue to Payment
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-3">
                  You can modify or cancel extras up to 24 hours before check-in
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingExtrasPage;