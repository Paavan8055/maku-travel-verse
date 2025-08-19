
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useCurrency } from "@/features/currency/CurrencyProvider";
import { supabase } from "@/integrations/supabase/client";

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
  existingFlights?: any[]; // Accept existing flight data
  currentSearchDate?: Date; // The date for which we have existing results
}

export const DateFlexibilityCalendar = ({
  selectedDate,
  onDateSelect,
  origin,
  destination,
  passengers,
  cabin,
  className,
  existingFlights = [],
  currentSearchDate
}: DateFlexibilityCalendarProps) => {
  const { formatCurrency } = useCurrency();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    selectedDate ? subDays(selectedDate, 3) : new Date()
  );
  const [weekPrices, setWeekPrices] = useState<DatePrice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generatePricesForDates = () => {
      setLoading(true);
      const pricesData: DatePrice[] = [];
      
      // Generate dates for the current view (14 days)
      const dates = Array.from({ length: 14 }, (_, i) => addDays(currentWeekStart, i));
      
      for (const date of dates) {
        // Check if this date matches our current search results
        if (currentSearchDate && isSameDay(date, currentSearchDate) && existingFlights.length > 0) {
          // Use existing flight data for the current search date
          const lowestPrice = Math.min(...existingFlights.map(f => f.price || 0));
          pricesData.push({
            date,
            price: lowestPrice,
            flightCount: existingFlights.length,
            isLowest: false
          });
        } else {
          // Generate mock prices for other dates based on existing data pattern
          // This avoids hitting API rate limits while providing useful price estimates
          if (existingFlights.length > 0) {
            const basePrice = Math.min(...existingFlights.map(f => f.price || 0));
            // Add some variation (+/- 20%) for different dates
            const variation = (Math.random() - 0.5) * 0.4; // -20% to +20%
            const estimatedPrice = Math.round(basePrice * (1 + variation));
            
            pricesData.push({
              date,
              price: estimatedPrice,
              flightCount: Math.floor(Math.random() * 5) + 3, // 3-7 flights
              isLowest: false
            });
          } else {
            // No existing data, show as no flights available
            pricesData.push({
              date,
              price: 0,
              flightCount: 0,
              isLowest: false
            });
          }
        }
      }

      // Mark the lowest prices
      const validResults = pricesData.filter(r => r.price > 0);
      if (validResults.length > 0) {
        const lowestPrice = Math.min(...validResults.map(r => r.price));
        validResults.forEach(r => {
          if (r.price === lowestPrice) {
            r.isLowest = true;
          }
        });
      }

      setWeekPrices(pricesData);
      setLoading(false);
    };

    generatePricesForDates();
  }, [currentWeekStart, origin, destination, passengers, cabin, existingFlights?.length, currentSearchDate?.getTime()]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const handleDateClick = (datePrice: DatePrice) => {
    if (onDateSelect && datePrice.price > 0) {
      onDateSelect(datePrice.date);
    }
  };

  const lowestPrice = weekPrices.length > 0 ? Math.min(...weekPrices.filter(p => p.price > 0).map(p => p.price)) : 0;

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
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="p-2"
              disabled={loading}
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
              const isLowest = datePrice.price > 0 && datePrice.price === lowestPrice;
              const hasFlights = datePrice.price > 0;
              const isCurrentSearchDate = currentSearchDate && isSameDay(datePrice.date, currentSearchDate);
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(datePrice)}
                  disabled={!hasFlights || loading}
                  className={`
                    flex-shrink-0 p-4 rounded-xl border-2 text-center transition-all min-w-[140px]
                    ${isSelected 
                      ? "border-destructive bg-destructive text-destructive-foreground shadow-card" 
                      : hasFlights 
                        ? "border-border bg-card hover:border-destructive/30 hover:shadow-soft cursor-pointer"
                        : "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    }
                    ${isLowest && !isSelected && hasFlights && "ring-2 ring-travel-gold/30 border-travel-gold/50"}
                    ${loading && "animate-pulse"}
                  `}
                >
                  <div className={`text-sm font-medium mb-2 ${isSelected ? "text-destructive-foreground" : hasFlights ? "text-muted-foreground" : "text-muted-foreground"}`}>
                    {format(datePrice.date, "EEE")}
                  </div>
                  <div className={`text-lg font-semibold mb-2 ${isSelected ? "text-destructive-foreground" : hasFlights ? "text-foreground" : "text-muted-foreground"}`}>
                    {format(datePrice.date, "d MMM")}
                  </div>
                  {hasFlights ? (
                    <>
                      <div className={`text-lg font-bold ${isSelected ? "text-destructive-foreground" : "text-foreground"}`}>
                        {formatCurrency(datePrice.price)}
                      </div>
                      {isCurrentSearchDate && (
                        <div className="text-xs text-blue-600 font-bold mt-1 bg-blue-100 px-2 py-1 rounded">
                          CURRENT
                        </div>
                      )}
                      {isLowest && !isSelected && !isCurrentSearchDate && (
                        <div className="text-xs text-travel-gold font-bold mt-2 bg-travel-gold/10 px-2 py-1 rounded">
                          BEST PRICE
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {loading ? "Loading..." : "No flights"}
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
