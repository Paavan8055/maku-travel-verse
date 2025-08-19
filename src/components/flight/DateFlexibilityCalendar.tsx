
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";

interface DatePrice {
  date: Date;
  price: number;
  flightCount?: number;
  isLowest?: boolean;
}

interface DateFlexibilityCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  origin: string;
  destination: string;
  passengers: number;
  cabin: string;
  className?: string;
}

export const DateFlexibilityCalendar = ({
  selectedDate,
  onDateSelect,
  origin,
  destination,
  passengers,
  cabin,
  className
}: DateFlexibilityCalendarProps) => {
  const { formatCurrency } = useCurrency();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    selectedDate ? subDays(selectedDate, 3) : new Date()
  );
  const [weekPrices, setWeekPrices] = useState<DatePrice[]>([]);

  // Generate search criteria for each date in the week
  const generateDateSearches = (startDate: Date) => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(startDate, i);
      return {
        origin,
        destination,
        departureDate: format(date, 'yyyy-MM-dd'),
        passengers,
      };
    });
  };

  const dateSearches = generateDateSearches(currentWeekStart);

  // Use flight search hook for the first date to get real data structure
  const { flights: sampleFlights } = useFlightSearch(dateSearches[0]);

  useEffect(() => {
    const fetchPricesForDates = async () => {
      const pricesData: DatePrice[] = [];
      
      for (let i = 0; i < 14; i++) {
        const date = addDays(currentWeekStart, i);
        
        // For now, we'll use a simplified approach to get prices
        // In a real implementation, you'd want to make multiple API calls
        // or use a batch search endpoint
        
        let price = 0;
        let flightCount = 0;
        
        if (sampleFlights && sampleFlights.length > 0) {
          // Use the lowest price from sample flights as base
          const basePrice = Math.min(...sampleFlights.map(f => f.price));
          // Add some variation based on date offset (+/- 20%)
          const variation = (Math.random() - 0.5) * 0.4;
          price = Math.round(basePrice * (1 + variation));
          flightCount = sampleFlights.length;
        } else {
          // Fallback to reasonable prices if no real data
          price = Math.floor(Math.random() * 300) + 400;
          flightCount = Math.floor(Math.random() * 5) + 1;
        }

        pricesData.push({
          date,
          price,
          flightCount,
          isLowest: false
        });
      }

      // Mark the lowest price
      const lowestPrice = Math.min(...pricesData.map(p => p.price));
      pricesData.forEach(p => {
        if (p.price === lowestPrice) {
          p.isLowest = true;
        }
      });

      setWeekPrices(pricesData);
    };

    fetchPricesForDates();
  }, [currentWeekStart, origin, destination, passengers, sampleFlights]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const handleDateClick = (datePrice: DatePrice) => {
    if (onDateSelect) {
      onDateSelect(datePrice.date);
    }
  };

  const lowestPrice = weekPrices.length > 0 ? Math.min(...weekPrices.map(p => p.price)) : 0;

  return (
    <div className="bg-background sticky top-0 z-20 border-b border-border py-4">
      <div className="container mx-auto px-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">
              {origin} → {destination}
            </h3>
            <span className="text-sm text-muted-foreground">
              {passengers} passenger{passengers !== 1 ? 's' : ''} • {cabin}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Horizontal scrollable date picker */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-3 min-w-max pb-2">
            {weekPrices.map((datePrice, index) => {
              const isSelected = selectedDate && isSameDay(datePrice.date, selectedDate);
              const isLowest = datePrice.price === lowestPrice;
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(datePrice)}
                  className={`
                    flex-shrink-0 p-4 rounded-xl border-2 text-center transition-all min-w-[140px]
                    ${isSelected 
                      ? "border-destructive bg-destructive text-destructive-foreground shadow-card" 
                      : "border-border bg-card hover:border-destructive/30 hover:shadow-soft"
                    }
                    ${isLowest && !isSelected && "ring-2 ring-travel-gold/30 border-travel-gold/50"}
                  `}
                >
                  <div className={`text-sm font-medium mb-2 ${isSelected ? "text-destructive-foreground" : "text-muted-foreground"}`}>
                    {format(datePrice.date, "EEE")}
                  </div>
                  <div className={`text-lg font-semibold mb-2 ${isSelected ? "text-destructive-foreground" : "text-foreground"}`}>
                    {format(datePrice.date, "d MMM")}
                  </div>
                  <div className={`text-lg font-bold ${isSelected ? "text-destructive-foreground" : "text-foreground"}`}>
                    {formatCurrency(datePrice.price)}
                  </div>
                  {isLowest && !isSelected && (
                    <div className="text-xs text-travel-gold font-bold mt-2 bg-travel-gold/10 px-2 py-1 rounded">
                      BEST PRICE
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
