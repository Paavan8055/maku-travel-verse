import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Armchair, DollarSign, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SeatSelectionInterfaceProps {
  booking: {
    id: string;
    booking_reference: string;
    booking_data: any;
  };
  onSeatSelectionComplete?: () => void;
}

export const SeatSelectionInterface: React.FC<SeatSelectionInterfaceProps> = ({
  booking,
  onSeatSelectionComplete
}) => {
  const [seatMap, setSeatMap] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchSeatMap = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-seat-selection', {
        body: {
          action: 'get_seatmap',
          pnrLocator: booking.booking_data.pnr_locator,
          flightSegmentId: booking.booking_data.flight?.segment_id || '1',
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        setSeatMap(data.seatMap);
      } else {
        throw new Error(data.error || 'Failed to fetch seat map');
      }
    } catch (error) {
      console.error('Seat map fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load seat map. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectSeat = (seat: any) => {
    const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
    
    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => s.seatNumber !== seat.seatNumber));
    } else {
      // Check if we can select more seats based on passenger count
      const passengerCount = booking.booking_data.passengers?.length || 1;
      if (selectedSeats.length < passengerCount) {
        setSelectedSeats(prev => [...prev, seat]);
      } else {
        toast({
          title: "Selection Limit",
          description: `You can only select ${passengerCount} seat(s) for this booking.`,
          variant: "destructive"
        });
      }
    }
  };

  const confirmSeatSelection = async () => {
    if (selectedSeats.length === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-seat-selection', {
        body: {
          action: 'select_seats',
          pnrLocator: booking.booking_data.pnr_locator,
          flightSegmentId: booking.booking_data.flight?.segment_id || '1',
          seatSelections: selectedSeats.map(seat => ({
            passengerName: booking.booking_data.passengers?.[0]?.name || 'Passenger',
            seatNumber: seat.seatNumber,
            seatType: seat.seatType,
            price: seat.price || 0
          })),
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Seats Selected",
          description: "Your seat selection has been confirmed.",
        });
        onSeatSelectionComplete?.();
      } else {
        throw new Error(data.error || 'Seat selection failed');
      }
    } catch (error) {
      console.error('Seat selection error:', error);
      toast({
        title: "Selection Failed",
        description: "Failed to confirm seat selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchSeatMap();
  }, []);

  const getSeatIcon = (seat: any) => {
    if (seat.occupied) return '⛔';
    if (selectedSeats.some(s => s.seatNumber === seat.seatNumber)) return '✅';
    if (seat.seatType === 'business') return '💺';
    if (seat.seatType === 'premium') return '🪑';
    if (seat.seatType === 'exit_row') return '🚪';
    return '💺';
  };

  const getSeatColor = (seat: any) => {
    if (seat.occupied) return 'bg-red-100 text-red-800 cursor-not-allowed';
    if (selectedSeats.some(s => s.seatNumber === seat.seatNumber)) return 'bg-green-100 text-green-800';
    if (seat.seatType === 'business') return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    if (seat.seatType === 'premium') return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    if (seat.seatType === 'exit_row') return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    return 'bg-white text-gray-800 hover:bg-gray-200';
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Armchair className="h-5 w-5" />
          Seat Selection
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSeatMap}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Summary */}
        {selectedSeats.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>
                  Selected {selectedSeats.length} seat(s): {selectedSeats.map(s => s.seatNumber).join(', ')}
                </span>
                {totalPrice > 0 && (
                  <span className="font-medium">
                    Total: ${totalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Seat Map */}
        {seatMap ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Aircraft: {seatMap.aircraftType}</div>
              <div className="w-full h-2 bg-gradient-to-r from-primary/20 to-primary/40 rounded mb-4"></div>
              <div className="text-xs text-muted-foreground">✈️ Front of Aircraft</div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center text-xs">
              <Badge variant="outline">💺 Standard</Badge>
              <Badge variant="outline" className="bg-purple-100">💺 Business</Badge>
              <Badge variant="outline" className="bg-blue-100">🪑 Premium</Badge>
              <Badge variant="outline" className="bg-orange-100">🚪 Exit Row</Badge>
              <Badge variant="outline" className="bg-red-100">⛔ Occupied</Badge>
              <Badge variant="outline" className="bg-green-100">✅ Selected</Badge>
            </div>

            {/* Seat Grid */}
            <div className="max-w-2xl mx-auto">
              {seatMap.rows?.map((row: any, rowIndex: number) => (
                <div key={rowIndex} className="flex justify-center items-center gap-1 mb-2">
                  <span className="text-xs w-8 text-center font-mono">{row.rowNumber}</span>
                  
                  {/* Left seats */}
                  <div className="flex gap-1">
                    {row.seats.filter((seat: any) => seat.position?.startsWith('A') || seat.position?.startsWith('B') || seat.position?.startsWith('C')).map((seat: any, seatIndex: number) => (
                      <button
                        key={seatIndex}
                        className={`w-8 h-8 text-xs rounded border transition-colors ${getSeatColor(seat)}`}
                        onClick={() => !seat.occupied && selectSeat(seat)}
                        disabled={seat.occupied}
                        title={`Seat ${seat.seatNumber}${seat.price ? ` - $${seat.price}` : ''}`}
                      >
                        {getSeatIcon(seat)}
                      </button>
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className="w-4"></div>

                  {/* Right seats */}
                  <div className="flex gap-1">
                    {row.seats.filter((seat: any) => seat.position?.startsWith('D') || seat.position?.startsWith('E') || seat.position?.startsWith('F')).map((seat: any, seatIndex: number) => (
                      <button
                        key={seatIndex}
                        className={`w-8 h-8 text-xs rounded border transition-colors ${getSeatColor(seat)}`}
                        onClick={() => !seat.occupied && selectSeat(seat)}
                        disabled={seat.occupied}
                        title={`Seat ${seat.seatNumber}${seat.price ? ` - $${seat.price}` : ''}`}
                      >
                        {getSeatIcon(seat)}
                      </button>
                    ))}
                  </div>
                  
                  <span className="text-xs w-8 text-center font-mono">{row.rowNumber}</span>
                </div>
              ))}
            </div>

            {/* Confirm Selection */}
            <div className="flex justify-center">
              <Button
                onClick={confirmSeatSelection}
                disabled={selectedSeats.length === 0 || isProcessing}
                className="min-w-32"
              >
                {isProcessing ? 'Processing...' : `Confirm Selection${totalPrice > 0 ? ` ($${totalPrice.toFixed(2)})` : ''}`}
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading seat map...</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Seat map not available for this flight
          </div>
        )}
      </CardContent>
    </Card>
  );
};