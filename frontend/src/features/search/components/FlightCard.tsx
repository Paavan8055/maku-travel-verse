import { useState } from "react";
import { Clock, Plane, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FareSelectionDialog } from "./FareSelectionDialog";
import { useCurrency } from "@/features/currency/CurrencyProvider";

interface Flight {
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
  price: number;
  currency: string;
  availableSeats: number;
  cabin: string;
  baggage: {
    carry: boolean;
    checked: boolean;
  };
}

interface FlightCardProps {
  flight: Flight;
  tripType?: string;
  isRoundtrip?: boolean;
  returnFlights?: Flight[];
  onMultiCitySelect?: (flight: Flight, segmentIndex: number) => void;
  currentSegmentIndex?: number;
  totalSegments?: number;
  isMultiCitySelected?: boolean;
}

export const FlightCard = ({ 
  flight, 
  tripType = "oneway", 
  isRoundtrip = false, 
  returnFlights = [],
  onMultiCitySelect,
  currentSegmentIndex = 0,
  totalSegments = 1,
  isMultiCitySelected = false
}: FlightCardProps) => {
  const [fareOpen, setFareOpen] = useState(false);
  const { convert, formatCurrency } = useCurrency();

  const handleSelectFlight = () => {
    if (tripType === "multicity" && onMultiCitySelect) {
      onMultiCitySelect(flight, currentSegmentIndex);
    } else {
      setFareOpen(true);
    }
  };

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

  // Calculate combined pricing based on trip type
  const getCombinedPrice = () => {
    if (tripType === "roundtrip" && isRoundtrip && returnFlights.length > 0) {
      const cheapestReturn = returnFlights.reduce((min, f) => f.price < min.price ? f : min, returnFlights[0]);
      return flight.price + cheapestReturn.price;
    }
    return flight.price;
  };

  const getPriceLabel = () => {
    if (tripType === "roundtrip" && isRoundtrip) {
      return "Round-trip from";
    }
    if (tripType === "multicity") {
      return "Multi-city from";
    }
    return "One-way from";
  };

  const getButtonText = () => {
    if (tripType === "roundtrip" && isRoundtrip) {
      return "Select departing flight";
    }
    if (tripType === "multicity") {
      return isMultiCitySelected ? "Selected" : "Add to journey";
    }
    return "Select flight";
  };

  // Convert and format the price properly
  const displayPrice = convert(getCombinedPrice(), flight.currency);
  const formattedPrice = formatCurrency(displayPrice);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            {/* Airline Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                {flight.airlineLogo ? (
                  <img 
                    src={flight.airlineLogo} 
                    alt={`${flight.airline} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) nextElement.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${flight.airlineLogo ? 'hidden' : ''}`}>
                  <span className="text-primary font-bold text-xs">{flight.airlineCode}</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">{flight.airline}</p>
                <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
              </div>
            </div>

            {/* Flight Times */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{flight.departureTime}</p>
                <p className="text-sm text-muted-foreground">{flight.origin}</p>
              </div>
              
              <div className="flex-1 relative">
                <div className="border-t border-border"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center mt-1">
                  <p className="text-xs text-muted-foreground">{formatDuration(flight.duration)}</p>
                  <p className="text-xs text-muted-foreground">{getStopsText(flight.stops)}</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{flight.arrivalTime}</p>
                <p className="text-sm text-muted-foreground">{flight.destination}</p>
              </div>
            </div>

            {/* Flight Details */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{flight.cabin}</Badge>
                {flight.baggage.carry && (
                  <Badge variant="outline" className="text-xs">Carry-on</Badge>
                )}
                {flight.baggage.checked && (
                  <Badge variant="outline" className="text-xs">Checked bag</Badge>
                )}
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{flight.availableSeats} seats left</span>
              </div>
            </div>
          </div>

          {/* Price and Select */}
          <div className="text-right space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">{getPriceLabel()}</p>
              <p className="text-2xl font-bold text-foreground">
                {formattedPrice}
              </p>
              <p className="text-sm text-muted-foreground">per person</p>
            </div>
            <Button 
              onClick={handleSelectFlight} 
              className="w-full"
              disabled={tripType === "multicity" && isMultiCitySelected}
              variant={tripType === "multicity" && isMultiCitySelected ? "secondary" : "default"}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </CardContent>
      {tripType !== "multicity" && (
        <FareSelectionDialog 
          open={fareOpen} 
          onOpenChange={setFareOpen} 
          flight={flight}
          tripType={tripType}
          returnFlights={returnFlights}
        />
      )}
    </Card>
  );
};
