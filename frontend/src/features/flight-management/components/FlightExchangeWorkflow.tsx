import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FlightExchangeWorkflowProps {
  booking: {
    id: string;
    booking_reference: string;
    booking_data: any;
    status: string;
  };
  onExchangeComplete?: () => void;
}

export const FlightExchangeWorkflow: React.FC<FlightExchangeWorkflowProps> = ({
  booking,
  onExchangeComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeOptions, setExchangeOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [fareRules, setFareRules] = useState<any>(null);
  const { toast } = useToast();

  const fetchExchangeOptions = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-flight-exchange', {
        body: {
          action: 'get_exchange_options',
          pnrLocator: booking.booking_data.pnr_locator,
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        setExchangeOptions(data.exchangeOptions || []);
        setFareRules(data.fareRules);
      } else {
        throw new Error(data.error || 'Failed to fetch exchange options');
      }
    } catch (error) {
      console.error('Exchange options fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exchange options. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processExchange = async () => {
    if (!selectedOption) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-flight-exchange', {
        body: {
          action: 'process_exchange',
          pnrLocator: booking.booking_data.pnr_locator,
          selectedOption: selectedOption,
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Exchange Successful",
          description: "Your flight has been successfully exchanged.",
        });
        onExchangeComplete?.();
      } else {
        throw new Error(data.error || 'Exchange processing failed');
      }
    } catch (error) {
      console.error('Exchange processing error:', error);
      toast({
        title: "Exchange Failed",
        description: "Failed to process exchange. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canExchange = booking.status === 'confirmed' && 
    booking.booking_data?.flight?.departure_time &&
    new Date(booking.booking_data.flight.departure_time) > new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Flight Exchange
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canExchange ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Flight exchange is not available for this booking. The flight may have already departed or the booking is not eligible for changes.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <h4 className="font-medium">Current Flight</h4>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span>{booking.booking_data.flight?.origin} → {booking.booking_data.flight?.destination}</span>
                  <Badge variant="outline">{booking.booking_reference}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(booking.booking_data.flight?.departure_time).toLocaleDateString()}
                </div>
              </div>
            </div>

            {!exchangeOptions.length ? (
              <Button 
                onClick={fetchExchangeOptions} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Loading...' : 'Find Exchange Options'}
              </Button>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium">Available Exchange Options</h4>
                
                {fareRules && (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Fare Rules:</strong> {fareRules.exchangeFee && `Exchange fee: ${fareRules.exchangeFee}`}
                      {fareRules.restrictions && ` | ${fareRules.restrictions}`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  {exchangeOptions.map((option, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedOption?.id === option.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedOption(option)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {option.origin} → {option.destination}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(option.departure_time).toLocaleDateString()}
                            <Clock className="h-3 w-3" />
                            {new Date(option.departure_time).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {option.fare_difference > 0 ? '+' : ''}{option.fare_difference} {option.currency}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Fare difference
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={processExchange}
                  disabled={!selectedOption || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing Exchange...' : 'Confirm Exchange'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};