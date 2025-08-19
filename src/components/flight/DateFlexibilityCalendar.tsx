
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPricesForDates = async () => {
      setLoading(true);
      const pricesData: DatePrice[] = [];
      
      // Generate dates for the current view (14 days)
      const dates = Array.from({ length: 14 }, (_, i) => addDays(currentWeekStart, i));
      
      // Make flight searches for each date
      const searchPromises = dates.map(async (date) => {
        try {
          const { data, error } = await supabase.functions.invoke('amadeus-flight-search', {
            body: {
              origin,
              destination,
              departureDate: format(date, 'yyyy-MM-dd'),
              adults: passengers,
              children: 0,
              infants: 0,
              travelClass: cabin.toUpperCase(),
              nonStop: false,
              maxPrice: 5000,
              currency: 'USD'
            }
          });

          if (error) {
            console.error(`Flight search error for ${format(date, 'yyyy-MM-dd')}:`, error);
            return {
              date,
              price: 0,
              flightCount: 0,
              isLowest: false
            };
          }

          if (data?.flights && data.flights.length > 0) {
            // Get the lowest price from available flights
            const lowestPrice = Math.min(...data.flights.map((f: any) => f.price?.amount || 0));
            return {
              date,
              price: Math.round(lowestPrice),
              flightCount: data.flights.length,
              isLowest: false
            };
          } else {
            // Fallback if no flights found
            return {
              date,
              price: 0,
              flightCount: 0,
              isLowest: false
            };
          }
        } catch (error) {
          console.error(`Search failed for ${format(date, 'yyyy-MM-dd')}:`, error);
          return {
            date,
            price: 0,
            flightCount: 0,
            isLowest: false
          };
        }
      });

      try {
        const results = await Promise.all(searchPromises);
        
        // Filter out results with no flights and mark the lowest prices
        const validResults = results.filter(r => r.price > 0);
        if (validResults.length > 0) {
          const lowestPrice = Math.min(...validResults.map(r => r.price));
          validResults.forEach(r => {
            if (r.price === lowestPrice) {
              r.isLowest = true;
            }
          });
        }

        // Include all results (even those with no flights) to maintain date continuity
        setWeekPrices(results);
      } catch (error) {
        console.error('Error fetching flight prices:', error);
        // Fallback to empty data
        setWeekPrices(dates.map(date => ({
          date,
          price: 0,
          flightCount: 0,
          isLowest: false
        })));
      }
      
      setLoading(false);
    };

    if (origin && destination) {
      fetchPricesForDates();
    }
  }, [currentWeekStart, origin, destination, passengers, cabin]);

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
                      {isLowest && !isSelected && (
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
