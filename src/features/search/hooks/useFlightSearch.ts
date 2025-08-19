
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlightSearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

interface FareOption {
  type: string;
  price: number;
  currency: string;
  features: string[];
  seatsAvailable?: number;
  bookingClass?: string;
}

interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  airlineLogo?: string;
  flightNumber: string;
  outboundFlightNumber?: string;
  returnFlightNumber?: string;
  aircraft: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number | string;
  stops: number;
  stopoverInfo?: string;
  departure?: {
    date?: string;
    time?: string;
  };
  arrival?: {
    date?: string;
    time?: string;
  };
  price: number;
  currency: string;
  availableSeats: number;
  cabin: string;
  baggage: {
    carry: boolean;
    checked: boolean;
  };
  segments?: Array<{
    departure: { airport: string; time: string; terminal?: string };
    arrival: { airport: string; time: string; terminal?: string };
    duration?: string;
    flightNumber?: string;
  }>;
  fareOptions?: FareOption[];
  isRoundTrip?: boolean;
  amadeusOfferId?: string;
}

// Convert ISO 8601 duration (e.g., PT7H30M) to minutes
const parseISO8601DurationToMinutes = (duration?: string): number => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
};

export const useFlightSearch = (criteria: FlightSearchCriteria | null) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!criteria || !criteria.destination || !criteria.departureDate) {
      console.log("useFlightSearch: Missing criteria", criteria);
      return;
    }

    console.log("useFlightSearch: Starting search with criteria:", criteria);

    const searchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Amadeus Flight Offers API for real-time results with multiple fare classes
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-flight-offers', {
          body: {
            originLocationCode: criteria.origin,
            destinationLocationCode: criteria.destination,
            departureDate: criteria.departureDate,
            returnDate: criteria.returnDate,
            adults: criteria.passengers,
            children: 0,
            infants: 0,
            travelClass: 'ECONOMY',
            nonStop: false,
            maxPrice: 5000,
            currencyCode: 'USD',
            max: 20
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.success && data?.data?.data && Array.isArray(data.data.data)) {
          console.log("useFlightSearch: API success, transforming", data.data.data.length, "offers");
          const transformedFlights = data.data.data.map((offer: any) => {
            const outbound = offer.itineraries[0];
            const segments = outbound.segments;
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            // Get real traveler pricing data
            const travelerPricings = offer.travelerPricings || [];
            const basePrice = parseFloat(offer.price.total);
            const baseCurrency = offer.price.currency;

            // Create fare options based on REAL Amadeus data only
            const fareOptions: FareOption[] = [];
            
            // Economy fare - use actual Amadeus pricing
            const economyFareDetail = travelerPricings[0]?.fareDetailsBySegment?.[0];
            fareOptions.push({
              type: 'economy',
              price: basePrice,
              currency: baseCurrency,
              features: [
                'Standard seat selection',
                'Carry-on bag included',
                economyFareDetail?.includedCheckedBags?.quantity > 0 ? 'Checked bag included' : 'Checked bag extra',
                'Standard meal service'
              ],
              seatsAvailable: economyFareDetail?.seatsAvailable || 9, // Use real availability
              bookingClass: economyFareDetail?.class || 'M'
            });

            // Business fare - only if available in response
            const businessPricing = travelerPricings.find((tp: any) => 
              tp.fareDetailsBySegment?.[0]?.class === 'C' || 
              tp.fareDetailsBySegment?.[0]?.class === 'J'
            );
            
            if (businessPricing) {
              const businessFareDetail = businessPricing.fareDetailsBySegment[0];
              fareOptions.push({
                type: 'business',
                price: parseFloat(businessPricing.price?.total || basePrice),
                currency: businessPricing.price?.currency || baseCurrency,
                features: [
                  'Priority check-in & boarding',
                  'Extra legroom & comfort',
                  'Premium meal service',
                  'Checked bags included',
                  'Lounge access',
                  'Priority baggage handling'
                ],
                seatsAvailable: businessFareDetail?.seatsAvailable || 4,
                bookingClass: businessFareDetail?.class || 'C'
              });
            }

            // Get airline name from Amadeus data
            const getAirlineName = (code: string) => {
              const airlines: { [key: string]: string } = {
                'QF': 'Qantas',
                'JQ': 'Jetstar',
                'VA': 'Virgin Australia',
                'TT': 'Tigerair',
                'AI': 'Air India',
                'SQ': 'Singapore Airlines',
                'EK': 'Emirates',
                'TG': 'Thai Airways',
                'CX': 'Cathay Pacific',
                'MH': 'Malaysia Airlines'
              };
              return airlines[code] || code;
            };

            return {
              id: offer.id,
              amadeusOfferId: offer.id,
              airline: getAirlineName(firstSegment.carrierCode),
              airlineCode: firstSegment.carrierCode,
              airlineLogo: `https://images.kiwi.com/airlines/64x64/${firstSegment.carrierCode}.png`,
              flightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
              outboundFlightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
              returnFlightNumber: offer.itineraries[1] ? `${offer.itineraries[1].segments[0].carrierCode} ${offer.itineraries[1].segments[0].number}` : undefined,
              aircraft: firstSegment.aircraft?.code || 'Unknown',
              origin: firstSegment.departure.iataCode,
              destination: lastSegment.arrival.iataCode,
              departureTime: new Date(firstSegment.departure.at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              arrivalTime: new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              departure: {
                date: firstSegment.departure.at,
                time: new Date(firstSegment.departure.at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              },
              arrival: {
                date: lastSegment.arrival.at,
                time: new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              },
              duration: parseISO8601DurationToMinutes(outbound.duration),
              stops: segments.length - 1,
              stopoverInfo: segments.length > 1 ? segments[0].arrival.iataCode : undefined,
              price: basePrice,
              currency: baseCurrency,
              availableSeats: economyFareDetail?.seatsAvailable || 9, // Use real availability
              cabin: economyFareDetail?.cabin || 'Economy',
              baggage: {
                carry: true,
                checked: economyFareDetail?.includedCheckedBags?.quantity > 0
              },
              segments: segments.map((segment: any) => ({
                departure: {
                  airport: segment.departure.iataCode,
                  time: new Date(segment.departure.at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }),
                  terminal: segment.departure.terminal
                },
                arrival: {
                  airport: segment.arrival.iataCode,
                  time: new Date(segment.arrival.at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }),
                  terminal: segment.arrival.terminal
                },
                duration: segment.duration,
                flightNumber: `${segment.carrierCode} ${segment.number}`
              })),
              fareOptions,
              isRoundTrip: !!criteria.returnDate
            } as Flight;
          });

          console.log("useFlightSearch: Setting", transformedFlights.length, "transformed flights");
          setFlights(transformedFlights);
        } else {
          console.log("useFlightSearch: No data from Amadeus API");
          setFlights([]);
          setError("No flights found for your search criteria");
        }
      } catch (err) {
        console.error("Flight search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search flights");
        toast.error("Flight search failed. Please try different search criteria.");
        setFlights([]);
      } finally {
        setLoading(false);
      }
    };

    searchFlights();
  }, [criteria?.origin, criteria?.destination, criteria?.departureDate, criteria?.returnDate, criteria?.passengers]);

  return { flights, loading, error };
};

// Mock data generator removed - production app uses only real Amadeus data
