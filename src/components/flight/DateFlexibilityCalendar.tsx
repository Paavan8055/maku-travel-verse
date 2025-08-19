import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useCurrency } from "@/features/currency/CurrencyProvider";

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

  // Generate price data for horizontal scrollable date bar
  const generateWeekPrices = (startDate: Date): DatePrice[] => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(startDate, i);
      const basePrice = Math.floor(Math.random() * 300) + 200;
      return {
        date,
        price: basePrice,
        flightCount: Math.floor(Math.random() * 5) + 1,
        isLowest: Math.random() > 0.8
      };
    });
  };

  const weekPrices = generateWeekPrices(currentWeekStart);
  const lowestPrice = Math.min(...weekPrices.map(p => p.price));

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

        {/* Horizontal scrollable date picker - Air India style */}
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