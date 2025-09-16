import React, { useState, useEffect } from 'react';
import { Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, addDays, subDays, parseISO } from 'date-fns';

interface DateOption {
  date: string;
  price: number;
  savings: number;
  availability: 'high' | 'medium' | 'low';
}

interface DateFlexibilityMatrixProps {
  currentCheckIn: string;
  currentCheckOut: string;
  currentPrice: number;
  onDateSelect: (checkIn: string, checkOut: string) => void;
  className?: string;
}

export const DateFlexibilityMatrix: React.FC<DateFlexibilityMatrixProps> = ({
  currentCheckIn,
  currentCheckOut,
  currentPrice,
  onDateSelect,
  className = ""
}) => {
  const [flexibleOptions, setFlexibleOptions] = useState<DateOption[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateFlexibleDates = () => {
    const checkInDate = parseISO(currentCheckIn);
    const checkOutDate = parseISO(currentCheckOut);
    const stayDuration = Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const options: DateOption[] = [];

    // Generate ±3 days options around the current check-in date
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue; // Skip current dates
      
      const newCheckIn = addDays(checkInDate, i);
      const newCheckOut = addDays(newCheckIn, stayDuration);
      
      // Skip past dates
      if (newCheckIn < new Date()) continue;
      
      // Simulate pricing variations based on day patterns
      const dayOfWeek = newCheckIn.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
      const isHoliday = false; // Simplified - in real app, check holiday API
      
      let priceMultiplier = 1;
      let availability: 'high' | 'medium' | 'low' = 'high';
      
      if (isWeekend) {
        priceMultiplier = 1.3;
        availability = 'medium';
      } else if (dayOfWeek === 1 || dayOfWeek === 2) { // Monday or Tuesday
        priceMultiplier = 0.8;
        availability = 'high';
      }
      
      // Add seasonal variations
      const month = newCheckIn.getMonth();
      if (month === 11 || month === 0 || month === 1) { // Dec, Jan, Feb (summer in Australia)
        priceMultiplier *= 1.2;
        availability = availability === 'high' ? 'medium' : 'low';
      }
      
      const estimatedPrice = Math.round(currentPrice * priceMultiplier);
      const savings = currentPrice - estimatedPrice;
      
      options.push({
        date: format(newCheckIn, 'yyyy-MM-dd'),
        price: estimatedPrice,
        savings,
        availability
      });
    }
    
    setFlexibleOptions(options.sort((a, b) => b.savings - a.savings));
  };

  useEffect(() => {
    if (currentCheckIn && currentCheckOut && currentPrice > 0) {
      generateFlexibleDates();
    }
  }, [currentCheckIn, currentCheckOut, currentPrice]);

  const getBestSavings = () => {
    return Math.max(...flexibleOptions.map(opt => opt.savings), 0);
  };

  const formatDateRange = (checkIn: string) => {
    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(currentCheckOut);
    const stayDuration = Math.floor((parseISO(currentCheckOut).getTime() - parseISO(currentCheckIn).getTime()) / (1000 * 60 * 60 * 24));
    const newCheckOut = addDays(checkInDate, stayDuration);
    
    return {
      checkIn: format(checkInDate, 'MMM dd'),
      checkOut: format(newCheckOut, 'MMM dd'),
      fullCheckOut: format(newCheckOut, 'yyyy-MM-dd')
    };
  };

  if (flexibleOptions.length === 0) {
    return null;
  }

  const bestSavings = getBestSavings();

  return (
    <Card className={`travel-card ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Flexible Dates
          </div>
          {bestSavings > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Save up to ${bestSavings}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {flexibleOptions.slice(0, isExpanded ? flexibleOptions.length : 3).map((option, index) => {
              const dateRange = formatDateRange(option.date);
              const isCurrentDates = option.date === currentCheckIn;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    isCurrentDates ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => onDateSelect(option.date, dateRange.fullCheckOut)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {dateRange.checkIn} - {dateRange.checkOut}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={option.availability === 'high' ? 'default' : 
                                 option.availability === 'medium' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {option.availability === 'high' ? 'Great availability' :
                           option.availability === 'medium' ? 'Limited rooms' : 'Few rooms left'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">${option.price}</p>
                      {option.savings !== 0 && (
                        <div className="flex items-center text-sm">
                          {option.savings > 0 ? (
                            <>
                              <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                              <span className="text-green-600">-${option.savings}</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3 w-3 text-red-600 mr-1" />
                              <span className="text-red-600">+${Math.abs(option.savings)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {flexibleOptions.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? 'Show Less' : `Show ${flexibleOptions.length - 3} More Options`}
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Prices are estimated and may vary based on actual availability
          </p>
        </div>
      </CardContent>
    </Card>
  );
};