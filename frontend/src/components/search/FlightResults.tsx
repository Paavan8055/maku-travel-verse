import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  Clock, 
  MapPin, 
  Users, 
  Wifi, 
  Utensils,
  Monitor,
  Luggage,
  ArrowRight
} from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface FlightResultsProps {
  flights: any[];
  loading: boolean;
  error: string | null;
  onFlightSelect: (flight: any) => void;
  onRetry?: () => void;
}

export const FlightResults: React.FC<FlightResultsProps> = ({
  flights,
  loading,
  error,
  onFlightSelect,
  onRetry
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-6 bg-muted rounded w-48"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-8"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-10 bg-muted rounded w-32"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <Plane className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Search Failed</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plane className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Flights Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or dates
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {flights.length} flights found
        </h2>
        <Badge variant="secondary">
          Best results shown first
        </Badge>
      </div>

      {flights.map((flight, index) => (
        <Card key={flight.id || index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Airline and Flight Number */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {flight.airline?.logo && (
                    <img 
                      src={flight.airline.logo} 
                      alt={flight.airline.name}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{flight.airline?.name || flight.airline?.code}</p>
                    <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                  </div>
                </div>
                <Badge variant={flight.cabinClass === 'ECONOMY' ? 'secondary' : 'default'}>
                  {flight.cabinClass}
                </Badge>
              </div>

              {/* Flight Route and Times */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{flight.departure?.time}</p>
                  <p className="text-sm text-muted-foreground">{flight.departure?.airport}</p>
                  {flight.departure?.date && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(flight.departure.date), 'MMM dd')}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <Separator className="flex-1" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">{flight.duration}</p>
                    {flight.stops > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {flight.stops} stop{flight.stops > 1 ? 's' : ''}
                      </p>
                    )}
                    {flight.stopoverInfo && (
                      <p className="text-xs text-muted-foreground">{flight.stopoverInfo}</p>
                    )}
                  </div>
                  <Separator className="flex-1" />
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold">{flight.arrival?.time}</p>
                  <p className="text-sm text-muted-foreground">{flight.arrival?.airport}</p>
                  {flight.arrival?.date && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(flight.arrival.date), 'MMM dd')}
                    </p>
                  )}
                </div>
              </div>

              {/* Return Flight (if applicable) */}
              {flight.returnItinerary && (
                <>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold">{flight.returnItinerary.departure?.time}</p>
                      <p className="text-sm text-muted-foreground">{flight.returnItinerary.departure?.airport}</p>
                      {flight.returnItinerary.departure?.date && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(flight.returnItinerary.departure.date), 'MMM dd')}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                      <Separator className="flex-1" />
                      <div className="text-center">
                        <p className="text-sm font-medium">{flight.returnItinerary.duration}</p>
                        <p className="text-xs text-muted-foreground">Return</p>
                      </div>
                      <Separator className="flex-1" />
                    </div>

                    <div className="text-center">
                      <p className="text-xl font-bold">{flight.returnItinerary.arrival?.time}</p>
                      <p className="text-sm text-muted-foreground">{flight.returnItinerary.arrival?.airport}</p>
                      {flight.returnItinerary.arrival?.date && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(flight.returnItinerary.arrival.date), 'MMM dd')}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Amenities */}
              {flight.amenities && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {flight.amenities.wifi && (
                    <div className="flex items-center gap-1">
                      <Wifi className="h-4 w-4" />
                      WiFi
                    </div>
                  )}
                  {flight.amenities.meal && (
                    <div className="flex items-center gap-1">
                      <Utensils className="h-4 w-4" />
                      Meal
                    </div>
                  )}
                  {flight.amenities.entertainment && (
                    <div className="flex items-center gap-1">
                      <Monitor className="h-4 w-4" />
                      Entertainment
                    </div>
                  )}
                  {flight.baggage?.included > 0 && (
                    <div className="flex items-center gap-1">
                      <Luggage className="h-4 w-4" />
                      {flight.baggage.included} bag{flight.baggage.included > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Price and Select Button */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {flight.price?.currency} {flight.price?.amount?.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total for {flight.passengers || 1} passenger{(flight.passengers || 1) > 1 ? 's' : ''}
                  </p>
                </div>
                <Button 
                  onClick={() => onFlightSelect(flight)}
                  size="lg"
                  className="px-8"
                >
                  Select Flight
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};