import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  Clock, 
  MapPin, 
  Calendar,
  Users,
  ArrowRight,
  Wifi,
  Utensils,
  Monitor,
  Luggage
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getAirlineLogo, getAirlineName, formatFlightNumber } from '@/utils/airline';
import { formatCurrency } from '@/utils/currency';

interface FlightResultsProps {
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
  };
  flights: any[];
  loading: boolean;
  error: string | null;
}

export const FlightResults: React.FC<FlightResultsProps> = ({
  searchParams,
  flights,
  loading,
  error
}) => {
  const navigate = useNavigate();

  const handleFlightSelect = (flight: any) => {
    navigate('/flight-booking-review', { 
      state: { 
        flight, 
        searchParams 
      } 
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
              <div className="h-8 bg-muted rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-destructive text-lg font-semibold">Search Error</div>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <Plane className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No flights found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or dates
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flight Results</h2>
          <p className="text-muted-foreground">
            {searchParams.origin} → {searchParams.destination} • {formatDate(new Date(searchParams.departureDate), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant="secondary">
          {flights.length} flight{flights.length !== 1 ? 's' : ''} found
        </Badge>
      </div>

      <div className="space-y-4">
        {flights.map((flight, index) => (
          <Card key={`${flight.id || index}`} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Flight Header with Airline Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={getAirlineLogo(flight.carrier || flight.validatingAirlineCodes?.[0] || 'XX')}
                      alt={getAirlineName(flight.carrier || flight.validatingAirlineCodes?.[0] || 'XX')}
                      className="w-8 h-8 rounded object-contain bg-white border"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-airline.svg';
                      }}
                    />
                    <div className="flex flex-col">
                      <Badge variant="outline" className="w-fit">
                        {flight.carrier || flight.validatingAirlineCodes?.[0] || 'XX'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getAirlineName(flight.carrier || flight.validatingAirlineCodes?.[0] || 'XX')}
                      </span>
                    </div>
                  </div>
                  <div className="border-l pl-3">
                    <span className="text-sm font-medium">
                      {formatFlightNumber(
                        flight.carrier || flight.validatingAirlineCodes?.[0] || 'XX',
                        flight.flightNumber || flight.id
                      )}
                    </span>
                    {flight.aircraft && (
                      <div className="text-xs text-muted-foreground">{flight.aircraft}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      parseFloat(flight.price?.total || flight.totalPrice || '0'),
                      flight.price?.currency || 'AUD'
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">per person</div>
                </div>
              </div>

              {/* Flight Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {flight.departure?.time || flight.departureTime || '00:00'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {flight.departure?.airport || searchParams.origin}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center space-x-2 min-w-0">
                    <Separator className="flex-1" />
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{flight.duration || '2h 30m'}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Separator className="flex-1" />
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {flight.arrival?.time || flight.arrivalTime || '00:00'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {flight.arrival?.airport || searchParams.destination}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Amenities */}
              {flight.amenities && (
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {flight.amenities.wifi && <Wifi className="h-4 w-4" />}
                  {flight.amenities.meals && <Utensils className="h-4 w-4" />}
                  {flight.amenities.entertainment && <Monitor className="h-4 w-4" />}
                  {flight.amenities.baggage && <Luggage className="h-4 w-4" />}
                </div>
              )}

              {/* Flight Stops and Aircraft Info */}
              <div className="flex items-center gap-4 text-sm">
                {flight.stops !== undefined && flight.stops >= 0 && (
                  <Badge variant="outline" className="w-fit">
                    {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </Badge>
                )}
                {flight.cabinClass && (
                  <span className="text-muted-foreground">{flight.cabinClass}</span>
                )}
                {flight.provider && (
                  <span className="text-xs text-muted-foreground">via {flight.provider}</span>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button 
                  onClick={() => handleFlightSelect(flight)}
                  className="w-full"
                >
                  Select Flight
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};