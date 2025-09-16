import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, MapPin, Plane } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { validateFlightSearch } from '@/utils/inputValidation';
import { useToast } from '@/hooks/use-toast';

interface FlightSearchFormProps {
  onSearch: (criteria: any) => void;
  loading?: boolean;
  initialValues?: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    tripType?: 'oneway' | 'roundtrip';
    travelClass?: string;
  };
}

export const FlightSearchForm: React.FC<FlightSearchFormProps> = ({
  onSearch,
  loading = false,
  initialValues = {}
}) => {
  const { toast } = useToast();
  
  const [searchData, setSearchData] = useState({
    origin: initialValues.origin || '',
    destination: initialValues.destination || '',
    departureDate: initialValues.departureDate || '',
    returnDate: initialValues.returnDate || '',
    passengers: initialValues.passengers || 1,
    tripType: initialValues.tripType || 'roundtrip' as 'oneway' | 'roundtrip',
    travelClass: initialValues.travelClass || 'ECONOMY'
  });

  const [departureCalendarOpen, setDepartureCalendarOpen] = useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate search criteria
    const validation = validateFlightSearch(searchData);
    if (!validation.isValid) {
      toast({
        title: "Invalid Search",
        description: validation.error || 'Invalid search parameters',
        variant: "destructive"
      });
      return;
    }

    onSearch(searchData);
  };

  const swapOriginDestination = () => {
    setSearchData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Search Flights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Type */}
          <div className="flex gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="roundtrip"
                checked={searchData.tripType === 'roundtrip'}
                onChange={(e) => handleInputChange('tripType', e.target.value)}
                className="w-4 h-4"
              />
              Round Trip
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="oneway"
                checked={searchData.tripType === 'oneway'}
                onChange={(e) => handleInputChange('tripType', e.target.value)}
                className="w-4 h-4"
              />
              One Way
            </Label>
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin"
                  placeholder="Origin airport (LAX)"
                  value={searchData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value.toUpperCase())}
                  className="pl-10"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination"
                  placeholder="Destination airport (SYD)"
                  value={searchData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value.toUpperCase())}
                  className="pl-10"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Swap button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={swapOriginDestination}
              className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 bg-background border rounded-full p-2 h-8 w-8"
            >
              ⇄
            </Button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Popover open={departureCalendarOpen} onOpenChange={setDepartureCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !searchData.departureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchData.departureDate ? (
                      formatDate(new Date(searchData.departureDate), "PPP")
                    ) : (
                      "Select departure date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={searchData.departureDate ? new Date(searchData.departureDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange('departureDate', formatDate(date, 'yyyy-MM-dd'));
                        setDepartureCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {searchData.tripType === 'roundtrip' && (
              <div className="space-y-2">
                <Label>Return Date</Label>
                <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !searchData.returnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchData.returnDate ? (
                        formatDate(new Date(searchData.returnDate), "PPP")
                      ) : (
                        "Select return date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={searchData.returnDate ? new Date(searchData.returnDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange('returnDate', formatDate(date, 'yyyy-MM-dd'));
                          setReturnCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => 
                        date < new Date() || 
                        (searchData.departureDate && date <= new Date(searchData.departureDate))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Passengers and Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengers">Passengers</Label>
              <Select value={searchData.passengers.toString()} onValueChange={(value) => handleInputChange('passengers', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select passengers" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Passenger' : 'Passengers'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelClass">Travel Class</Label>
              <Select value={searchData.travelClass} onValueChange={(value) => handleInputChange('travelClass', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECONOMY">Economy</SelectItem>
                  <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="FIRST">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Searching Flights...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Flights
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};