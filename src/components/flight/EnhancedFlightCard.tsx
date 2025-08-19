import { useState } from "react";
import { Clock, Plane, Users, WifiOff, Utensils, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/features/currency/CurrencyProvider";

interface FareOption {
  type: "economy" | "business" | "first";
  price: number;
  currency: string;
  features: string[];
  available: boolean;
  seatsLeft?: number;
}

interface EnhancedFlight {
  id: string;
  airline: string;
  airlineCode: string;
  airlineLogo?: string;
  flightNumber: string;
  aircraft: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: string;
  fareOptions: FareOption[];
  availableSeats: number;
  amenities: string[];
  onTimePerformance?: number;
}

interface EnhancedFlightCardProps {
  flight: EnhancedFlight;
  onSelectFare: (flight: EnhancedFlight, fareType: string) => void;
  className?: string;
  showFareOptions?: boolean;
}

export const EnhancedFlightCard = ({ 
  flight, 
  onSelectFare, 
  className,
  showFareOptions = true 
}: EnhancedFlightCardProps) => {
  const [selectedFare, setSelectedFare] = useState<string>("economy");
  const { convert, formatCurrency } = useCurrency();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStopsText = (stops: string) => {
    switch (stops) {
      case "0":
        return "Direct";
      case "1":
        return "1 stop";
      default:
        return `${stops} stops`;
    }
  };

  const getSeatAvailabilityColor = (seatsLeft?: number) => {
    if (!seatsLeft) return "text-muted-foreground";
    if (seatsLeft <= 3) return "text-orange-600";
    if (seatsLeft <= 9) return "text-yellow-600";
    return "text-green-600";
  };

  const getSeatAvailabilityText = (seatsLeft?: number) => {
    if (!seatsLeft) return "Check availability";
    if (seatsLeft <= 3) return `Only ${seatsLeft} left`;
    if (seatsLeft <= 9) return `${seatsLeft} seats left`;
    return "Available";
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <WifiOff className="h-4 w-4" />;
      case "meal":
        return <Utensils className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
      <CardContent className="p-0">
        {/* Main Flight Info */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 flex-1">
              {/* Airline Info */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {flight.airlineLogo ? (
                    <img 
                      src={flight.airlineLogo} 
                      alt={`${flight.airline} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${flight.airlineLogo ? 'hidden' : ''}`}>
                    <span className="text-primary font-bold text-sm">{flight.airlineCode}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{flight.airline}</p>
                  <p className="text-sm text-muted-foreground">{flight.flightNumber} • {flight.aircraft}</p>
                  {flight.onTimePerformance && (
                    <p className="text-xs text-green-600">
                      {flight.onTimePerformance}% on time
                    </p>
                  )}
                </div>
              </div>

              {/* Flight Times */}
              <div className="flex items-center space-x-6 flex-1">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{flight.departureTime}</p>
                  <p className="text-sm text-muted-foreground font-medium">{flight.origin}</p>
                </div>
                
                <div className="flex-1 relative">
                  <div className="border-t border-border"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium text-foreground">{formatDuration(flight.duration)}</p>
                    <p className="text-xs text-muted-foreground">{getStopsText(flight.stops)}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{flight.arrivalTime}</p>
                  <p className="text-sm text-muted-foreground font-medium">{flight.destination}</p>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  {flight.amenities.slice(0, 3).map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-1 text-muted-foreground">
                      {getAmenityIcon(amenity)}
                      <span className="text-xs">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Options */}
        {showFareOptions && (
          <>
            <Separator />
            <div className="p-4 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {flight.fareOptions.map((fare) => {
                  const displayPrice = convert(fare.price, fare.currency);
                  const formattedPrice = formatCurrency(displayPrice);
                  const seatsLeftColor = getSeatAvailabilityColor(fare.seatsLeft);
                  const seatsLeftText = getSeatAvailabilityText(fare.seatsLeft);
                  
                  return (
                    <div
                      key={fare.type}
                      className={cn(
                        "p-4 rounded-lg border transition-all cursor-pointer",
                        selectedFare === fare.type 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50",
                        !fare.available && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => fare.available && setSelectedFare(fare.type)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold capitalize">{fare.type}</h4>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", seatsLeftColor)}
                          >
                            {seatsLeftText}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {formattedPrice}
                          </p>
                          <p className="text-xs text-muted-foreground">per person</p>
                        </div>
                        
                        <div className="space-y-1">
                          {fare.features.slice(0, 3).map((feature, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                              • {feature}
                            </p>
                          ))}
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          disabled={!fare.available}
                          variant={selectedFare === fare.type ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (fare.available) {
                              onSelectFare(flight, fare.type);
                            }
                          }}
                        >
                          {!fare.available ? "Sold out" : "Select"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};