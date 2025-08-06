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
  flightNumber: string;
  aircraft: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: string;
  price: number;
  currency: string;
  availableSeats: number;
  cabin: string;
  baggage: {
    carry: boolean;
    checked: boolean;
  };
}

export const useFlightSearch = (criteria: FlightSearchCriteria) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!criteria.destination || !criteria.departureDate) {
      return;
    }

    const searchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        // Call unified search with real providers
        const { data, error: functionError } = await supabase.functions.invoke('unified-search', {
          body: {
            type: 'flight',
            origin: criteria.origin,
            destination: criteria.destination,
            departureDate: criteria.departureDate,
            returnDate: criteria.returnDate,
            passengers: criteria.passengers,
            providers: ['amadeus', 'travelport']
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.flights) {
          setFlights(data.flights);
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
  }, [criteria.origin, criteria.destination, criteria.departureDate, criteria.returnDate, criteria.passengers]);

  return { flights, loading, error };
};

// Mock data generator for development
const generateMockFlights = (criteria: FlightSearchCriteria): Flight[] => {
  const airlines = [
    { name: "Qantas", code: "QF" },
    { name: "Jetstar", code: "JQ" },
    { name: "Virgin Australia", code: "VA" },
    { name: "Singapore Airlines", code: "SQ" },
    { name: "Emirates", code: "EK" }
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
      flightNumber: `${airline.code}${Math.floor(Math.random() * 900) + 100}`,
      aircraft: "Boeing 737",
      origin: criteria.origin,
      destination: criteria.destination,
      departureTime: `${Math.floor(Math.random() * 12) + 6}:${Math.floor(Math.random() * 6) * 10}`,
      arrivalTime: `${Math.floor(Math.random() * 12) + 6}:${Math.floor(Math.random() * 6) * 10}`,
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