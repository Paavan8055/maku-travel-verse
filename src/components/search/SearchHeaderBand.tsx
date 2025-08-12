import React from "react";
import { CalendarDays, Users2, MapPin } from "lucide-react";

interface SearchHeaderBandProps {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

const SearchHeaderBand: React.FC<SearchHeaderBandProps> = ({ destination, checkIn, checkOut, guests }) => {
  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">{destination || "Anywhere"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-foreground">{checkIn || "—"} – {checkOut || "—"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card">
              <Users2 className="h-4 w-4 text-primary" />
              <span className="text-foreground">{guests} guest{guests === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/" className="text-sm story-link">Modify search</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHeaderBand;
