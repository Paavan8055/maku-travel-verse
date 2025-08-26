import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plane, User, Crown, Wifi, Coffee, Monitor, AlertCircle } from 'lucide-react';

interface SeatMap {
  aircraftCode: string;
  flightNumber: string;
  departureDate: string;
  segments: SeatMapSegment[];
}

interface SeatMapSegment {
  segmentId: string;
  origin: string;
  destination: string;
  cabins: Cabin[];
}

interface Cabin {
  code: string;
  name: string;
  layout: string;
  rows: SeatRow[];
}

interface SeatRow {
  rowNumber: string;
  seats: Seat[];
}

interface Seat {
  number: string;
  characteristics: string[];
  available: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  amenities: string[];
}

interface SeatMapIntegrationProps {
  flightOfferId: string;
  provider: 'amadeus' | 'sabre';
  onSeatSelected?: (seatNumber: string, price?: number) => void;
  className?: string;
}

export const SeatMapIntegration: React.FC<SeatMapIntegrationProps> = ({
  flightOfferId,
  provider,
  onSeatSelected,
  className
}) => {
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (flightOfferId) {
      fetchSeatMap();
    }
  }, [flightOfferId, provider]);

  const fetchSeatMap = async () => {
    try {
      setLoading(true);
      setError(null);

      const functionName = provider === 'amadeus' ? 'amadeus-seat-map' : 'sabre-seat-selection';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'get_seatmap',
          offerId: flightOfferId,
          provider
        }
      });

      if (error) throw error;

      if (data?.seatMap) {
        setSeatMap(data.seatMap);
      } else {
        throw new Error('No seat map data received');
      }

    } catch (error) {
      console.error('Failed to fetch seat map:', error);
      setError(error instanceof Error ? error.message : 'Failed to load seat map');
      toast({
        title: "Seat Map Error",
        description: "Unable to load seat map. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!seat.available) return;

    setSelectedSeat(seat.number);
    onSeatSelected?.(seat.number, seat.price?.amount);

    toast({
      title: "Seat Selected",
      description: `Seat ${seat.number} selected${seat.price ? ` for $${seat.price.amount}` : ''}`,
    });
  };

  const getSeatIcon = (seat: Seat) => {
    if (seat.characteristics.includes('aisle')) return 'A';
    if (seat.characteristics.includes('window')) return 'W';
    if (seat.characteristics.includes('middle')) return 'M';
    return '';
  };

  const getSeatClassName = (seat: Seat) => {
    const baseClasses = "w-8 h-8 text-xs font-medium border rounded cursor-pointer transition-colors flex items-center justify-center";
    
    if (!seat.available) {
      return `${baseClasses} bg-muted text-muted-foreground cursor-not-allowed`;
    }
    
    if (selectedSeat === seat.number) {
      return `${baseClasses} bg-primary text-primary-foreground border-primary`;
    }
    
    if (seat.characteristics.includes('preferred') || seat.price) {
      return `${baseClasses} bg-yellow-50 border-yellow-300 hover:bg-yellow-100 text-yellow-800`;
    }
    
    return `${baseClasses} bg-background border-border hover:bg-accent hover:text-accent-foreground`;
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-3 w-3" />;
      case 'meal':
        return <Coffee className="h-3 w-3" />;
      case 'entertainment':
        return <Monitor className="h-3 w-3" />;
      case 'premium':
        return <Crown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Seat Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Seat Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchSeatMap}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!seatMap) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Seat Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No seat map available for this flight</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Seat Selection
        </CardTitle>
        <CardDescription>
          Flight {seatMap.flightNumber} • {seatMap.aircraftCode}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-background border rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border-yellow-300 rounded"></div>
            <span>Premium (+fee)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span>Selected</span>
          </div>
        </div>

        {/* Seat Map */}
        {seatMap.segments.map((segment) => (
          <div key={segment.segmentId} className="space-y-4">
            <h3 className="font-medium">
              {segment.origin} → {segment.destination}
            </h3>
            
            {segment.cabins.map((cabin) => (
              <div key={cabin.code} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{cabin.name}</h4>
                  <Badge variant="outline">{cabin.layout}</Badge>
                </div>
                
                <div className="space-y-1">
                  {cabin.rows.map((row) => (
                    <div key={row.rowNumber} className="flex items-center gap-2">
                      <div className="w-6 text-xs text-muted-foreground text-center">
                        {row.rowNumber}
                      </div>
                      
                      <div className="flex gap-1">
                        {row.seats.map((seat, index) => (
                          <React.Fragment key={seat.number}>
                            <div
                              className={getSeatClassName(seat)}
                              onClick={() => handleSeatClick(seat)}
                              title={`Seat ${seat.number}${seat.price ? ` (+$${seat.price.amount})` : ''}`}
                            >
                              {getSeatIcon(seat) || seat.number.slice(-1)}
                            </div>
                            
                            {/* Add aisle gap after specific seats based on layout */}
                            {cabin.layout.includes('-') && 
                             index === Math.floor(row.seats.length / 2) - 1 && (
                              <div className="w-4"></div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Selected Seat Summary */}
        {selectedSeat && (
          <div className="mt-6 p-4 bg-accent rounded-lg">
            <h4 className="font-medium mb-2">Selected Seat</h4>
            <div className="flex items-center justify-between">
              <span>Seat {selectedSeat}</span>
              {seatMap.segments[0]?.cabins
                .flatMap(c => c.rows)
                .flatMap(r => r.seats)
                .find(s => s.number === selectedSeat)?.price && (
                <Badge>
                  +${seatMap.segments[0].cabins
                    .flatMap(c => c.rows)
                    .flatMap(r => r.seats)
                    .find(s => s.number === selectedSeat)?.price?.amount}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};