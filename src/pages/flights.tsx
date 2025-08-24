
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SearchErrorBoundary } from "@/components/error-boundaries/SearchErrorBoundary";
import { useFlightSearch } from "@/features/search/hooks/useFlightSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Plane, AlertTriangle } from "lucide-react";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { validateFlightSearch } from "@/utils/inputValidation";
import { useToast } from "@/hooks/use-toast";

const FlightsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get parameters from URL
  const origin = searchParams.get('origin') || 'LAX';
  const destination = searchParams.get('destination') || 'SYD';
  const departureDate = searchParams.get('departureDate') || '2025-08-24';
  const passengers = parseInt(searchParams.get('passengers') || '2');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flights, setFlights] = useState<any[]>([]);

  // Search criteria for the hook
  const searchCriteria = {
    origin,
    destination,
    departureDate,
    passengers
  };

  console.log('FlightsPage: Search criteria:', searchCriteria);

  // Test flight search directly
  useEffect(() => {
    const testFlightSearch = async () => {
      setLoading(true);
      setError(null);
      
      // Validate input before making API call
      const validation = validateFlightSearch(searchCriteria);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid search parameters');
        setLoading(false);
        toast({
          title: "Invalid Search",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }
      
      try {
        console.log('Testing flight search with:', searchCriteria);
        
        // Import supabase client
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error: functionError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'flight',
            params: {
              origin: searchCriteria.origin,
              destination: searchCriteria.destination,
              departureDate: searchCriteria.departureDate,
              passengers: searchCriteria.passengers,
              travelClass: 'ECONOMY',
              nonStop: false
            }
          }
        });

        console.log('Flight search response:', { data, error: functionError });

        if (functionError) {
          throw new Error(functionError.message || 'Flight search failed');
        }

        if (data?.success && data?.data) {
          // Handle nested data structure - check for flights array
          const flightData = data.data.flights || data.data.data?.flights || data.data;
          setFlights(Array.isArray(flightData) ? flightData : []);
          console.log('Found flights:', Array.isArray(flightData) ? flightData.length : 0);
          console.log('Provider used:', data.provider, 'Fallback:', data.fallbackUsed);
        } else {
          throw new Error(data?.error || 'No flights found');
        }
      } catch (err) {
        console.error('Flight search error:', err);
        setError(err instanceof Error ? err.message : 'Flight search failed');
      } finally {
        setLoading(false);
      }
    };

    testFlightSearch();
  }, [origin, destination, departureDate, passengers]);

  const handleFlightSelect = (flight: any) => {
    console.log('Flight selected:', flight);
    // Store flight data and navigate to booking
    sessionStorage.setItem('selectedFlight', JSON.stringify(flight));
    navigate('/flight-booking-review');
  };

  return (
    <SearchErrorBoundary fallbackMessage="Flight search is temporarily unavailable. Please try again later.">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Flight Search Results</h1>
            <p className="text-muted-foreground">
              {origin} → {destination} • {formatDate(new Date(departureDate), 'MMM dd, yyyy')} • {passengers} passenger{passengers !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Searching flights...</h3>
              <p className="text-muted-foreground">Finding the best options for your trip</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-4">Flight search providers are currently experiencing issues. Please try again in a few minutes.</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </Card>
          )}

          {/* Results */}
          {!loading && !error && flights.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Found {flights.length} flights
              </p>
              
              {flights.map((flight, index) => (
                <Card key={`${flight.id}-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 flex-1">
                        {/* Airline Info */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">
                              {flight.airline?.code || flight.airlineCode || 'FL'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{flight.airline?.name || flight.airline || 'Flight'}</p>
                            <p className="text-sm text-muted-foreground">{flight.flightNumber || 'FL001'}</p>
                          </div>
                        </div>

                        {/* Flight Times */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-center">
                            <p className="text-lg font-semibold">{flight.departure?.time || '10:00'}</p>
                            <p className="text-sm text-muted-foreground">{flight.departure?.airport || origin}</p>
                          </div>
                          
                          <div className="flex-1 relative">
                            <div className="border-t border-border"></div>
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                              <Plane className="h-4 w-4 text-muted-foreground rotate-90" />
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-lg font-semibold">{flight.arrival?.time || '18:00'}</p>
                            <p className="text-sm text-muted-foreground">{flight.arrival?.airport || destination}</p>
                          </div>
                        </div>

                        {/* Duration & Stops */}
                        <div className="text-center">
                          <p className="text-sm font-medium">{flight.duration || '8H 0Min'}</p>
                          <p className="text-xs text-muted-foreground">
                            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>

                      {/* Price & Select */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {flight.price?.currency || 'AUD'} {flight.price?.amount || flight.price || '599'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">per person</p>
                        <Button onClick={() => handleFlightSelect(flight)}>
                          Select Flight
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && flights.length === 0 && (
            <Card className="p-12 text-center">
              <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Service Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-4">Flight search providers are currently experiencing issues. Please try again later.</p>
              <Button onClick={() => navigate('/')} variant="outline">
                New Search
              </Button>
            </Card>
          )}
        </div>
      </div>
    </SearchErrorBoundary>
  );
};

export default FlightsPage;
