import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { 
  Plane, 
  Clock, 
  AlertTriangle,
  ExternalLink
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

  // Filter fare options to only show Economy and Business (no First class)
  const filteredFareOptions = flight.fareOptions?.filter(fare => 
    fare.type.toLowerCase() === 'economy' || fare.type.toLowerCase() === 'business'
  ) || [];

  return (
    <Card className="mb-4 hover:shadow-card transition-all duration-300 border border-border/50">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          
          {/* Left Section - Flight Details (2/3 width) */}
          <div className="flex-1 lg:flex-[2] space-y-6">
            
            {/* Flight Number Badges - Red like Air India */}
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded text-sm font-bold">
                  {flight.flightNumber}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base">{flight.airline}</span>
                <span className="text-sm text-muted-foreground">{flight.aircraft || 'Aircraft Type'}</span>
              </div>
            </div>

            {/* Flight Route - Large Times */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-1">{flight.departureTime}</div>
                <div className="text-lg font-medium text-muted-foreground">{flight.origin}</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-6">
                <div className="text-sm text-muted-foreground mb-2">{formatDuration(flight.duration)}</div>
                <div className="w-full border-t-2 border-dotted border-border relative">
                  <Plane className="h-5 w-5 text-muted-foreground absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-background px-1 rotate-90" />
                </div>
                <div className="text-sm text-muted-foreground mt-2 font-medium">{getStopsText(flight.stops)}</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-1">{flight.arrivalTime}</div>
                <div className="text-lg font-medium text-muted-foreground">{flight.destination}</div>
              </div>
            </div>

            {/* View Flight Details Link */}
            <div className="flex justify-end">
              <Button variant="link" className="text-destructive hover:text-destructive/80 p-0 h-auto font-medium">
                View Flight Details
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Right Section - Fare Options (1/3 width) */}
          <div className="lg:flex-[1] min-w-0">
            {showFareOptions && filteredFareOptions.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {filteredFareOptions.map((fare, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => setSelectedFare(fare.type)}
                  >
                    {/* Seat Availability Warning - Orange box like Air India */}
                    {fare.seatsAvailable !== undefined && fare.seatsAvailable <= 9 && (
                      <div className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-md text-sm font-medium mb-3 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {getSeatAvailabilityText(fare.seatsAvailable)}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg capitalize">{fare.type}</h4>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-foreground">
                          {formatCurrency(fare.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">per person</div>
                      </div>
                      
                      {fare.features && fare.features.length > 0 && (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {fare.features.slice(0, 3).map((feature, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="w-1 h-1 bg-travel-forest rounded-full mt-2 flex-shrink-0"></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {onSelectFare && (
                        <Button
                          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFare(flight, fare);
                          }}
                        >
                          SELECT
                        </Button>
                      )}
                    </div>
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