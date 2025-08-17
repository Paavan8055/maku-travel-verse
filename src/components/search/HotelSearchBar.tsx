import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";

import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { RoomGuestSelector } from "@/components/search/RoomGuestSelector";
import { Button } from "@/components/ui/button";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface HotelSearchBarProps {
  className?: string;
}

const toYMD = (d: Date) => format(d, "yyyy-MM-dd");

const parseYMD = (s?: string | null) => {
  if (!s) return undefined;
  const parts = s.split("-");
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return isNaN(dt.getTime()) ? undefined : dt;
};

const HotelSearchBar: React.FC<HotelSearchBarProps> = ({ className }) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Destination
  const [destination, setDestination] = useState<string>(params.get("destination") || "");

  // Date range
  const initialFrom = parseYMD(params.get("checkIn"));
  const initialTo = parseYMD(params.get("checkOut"));
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: initialFrom, to: initialTo });

  // Rooms & Guests (default 1 room, 2 adults)
  const initialGuests = Math.max(1, parseInt(params.get("guests") || "2"));
  const [rooms, setRooms] = useState([{ adults: Math.min(initialGuests, 8), children: [] as number[] }]);

  useEffect(() => {
    // If guests > 8, just keep a single room and cap adults; simple MVP
    const g = Math.max(1, parseInt(params.get("guests") || "2"));
    setRooms([{ adults: Math.min(g, 8), children: [] }]);
    setDestination(params.get("destination") || "");
    setDateRange({ from: parseYMD(params.get("checkIn")), to: parseYMD(params.get("checkOut")) });
  }, [params]);

  const totalGuests = useMemo(() => rooms.reduce((t, r) => t + r.adults + r.children.length, 0), [rooms]);

  const canSearch = destination.trim().length > 0 && !!dateRange?.from && !!dateRange?.to;

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!canSearch) return;

    const qs = new URLSearchParams();
    qs.set("destination", destination.trim());
    if (dateRange?.from) qs.set("checkIn", toYMD(dateRange.from));
    if (dateRange?.to) qs.set("checkOut", toYMD(dateRange.to));
    qs.set("guests", String(totalGuests));
    qs.set("rooms", String(rooms.length));
    qs.set("searched", "true"); // Add flag to indicate user searched

    navigate(`/search/hotels?${qs.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} aria-label="Hotel search">
      <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Destination */}
          <div className="md:col-span-1">
            <DestinationAutocomplete
              value={destination}
              onChange={setDestination}
              onDestinationSelect={(d) => setDestination(d.name)}
              placeholder="Search places or properties"
            />
          </div>

          {/* Dates */}
          <div className="md:col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && !dateRange?.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span>
                        {format(dateRange.from, "LLL dd, yyyy")} – {format(dateRange.to, "LLL dd, yyyy")}
                      </span>
                    ) : (
                      <span>{format(dateRange.from, "LLL dd, yyyy")}</span>
                    )
                  ) : (
                    <span>Add dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className="md:col-span-1">
            <RoomGuestSelector rooms={rooms} onRoomsChange={setRooms} />
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <Button type="submit" disabled={!canSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search Hotels
          </Button>
        </div>
      </div>
    </form>
  );
};

export default HotelSearchBar;
