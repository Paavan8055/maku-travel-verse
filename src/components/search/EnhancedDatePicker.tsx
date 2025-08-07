// Enhanced date picker with price calendar and flexible dates
import { useState } from "react";
import { Calendar, ChevronDown, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface PriceCalendarDay {
  date: Date;
  price: number;
  isLowest?: boolean;
}

interface EnhancedDatePickerProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
  className?: string;
  destination?: string;
}

export const EnhancedDatePicker = ({
  selected,
  onSelect,
  placeholder,
  className,
  destination
}: EnhancedDatePickerProps) => {
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Mock price data - In production, this would come from your API
  const generatePriceData = (): PriceCalendarDay[] => {
    const days: PriceCalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      const basePrice = 150 + Math.random() * 200;
      const dayOfWeek = date.getDay();
      // Weekend surge pricing
      const weekendMultiplier = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.3 : 1;
      const price = Math.round(basePrice * weekendMultiplier);
      
      days.push({
        date,
        price,
        isLowest: Math.random() < 0.1 // 10% chance of being marked as lowest
      });
    }
    
    return days;
  };

  const priceData = generatePriceData();

  const getPriceForDate = (date: Date) => {
    return priceData.find(day => isSameDay(day.date, date));
  };

  const getLowestPriceDates = () => {
    const sorted = [...priceData].sort((a, b) => a.price - b.price);
    return sorted.slice(0, 5);
  };

  const handleDateSelect = (date: Date | undefined) => {
    onSelect(date);
    setIsOpen(false);
  };

  const dayClassName = (date: Date) => {
    const priceInfo = getPriceForDate(date);
    if (!priceInfo) return "";
    
    if (priceInfo.isLowest) {
      return "bg-green-100 border-green-500 text-green-800";
    }
    
    if (priceInfo.price < 180) {
      return "bg-blue-50 border-blue-200";
    }
    
    return "";
  };

  const renderDayContent = (date: Date) => {
    const priceInfo = getPriceForDate(date);
    if (!priceInfo) return null;

    return (
      <div className="text-center">
        <div className="text-sm font-medium">{date.getDate()}</div>
        <div className="text-xs text-muted-foreground">${priceInfo.price}</div>
        {priceInfo.isLowest && (
          <div className="flex justify-center">
            <TrendingDown className="h-3 w-3 text-green-600" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selected ? format(selected, "MMM dd") : placeholder}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Price Calendar</TabsTrigger>
            <TabsTrigger value="flexible">Flexible Dates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="p-0">
            <div className="p-3 border-b">
              <div className="flex items-center space-x-2">
                <Switch
                  id="flexible-dates"
                  checked={flexibleDates}
                  onCheckedChange={setFlexibleDates}
                />
                <Label htmlFor="flexible-dates" className="text-sm">
                  ±3 days flexibility
                </Label>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                  <span>Lowest price</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                  <span>Good deal</span>
                </div>
              </div>
            </div>
            
            <CalendarComponent
              mode="single"
              selected={selected}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
              disabled={(date) => date < new Date()}
              modifiers={{
                lowest: (date) => getPriceForDate(date)?.isLowest || false,
                goodDeal: (date) => {
                  const price = getPriceForDate(date);
                  return price ? price.price < 180 : false;
                }
              }}
              modifiersClassNames={{
                lowest: dayClassName(new Date()),
                goodDeal: "bg-blue-50 border-blue-200"
              }}
              components={{
                DayContent: ({ date }) => renderDayContent(date)
              }}
            />
          </TabsContent>
          
          <TabsContent value="flexible" className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Lowest prices in the next 2 months</h4>
              {getLowestPriceDates().map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day.date)}
                  className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{format(day.date, "EEEE, MMM dd")}</div>
                      <div className="text-sm text-muted-foreground">
                        {destination && `Hotels in ${destination}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${day.price}</div>
                      <div className="text-xs text-muted-foreground">avg/night</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};