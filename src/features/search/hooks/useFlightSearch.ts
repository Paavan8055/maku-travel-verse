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

interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  airlineLogo?: string;
  flightNumber: string;
  aircraft: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  stops: string;
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
      return;
    }

    const searchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use direct Amadeus Flight Search API for real-time results
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-flight-search', {
          body: {
            origin: criteria.origin,
            destination: criteria.destination,
            departureDate: criteria.departureDate,
            returnDate: criteria.returnDate,
            adults: criteria.passengers,
            children: 0,
            infants: 0,
            travelClass: 'ECONOMY',
            nonStop: false,
            maxPrice: 5000,
            currency: 'USD'
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.flights && Array.isArray(data.flights)) {
          const normalized = data.flights
            .map((f: any) => {
              // Amadeus-like schema with Air India style formatting
              if (f?.airline && f?.departure && f?.arrival && f?.price) {
                return {
                  id: String(f.id ?? `${f.airline?.code}-${f.flightNumber}`),
                  airline: f.airline?.name ?? f.airline?.code ?? "Airline",
                  airlineCode: f.airline?.code ?? "XX",
                  airlineLogo: f.airline?.logo,
                  flightNumber: f.flightNumber ?? f.outboundFlightNumber ?? `${f.airline?.code ?? "XX"}${Math.floor(Math.random()*900)+100}`,
                  outboundFlightNumber: f.outboundFlightNumber,
                  returnFlightNumber: f.returnFlightNumber,
                  aircraft: f.aircraft ?? "Unknown",
                  origin: f.departure?.airport ?? criteria?.origin ?? "Unknown",
                  destination: f.arrival?.airport ?? criteria?.destination ?? "Unknown",
                  departureTime: f.departure?.time ?? "--:--",
                  arrivalTime: f.arrival?.time ?? "--:--",
                  departure: f.departure,
                  arrival: f.arrival,
                  duration: typeof f.duration === 'string' ? f.duration : parseISO8601DurationToMinutes(f.duration),
                  durationMinutes: f.durationMinutes ?? parseISO8601DurationToMinutes(f.duration),
                  stops: String(typeof f.stops === 'number' ? f.stops : (f.stops ?? 0)),
                  stopoverInfo: f.stopoverInfo,
                  price: Math.round(Number(f.price?.amount ?? 0)),
                  currency: f.price?.currency ?? "USD",
                  availableSeats: f.availableSeats ?? 9,
                  cabin: (f.cabinClass ?? "ECONOMY").toString().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                  baggage: {
                    carry: Boolean(f.baggage?.carry_on ?? true),
                    checked: Boolean((f.baggage?.included ?? 0) > 0)
                  },
                  segments: Array.isArray(f.segments) ? f.segments : undefined
                } as Flight;
              }
              // Already in internal shape
              if (f?.airline && f?.origin && f?.destination && typeof f?.price === 'number') {
                return f as Flight;
              }
              return null;
            })
            .filter(Boolean) as Flight[];

          if (normalized.length > 0) {
            setFlights(normalized);
          } else {
            setFlights(generateMockFlights(criteria));
          }
        } else {
          // Fallback to mock data for development
          setFlights(generateMockFlights(criteria));
        }
      } catch (err) {
        console.error("Flight search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search flights");
        toast.error("Failed to search flights. Showing sample results.");
        
        // Show mock data on error
        setFlights(generateMockFlights(criteria));
      } finally {
        setLoading(false);
      }
    };

    searchFlights();
  }, [criteria?.origin, criteria?.destination, criteria?.departureDate, criteria?.returnDate, criteria?.passengers]);

  return { flights, loading, error };
};

// Mock data generator for development
const generateMockFlights = (criteria: FlightSearchCriteria): Flight[] => {
  const airlines = [
    { name: "Qantas", code: "QF", logo: "https://logos-world.net/wp-content/uploads/2023/01/Qantas-Logo.png" },
    { name: "Jetstar", code: "JQ", logo: "https://logos-world.net/wp-content/uploads/2023/01/Jetstar-Logo.png" },
    { name: "Virgin Australia", code: "VA", logo: "https://logos-world.net/wp-content/uploads/2023/01/Virgin-Australia-Logo.png" },
    { name: "Singapore Airlines", code: "SQ", logo: "https://logos-world.net/wp-content/uploads/2023/01/Singapore-Airlines-Logo.png" },
    { name: "Emirates", code: "EK", logo: "https://logos-world.net/wp-content/uploads/2023/01/Emirates-Logo.png" }
  ];

  const flights: Flight[] = [];
  
  for (let i = 0; i < 8; i++) {
    const airline = airlines[i % airlines.length];
    const basePrice = 300 + Math.random() * 800;
    const duration = 120 + Math.random() * 480; // 2-10 hours
    const stops = Math.random() < 0.3 ? "0" : Math.random() < 0.7 ? "1" : "2";
    
    flights.push({
      id: `flight-${i + 1}`,
      airline: airline.name,
      airlineCode: airline.code,
      airlineLogo: airline.logo,
      flightNumber: `${airline.code}${Math.floor(Math.random() * 900) + 100}`,
      aircraft: "Boeing 737",
      origin: criteria.origin,
      destination: criteria.destination,
      departureTime: `${Math.floor(Math.random() * 12) + 6}:${(Math.floor(Math.random() * 6) * 10).toString().padStart(2, '0')}`,
      arrivalTime: `${Math.floor(Math.random() * 12) + 6}:${(Math.floor(Math.random() * 6) * 10).toString().padStart(2, '0')}`,
      duration: Math.round(duration),
      stops,
      price: Math.round(basePrice),
      currency: "$",
      availableSeats: Math.floor(Math.random() * 20) + 1,
      cabin: Math.random() < 0.7 ? "Economy" : "Business",
      baggage: {
        carry: true,
        checked: Math.random() < 0.8
      }
    });
  }

  return flights.sort((a, b) => a.price - b.price);
};