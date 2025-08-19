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
    <div className="bg-card border-b sticky top-16 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Choose departure date</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Air India style horizontal scrollable date bar */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {weekPrices.map((datePrice, index) => {
            const isSelected = selectedDate && isSameDay(datePrice.date, selectedDate);
            const isLowest = datePrice.price === lowestPrice;
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(datePrice)}
                className={`
                  flex-shrink-0 p-3 rounded-lg border-2 text-center transition-all min-w-[90px]
                  ${isSelected 
                    ? "border-primary bg-primary text-primary-foreground shadow-card" 
                    : "border-border hover:border-primary/50 hover:bg-muted"
                  }
                `}
              >
                <div className={`text-sm font-medium ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {format(datePrice.date, "EEE")}
                </div>
                <div className={`text-lg font-bold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                  {format(datePrice.date, "dd MMM")}
                </div>
                <div className={`text-sm font-semibold mt-1 ${isSelected ? "text-primary-foreground" : isLowest ? "text-travel-forest" : "text-foreground"}`}>
                  {formatCurrency(datePrice.price)}
                </div>
                {isLowest && !isSelected && (
                  <div className="text-xs text-travel-forest font-medium mt-1">
                    Lowest
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};