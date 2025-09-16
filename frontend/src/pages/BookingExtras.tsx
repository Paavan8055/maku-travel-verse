import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from "@/utils/logger";

type Addon = {
  id: string; 
  code: string; 
  name: string; 
  description?: string;
  price_cents: number; 
  currency: string; 
  active: boolean;
  category: string;
  per_person: boolean;
};

export default function BookingExtras() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const hotelId = searchParams.get("hotelId")!;
  const offerId = searchParams.get("offerId")!;
  const checkIn = searchParams.get("checkIn")!;
  const checkOut = searchParams.get("checkOut")!;
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const bedPref = searchParams.get("bedPref") || "any";
  const note = searchParams.get("note") || "";

  const [addons, setAddons] = useState<Addon[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAddons = async () => {
      try {
        const { data, error } = await supabase
          .from("hotel_addons")
          .select("*")
          .eq("hotel_id", hotelId)
          .eq("active", true);
          
        if (error) {
          logger.error('Error loading addons:', error);
          toast.error('Failed to load hotel extras');
        } else {
          setAddons(data as Addon[]);
        }
      } catch (err) {
        logger.error('Addons loading error:', err);
        toast.error('Failed to load hotel extras');
      } finally {
        setLoading(false);
      }
    };
    
    loadAddons();
  }, [hotelId]);

  const updateQuantity = (id: string, change: number) => {
    setSelected((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + change)
    }));
  };

  const getAddonPrice = (addon: Addon) => {
    const basePrice = addon.price_cents / 100;
    const quantity = addon.per_person ? (adults + children) : 1;
    return basePrice * quantity;
  };

  const getTotalExtrasPrice = () => {
    return addons.reduce((total, addon) => {
      const quantity = selected[addon.id] || 0;
      if (quantity > 0) {
        return total + (getAddonPrice(addon) * quantity);
      }
      return total;
    }, 0);
  };

  const proceed = () => {
    const selectedAddons = Object.entries(selected)
      .filter(([_, quantity]) => quantity > 0)
      .map(([id]) => id);
    
    const params = new URLSearchParams({
      hotelId,
      offerId,
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
      bedPref,
      note,
      addons: selectedAddons.join(',')
    });
    
    navigate(`/booking/checkout?${params.toString()}`);
  };

  const totalExtras = getTotalExtrasPrice();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 space-y-4 pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Room Selection
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add Extras & Services</CardTitle>
            <p className="text-muted-foreground">
              Enhance your stay with optional extras and services
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading available extras...</p>
              </div>
            ) : addons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No extras available for this hotel.</p>
              </div>
            ) : (
              <>
                {addons.map((addon) => {
                  const quantity = selected[addon.id] || 0;
                  const price = getAddonPrice(addon);
                  
                  return (
                    <Card key={addon.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{addon.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {addon.category}
                              </Badge>
                              {addon.per_person && (
                                <Badge variant="secondary" className="text-xs">
                                  Per person
                                </Badge>
                              )}
                            </div>
                            {addon.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {addon.description}
                              </p>
                            )}
                            <div className="text-sm font-medium">
                              {addon.currency} {price.toFixed(2)}
                              {addon.per_person && (
                                <span className="text-muted-foreground ml-1">
                                  (× {adults + children} guests)
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(addon.id, -1)}
                              disabled={quantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(addon.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {totalExtras > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Extras:</span>
                        <span className="font-bold text-lg">
                          AUD {totalExtras.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <Button onClick={proceed} className="w-full mt-6" size="lg">
              Continue to Checkout
              {totalExtras > 0 && (
                <span className="ml-2">
                  (+AUD {totalExtras.toFixed(2)})
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}