import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface DatePrice {
  date: Date;
  price: number;
  isLowest?: boolean;
  departureFlight?: any;
  returnFlight?: any;
}

interface DateFlexibilityCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date, flights?: { departure?: any; return?: any }) => void;
  origin: string;
  destination: string;
  tripType: string;
  className?: string;
}

export const DateFlexibilityCalendar = ({
  selectedDate,
  onDateSelect,
  origin,
  destination,
  tripType,
  className
}: DateFlexibilityCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    selectedDate ? subDays(selectedDate, 3) : new Date()
  );

  // Mock price data - in production, this would come from Amadeus API
  const generateWeekPrices = (startDate: Date): DatePrice[] => {
    const prices: DatePrice[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const basePrice = 150 + Math.random() * 200;
      const dayOfWeek = date.getDay();
      // Weekend surge pricing
      const weekendMultiplier = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.3 : 1;
      const price = Math.round(basePrice * weekendMultiplier);
      
      prices.push({
        date,
        price,
        isLowest: Math.random() < 0.15, // 15% chance of being marked as lowest
      });
    }
    return prices;
  };

  const weekPrices = generateWeekPrices(currentWeekStart);
  const lowestPrice = Math.min(...weekPrices.map(p => p.price));

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subDays(currentWeekStart, 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleDateClick = (datePrice: DatePrice) => {
    onDateSelect(datePrice.date, {
      departure: datePrice.departureFlight,
      return: datePrice.returnFlight
    });
  };

  const getPriceColor = (price: number, isLowest: boolean) => {
    if (isLowest) return "text-green-600 bg-green-50";
    if (price === lowestPrice) return "text-green-600 bg-green-50";
    if (price < lowestPrice * 1.1) return "text-blue-600 bg-blue-50";
    if (price > lowestPrice * 1.3) return "text-orange-600 bg-orange-50";
    return "text-foreground bg-background";
  };

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Choose {tripType === "roundtrip" ? "departure" : ""} date
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekPrices.map((datePrice, index) => {
            const isSelected = selectedDate && isSameDay(datePrice.date, selectedDate);
            const priceColorClass = getPriceColor(datePrice.price, datePrice.isLowest || false);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(datePrice)}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-md text-center relative",
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  priceColorClass
                )}
              >
                <div className="text-xs text-muted-foreground font-medium">
                  {format(datePrice.date, "EEE")}
                </div>
                <div className="text-lg font-bold mt-1">
                  {format(datePrice.date, "dd")}
                </div>
                <div className="text-sm font-semibold mt-1">
                  ${datePrice.price}
                </div>
                {datePrice.isLowest && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                      <TrendingDown className="h-3 w-3" />
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span>Best price</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>Good deal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
            <span>Higher price</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};