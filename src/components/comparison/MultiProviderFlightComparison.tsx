import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Clock, Users, Star, TrendingUp, Zap } from 'lucide-react';
import { useProviderRotation } from '@/hooks/useProviderRotation';

interface FlightComparisonProps {
  criteria: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
  };
  onFlightSelect: (flight: any, provider: string) => void;
}

interface ProviderResults {
  provider: string;
  flights: any[];
  responseTime: number;
  status: 'loading' | 'success' | 'error';
  error?: string;
}

export const MultiProviderFlightComparison: React.FC<FlightComparisonProps> = ({
  criteria,
  onFlightSelect
}) => {
  const [results, setResults] = useState<ProviderResults[]>([]);
  const [selectedView, setSelectedView] = useState<'side-by-side' | 'best-price' | 'fare-matrix'>('side-by-side');
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating' | 'departure'>('price');
  const { searchWithRotation, isLoading } = useProviderRotation();

  const providers = ['amadeus', 'sabre'];

  useEffect(() => {
    if (criteria.origin && criteria.destination && criteria.departureDate) {
      performMultiProviderSearch();
    }
  }, [criteria]);

  const performMultiProviderSearch = async () => {
    // Initialize results with loading state
    const initialResults = providers.map(provider => ({
      provider,
      flights: [],
      responseTime: 0,
      status: 'loading' as const
    }));
    setResults(initialResults);

    // Search each provider concurrently
    const searchPromises = providers.map(async (provider) => {
      const startTime = Date.now();
      try {
        const result = await searchWithRotation({
          searchType: 'flight',
          params: {
            ...criteria,
            providers: [provider]
          }
        });

        const responseTime = Date.now() - startTime;

        return {
          provider,
          flights: result.success ? result.data?.flights || [] : [],
          responseTime,
          status: result.success ? 'success' : 'error',
          error: result.error
        } as ProviderResults;
      } catch (error) {
        return {
          provider,
          flights: [],
          responseTime: Date.now() - startTime,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } as ProviderResults;
      }
    });

    // Wait for all searches to complete
    const searchResults = await Promise.all(searchPromises);
    setResults(searchResults);
  };

  const getAllFlights = () => {
    return results.flatMap(result => 
      result.flights.map(flight => ({
        ...flight,
        provider: result.provider
      }))
    );
  };

  const sortedFlights = getAllFlights().sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (a.price || 0) - (b.price || 0);
      case 'duration':
        return (a.duration || 0) - (b.duration || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'departure':
        return new Date(a.departureTime || 0).getTime() - new Date(b.departureTime || 0).getTime();
      default:
        return 0;
    }
  });

  const getBestPriceByProvider = () => {
    return providers.map(provider => {
      const providerFlights = results.find(r => r.provider === provider)?.flights || [];
      const bestFlight = providerFlights.sort((a, b) => (a.price || 0) - (b.price || 0))[0];
      return {
        provider,
        flight: bestFlight,
        count: providerFlights.length
      };
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'amadeus': return 'bg-emerald-500';
      case 'sabre': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Multi-Provider Flight Comparison
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side-by-side">Side by Side</SelectItem>
                  <SelectItem value="best-price">Best Prices</SelectItem>
                  <SelectItem value="fare-matrix">Fare Matrix</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="departure">Departure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Provider Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <Card key={result.provider}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`text-white ${getProviderBadgeColor(result.provider)}`}>
                    {result.provider.toUpperCase()}
                  </Badge>
                  <div>
                    <div className="font-semibold">
                      {result.status === 'loading' && 'Searching...'}
                      {result.status === 'success' && `${result.flights.length} flights found`}
                      {result.status === 'error' && 'Search failed'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.status === 'success' && `Response: ${result.responseTime}ms`}
                      {result.status === 'error' && result.error}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {result.status === 'loading' && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  )}
                  {result.status === 'success' && result.flights.length > 0 && (
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(Math.min(...result.flights.map(f => f.price || 999999)))}
                      </div>
                      <div className="text-xs text-muted-foreground">from</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
          <TabsTrigger value="best-price">Best Prices</TabsTrigger>
          <TabsTrigger value="fare-matrix">Fare Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="side-by-side" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {providers.map(provider => {
              const providerResult = results.find(r => r.provider === provider);
              return (
                <Card key={provider}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Badge className={`text-white ${getProviderBadgeColor(provider)}`}>
                        {provider.toUpperCase()}
                      </Badge>
                      {providerResult?.flights.length && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {providerResult.flights.length} results
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {providerResult?.status === 'loading' && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">Searching flights...</p>
                      </div>
                    )}
                    {providerResult?.status === 'error' && (
                      <div className="text-center py-8">
                        <p className="text-destructive">Search failed</p>
                        <p className="text-sm text-muted-foreground">{providerResult.error}</p>
                      </div>
                    )}
                    {providerResult?.flights.slice(0, 3).map((flight, index) => (
                      <Card key={index} className="border border-border/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{flight.airline}</span>
                                <span className="text-sm text-muted-foreground">{flight.flightNumber}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <div className="font-medium">{flight.origin}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {flight.departureTime}
                                  </div>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs">{formatDuration(flight.duration)}</span>
                                </div>
                                <div>
                                  <div className="font-medium">{flight.destination}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {flight.arrivalTime}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {formatPrice(flight.price)}
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => onFlightSelect(flight, provider)}
                                className="mt-2"
                              >
                                Select
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="best-price" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Best Prices by Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getBestPriceByProvider().map((item, index) => (
                  <div key={item.provider} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={`text-white ${getProviderBadgeColor(item.provider)}`}>
                        {item.provider.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-semibold">{item.flight?.airline || 'No flights found'}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.count} flights available
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.flight && (
                        <>
                          <div className="text-xl font-bold text-primary">
                            {formatPrice(item.flight.price)}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => onFlightSelect(item.flight, item.provider)}
                          >
                            Select
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fare-matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Fare Class Comparison Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Flight</th>
                      <th className="text-center p-3">Economy</th>
                      <th className="text-center p-3">Premium Economy</th>
                      <th className="text-center p-3">Business</th>
                      <th className="text-center p-3">First</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFlights.slice(0, 5).map((flight, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-white text-xs ${getProviderBadgeColor(flight.provider)}`}>
                              {flight.provider.charAt(0).toUpperCase()}
                            </Badge>
                            <div>
                              <div className="font-medium">{flight.airline}</div>
                              <div className="text-sm text-muted-foreground">{flight.flightNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <div className="text-sm font-medium">{formatPrice(flight.price)}</div>
                          <Button size="sm" variant="outline" className="mt-1 text-xs">
                            Select
                          </Button>
                        </td>
                        <td className="text-center p-3">
                          <div className="text-sm font-medium">{formatPrice(flight.price * 1.5)}</div>
                          <Button size="sm" variant="outline" className="mt-1 text-xs">
                            Select
                          </Button>
                        </td>
                        <td className="text-center p-3">
                          <div className="text-sm font-medium">{formatPrice(flight.price * 2.5)}</div>
                          <Button size="sm" variant="outline" className="mt-1 text-xs">
                            Select
                          </Button>
                        </td>
                        <td className="text-center p-3">
                          <div className="text-sm font-medium">{formatPrice(flight.price * 4)}</div>
                          <Button size="sm" variant="outline" className="mt-1 text-xs">
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Search Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {getAllFlights().length}
              </div>
              <div className="text-sm text-muted-foreground">Total Options</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.min(...results.map(r => r.responseTime))}ms
              </div>
              <div className="text-sm text-muted-foreground">Fastest Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {results.filter(r => r.status === 'success').length}/{results.length}
              </div>
              <div className="text-sm text-muted-foreground">Successful Searches</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};