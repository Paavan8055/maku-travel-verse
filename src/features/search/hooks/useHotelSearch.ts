import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HotelSearchCriteria {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  images: string[];
  starRating: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  totalPrice: number;
  propertyType: string;
  distanceFromCenter: number;
  amenities: string[];
  cancellationPolicy: string;
  breakfast: boolean;
  deals?: {
    type: string;
    description: string;
    savings: number;
  };
}

export const useHotelSearch = (criteria: HotelSearchCriteria) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!criteria.destination || !criteria.checkIn || !criteria.checkOut) {
      return;
    }

    const searchHotels = async () => {
      setLoading(true);
      setError(null);

      try {
        // Call unified search with real providers
        const { data, error: functionError } = await supabase.functions.invoke('unified-search', {
          body: {
            type: 'hotel',
            destination: criteria.destination,
            checkIn: criteria.checkIn,
            checkOut: criteria.checkOut,
            guests: criteria.guests,
            providers: ['hotelbeds', 'travelport']
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.hotels) {
          setHotels(data.hotels);
        } else {
          // Fallback to mock data for development
          setHotels(generateMockHotels(criteria));
        }
      } catch (err) {
        console.error("Hotel search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search hotels");
        toast.error("Failed to search hotels. Showing sample results.");
        
        // Show mock data on error
        setHotels(generateMockHotels(criteria));
      } finally {
        setLoading(false);
      }
    };

    searchHotels();
  }, [criteria.destination, criteria.checkIn, criteria.checkOut, criteria.guests]);

  return { hotels, loading, error };
};

// Mock data generator for development
const generateMockHotels = (criteria: HotelSearchCriteria): Hotel[] => {
  const hotelNames = [
    "Shangri-La Sydney",
    "Park Hyatt Sydney",
    "Four Seasons Sydney",
    "The Langham Sydney",
    "InterContinental Sydney",
    "Hilton Sydney",
    "Marriott Sydney Harbour",
    "Swissotel Sydney"
  ];

  const propertyTypes = ["Hotel", "Resort", "Boutique", "Apartment"];
  const amenities = ["WiFi", "Pool", "Gym", "Spa", "Parking", "Restaurant", "Bar", "Room Service"];

  const hotels: Hotel[] = [];
  
  const checkInDate = new Date(criteria.checkIn);
  const checkOutDate = new Date(criteria.checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

  for (let i = 0; i < hotelNames.length; i++) {
    const basePrice = 150 + Math.random() * 350;
    const starRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
    const rating = 3.5 + Math.random() * 1.5; // 3.5-5.0 rating
    const hotelAmenities = amenities.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 3);
    
    hotels.push({
      id: `hotel-${i + 1}`,
      name: hotelNames[i],
      description: `Experience luxury and comfort at ${hotelNames[i]}, perfectly located in the heart of ${criteria.destination}. Enjoy stunning views, world-class amenities, and exceptional service.`,
      address: `${Math.floor(Math.random() * 500) + 1} ${criteria.destination} Street, ${criteria.destination}`,
      images: ["/placeholder.svg"],
      starRating,
      rating: Math.round(rating * 10) / 10,
      reviewCount: Math.floor(Math.random() * 2000) + 100,
      pricePerNight: Math.round(basePrice),
      currency: "$",
      totalPrice: Math.round(basePrice * nights),
      propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      distanceFromCenter: Math.round((Math.random() * 5 + 0.1) * 10) / 10,
      amenities: hotelAmenities,
      cancellationPolicy: Math.random() < 0.6 ? "Free cancellation" : "Non-refundable",
      breakfast: Math.random() < 0.4,
      deals: Math.random() < 0.3 ? {
        type: "Early Bird",
        description: "Book now and save",
        savings: Math.floor(Math.random() * 100) + 20
      } : undefined
    });
  }

  return hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
};