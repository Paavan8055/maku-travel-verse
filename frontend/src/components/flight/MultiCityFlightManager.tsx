import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { Plus, Minus, CalendarIcon, MapPin } from "lucide-react";
import { format as formatDate } from "date-fns";
import { useCurrency } from "@/features/currency/CurrencyProvider";

interface MultiCitySegment {
  origin: string;
  destination: string;
  date: string;
  originInput: string;
  destinationInput: string;
}

interface MultiCitySelection {
  segmentIndex: number;
  flight: any;
  fare: any;
}

interface MultiCityFlightManagerProps {
  segments: MultiCitySegment[];
  selections: MultiCitySelection[];
  onSegmentsChange: (segments: MultiCitySegment[]) => void;
  onSelectionChange: (selections: MultiCitySelection[]) => void;
  children: React.ReactNode;
}

const MultiCityFlightManager: React.FC<MultiCityFlightManagerProps> = ({
  segments,
  selections,
  onSegmentsChange,
  onSelectionChange,
  children
}) => {
  const { formatCurrency } = useCurrency();
  const [activeSegment, setActiveSegment] = useState(0);

  const addSegment = () => {
    if (segments.length < 6) {
      const lastSegment = segments[segments.length - 1];
      const newSegment: MultiCitySegment = {
        origin: lastSegment.destination,
        destination: "",
        date: formatDate(new Date(Date.now() + segments.length * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        originInput: lastSegment.destinationInput,
        destinationInput: ""
      };
      onSegmentsChange([...segments, newSegment]);
    }
  };

  const removeSegment = (index: number) => {
    if (segments.length > 2) {
      const newSegments = segments.filter((_, i) => i !== index);
      onSegmentsChange(newSegments);
      
      // Remove any selections for this segment
      const newSelections = selections.filter(s => s.segmentIndex !== index);
      onSelectionChange(newSelections);
    }
  };

  const updateSegment = (index: number, updates: Partial<MultiCitySegment>) => {
    const newSegments = segments.map((segment, i) => 
      i === index ? { ...segment, ...updates } : segment
    );
    onSegmentsChange(newSegments);
  };

  const handleOriginSelect = (index: number, destination: any) => {
    updateSegment(index, {
      origin: destination.code || destination.id,
      originInput: destination.code ? `${destination.city} (${destination.code})` : destination.name
    });
  };

  const handleDestinationSelect = (index: number, destination: any) => {
    updateSegment(index, {
      destination: destination.code || destination.id,
      destinationInput: destination.code ? `${destination.city} (${destination.code})` : destination.name
    });
  };

  const handleDateSelect = (index: number, date: Date | undefined) => {
    if (date) {
      updateSegment(index, {
        date: formatDate(date, "yyyy-MM-dd")
      });
    }
  };

  const getTotalPrice = () => {
    return selections.reduce((total, selection) => {
      return total + (selection.fare?.price || 0);
    }, 0);
  };

  const getSelectedFlight = (segmentIndex: number) => {
    return selections.find(s => s.segmentIndex === segmentIndex);
  };

  return (
    <div className="space-y-6">
      {/* Multi-city Segments Configuration */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Multi-city Itinerary</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addSegment}
                disabled={segments.length >= 6}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add City
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {segments.map((segment, index) => {
              const isSelected = getSelectedFlight(index);
              
              return (
                <div key={index} className="border border-border rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={isSelected ? "default" : "secondary"}>
                      Flight {index + 1}
                      {isSelected && " ✓"}
                    </Badge>
                    {segments.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSegment(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">From</label>
                      <DestinationAutocomplete
                        value={segment.originInput}
                        onChange={(value) => updateSegment(index, { originInput: value })}
                        onDestinationSelect={(dest) => handleOriginSelect(index, dest)}
                        placeholder="From where?"
                        searchType="airport"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">To</label>
                      <DestinationAutocomplete
                        value={segment.destinationInput}
                        onChange={(value) => updateSegment(index, { destinationInput: value })}
                        onDestinationSelect={(dest) => handleDestinationSelect(index, dest)}
                        placeholder="Where to?"
                        searchType="airport"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(new Date(segment.date), "MMM dd")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={new Date(segment.date)}
                            onSelect={(date) => handleDateSelect(index, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="font-medium">
                            {isSelected.flight.airline} {isSelected.flight.flightNumber}
                          </div>
                          <div className="text-muted-foreground">
                            {isSelected.flight.departureTime} - {isSelected.flight.arrivalTime}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(isSelected.fare.price)}</div>
                          <div className="text-sm text-muted-foreground capitalize">{isSelected.fare.type}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSegment === index && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSegment(-1)}
                      className="mt-3"
                    >
                      Cancel Selection
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {selections.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total for All Flights:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(getTotalPrice())}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Segment Flight Search */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Select Flight {activeSegment + 1}: {segments[activeSegment]?.originInput} → {segments[activeSegment]?.destinationInput}
        </h3>
        {children}
      </div>
    </div>
  );
};

export default MultiCityFlightManager;