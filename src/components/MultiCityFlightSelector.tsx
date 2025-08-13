import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, X, Check } from "lucide-react";
import { useCurrency } from "@/features/currency/CurrencyProvider";

interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: string;
  price: number;
  currency: string;
  cabin: string;
  fareType?: "basic" | "flex";
}

interface MultiCitySelection {
  segmentIndex: number;
  flight: Flight;
}

interface MultiCityFlightSelectorProps {
  selections: MultiCitySelection[];
  totalSegments: number;
  onRemoveFlight: (segmentIndex: number) => void;
  onProceedToFareSelection: () => void;
}

export const MultiCityFlightSelector = ({ 
  selections, 
  totalSegments, 
  onRemoveFlight, 
  onProceedToFareSelection 
}: MultiCityFlightSelectorProps) => {
  const { formatCurrency, selectedCurrency, convert } = useCurrency();

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

  const calculateTotalPrice = () => {
    return selections.reduce((total, selection) => {
      return total + convert(selection.flight.price, selection.flight.currency);
    }, 0);
  };

  const isComplete = selections.length === totalSegments;

  if (selections.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Multi-City Journey</span>
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? "default" : "secondary"}>
              {selections.length} of {totalSegments} flights selected
            </Badge>
            {isComplete && <Check className="h-4 w-4 text-green-600" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selections.map((selection, index) => (
          <div key={selection.segmentIndex} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
              {selection.segmentIndex + 1}
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{selection.flight.airlineCode}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{selection.flight.airline}</p>
                  <p className="text-xs text-muted-foreground">{selection.flight.flightNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selection.flight.origin} → {selection.flight.destination}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">{selection.flight.departureTime}</span>
                  <span className="text-muted-foreground"> · {formatDuration(selection.flight.duration)}</span>
                  <span className="text-muted-foreground"> · {getStopsText(selection.flight.stops)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {formatCurrency(convert(selection.flight.price, selection.flight.currency), selectedCurrency)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveFlight(selection.segmentIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Total Journey Price</div>
            <div className="text-xl font-bold text-primary">
              {formatCurrency(calculateTotalPrice(), selectedCurrency)}
            </div>
          </div>
          {isComplete && (
            <div className="mt-4">
              <Button onClick={onProceedToFareSelection} size="lg" className="w-full">
                Proceed to Fare Selection
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};