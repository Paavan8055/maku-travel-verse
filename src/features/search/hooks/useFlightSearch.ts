
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { detectFlightCurrency } from "@/lib/currencyDetection";
import logger from '@/utils/logger';
import { getAirlineLogo, getAirlineName, formatFlightNumber } from '@/utils/airline';
import { standardizeFlightData } from '@/utils/flight';

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
    if (!criteria || !criteria.origin || !criteria.destination || !criteria.departureDate || criteria.departureDate === "") {
      console.log("useFlightSearch: Missing or invalid criteria", criteria);
      setFlights([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Validate date format (should be ISO 8601 YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(criteria.departureDate)) {
      console.error("useFlightSearch: Invalid date format", criteria.departureDate);
      setError("Invalid departure date format. Please select a valid date.");
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

        // Use provider rotation for multi-provider flight search with Sabre fallback
        const { data, error: functionError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'flight',
            params: {
              origin: criteria.origin.toUpperCase(),
              destination: criteria.destination.toUpperCase(),
              departure_date: criteria.departureDate, // Use snake_case for API consistency
              return_date: criteria.returnDate,
              passengers: criteria.passengers || 1,
              adults: criteria.passengers || 1,
              children: 0,
              infants: 0,
              travelClass: 'ECONOMY',
              cabin: 'ECONOMY',
              nonStop: false,
              currency: currencyCode
            }
          }
        });

        if (functionError) {
          throw functionError;
        }

        // Handle different response structures from provider-rotation
        const rawFlights = data?.data?.flights || data?.flights || (Array.isArray(data?.data) ? data.data : []);
        
        if (data?.success && rawFlights && Array.isArray(rawFlights) && rawFlights.length > 0) {
          console.log("useFlightSearch: Provider rotation success, transforming", rawFlights.length, "flights");
          console.log("Used provider:", data.provider, "Fallback used:", data.fallbackUsed);
          
          const transformedFlights = rawFlights.map((rawFlight: any, index: number) => {
            console.log(`Processing flight ${index + 1}:`, rawFlight);

            // Use standardizeFlightData to normalize the data structure (let it auto-detect provider)
            const std = standardizeFlightData(rawFlight);
            
            // Extract airline information
            const airlineCode = std.carrier || rawFlight.validatingAirlineCodes?.[0] || rawFlight.carrierCode || 'XX';
            const airlineName = std.carrierName || getAirlineName(airlineCode);
            
            // Extract price information
            const priceNumber = typeof std.price?.total === 'string' ? parseFloat(std.price.total) : (std.price?.total ?? 0);
            const currency = std.price?.currency || 'AUD';

            const transformedFlight = {
              id: std.id,
              airline: airlineName,
              airlineCode,
              airlineLogo: getAirlineLogo(airlineCode),
              flightNumber: formatFlightNumber(airlineCode, std.flightNumber || ''),
              outboundFlightNumber: formatFlightNumber(airlineCode, std.flightNumber || ''),
              returnFlightNumber: undefined, // Not available in StandardizedFlight
              aircraft: std.aircraft || 'Unknown Aircraft',
              origin: std.departure?.airport,
              destination: std.arrival?.airport,
              departureTime: std.departure?.time,
              arrivalTime: std.arrival?.time,
              departure: std.departure,
              arrival: std.arrival,
              duration: std.duration,
              stops: std.stops ?? 0,
              stopoverInfo: std.stops && std.stops > 0 ? `${std.stops} stop${std.stops > 1 ? 's' : ''}` : undefined,
              price: priceNumber,
              currency,
              availableSeats: std.availableSeats ?? 9,
              cabin: std.cabinClass || 'ECONOMY',
              baggage: { 
                carry: std.amenities?.baggage ?? true, 
                checked: std.amenities?.baggage ?? false 
              },
              segments: [], // Not available in StandardizedFlight, could be added later
              fareOptions: [{
                type: 'economy',
                price: priceNumber,
                currency,
                features: ['Standard seat selection', 'Carry-on bag included'],
                seatsAvailable: 9,
                bookingClass: 'M'
              }],
              isRoundTrip: !!criteria.returnDate,
              amadeusOfferId: std.offerId || std.id
            } as Flight;

            // Log the first transformed flight for debugging
            if (index === 0) {
              console.log("First transformed flight:", {
                id: transformedFlight.id,
                airline: transformedFlight.airline,
                airlineCode: transformedFlight.airlineCode,
                price: transformedFlight.price,
                currency: transformedFlight.currency,
                airlineLogo: transformedFlight.airlineLogo
              });
            }

            return transformedFlight;
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
