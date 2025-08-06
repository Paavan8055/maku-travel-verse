import { useNavigate } from "react-router-dom";
import { Clock, Plane, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
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
}

export const FlightCard = ({ flight }: FlightCardProps) => {
  const navigate = useNavigate();

  const handleSelectFlight = () => {
    navigate(`/booking?type=flight&id=${flight.id}`);
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            {/* Airline Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Plane className="h-5 w-5 text-primary" />
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
              <p className="text-2xl font-bold text-foreground">
                {flight.currency}{flight.price}
              </p>
              <p className="text-sm text-muted-foreground">per person</p>
            </div>
            <Button onClick={handleSelectFlight} className="w-full">
              Select Flight
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};