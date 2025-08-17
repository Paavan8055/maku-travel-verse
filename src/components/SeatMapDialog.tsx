import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plane, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SeatMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flightOfferId: string;
  onSeatSelected?: (seatNumber: string, price?: number) => void;
}

interface Seat {
  number: string;
  characteristicsCodes: string[];
  travelerPricing?: Array<{
    travelerId: string;
    seatAvailabilityStatus: string;
    price?: {
      currency: string;
      total: string;
      base: string;
    };
  }>;
}

interface SeatMap {
  flightOfferId: string;
  segmentId: string;
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
    name: string;
  };
  class: string;
  decks: Array<{
    deckType: string;
    deckConfiguration: {
      width: number;
      length: number;
      startsWithRow: number;
      endsWithRow: number;
    };
    seats: Seat[];
  }>;
}

export const SeatMapDialog = ({ open, onOpenChange, flightOfferId, onSeatSelected }: SeatMapDialogProps) => {
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && flightOfferId) {
      fetchSeatMap();
    }
  }, [open, flightOfferId]);

  const fetchSeatMap = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('amadeus-seat-map', {
        body: { flightOfferId }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.success && data.seatMaps) {
        setSeatMaps(data.seatMaps);
      } else {
        throw new Error('No seat map data available');
      }
    } catch (err) {
      console.error('Seat map error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load seat map');
      toast.error('Failed to load seat map');
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seat: Seat) => {
    const characteristics = seat.characteristicsCodes || [];
    
    if (characteristics.includes('9')) return 'occupied';
    if (characteristics.includes('1A') || characteristics.includes('1C')) return 'window';
    if (characteristics.includes('1B')) return 'middle';
    if (characteristics.includes('1D')) return 'aisle';
    if (characteristics.includes('E')) return 'exit-row';
    if (characteristics.includes('7')) return 'blocked';
    
    return 'available';
  };

  const getSeatPrice = (seat: Seat) => {
    const pricing = seat.travelerPricing?.[0];
    return pricing?.price ? parseFloat(pricing.price.total) : 0;
  };

  const getSeatStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed';
      case 'window': return 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800';
      case 'aisle': return 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800';
      case 'exit-row': return 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800';
      case 'blocked': return 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed';
      default: return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800';
    }
  };

  const handleSeatClick = (seat: Seat) => {
    const status = getSeatStatus(seat);
    if (status === 'occupied' || status === 'blocked') return;
    
    setSelectedSeat(seat.number);
  };

  const handleConfirmSelection = () => {
    if (selectedSeat && onSeatSelected) {
      const selectedSeatData = seatMaps
        .flatMap(sm => sm.decks)
        .flatMap(deck => deck.seats)
        .find(seat => seat.number === selectedSeat);
      
      const price = selectedSeatData ? getSeatPrice(selectedSeatData) : 0;
      onSeatSelected(selectedSeat, price);
      onOpenChange(false);
    }
  };

  const renderSeatMap = (seatMap: SeatMap) => {
    const mainDeck = seatMap.decks[0];
    if (!mainDeck || !mainDeck.seats) return null;

    // Group seats by row
    const seatsByRow: { [row: string]: Seat[] } = {};
    mainDeck.seats.forEach(seat => {
      const row = seat.number.replace(/[A-Z]/g, '');
      if (!seatsByRow[row]) seatsByRow[row] = [];
      seatsByRow[row].push(seat);
    });

    const rows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="h-5 w-5 text-primary" />
          <span className="font-medium">{seatMap.aircraft.name || seatMap.aircraft.code}</span>
          <Badge variant="outline">Flight {seatMap.number}</Badge>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {rows.map(row => (
            <div key={row} className="flex items-center gap-1">
              <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                {row}
              </div>
              {seatsByRow[row]
                .sort((a, b) => a.number.localeCompare(b.number))
                .map(seat => {
                  const status = getSeatStatus(seat);
                  const price = getSeatPrice(seat);
                  const isSelected = selectedSeat === seat.number;
                  
                  return (
                    <button
                      key={seat.number}
                      onClick={() => handleSeatClick(seat)}
                      disabled={status === 'occupied' || status === 'blocked'}
                      className={`
                        w-8 h-8 text-xs font-medium border rounded transition-colors
                        ${getSeatStatusColor(status)}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                      `}
                      title={`Seat ${seat.number} - ${status}${price > 0 ? ` (+$${price})` : ''}`}
                    >
                      {seat.number.replace(/[0-9]/g, '')}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Window</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Aisle</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span>Exit Row</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Select Your Seat
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading seat map...</span>
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSeatMap} variant="outline">
              Try Again
            </Button>
          </div>
        ) : seatMaps.length > 0 ? (
          <div className="space-y-6">
            {seatMaps.map((seatMap, index) => (
              <div key={index}>
                {renderSeatMap(seatMap)}
              </div>
            ))}
            
            {selectedSeat && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Selected Seat: {selectedSeat}</p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const seat = seatMaps
                        .flatMap(sm => sm.decks)
                        .flatMap(deck => deck.seats)
                        .find(s => s.number === selectedSeat);
                      const price = seat ? getSeatPrice(seat) : 0;
                      return price > 0 ? `Additional fee: $${price}` : 'No additional fee';
                    })()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedSeat(null)}>
                    Clear Selection
                  </Button>
                  <Button onClick={handleConfirmSelection}>
                    Confirm Seat
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <Plane className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No seat map available for this flight</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};