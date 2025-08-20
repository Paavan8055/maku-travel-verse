import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Car, Coffee, Utensils, Heart, Shield, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Addon {
  id: string;
  hotel_id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  category: string;
  per_person: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SelectedAddon extends Addon {
  quantity: number;
}

const BookingExtrasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, SelectedAddon>>({});
  const [loading, setLoading] = useState(true);

  // Get booking details from URL parameters
  const hotelId = searchParams.get('hotelId') || '';
  const offerId = searchParams.get('offerId') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const rooms = parseInt(searchParams.get('rooms') || '1');
  const bedPreference = searchParams.get('bedPreference') || 'any';
  const specialRequests = decodeURIComponent(searchParams.get('specialRequests') || '');

  // Calculate nights for pricing
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
  const basePrice = 200; // Base price per night - in real app, get from offer
  const totalGuests = adults + children;

  // Fetch available addons from database
  useEffect(() => {
    const fetchAddons = async () => {
      setLoading(true);
      try {
        // Fetch addons for this hotel or global addons (hotel_id = '*')
        const { data, error } = await supabase
          .from('hotel_addons')
          .select('*')
          .or(`hotel_id.eq.${hotelId},hotel_id.eq.*`)
          .eq('active', true)
          .order('category', { ascending: true });

        if (error) {
          console.error('Error fetching addons:', error);
          toast.error('Failed to load hotel extras');
        } else {
          setAddons(data || []);
        }
      } catch (err) {
        console.error('Error fetching addons:', err);
        toast.error('Failed to load hotel extras');
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchAddons();
    }
  }, [hotelId]);

  // Icon mapping for categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport': return Car;
      case 'dining': return Coffee;
      case 'wellness': return Heart;
      case 'protection': return Shield;
      case 'convenience': return Plane;
      default: return Utensils;
    }
  };

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons(prev => {
      const newSelected = { ...prev };
      if (newSelected[addon.id]) {
        delete newSelected[addon.id];
      } else {
        newSelected[addon.id] = {
          ...addon,
          quantity: 1
        };
      }
      return newSelected;
    });
  };

  const updateQuantity = (addonId: string, quantity: number) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        quantity: Math.max(1, quantity)
      }
    }));
  };

  const getAddonPrice = (addon: SelectedAddon) => {
    const basePriceCents = addon.price_cents;
    const quantity = addon.quantity || 1;
    const multiplier = addon.per_person ? totalGuests : 1;
    return (basePriceCents * quantity * multiplier) / 100; // Convert to dollars
  };

  const getTotalAddonsPrice = () => {
    return Object.values(selectedAddons).reduce((total, addon) => {
      return total + getAddonPrice(addon);
    }, 0);
  };

  const getTotalPrice = () => {
    return (basePrice * nights) + getTotalAddonsPrice();
  };

  const handleContinue = () => {
    // Navigate to hotel checkout page with all booking data
    const params = new URLSearchParams({
      hotelId,
      offerId,
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
      bedPreference,
      specialRequests: encodeURIComponent(specialRequests),
      addons: Object.keys(selectedAddons).join(',')
    });
    navigate(`/HotelCheckout?${params.toString()}`);
  };

  const categorizeAddons = (category: string) => 
    addons.filter(addon => addon.category === category);

  // Validation
  if (!hotelId || !offerId || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Missing booking information</h2>
              <p className="text-muted-foreground mb-4">
                Please return to hotel search and select a hotel with valid dates.
              </p>
              <Button onClick={() => navigate('/search/hotels')}>
                Back to Hotel Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading hotel extras...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Addons Selection */}
            <div className="lg:col-span-2 space-y-8">
              {addons.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No extras available for this hotel.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Recommended */}
                  {addons.slice(0, 2).length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                        <span>Recommended</span>
                        <Badge variant="secondary">Most Popular</Badge>
                      </h2>
                      <div className="space-y-4">
                        {addons.slice(0, 2).map((addon) => {
                          const IconComponent = getCategoryIcon(addon.category);
                          return (
                            <Card key={addon.id} className="border-2 border-primary/20">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                      <IconComponent className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-semibold">{addon.name}</h3>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {addon.description}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-semibold">
                                          {addon.currency} {(addon.price_cents / 100).toFixed(2)}
                                        </span>
                                        {addon.per_person && (
                                          <span className="text-sm text-muted-foreground">per person</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={!!selectedAddons[addon.id]}
                                    onCheckedChange={() => toggleAddon(addon)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* By Category */}
                  {['transport', 'convenience', 'dining', 'wellness', 'protection'].map(category => {
                    const categoryAddons = categorizeAddons(category);
                    if (categoryAddons.length === 0) return null;

                    return (
                      <div key={category}>
                        <h2 className="text-xl font-semibold mb-4 capitalize">
                          {category === 'transport' ? 'Transport & Convenience' : category}
                        </h2>
                        <div className="space-y-4">
                          {categoryAddons.map((addon) => {
                            const IconComponent = getCategoryIcon(addon.category);
                            return (
                              <Card key={addon.id}>
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                      <div className="p-3 bg-muted rounded-lg">
                                        <IconComponent className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="font-semibold">{addon.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                          {addon.description}
                                        </p>
                                        
                                        {/* Quantity selector for per-person items */}
                                        {selectedAddons[addon.id] && addon.per_person && (
                                          <div className="flex items-center space-x-2 mt-3">
                                            <span className="text-sm">Quantity:</span>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => updateQuantity(addon.id, (selectedAddons[addon.id]?.quantity || 1) - 1)}
                                              disabled={(selectedAddons[addon.id]?.quantity || 1) <= 1}
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm">
                                              {selectedAddons[addon.id]?.quantity || 1}
                                            </span>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => updateQuantity(addon.id, (selectedAddons[addon.id]?.quantity || 1) + 1)}
                                            >
                                              <Plus className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold">
                                            {addon.currency} {(addon.price_cents / 100).toFixed(2)}
                                          </span>
                                          {addon.per_person && (
                                            <span className="text-sm text-muted-foreground">per person</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Switch
                                      checked={!!selectedAddons[addon.id]}
                                      onCheckedChange={() => toggleAddon(addon)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Room ({nights} night{nights > 1 ? 's' : ''})</span>
                    <span>AUD {(basePrice * nights).toFixed(2)}</span>
                  </div>
                  
                  {Object.values(selectedAddons).map((addon: SelectedAddon) => (
                    <div key={addon.id} className="flex justify-between text-sm">
                      <span>
                        {addon.name}
                        {addon.quantity > 1 && ` (×${addon.quantity})`}
                        {addon.per_person && ` (${totalGuests} guests)`}
                      </span>
                      <span>AUD {getAddonPrice(addon).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>AUD {getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={handleContinue}>
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingExtrasPage;