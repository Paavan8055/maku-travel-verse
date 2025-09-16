import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { SearchErrorBoundary } from "@/components/error-boundaries/SearchErrorBoundary";
import { FlightSearchForm } from "@/components/search/FlightSearchForm";
import { FlightResults } from "@/components/search/FlightResults";
import { useProviderRotation } from "@/hooks/useProviderRotation";
import { useToast } from "@/hooks/use-toast";

const FlightsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchWithRotation, isLoading } = useProviderRotation();
  
  // State management
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Get initial search criteria from URL
  const getInitialSearchCriteria = () => ({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    passengers: parseInt(searchParams.get('passengers') || '1'),
    tripType: (searchParams.get('tripType') as 'oneway' | 'roundtrip') || 'roundtrip',
    travelClass: searchParams.get('travelClass') || 'ECONOMY'
  });

  // Perform flight search
  const handleFlightSearch = async (searchCriteria: any) => {
    try {
      setError(null);
      setHasSearched(true);
      
      // Update URL with search parameters
      const newSearchParams = new URLSearchParams();
      Object.entries(searchCriteria).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, value.toString());
        }
      });
      setSearchParams(newSearchParams);

      console.log('FlightsPage: Starting flight search with:', searchCriteria);

      // Call provider rotation for flight search
      const result = await searchWithRotation({
        searchType: 'flight',
        params: {
          origin: searchCriteria.origin,
          destination: searchCriteria.destination,
          departureDate: searchCriteria.departureDate,
          returnDate: searchCriteria.tripType === 'roundtrip' ? searchCriteria.returnDate : undefined,
          passengers: searchCriteria.passengers,
          travelClass: searchCriteria.travelClass
        }
      });

      console.log('FlightsPage: Provider rotation result:', result);

      if (result.success && result.data) {
        const flightData = result.data.flights || [];
        console.log('FlightsPage: Setting flights data:', flightData);
        setFlights(flightData);
        
        if (flightData.length === 0) {
          setError('No flights found for your search criteria. Please try different dates or destinations.');
        }
      } else {
        console.error('FlightsPage: Search failed:', result.error);
        setError(result.error || 'Unable to search flights at this time');
        setFlights([]);
      }

    } catch (error) {
      console.error('FlightsPage: Flight search error:', error);
      setError('An unexpected error occurred while searching for flights');
      setFlights([]);
      
      toast({
        title: "Search Error",
        description: "Unable to search flights. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Handle flight selection
  const handleFlightSelect = (flight: any) => {
    try {
      // Store selected flight in sessionStorage for booking flow
      sessionStorage.setItem('selectedFlight', JSON.stringify(flight));
      
      console.log('FlightsPage: Flight selected:', flight);
      
      // Navigate to flight booking review page
      navigate('/flights/review');
      
    } catch (error) {
      console.error('FlightsPage: Error selecting flight:', error);
      toast({
        title: "Selection Error",
        description: "Unable to select flight. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Auto-search if URL has search parameters
  useEffect(() => {
    const criteria = getInitialSearchCriteria();
    if (criteria.origin && criteria.destination && criteria.departureDate && !hasSearched) {
      console.log('FlightsPage: Auto-searching with URL criteria:', criteria);
      handleFlightSearch(criteria);
    }
  }, []);

  return (
    <SearchErrorBoundary>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Search Form */}
          <FlightSearchForm
            onSearch={handleFlightSearch}
            loading={isLoading}
            initialValues={getInitialSearchCriteria()}
          />

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-6">
              {/* Search Summary */}
              {(flights.length > 0 || error) && (
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Flight Search Results</h2>
                  {flights.length > 0 && (
                    <p className="text-muted-foreground">
                      {getInitialSearchCriteria().origin} → {getInitialSearchCriteria().destination}
                      {getInitialSearchCriteria().departureDate && (
                        <> • {new Date(getInitialSearchCriteria().departureDate).toLocaleDateString()}</>
                      )}
                      {getInitialSearchCriteria().returnDate && getInitialSearchCriteria().tripType === 'roundtrip' && (
                        <> • {new Date(getInitialSearchCriteria().returnDate).toLocaleDateString()}</>
                      )}
                      • {getInitialSearchCriteria().passengers} passenger{getInitialSearchCriteria().passengers > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Results Component */}
              <FlightResults
                flights={flights}
                loading={isLoading}
                error={error}
                onFlightSelect={handleFlightSelect}
                onRetry={() => handleFlightSearch(getInitialSearchCriteria())}
              />
            </div>
          )}

          {/* No Search Performed Yet */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Search for Flights</h3>
                  <p className="text-muted-foreground">
                    Enter your travel details above to find the best flight deals
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SearchErrorBoundary>
  );
};

export default FlightsPage;