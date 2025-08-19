
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
  outboundFlightNumber?: string;
  returnFlightNumber?: string;
  aircraft?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number | string;
  stops: number;
  stopoverInfo?: string;
  departure?: {
    date?: string;
    time?: string;
  };
  arrival?: {
    date?: string;
    time?: string;
  };
  amenities?: string[];
  fareOptions?: FareOption[];
  isRoundTrip?: boolean;
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

  const formatDuration = (duration: number | string) => {
    if (typeof duration === 'string') return duration;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}H ${mins}Min`;
  };

  const getStopsText = (stops: number, stopoverInfo?: string) => {
    if (stops === 0) return "Direct";
    if (stopoverInfo) return `${stops} Stop ${stopoverInfo}`;
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

  const formatDate = (dateStr?: string) => {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const date = dateStr ? new Date(dateStr) : new Date();
    const day = dayNames[date.getDay()];
    const dayNum = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    
    return `${day}, ${dayNum} ${month} ${year}`;
  };

  return (
    <Card className="mb-3 hover:shadow-lg transition-all duration-300 border border-border/30 w-full max-w-none">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between w-full">
          
          {/* Left Section - Flight Details */}
          <div className="flex-1 max-w-4xl">
            
            {/* Flight Number Badges and Airline Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex space-x-2">
                <div className="bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold">
                  {flight.outboundFlightNumber || flight.flightNumber}
                </div>
                {flight.isRoundTrip && flight.returnFlightNumber && (
                  <div className="bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold">
                    {flight.returnFlightNumber}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{flight.airline}</span>
                <span className="text-xs text-muted-foreground">{flight.aircraft || 'Aircraft Type'}</span>
              </div>
            </div>

            {/* Flight Route */}
            <div className="flex items-center justify-between max-w-3xl">
              <div className="text-left">
                <div className="text-xs text-muted-foreground mb-1">{formatDate(flight.departure?.date)}</div>
                <div className="text-lg font-semibold text-foreground mb-1">{flight.departure?.time || flight.departureTime}</div>
                <div className="text-base font-medium text-muted-foreground">{flight.origin}</div>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-8">
                <div className="text-xs text-muted-foreground mb-2">{formatDuration(flight.duration)}</div>
                <div className="w-full border-t-2 border-dotted border-muted-foreground/30 relative">
                  <Plane className="h-4 w-4 text-muted-foreground absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-background px-1 rotate-90" />
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  {getStopsText(flight.stops, flight.stopoverInfo)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">{formatDate(flight.arrival?.date)}</div>
                <div className="text-lg font-semibold text-foreground mb-1">{flight.arrival?.time || flight.arrivalTime}</div>
                <div className="text-base font-medium text-muted-foreground">{flight.destination}</div>
              </div>
            </div>

            {/* View Flight Details Link */}
            <div className="flex justify-end mt-4">
              <Button variant="link" className="text-destructive hover:text-destructive/80 p-0 h-auto text-sm font-medium">
                View Flight Details
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>

          {/* Right Section - Fare Options */}
          <div className="ml-8 min-w-[320px]">
            {showFareOptions && filteredFareOptions.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {filteredFareOptions.map((fare, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer min-h-[180px] flex flex-col"
                    onClick={() => setSelectedFare(fare.type)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="text-center mb-3">
                        <h4 className="font-bold text-sm uppercase tracking-wide">{fare.type}</h4>
                      </div>
                      
                      {/* Seat Availability Warning */}
                      {fare.seatsAvailable !== undefined && fare.seatsAvailable <= 9 && (
                        <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold text-center mb-3">
                          {getSeatAvailabilityText(fare.seatsAvailable)}
                        </div>
                      )}
                      
                      <div className="text-center mb-3 flex-1">
                        <div className="text-xl font-bold text-foreground">
                          {formatCurrency(fare.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">per person</div>
                      </div>
                      
                      {fare.features && fare.features.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                          {fare.features.slice(0, 2).map((feature, i) => (
                            <li key={i} className="flex items-start space-x-1">
                              <span className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0"></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {onSelectFare && (
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 mt-auto"
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
