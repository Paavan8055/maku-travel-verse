import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Plane } from "lucide-react";
import { useCurrency } from "@/features/currency/CurrencyProvider";

interface ReturnFlightSearchProps {
  selectedOutbound: any;
  onGoBack: () => void;
  children: React.ReactNode;
}

const ReturnFlightSearch: React.FC<ReturnFlightSearchProps> = ({
  selectedOutbound,
  onGoBack,
  children
}) => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-6">
      {/* Selected Outbound Flight Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className="bg-primary text-primary-foreground">
                Outbound Selected
              </Badge>
              <div>
                <div className="font-medium">
                  {selectedOutbound.flight.origin} → {selectedOutbound.flight.destination}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedOutbound.flight.airline} {selectedOutbound.flight.flightNumber} • {selectedOutbound.flight.departureTime}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(selectedOutbound.fare.price)}</div>
              <div className="text-sm text-muted-foreground capitalize">{selectedOutbound.fare.type}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Flight Selection Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select Your Return Flight</h2>
          <p className="text-muted-foreground">Choose your return flight to complete your booking</p>
        </div>
        <Button variant="outline" onClick={onGoBack} className="flex items-center">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Change Outbound
        </Button>
      </div>

      {/* Return Flight Results */}
      {children}
    </div>
  );
};

export default ReturnFlightSearch;