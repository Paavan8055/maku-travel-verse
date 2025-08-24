import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Plane, Clock, MapPin, Info, AlertCircle } from 'lucide-react';
import { EnhancedFlightCard } from '@/components/flight/EnhancedFlightCard';
import logger from '@/utils/logger';

interface FlightOffer {
  id: string;
  supplier: 'amadeus' | 'sabre';
  price: {
    total: string;
    currency: string;
    base?: string;
    taxes?: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  numberOfBookableSeats?: number;
  fareDetailsBySegment?: Array<{
    segmentId: string;
    cabin: string;
    fareBasis: string;
    class: string;
  }>;
  validatingAirlineCodes?: string[];
}

interface FlightResultsHarmonizedProps {
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
  };
}

export const FlightResultsHarmonized: React.FC<FlightResultsHarmonizedProps> = ({
  searchParams
}) => {
  const [results, setResults] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
  const [supplierFilter, setSupplierFilter] = useState<'all' | 'amadeus' | 'sabre'>('all');
  const { toast } = useToast();

  useEffect(() => {
    searchFlights();
  }, [searchParams]);

  const searchFlights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info('Searching flights with harmonized results', searchParams);

      // Search both Amadeus and Sabre simultaneously
      const [amadeusResult, sabreResult] = await Promise.allSettled([
        supabase.functions.invoke('amadeus-flight-search', {
          body: {
            originLocationCode: searchParams.origin,
            destinationLocationCode: searchParams.destination,
            departureDate: searchParams.departureDate,
            returnDate: searchParams.returnDate,
            adults: searchParams.adults,
            children: searchParams.children || 0,
            infants: searchParams.infants || 0,
            travelClass: searchParams.travelClass || 'ECONOMY'
          }
        }),
        supabase.functions.invoke('sabre-flight-search', {
          body: {
            origin: searchParams.origin,
            destination: searchParams.destination,
            departureDate: searchParams.departureDate,
            returnDate: searchParams.returnDate,
            passengerCount: searchParams.adults + (searchParams.children || 0),
            cabinClass: searchParams.travelClass || 'Economy'
          }
        })
      ]);

      const harmonizedResults: FlightOffer[] = [];

      // Process Amadeus results
      if (amadeusResult.status === 'fulfilled' && amadeusResult.value.data?.success) {
        const amadeusOffers = amadeusResult.value.data.flightOffers || [];
        
        harmonizedResults.push(...amadeusOffers.map((offer: any) => ({
          ...offer,
          supplier: 'amadeus' as const,
          id: `amadeus_${offer.id}`
        })));
        
        logger.info(`Added ${amadeusOffers.length} Amadeus flight offers`);
      } else {
        logger.warn('Amadeus flight search failed:', amadeusResult.status === 'rejected' ? amadeusResult.reason : amadeusResult.value);
      }

      // Process Sabre results  
      if (sabreResult.status === 'fulfilled' && sabreResult.value.data?.success) {
        const sabreOffers = sabreResult.value.data.flightOffers || [];
        
        // Harmonize Sabre format to match Amadeus structure
        const harmonizedSabreOffers = sabreOffers.map((offer: any, index: number) => ({
          id: `sabre_${offer.id || offer.flightNumber || `flight-${index}`}`,
          supplier: 'sabre' as const,
          price: {
            total: offer.price?.total || offer.totalFare || '0',
            currency: offer.price?.currency || offer.currency || 'USD',
            base: offer.price?.base || offer.baseFare,
            taxes: offer.price?.taxes || offer.taxes
          },
          itineraries: offer.itineraries || offer.segments ? [{
            duration: offer.duration || offer.totalTravelTime || 'PT0H0M',
            segments: Array.isArray(offer.segments) ? offer.segments.map((segment: any) => ({
              departure: {
                iataCode: segment.departure?.iataCode || segment.origin,
                terminal: segment.departure?.terminal,
                at: segment.departure?.at || segment.departureTime
              },
              arrival: {
                iataCode: segment.arrival?.iataCode || segment.destination,
                terminal: segment.arrival?.terminal,
                at: segment.arrival?.at || segment.arrivalTime
              },
              carrierCode: segment.carrierCode || segment.airline,
              number: segment.number || segment.flightNumber,
              aircraft: segment.aircraft,
              duration: segment.duration || 'PT0H0M'
            })) : []
          }] : [],
          numberOfBookableSeats: offer.numberOfBookableSeats || offer.availableSeats,
          fareDetailsBySegment: offer.fareDetailsBySegment,
          validatingAirlineCodes: offer.validatingAirlineCodes || (offer.airline ? [offer.airline] : [])
        }));
        
        harmonizedResults.push(...harmonizedSabreOffers);
        logger.info(`Added ${harmonizedSabreOffers.length} Sabre flight offers`);
      } else {
        logger.warn('Sabre flight search failed:', sabreResult.status === 'rejected' ? sabreResult.reason : sabreResult.value);
      }

      if (harmonizedResults.length === 0) {
        setError('No flights found from any supplier. Please try different search criteria.');
      } else {
        setResults(harmonizedResults);
        logger.info(`Total harmonized results: ${harmonizedResults.length}`);
      }

    } catch (error) {
      logger.error('Flight search error:', error);
      setError('Failed to search flights. Please try again.');
      toast({
        title: "Search Error",
        description: "Failed to search flights from suppliers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return parseFloat(a.price.total) - parseFloat(b.price.total);
      case 'duration':
        const aDuration = a.itineraries[0]?.duration || 'PT0H0M';
        const bDuration = b.itineraries[0]?.duration || 'PT0H0M';
        return aDuration.localeCompare(bDuration);
      case 'departure':
        const aDep = a.itineraries[0]?.segments[0]?.departure.at || '';
        const bDep = b.itineraries[0]?.segments[0]?.departure.at || '';
        return aDep.localeCompare(bDep);
      default:
        return 0;
    }
  });

  const filteredResults = supplierFilter === 'all' 
    ? sortedResults 
    : sortedResults.filter(result => result.supplier === supplierFilter);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Searching flights from multiple suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Search Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={searchFlights}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="w-6 h-6" />
            Flight Results ({filteredResults.length})
          </h2>
          <p className="text-muted-foreground">
            {searchParams.origin} → {searchParams.destination}
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={supplierFilter} onValueChange={(value: any) => setSupplierFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              <SelectItem value="amadeus">Amadeus</SelectItem>
              <SelectItem value="sabre">Sabre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Sort by Price</SelectItem>
              <SelectItem value="duration">Sort by Duration</SelectItem>
              <SelectItem value="departure">Sort by Departure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Supplier Summary */}
      <div className="flex gap-4">
        <Badge variant="outline" className="flex items-center gap-2">
          <Info className="w-3 h-3" />
          Amadeus: {results.filter(r => r.supplier === 'amadeus').length} results
        </Badge>
        <Badge variant="outline" className="flex items-center gap-2">
          <Info className="w-3 h-3" />
          Sabre: {results.filter(r => r.supplier === 'sabre').length} results
        </Badge>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No flights found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((flight) => (
            <Card key={flight.id} className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {flight.supplier}
                      </Badge>
                      {flight.validatingAirlineCodes?.[0] && (
                        <Badge variant="secondary">
                          {flight.validatingAirlineCodes[0]}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-medium">{flight.itineraries[0]?.segments[0]?.departure.iataCode}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(flight.itineraries[0]?.segments[0]?.departure.at || '').toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <Plane className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {flight.itineraries[0]?.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="font-medium">{flight.itineraries[0]?.segments[flight.itineraries[0].segments.length - 1]?.arrival.iataCode}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(flight.itineraries[0]?.segments[flight.itineraries[0].segments.length - 1]?.arrival.at || '').toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {flight.price.currency} {flight.price.total}
                    </div>
                    {flight.numberOfBookableSeats && (
                      <p className="text-sm text-muted-foreground">
                        {flight.numberOfBookableSeats} seats left
                      </p>
                    )}
                    <Button 
                      className="mt-2"
                      onClick={() => {
                        toast({
                          title: "Flight Selected",
                          description: `Selected ${flight.supplier} flight for ${flight.price.currency} ${flight.price.total}`
                        });
                      }}
                    >
                      Select Flight
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};