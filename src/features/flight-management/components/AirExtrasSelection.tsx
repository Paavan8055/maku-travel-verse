import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Luggage, Coffee, Wifi, DollarSign, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AirExtrasSelectionProps {
  booking: {
    id: string;
    booking_reference: string;
    booking_data: any;
  };
  onExtrasComplete?: () => void;
}

export const AirExtrasSelection: React.FC<AirExtrasSelectionProps> = ({
  booking,
  onExtrasComplete
}) => {
  const [availableExtras, setAvailableExtras] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchAvailableExtras = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-air-extras', {
        body: {
          action: 'get_available',
          pnrLocator: booking.booking_data.pnr_locator,
          flightSegmentId: booking.booking_data.flight?.segment_id || '1',
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        setAvailableExtras(data.availableExtras || []);
      } else {
        throw new Error(data.error || 'Failed to fetch available extras');
      }
    } catch (error) {
      console.error('Air extras fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load available extras. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExtra = (extra: any) => {
    const isSelected = selectedExtras.some(e => e.code === extra.code);
    
    if (isSelected) {
      setSelectedExtras(prev => prev.filter(e => e.code !== extra.code));
    } else {
      setSelectedExtras(prev => [...prev, { ...extra, quantity: 1 }]);
    }
  };

  const updateQuantity = (extraCode: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedExtras(prev => prev.filter(e => e.code !== extraCode));
    } else {
      setSelectedExtras(prev => 
        prev.map(e => e.code === extraCode ? { ...e, quantity } : e)
      );
    }
  };

  const bookSelectedExtras = async () => {
    if (selectedExtras.length === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-air-extras', {
        body: {
          action: 'book_extras',
          pnrLocator: booking.booking_data.pnr_locator,
          flightSegmentId: booking.booking_data.flight?.segment_id || '1',
          extraSelections: selectedExtras.map(extra => ({
            code: extra.code,
            quantity: extra.quantity,
            passengerName: booking.booking_data.passengers?.[0]?.name || 'Passenger'
          })),
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Extras Booked",
          description: "Your air extras have been successfully added to your booking.",
        });
        onExtrasComplete?.();
        setSelectedExtras([]);
      } else {
        throw new Error(data.error || 'Air extras booking failed');
      }
    } catch (error) {
      console.error('Air extras booking error:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book air extras. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchAvailableExtras();
  }, []);

  const getExtraIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'baggage': return <Luggage className="h-4 w-4" />;
      case 'meals': return <Coffee className="h-4 w-4" />;
      case 'wifi': return <Wifi className="h-4 w-4" />;
      default: return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const totalPrice = selectedExtras.reduce((sum, extra) => 
    sum + (extra.price * extra.quantity), 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Air Extras
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAvailableExtras}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Summary */}
        {selectedExtras.length > 0 && (
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>
                  {selectedExtras.length} extra(s) selected
                </span>
                <span className="font-medium">
                  Total: ${totalPrice.toFixed(2)}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Available Extras */}
        {availableExtras.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium">Available Add-ons</h4>
            
            <div className="grid gap-4">
              {availableExtras.map((extra) => (
                <div 
                  key={extra.code}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedExtras.some(e => e.code === extra.code)}
                        onCheckedChange={() => toggleExtra(extra)}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getExtraIcon(extra.category)}
                          <span className="font-medium">{extra.name}</span>
                          <Badge variant="outline">{extra.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {extra.description}
                        </p>
                        {extra.restrictions && (
                          <p className="text-xs text-muted-foreground italic">
                            {extra.restrictions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${extra.price?.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {extra.currency}
                      </div>
                    </div>
                  </div>

                  {/* Quantity selector for selected extras */}
                  {selectedExtras.some(e => e.code === extra.code) && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm">Quantity:</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const current = selectedExtras.find(e => e.code === extra.code);
                            updateQuantity(extra.code, (current?.quantity || 1) - 1);
                          }}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">
                          {selectedExtras.find(e => e.code === extra.code)?.quantity || 1}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const current = selectedExtras.find(e => e.code === extra.code);
                            updateQuantity(extra.code, (current?.quantity || 1) + 1);
                          }}
                        >
                          +
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground ml-auto">
                        Subtotal: ${(extra.price * (selectedExtras.find(e => e.code === extra.code)?.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Book Extras Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={bookSelectedExtras}
                disabled={selectedExtras.length === 0 || isProcessing}
                className="min-w-32"
              >
                {isProcessing ? 'Processing...' : `Book Extras ($${totalPrice.toFixed(2)})`}
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading available extras...</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No additional extras available for this flight
          </div>
        )}
      </CardContent>
    </Card>
  );
};