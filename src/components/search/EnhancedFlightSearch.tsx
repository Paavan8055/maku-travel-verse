import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plane, Users, Calendar, MapPin, Settings, Zap, DollarSign, Clock } from 'lucide-react';
import { useProviderRotation } from '@/hooks/useProviderRotation';
import { MultiProviderFlightComparison } from '@/components/comparison/MultiProviderFlightComparison';
import { FlexibleDateMatrix } from '@/components/comparison/FlexibleDateMatrix';
import { SeatMapIntegration } from '@/components/search/SeatMapIntegration';
import { ProviderPerformanceMonitor } from '@/components/providers/ProviderPerformanceMonitor';

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  directFlights: boolean;
  flexibleDates: boolean;
  selectionCriteria: {
    prioritizeSpeed: boolean;
    prioritizeCost: boolean;
    prioritizeReliability: boolean;
  };
}

export const EnhancedFlightSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'economy',
    directFlights: false,
    flexibleDates: false,
    selectionCriteria: {
      prioritizeSpeed: false,
      prioritizeCost: true,
      prioritizeReliability: true
    }
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);

  const { searchWithRotation, isLoading } = useProviderRotation();

  const handleSearch = async () => {
    try {
      const result = await searchWithRotation({
        searchType: 'flight',
        params: {
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate,
          passengerTypeQuantity: {
            adults: searchParams.adults,
            children: searchParams.children,
            infants: searchParams.infants
          },
          cabinPreference: searchParams.cabinClass,
          directFlights: searchParams.directFlights,
          selectionCriteria: searchParams.selectionCriteria
        }
      });

      if (result.success && result.data) {
        setSearchResults(Array.isArray(result.data) ? result.data : [result.data]);
        setShowComparison(true);
      }
    } catch (error) {
      console.error('Flight search failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Enhanced Flight Search
          </CardTitle>
          <CardDescription>
            Multi-provider search with intelligent routing and performance optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin"
                  placeholder="Origin airport"
                  value={searchParams.origin}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, origin: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination"
                  placeholder="Destination airport"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departure">Departure</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="departure"
                  type="date"
                  value={searchParams.departureDate}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return">Return (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="return"
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Passengers and Cabin */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Adults</Label>
              <Select
                value={searchParams.adults.toString()}
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, adults: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Children</Label>
              <Select
                value={searchParams.children.toString()}
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, children: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Infants</Label>
              <Select
                value={searchParams.infants.toString()}
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, infants: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cabin Class</Label>
              <Select
                value={searchParams.cabinClass}
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, cabinClass: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium-economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Provider Selection Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Search Optimization</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Options
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prioritize-speed"
                  checked={searchParams.selectionCriteria.prioritizeSpeed}
                  onCheckedChange={(checked) => 
                    setSearchParams(prev => ({
                      ...prev,
                      selectionCriteria: {
                        ...prev.selectionCriteria,
                        prioritizeSpeed: checked as boolean
                      }
                    }))
                  }
                />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="prioritize-speed" className="font-normal">
                    Prioritize Speed
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prioritize-cost"
                  checked={searchParams.selectionCriteria.prioritizeCost}
                  onCheckedChange={(checked) => 
                    setSearchParams(prev => ({
                      ...prev,
                      selectionCriteria: {
                        ...prev.selectionCriteria,
                        prioritizeCost: checked as boolean
                      }
                    }))
                  }
                />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <Label htmlFor="prioritize-cost" className="font-normal">
                    Prioritize Cost
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prioritize-reliability"
                  checked={searchParams.selectionCriteria.prioritizeReliability}
                  onCheckedChange={(checked) => 
                    setSearchParams(prev => ({
                      ...prev,
                      selectionCriteria: {
                        ...prev.selectionCriteria,
                        prioritizeReliability: checked as boolean
                      }
                    }))
                  }
                />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="prioritize-reliability" className="font-normal">
                    Prioritize Reliability
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="direct-flights"
                    checked={searchParams.directFlights}
                    onCheckedChange={(checked) => 
                      setSearchParams(prev => ({ ...prev, directFlights: checked as boolean }))
                    }
                  />
                  <Label htmlFor="direct-flights">Direct flights only</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="flexible-dates"
                    checked={searchParams.flexibleDates}
                    onCheckedChange={(checked) => 
                      setSearchParams(prev => ({ ...prev, flexibleDates: checked as boolean }))
                    }
                  />
                  <Label htmlFor="flexible-dates">Flexible dates (+/- 3 days)</Label>
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            disabled={isLoading || !searchParams.origin || !searchParams.destination || !searchParams.departureDate}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching Flights...
              </>
            ) : (
              <>
                <Plane className="h-4 w-4 mr-2" />
                Search Flights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Flexible Date Matrix */}
      {searchParams.flexibleDates && searchParams.origin && searchParams.destination && (
        <FlexibleDateMatrix
          originIata={searchParams.origin}
          destinationIata={searchParams.destination}
          baseDate={searchParams.departureDate}
          passengerCount={searchParams.adults + searchParams.children + searchParams.infants}
          onDateSelected={(date) => setSearchParams(prev => ({ ...prev, departureDate: date }))}
        />
      )}

      {/* Multi-Provider Flight Comparison */}
      {showComparison && searchResults.length > 0 && (
        <MultiProviderFlightComparison
          flights={searchResults}
          onFlightSelected={(flightId) => {
            setSelectedFlight(flightId);
            setShowSeatMap(true);
          }}
        />
      )}

      {/* Seat Map Integration */}
      {showSeatMap && selectedFlight && (
        <SeatMapIntegration
          flightOfferId={selectedFlight}
          provider="amadeus"
          onSeatSelected={(seatNumber, price) => {
            console.log(`Seat ${seatNumber} selected for $${price || 0}`);
          }}
        />
      )}

      {/* Provider Performance Monitor */}
      <ProviderPerformanceMonitor />
    </div>
  );
};