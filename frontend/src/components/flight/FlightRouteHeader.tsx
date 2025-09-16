import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users, Edit2 } from "lucide-react";
import { format } from "date-fns";

interface FlightRouteHeaderProps {
  origin: string;
  destination: string;
  departureDate?: Date;
  returnDate?: Date;
  passengers: number;
  tripType: string;
  onModify?: () => void;
}

export const FlightRouteHeader = ({
  origin,
  destination,
  departureDate,
  returnDate,
  passengers,
  tripType,
  onModify
}: FlightRouteHeaderProps) => {
  return (
    <Card className="mb-6">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg">{origin}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-lg">{destination}</span>
            </div>
          </div>
          
          {departureDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {format(departureDate, "EEE, MMM dd")}
                {tripType === "roundtrip" && returnDate && (
                  <> - {format(returnDate, "EEE, MMM dd")}</>
                )}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{passengers} passenger{passengers > 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {onModify && (
          <Button variant="outline" onClick={onModify} size="sm">
            <Edit2 className="h-4 w-4 mr-2" />
            Modify Search
          </Button>
        )}
      </div>
    </Card>
  );
};