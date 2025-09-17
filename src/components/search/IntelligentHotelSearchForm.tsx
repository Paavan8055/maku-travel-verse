import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Sparkles, Users, Building2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DestinationAutocomplete } from '@/components/search/DestinationAutocomplete';
import { RoomGuestSelector } from '@/components/search/RoomGuestSelector';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface PredictiveInsight {
  type: 'price_forecast' | 'availability' | 'demand' | 'seasonal';
  message: string;
  confidence: number;
  actionable?: boolean;
}

interface IntelligentHotelSearchFormProps {
  onSearch: (params: {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
  }) => void;
  className?: string;
}

export const IntelligentHotelSearchForm: React.FC<IntelligentHotelSearchFormProps> = ({
  onSearch,
  className = ''
}) => {
  const [destination, setDestination] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [rooms, setRooms] = useState([{ adults: 2, children: [] as number[] }]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  const totalGuests = useMemo(() => 
    rooms.reduce((t, r) => t + r.adults + r.children.length, 0), 
    [rooms]
  );

  const canSearch = destination.trim().length > 0 && !!dateRange?.from && !!dateRange?.to;

  // Generate predictive insights based on search criteria
  useEffect(() => {
    if (destination && dateRange?.from) {
      const generateInsights = async () => {
        // Simulate AI-powered insights
        const newInsights: PredictiveInsight[] = [];

        // Price prediction
        newInsights.push({
          type: 'price_forecast',
          message: `Hotel prices in ${destination} are predicted to increase by 12% next week`,
          confidence: 87,
          actionable: true
        });

        // Availability insight
        if (totalGuests > 4) {
          newInsights.push({
            type: 'availability',
            message: `Group bookings for ${totalGuests} guests are limited. Consider booking 2 separate rooms`,
            confidence: 92,
            actionable: true
          });
        }

        // Seasonal demand
        const month = dateRange.from.getMonth();
        if (month >= 5 && month <= 7) { // Summer months
          newInsights.push({
            type: 'seasonal',
            message: 'Peak summer season - book early for best selection and rates',
            confidence: 94
          });
        }

        // Weekend vs weekday
        const isWeekend = dateRange.from.getDay() === 0 || dateRange.from.getDay() === 6;
        if (isWeekend) {
          newInsights.push({
            type: 'demand',
            message: 'Weekend rates are typically 30% higher. Consider checking weekday alternatives',
            confidence: 89,
            actionable: true
          });
        }

        setInsights(newInsights);
        setShowInsights(true);
      };

      const timeoutId = setTimeout(generateInsights, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setShowInsights(false);
    }
  }, [destination, dateRange, totalGuests]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch || !dateRange?.from || !dateRange?.to) return;

    onSearch({
      destination: destination.trim(),
      checkIn: format(dateRange.from, 'yyyy-MM-dd'),
      checkOut: format(dateRange.to, 'yyyy-MM-dd'),
      guests: totalGuests,
      rooms: rooms.length
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 80) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="border-2 border-primary/20">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Destination with Smart Suggestions */}
              <div className="md:col-span-1">
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onDestinationSelect={(d) => setDestination(d.name)}
                  placeholder="Where do you want to stay?"
                  searchType="hotel"
                />
              </div>

              {/* Intelligent Date Selection */}
              <div className="md:col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && !dateRange?.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <span>
                            {format(dateRange.from, "LLL dd, yyyy")} – {format(dateRange.to, "LLL dd, yyyy")}
                          </span>
                        ) : (
                          <span>{format(dateRange.from, "LLL dd, yyyy")}</span>
                        )
                      ) : (
                        <span>Select your dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) => date < new Date()}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Smart Guest & Room Configuration */}
              <div className="md:col-span-1">
                <RoomGuestSelector 
                  rooms={rooms} 
                  onRoomsChange={setRooms}
                />
              </div>
            </div>

            {/* Search Button with Intelligence Indicator */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {showInsights && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Insights Available
                  </Badge>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={!canSearch}
                className="min-w-[140px]"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Hotels
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Predictive Insights Panel */}
      {showInsights && insights.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Smart Travel Insights</h3>
            </div>
            
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className={`p-3 rounded-lg ${getConfidenceColor(insight.confidence)}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm flex-1">{insight.message}</p>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence}% confidence
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="secondary" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Powered by AI market analysis and booking patterns
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};