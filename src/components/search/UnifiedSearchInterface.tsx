import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, SearchIcon, Plane, Hotel, MapPin, Car, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { UnifiedSearchItem, UnifiedSearchResults } from '@/types/unified-search';

interface SearchParams {
  type: 'flight' | 'hotel' | 'activity' | 'car' | 'transfer';
  origin?: string;
  destination: string;
  departureDate?: Date;
  returnDate?: Date;
  checkIn?: Date;
  checkOut?: Date;
  passengers?: number;
  guests?: number;
  rooms?: number;
  pickUpTime?: string;
  dropOffTime?: string;
  driverAge?: number;
  providers: string[];
}

export default function UnifiedSearchInterface() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    type: 'flight',
    destination: '',
    passengers: 1,
    guests: 2,
    rooms: 1,
    driverAge: 25,
    pickUpTime: '10:00',
    dropOffTime: '10:00',
    providers: ['amadeus', 'hotelbeds', 'sabre']
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedSearchResults | null>(null);

  const handleSearch = async () => {
    if (!searchParams.destination) {
      toast({
        title: "Missing Information",
        description: "Please enter a destination",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('unified-search', {
        body: {
          ...searchParams,
          departureDate: searchParams.departureDate?.toISOString().split('T')[0],
          returnDate: searchParams.returnDate?.toISOString().split('T')[0],
          checkIn: searchParams.checkIn?.toISOString().split('T')[0],
          checkOut: searchParams.checkOut?.toISOString().split('T')[0],
          pickUpDate: searchParams.departureDate?.toISOString().split('T')[0],
          dropOffDate: searchParams.returnDate?.toISOString().split('T')[0]
        }
      });

      if (error) {
        throw error;
      }

      setResults(data as UnifiedSearchResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.resultCounts?.total || 0} results from ${Object.keys(data.resultCounts || {}).length - 1} providers`
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to complete search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDatePicker = (value: Date | undefined, onChange: (date: Date | undefined) => void, placeholder: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  const renderProviderSelector = () => (
    <div className="space-y-2">
      <Label>Data Providers</Label>
      <div className="flex flex-wrap gap-2">
        {['amadeus', 'hotelbeds', 'sabre', 'travelport'].map((provider) => (
          <Badge
            key={provider}
            variant={searchParams.providers.includes(provider) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              const newProviders = searchParams.providers.includes(provider)
                ? searchParams.providers.filter(p => p !== provider)
                : [...searchParams.providers, provider];
              setSearchParams({ ...searchParams, providers: newProviders });
            }}
          >
            {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </Badge>
        ))}
      </div>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    const typedResults = results as UnifiedSearchResults;

    const resultKey = {
      'flight': 'flights',
      'hotel': 'hotels',
      'activity': 'activities',
      'car': 'cars',
      'transfer': 'transfers'
    }[searchParams.type] || 'items';

    const items = (typedResults[resultKey as keyof UnifiedSearchResults] as UnifiedSearchItem[]) || [];

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <div className="flex gap-2">
            {Object.entries(typedResults.resultCounts || {}).map(([provider, count]) => (
              provider !== 'total' && (
                <Badge key={provider} variant="secondary">
                  {provider}: {count as number}
                </Badge>
              )
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.slice(0, 10).map((item: UnifiedSearchItem, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.title || item.name || item.vehicle?.description}</h3>
                    <p className="text-sm text-muted-foreground">{item.description || item.location}</p>
                    <Badge variant="outline" className="mt-1">{item.source}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {item.price?.currency || item.currency || '$'}
                      {item.price?.amount || item.pricePerNight || item.totalPrice || 0}
                    </p>
                    {item.responseTime && (
                      <p className="text-xs text-muted-foreground">{item.responseTime}ms</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Unified Travel Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={searchParams.type} onValueChange={(value) =>
            setSearchParams({ ...searchParams, type: value as SearchParams['type'] })
          }>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="flight" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Flights
              </TabsTrigger>
              <TabsTrigger value="hotel" className="flex items-center gap-2">
                <Hotel className="h-4 w-4" />
                Hotels
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="car" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Cars
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Transfers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flight" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">From</Label>
                  <Input
                    id="origin"
                    placeholder="Origin airport"
                    value={searchParams.origin || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="Destination airport"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Departure</Label>
                  {renderDatePicker(searchParams.departureDate, (date) => 
                    setSearchParams({ ...searchParams, departureDate: date }), "Select departure"
                  )}
                </div>
                <div>
                  <Label>Return (Optional)</Label>
                  {renderDatePicker(searchParams.returnDate, (date) => 
                    setSearchParams({ ...searchParams, returnDate: date }), "Select return"
                  )}
                </div>
                <div>
                  <Label htmlFor="passengers">Passengers</Label>
                  <Select value={searchParams.passengers?.toString()} onValueChange={(value) => 
                    setSearchParams({ ...searchParams, passengers: parseInt(value) })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hotel" className="space-y-4">
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="City or hotel name"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Check-in</Label>
                  {renderDatePicker(searchParams.checkIn, (date) => 
                    setSearchParams({ ...searchParams, checkIn: date }), "Check-in date"
                  )}
                </div>
                <div>
                  <Label>Check-out</Label>
                  {renderDatePicker(searchParams.checkOut, (date) => 
                    setSearchParams({ ...searchParams, checkOut: date }), "Check-out date"
                  )}
                </div>
                <div>
                  <Label htmlFor="guests">Guests</Label>
                  <Select value={searchParams.guests?.toString()} onValueChange={(value) => 
                    setSearchParams({ ...searchParams, guests: parseInt(value) })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="City or location"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  {renderDatePicker(searchParams.departureDate, (date) => 
                    setSearchParams({ ...searchParams, departureDate: date }), "Activity date"
                  )}
                </div>
                <div>
                  <Label htmlFor="participants">Participants</Label>
                  <Select value={searchParams.passengers?.toString()} onValueChange={(value) => 
                    setSearchParams({ ...searchParams, passengers: parseInt(value) })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="car" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup">Pick-up Location</Label>
                  <Input
                    id="pickup"
                    placeholder="Airport or city code"
                    value={searchParams.origin || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dropoff">Drop-off Location (Optional)</Label>
                  <Input
                    id="dropoff"
                    placeholder="Same as pick-up"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Pick-up Date</Label>
                  {renderDatePicker(searchParams.departureDate, (date) => 
                    setSearchParams({ ...searchParams, departureDate: date }), "Pick-up date"
                  )}
                </div>
                <div>
                  <Label htmlFor="pickupTime">Pick-up Time</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={searchParams.pickUpTime}
                    onChange={(e) => setSearchParams({ ...searchParams, pickUpTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Drop-off Date</Label>
                  {renderDatePicker(searchParams.returnDate, (date) => 
                    setSearchParams({ ...searchParams, returnDate: date }), "Drop-off date"
                  )}
                </div>
                <div>
                  <Label htmlFor="dropoffTime">Drop-off Time</Label>
                  <Input
                    id="dropoffTime"
                    type="time"
                    value={searchParams.dropOffTime}
                    onChange={(e) => setSearchParams({ ...searchParams, dropOffTime: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">From</Label>
                  <Input
                    id="origin"
                    placeholder="Airport/hotel code"
                    value={searchParams.origin || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="Airport/hotel code"
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transfer Date</Label>
                  {renderDatePicker(searchParams.departureDate, (date) => 
                    setSearchParams({ ...searchParams, departureDate: date }), "Transfer date"
                  )}
                </div>
                <div>
                  <Label htmlFor="passengers">Passengers</Label>
                  <Select value={searchParams.passengers?.toString()} onValueChange={(value) => 
                    setSearchParams({ ...searchParams, passengers: parseInt(value) })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            {renderProviderSelector()}
            
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !searchParams.destination}
              className="w-full"
            >
              {isLoading ? 'Searching...' : 'Search All Providers'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderResults()}
    </div>
  );
}