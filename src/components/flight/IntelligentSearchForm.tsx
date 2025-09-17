import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  ArrowLeftRight, 
  Plane,
  Clock,
  TrendingDown,
  TrendingUp,
  Zap,
  ChevronDown,
  X
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isWeekend } from "date-fns";
import { cn } from "@/lib/utils";

import { AIRPORTS, type Airport } from '@/data/airports';

// Use the comprehensive airport database
const AIRPORT_DATA = AIRPORTS;

interface PriceCalendarDay {
  date: Date;
  price?: number;
  trend?: 'up' | 'down' | 'stable';
  availability?: 'high' | 'medium' | 'low';
  isWeekend?: boolean;
}

interface IntelligentSearchFormProps {
  onSearch?: (searchData: any) => void;
  className?: string;
}

const SmartAirportSearch = ({ 
  value, 
  onChange, 
  placeholder = "Search airports...", 
  excludeAirport 
}: {
  value: string;
  onChange: (airport: Airport) => void;
  placeholder?: string;
  excludeAirport?: string;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced fuzzy search with comprehensive matching
  const filteredAirports = useMemo(() => {
    if (!searchTerm.trim()) {
      // Show popular airports when no search term
      return AIRPORT_DATA.filter(airport => 
        airport.iata && airport.iata !== excludeAirport && 
        ['SYD', 'MEL', 'BNE', 'PER', 'LAX', 'JFK', 'LHR', 'NRT'].includes(airport.iata)
      ).slice(0, 8);
    }
    
    const term = searchTerm.toLowerCase().trim();
    const results = AIRPORT_DATA
      .filter(airport => airport.iata && airport.iata !== excludeAirport)
      .map(airport => {
        let score = 0;
        const code = (airport.iata || '').toLowerCase();
        const city = (airport.city || '').toLowerCase();
        const name = (airport.name || '').toLowerCase();
        const country = (airport.country || '').toLowerCase();
        
        // Exact matches get highest priority
        if (code === term) score += 1000;
        else if (city === term) score += 900;
        else if (code.startsWith(term)) score += 800;
        else if (city.startsWith(term)) score += 700;
        
        // Partial matches
        if (code.includes(term)) score += 600;
        if (city.includes(term)) score += 500;
        if (name.includes(term)) score += 300;
        if (country.includes(term)) score += 200;
        
        // Fuzzy matching for typos (simple algorithm)
        const distance = getLevenshteinDistance(term, code) + getLevenshteinDistance(term, city);
        if (distance <= 2 && term.length > 2) score += 100;
        
        return { airport, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ airport }) => airport);
    
    return results;
  }, [searchTerm, excludeAirport]);

  // Simple Levenshtein distance for fuzzy matching
  const getLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredAirports.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const airport = filteredAirports[selectedIndex];
                  onChange(airport);
      setSearchTerm(`${airport.city} (${airport.iata})`);
                  setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={searchTerm || value}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsOpen(false), 300);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-8"
            autoComplete="off"
            spellCheck={false}
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-2" align="start">
        <div className="space-y-1">
          {filteredAirports.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No airports found. Try searching by city name, airport code, or country.
            </div>
          ) : (
            filteredAirports.map((airport, index) => (
              <Button
                key={airport.iata}
                variant={index === selectedIndex ? "secondary" : "ghost"}
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => {
                  onChange(airport);
                  setSearchTerm(`${airport.city} (${airport.iata})`);
                  setIsOpen(false);
                  // Prevent immediate reopening
                  setTimeout(() => setIsOpen(false), 100);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 rounded p-1">
                    <Plane className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{airport.iata}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{airport.city}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {airport.name}, {airport.country}
                    </div>
                  </div>
                  {airport.timezone && (
                    <Badge variant="outline" className="text-xs">
                      {airport.timezone}
                    </Badge>
                  )}
                </div>
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const IntelligentDatePicker = ({ 
  selected, 
  onSelect, 
  placeholder = "Select date",
  minDate = new Date(),
  showPriceCalendar = false 
}: {
  selected?: Date;
  onSelect: (date: Date) => void;
  placeholder?: string;
  minDate?: Date;
  showPriceCalendar?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generate mock price calendar data
  const priceCalendarData = useMemo(() => {
    const data: PriceCalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const basePrice = 300 + Math.random() * 200;
      const isWeekendDay = isWeekend(date);
      const price = isWeekendDay ? basePrice * 1.2 : basePrice;
      
      data.push({
        date,
        price: Math.round(price),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        availability: Math.random() > 0.7 ? 'low' : Math.random() > 0.4 ? 'medium' : 'high',
        isWeekend: isWeekendDay
      });
    }
    
    return data;
  }, []);

  const quickDateOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'This Weekend', date: endOfWeek(new Date()) },
    { label: 'Next Week', date: startOfWeek(addDays(new Date(), 7)) },
    { label: 'Next Month', date: addDays(new Date(), 30) }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left">
          <Calendar className="h-4 w-4 mr-2" />
          {selected ? format(selected, "EEE, MMM dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Quick options */}
          <div className="w-40 border-r p-3 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Select</h4>
            {quickDateOptions.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  onSelect(option.date);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Enhanced calendar */}
          <div className="p-3">
            {showPriceCalendar && (
              <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Price Trends</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">Low</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-500">High</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {priceCalendarData.slice(0, 14).map((day, index) => {
                const isSelected = selected && format(day.date, 'yyyy-MM-dd') === format(selected, 'yyyy-MM-dd');
                const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-auto p-1 flex flex-col items-center space-y-1",
                      isToday && !isSelected && "bg-accent",
                      day.availability === 'low' && "opacity-60"
                    )}
                    onClick={() => {
                      onSelect(day.date);
                      setIsOpen(false);
                    }}
                  >
                    <span className="text-xs font-medium">
                      {format(day.date, 'd')}
                    </span>
                    {showPriceCalendar && day.price && (
                      <>
                        <span className="text-[10px] text-muted-foreground">
                          ${day.price}
                        </span>
                        {day.trend === 'down' ? (
                          <TrendingDown className="h-2 w-2 text-green-500" />
                        ) : (
                          <TrendingUp className="h-2 w-2 text-orange-500" />
                        )}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const IntelligentSearchForm = ({ onSearch, className }: IntelligentSearchFormProps) => {
  const [tripType, setTripType] = useState("roundtrip");
  const [origin, setOrigin] = useState<Airport>(AIRPORT_DATA[0]);
  const [destination, setDestination] = useState<Airport>(AIRPORT_DATA[1]);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState("economy");
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);

  const swapAirports = useCallback(() => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  }, [origin, destination]);

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  const handleSearch = () => {
    const searchData = {
      tripType,
      origin: origin.iata,
      destination: destination.iata,
      departureDate,
      returnDate: tripType === 'roundtrip' ? returnDate : undefined,
      passengers,
      cabinClass
    };
    onSearch?.(searchData);
  };

  return (
    <Card className={cn("bg-card border border-border rounded-lg p-6 space-y-6 animate-fade-in", className)}>
      {/* Trip Type & Smart Suggestions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={tripType} onValueChange={setTripType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneway">One-way</SelectItem>
              <SelectItem value="roundtrip">Round trip</SelectItem>
              <SelectItem value="multicity">Multi-city</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Smart Search
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Search in real-time</span>
        </div>
      </div>

      {/* Route Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <SmartAirportSearch
            value={`${origin.city} (${origin.iata})`}
            onChange={setOrigin}
            placeholder="Search departure city..."
            excludeAirport={destination.iata}
          />
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={swapAirports}
            className="rounded-full p-2 hover-scale"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <SmartAirportSearch
            value={`${destination.city} (${destination.iata})`}
            onChange={setDestination}
            placeholder="Search destination city..."
            excludeAirport={origin.iata}
          />
        </div>
      </div>

      {/* Date & Travel Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Departure</label>
          <IntelligentDatePicker
            selected={departureDate}
            onSelect={setDepartureDate}
            placeholder="Select date"
            showPriceCalendar={true}
          />
        </div>
        
        {tripType === 'roundtrip' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Return</label>
            <IntelligentDatePicker
              selected={returnDate}
              onSelect={setReturnDate}
              placeholder="Select return"
              minDate={departureDate}
              showPriceCalendar={true}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Passengers</label>
          <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>{totalPassengers} passenger{totalPassengers > 1 ? 's' : ''}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                {Object.entries(passengers).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{key}</div>
                      <div className="text-xs text-muted-foreground">
                        {key === 'adults' && 'Age 12+'}
                        {key === 'children' && 'Age 2-11'}
                        {key === 'infants' && 'Under 2'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({
                          ...prev,
                          [key]: Math.max(0, value - 1)
                        }))}
                        disabled={key === 'adults' && value <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{value}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({
                          ...prev,
                          [key]: value + 1
                        }))}
                        disabled={totalPassengers >= 9}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <Select value={cabinClass} onValueChange={setCabinClass}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium_economy">Premium Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Action */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>✓ Real-time availability</span>
          <span>•</span>
          <span>✓ Price comparison</span>
          <span>•</span>
          <span>✓ Instant booking</span>
        </div>
        
        <Button 
          onClick={handleSearch}
          size="lg" 
          className="px-8 hover-scale"
          disabled={!origin || !destination || !departureDate}
        >
          <Search className="h-4 w-4 mr-2" />
          Search Flights
        </Button>
      </div>
    </Card>
  );
};