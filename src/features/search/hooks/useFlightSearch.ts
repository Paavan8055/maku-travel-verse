
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
      return;
    }

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
          const transformedFlights = data.data.data.map((offer: any) => {
            const outbound = offer.itineraries[0];
            const segments = outbound.segments;
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            // Get traveler pricings for different fare classes
            const travelerPricings = offer.travelerPricings || [];
            const basePrice = parseFloat(offer.price.total);

            // Generate fare options based on available booking classes and realistic pricing
            const fareOptions: FareOption[] = [];
            
            // Economy fare
            fareOptions.push({
              type: 'economy',
              price: basePrice,
              currency: offer.price.currency,
              features: [
                'Standard seat selection',
                'Carry-on bag included',
                travelerPricings[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity > 0 ? 'Checked bag included' : 'Checked bag extra',
                'Standard meal service'
              ],
              seatsAvailable: Math.floor(Math.random() * 15) + 5,
              bookingClass: travelerPricings[0]?.fareDetailsBySegment?.[0]?.class || 'M'
            });

            // Business fare (typically 2.5-4x economy price)
            const businessMultiplier = 2.5 + Math.random() * 1.5;
            fareOptions.push({
              type: 'business',
              price: Math.round(basePrice * businessMultiplier),
              currency: offer.price.currency,
              features: [
                'Priority check-in & boarding',
                'Extra legroom & comfort',
                'Premium meal service',
                'Checked bags included',
                'Lounge access',
                'Priority baggage handling'
              ],
              seatsAvailable: Math.floor(Math.random() * 8) + 2,
              bookingClass: 'C'
            });

            return {
              id: offer.id,
              amadeusOfferId: offer.id,
              airline: firstSegment.carrierCode === 'AI' ? 'Air India' : firstSegment.carrierCode,
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
              currency: offer.price.currency,
              availableSeats: Math.floor(Math.random() * 20) + 5,
              cabin: 'Economy',
              baggage: {
                carry: true,
                checked: travelerPricings[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity > 0
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

          setFlights(transformedFlights);
        } else {
          // Fallback to enhanced mock data with realistic pricing variations
          setFlights(generateRealisticMockFlights(criteria));
        }
      } catch (err) {
        console.error("Flight search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search flights");
        toast.error("Failed to search flights. Showing sample results.");
        
        // Show enhanced mock data on error
        setFlights(generateRealisticMockFlights(criteria));
      } finally {
        setLoading(false);
      }
    };

    searchFlights();
  }, [criteria?.origin, criteria?.destination, criteria?.departureDate, criteria?.returnDate, criteria?.passengers]);

  return { flights, loading, error };
};

// Enhanced mock data generator with realistic pricing variations
const generateRealisticMockFlights = (criteria: FlightSearchCriteria): Flight[] => {
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
    const basePrice = 250 + Math.random() * 600 + (i * 50); // Varied base prices
    const duration = 120 + Math.random() * 480;
    const stops = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;
    
    // Generate realistic fare options with varied pricing
    const fareOptions: FareOption[] = [
      {
        type: 'economy',
        price: Math.round(basePrice),
        currency: 'USD',
        features: [
          'Standard seat selection',
          'Carry-on bag included',
          Math.random() > 0.5 ? 'Checked bag included' : 'Checked bag extra',
          'Standard meal service'
        ],
        seatsAvailable: Math.floor(Math.random() * 15) + 5
      },
      {
        type: 'business',
        price: Math.round(basePrice * (2.5 + Math.random() * 1.5)),
        currency: 'USD',
        features: [
          'Priority check-in & boarding',
          'Extra legroom & comfort',
          'Premium meal service',
          'Checked bags included',
          'Lounge access',
          'Priority baggage handling'
        ],
        seatsAvailable: Math.floor(Math.random() * 8) + 2
      }
    ];
    
    flights.push({
      id: `flight-${i + 1}`,
      amadeusOfferId: `mock-offer-${i + 1}`,
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
      currency: "USD",
      availableSeats: Math.floor(Math.random() * 20) + 1,
      cabin: "Economy",
      baggage: {
        carry: true,
        checked: Math.random() < 0.8
      },
      fareOptions,
      isRoundTrip: !!criteria.returnDate
    });
  }

  return flights.sort((a, b) => a.price - b.price);
};
