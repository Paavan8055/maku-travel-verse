import React from "react";
import { CalendarDays, Users2, MapPin } from "lucide-react";

interface SearchHeaderBandProps {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  hotelName?: string;
}

const SearchHeaderBand: React.FC<SearchHeaderBandProps> = ({
  destination,
  checkIn,
  checkOut,
  guests,
  hotelName
}) => {
  return (
    <div className="w-full rounded-xl border bg-card text-card-foreground p-4 sm:p-5 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 pr-4 border-r last:border-r-0">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{destination || "Sydney (Default)"}</span>
        {hotelName && (
          <span className="text-sm font-medium text-primary">• {hotelName}</span>
        )}
      </div>
      <div className="flex items-center gap-2 pr-4 border-r last:border-r-0">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm sm:text-base">
          {checkIn && checkOut ? `${checkIn} → ${checkOut}` : "Add dates"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Users2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm sm:text-base">{guests || 2} guests</span>
      </div>
    </div>
  );
};

export default SearchHeaderBand;
