import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { 
  Plane, 
  Clock, 
  Wifi, 
  Tv, 
  Utensils, 
  Luggage,
  AlertTriangle
} from "lucide-react";

interface FareOption {
  type: string;
  price: number;
  features?: string[];
  seatsAvailable?: number;
}

interface EnhancedFlight {
  id?: string;
  airline: string;
  flightNumber: string;
  aircraft?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  amenities?: string[];
  fareOptions?: FareOption[];
}

interface EnhancedFlightCardProps {
  flight: EnhancedFlight;
  onSelectFare?: (flight: EnhancedFlight, fare: FareOption) => void;
  showFareOptions?: boolean;
}

export const EnhancedFlightCard = ({ 
  flight, 
  onSelectFare,
  showFareOptions = true 
}: EnhancedFlightCardProps) => {
  const { formatCurrency } = useCurrency();
  const [selectedFare, setSelectedFare] = useState<string>("economy");

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStopsText = (stops: number) => {
    if (stops === 0) return "Direct";
    return `${stops} stop${stops > 1 ? 's' : ''}`;
  };

  const getSeatAvailabilityColor = (seats: number) => {
    if (seats <= 3) return "text-destructive";
    if (seats <= 9) return "text-secondary";
    return "text-travel-forest";
  };

  const getSeatAvailabilityText = (seats: number) => {
    if (seats <= 3) return `Only ${seats} left`;
    if (seats <= 9) return `${seats} seats left`;
    return `${seats}+ available`;
  };

  const getAirlineLogo = (airline: string) => {
    // Return airline code initials as fallback for logo
    return airline.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="mb-4 hover:shadow-card transition-all hover:-translate-y-1">
      <div className="p-6">
        {/* Air India style layout - Flight details on left, Fare options on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Flight Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Airline Header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                {getAirlineLogo(flight.airline)}
              </div>
              <div>
                <div className="font-semibold text-lg">{flight.airline}</div>
                <div className="text-sm text-muted-foreground">
                  {flight.flightNumber} • {flight.aircraft || 'Aircraft'}
                </div>
              </div>
            </div>

            {/* Flight Route */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{flight.departureTime}</div>
                <div className="text-sm text-muted-foreground font-medium">{flight.origin}</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-4">
                <div className="text-sm text-muted-foreground mb-1">{formatDuration(flight.duration)}</div>
                <div className="w-full h-px bg-border relative">
                  <Plane className="h-4 w-4 text-primary absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rotate-90" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">{getStopsText(flight.stops)}</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{flight.arrivalTime}</div>
                <div className="text-sm text-muted-foreground font-medium">{flight.destination}</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                {flight.amenities && flight.amenities.length > 0 && (
                  <>
                    <span className="text-muted-foreground">Amenities:</span>
                    <div className="flex items-center space-x-2">
                      {flight.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View flight details
              </Button>
            </div>
          </div>

          {/* Right Column - Fare Selection */}
          <div className="lg:col-span-1">
            {showFareOptions && flight.fareOptions && (
              <div className="space-y-3">
                {flight.fareOptions.map((fare, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${selectedFare === fare.type 
                        ? "border-primary bg-primary/5 shadow-soft" 
                        : "border-border hover:border-primary/50 hover:shadow-soft"
                      }
                    `}
                    onClick={() => setSelectedFare(fare.type)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-lg capitalize">{fare.type}</div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(fare.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">per person</div>
                      </div>
                    </div>
                    
                    {fare.seatsAvailable !== undefined && fare.seatsAvailable <= 9 && (
                      <div className={`flex items-center space-x-1 mb-2 ${getSeatAvailabilityColor(fare.seatsAvailable)}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {getSeatAvailabilityText(fare.seatsAvailable)}
                        </span>
                      </div>
                    )}
                    
                    <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                      {fare.features?.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-travel-forest rounded-full mt-2 flex-shrink-0"></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {onSelectFare && (
                      <Button
                        size="sm"
                        className="w-full"
                        variant={selectedFare === fare.type ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFare(flight, fare);
                        }}
                      >
                        SELECT
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};