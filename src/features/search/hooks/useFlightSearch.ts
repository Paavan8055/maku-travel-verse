
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { detectFlightCurrency } from "@/lib/currencyDetection";
import logger from '@/utils/logger';

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
    if (!criteria || !criteria.origin || !criteria.destination || !criteria.departureDate) {
      console.log("useFlightSearch: Missing criteria", criteria);
      setFlights([]);
      setError(null);
      setLoading(false);
      return;
    }

    console.log("useFlightSearch: Starting search with criteria:", criteria);

    const searchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        // Detect appropriate currency based on flight route
        const currencyCode = detectFlightCurrency(criteria.origin, criteria.destination);
        console.log(`useFlightSearch: Using currency ${currencyCode} for route ${criteria.origin}-${criteria.destination}`);

        // Use Amadeus Flight Search API for real-time results
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-flight-search', {
          body: {
            origin: criteria.origin,
            destination: criteria.destination,
            departureDate: criteria.departureDate,
            returnDate: criteria.returnDate,
            passengers: criteria.passengers,
            travelClass: 'ECONOMY',
            nonStop: false
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.success && data?.flights && Array.isArray(data.flights)) {
          console.log("useFlightSearch: API success, transforming", data.flights.length, "flights");
          
          if (data.flights.length === 0) {
            console.log("useFlightSearch: No flights found in API response");
            setFlights([]);
            setError("No flights found for your search criteria. Please try different dates or destinations.");
            return;
          }
          
          console.log("Raw Amadeus flights:", data.flights.length);
          
          const transformedFlights = data.flights.map((flight: any, index: number) => {
            console.log(`Processing flight ${index + 1}:`, {
              flightId: flight.id,
              airline: flight.airline?.name,
              price: flight.price
            });

            // Map flight data to our expected format
            return {
              id: flight.id,
              airline: flight.airline?.name || flight.airline?.code || 'Unknown',
              airlineCode: flight.airline?.code,
              airlineLogo: flight.airline?.logo,
              flightNumber: flight.flightNumber,
              outboundFlightNumber: flight.outboundFlightNumber,
              returnFlightNumber: flight.returnFlightNumber,
              aircraft: flight.aircraft,
              origin: flight.departure?.airport,
              destination: flight.arrival?.airport,
              departureTime: flight.departure?.time,
              arrivalTime: flight.arrival?.time,
              departure: flight.departure,
              arrival: flight.arrival,
              duration: flight.durationMinutes || flight.duration,
              stops: flight.stops || 0,
              stopoverInfo: flight.stopoverInfo,
              price: flight.price?.amount || 0,
              currency: flight.price?.currency || 'USD',
              availableSeats: flight.availableSeats || 9,
              cabin: flight.cabinClass || 'ECONOMY',
              baggage: flight.baggage || { carry: true, checked: false },
              segments: flight.segments || [],
              fareOptions: [{
                type: 'economy',
                price: flight.price?.amount || 0,
                currency: flight.price?.currency || 'USD',
                features: ['Standard seat selection', 'Carry-on bag included'],
                seatsAvailable: 9,
                bookingClass: 'M'
              }],
              isRoundTrip: !!criteria.returnDate,
              amadeusOfferId: flight.id
            } as Flight;
          });

          console.log("useFlightSearch: Setting", transformedFlights.length, "transformed flights");
          setFlights(transformedFlights);
        } else {
          console.log("useFlightSearch: No flight data from API", data);
          setFlights([]);
          if (data?.error) {
            setError(`Amadeus API Error: ${data.error}. Please try different search criteria or check back later.`);
          } else {
            setError("No flights found for your search criteria. Please try different dates, destinations, or check our flight alternatives.");
          }
        }
      } catch (err) {
        logger.error("Flight search error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to search flights";
        
        // Provide specific error messages based on error type
        if (errorMessage.includes('credentials') || errorMessage.includes('auth')) {
          setError("Flight search service is temporarily unavailable due to authentication issues. Please try again in a few minutes.");
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError("Network connection issue. Please check your internet connection and try again.");
        } else if (errorMessage.includes('rate limit')) {
          setError("Too many requests. Please wait a moment before searching again.");
        } else {
          setError(`Amadeus Flight Search Error: ${errorMessage}. Please try different search criteria or check back later.`);
        }
        
        toast.error("Flight search temporarily unavailable. Please try again in a few minutes.");
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
