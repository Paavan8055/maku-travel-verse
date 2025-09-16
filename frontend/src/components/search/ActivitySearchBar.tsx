import { useState } from "react";
import { Calendar, Users, MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { ActivityParticipantSelector } from "@/components/search/ActivityParticipantSelector";
import { toast } from "sonner";

interface ActivitySearchBarProps {
  destination: string;
  setDestination: (destination: string) => void;
  checkIn: Date | undefined;
  setCheckIn: (date: Date | undefined) => void;
  checkOut: Date | undefined;
  setCheckOut: (date: Date | undefined) => void;
  adults: number;
  setAdults: (adults: number) => void;
  children: number;
  setChildren: (children: number) => void;
  onSearch: () => void;
  className?: string;
}

export const ActivitySearchBar = ({
  destination,
  setDestination,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  adults,
  setAdults,
  children,
  setChildren,
  onSearch,
  className = ""
}: ActivitySearchBarProps) => {
  const [showFlexibleDates, setShowFlexibleDates] = useState(false);

  const handleFillDemoData = () => {
    // Production app - no demo data
    setDestination("Sydney, Australia");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    setCheckIn(tomorrow);
    setAdults(2);
    setChildren(0);
    toast.success("Sample search criteria applied!");
  };

  const isValid = destination && checkIn && (adults + children > 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Demo Data Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFillDemoData}
          className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Fill Demo Data
        </Button>
      </div>

      {/* Main Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="relative">
          <DestinationAutocomplete
            value={destination}
            onChange={setDestination}
            onDestinationSelect={(d) => setDestination(d.code ? `${d.city ?? d.name} (${d.code})` : d.name)}
            placeholder="Where to explore?"
            className="search-input"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          {/* Start Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="search-input justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, "MMM dd") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          {/* End Date (Optional) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="search-input justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, "MMM dd") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date < (checkIn || new Date())}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Participants */}
        <ActivityParticipantSelector
          adults={adults}
          children={children}
          onChange={({ adults: a, children: c }) => {
            setAdults(a);
            setChildren(c);
          }}
        />

        {/* Search Button */}
        <Button 
          className="btn-primary h-12"
          onClick={onSearch}
          disabled={!isValid}
        >
          <Search className="mr-2 h-5 w-5" />
          Search
        </Button>
      </div>

      {/* Flexible Dates Toggle */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFlexibleDates(!showFlexibleDates)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showFlexibleDates ? "Exact dates" : "Flexible dates"}
        </Button>
      </div>

      {/* Flexible Dates Options */}
      {showFlexibleDates && (
        <div className="flex justify-center gap-2 flex-wrap">
          {["This weekend", "Next week", "Next month", "This summer"].map((option) => (
            <Button
              key={option}
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => {
                // Handle flexible date selection
                toast.info(`Selected: ${option}`);
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};