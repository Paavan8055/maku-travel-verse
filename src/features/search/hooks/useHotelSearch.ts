import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import hotel images
import shangriLaImg from "@/assets/hotel-shangri-la.jpg";
import parkHyattImg from "@/assets/hotel-park-hyatt.jpg";
import boutiqueImg from "@/assets/hotel-boutique.jpg";
import budgetImg from "@/assets/hotel-budget.jpg";

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
  safetyRating?: string;
  pointsOfInterest?: any[];
  deals?: {
    type: string;
    description: string;
    savings: number;
  };
}

// Transform Amadeus hotel data to our interface - NO MOCK DATA
const transformAmadeusHotel = (amadeusHotel: any): Hotel => {
  return {
    id: amadeusHotel.id || amadeusHotel.hotelId || `hotel-${Date.now()}`,
    name: amadeusHotel.name || 'Hotel',
    description: amadeusHotel.description || 'Hotel accommodation',
    address: amadeusHotel.location?.address || amadeusHotel.address || 'Location not available',
    images: amadeusHotel.images && amadeusHotel.images.length > 0 ? amadeusHotel.images : ['/placeholder.svg'],
    starRating: amadeusHotel.starRating || amadeusHotel.rating || 0,
    rating: amadeusHotel.guestRating || 0,
    reviewCount: amadeusHotel.reviewCount || 0,
    pricePerNight: amadeusHotel.pricePerNight || 0,
    currency: amadeusHotel.currency || 'USD',
    totalPrice: amadeusHotel.totalPrice || 0,
    propertyType: amadeusHotel.propertyType || 'Hotel',
    distanceFromCenter: amadeusHotel.distanceFromCenter || 0,
    amenities: amadeusHotel.amenities || [],
    cancellationPolicy: amadeusHotel.cancellationPolicy || 'No cancellation policy available',
    breakfast: amadeusHotel.breakfast || false,
    safetyRating: amadeusHotel.safetyRating,
    pointsOfInterest: amadeusHotel.pointsOfInterest,
    deals: amadeusHotel.deals
  };
};

export const useHotelSearch = (criteria: HotelSearchCriteria) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Hotel search criteria:", criteria);
    
    // Set default values if criteria is missing to force real API calls
    const searchCriteria = {
      destination: criteria.destination || "Sydney",
      checkIn: criteria.checkIn || new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      checkOut: criteria.checkOut || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
      guests: criteria.guests || 2
    };
    
    console.log("Using search criteria (with defaults):", searchCriteria);

    const searchHotels = async () => {
      console.log("Starting hotel search...");
      setLoading(true);
      setError(null);

      try {
        console.log("Calling amadeus-hotel-search function with:", {
          destination: searchCriteria.destination,
          checkInDate: searchCriteria.checkIn,
          checkOutDate: searchCriteria.checkOut,
          guests: searchCriteria.guests
        });

        // Use direct Amadeus Hotel Search API with correct parameter names
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-hotel-search', {
          body: {
            destination: searchCriteria.destination,
            checkInDate: searchCriteria.checkIn,
            checkOutDate: searchCriteria.checkOut,
            guests: searchCriteria.guests,
            rooms: 1,
            radius: 5,
            bestRateOnly: true
          }
        });

        console.log("Amadeus hotel search response:", { data, error: functionError });

        if (functionError) {
          console.error("Amadeus API error:", functionError);
          setError("Failed to search hotels with Amadeus API");
          toast.error("Hotel search failed. Please try again.");
          setHotels([]);
          return;
        }

        if (data?.success && data?.hotels && data.hotels.length > 0) {
          console.log("Found real hotel data:", data.hotels.length, "hotels");
          
          // Transform Amadeus data to match our Hotel interface and enrich with additional data
          const transformedHotels = await Promise.all(
            data.hotels.map(async (hotel: any) => {
              const baseHotel = transformAmadeusHotel(hotel);
              
              // Enrich with real photos if hotel ID is available
              if (hotel.hotelId || hotel.id) {
                try {
                  const photosResponse = await supabase.functions.invoke('amadeus-hotel-photos', {
                    body: { hotelId: hotel.hotelId || hotel.id }
                  });
                  
                  if (photosResponse.data?.success && photosResponse.data.photos?.length > 0) {
                    baseHotel.images = photosResponse.data.photos.map((photo: any) => photo.url);
                  }
                } catch (photoErr) {
                  console.warn("Failed to fetch photos for hotel:", hotel.hotelId || hotel.id, photoErr);
                }
              }
              
              // Add safety rating if coordinates are available
              if (hotel.location?.latitude && hotel.location?.longitude) {
                try {
                  const safetyResponse = await supabase.functions.invoke('amadeus-safe-place', {
                    body: { 
                      latitude: hotel.location.latitude, 
                      longitude: hotel.location.longitude 
                    }
                  });
                  
                  if (safetyResponse.data?.success && safetyResponse.data.safetyInfo) {
                    baseHotel.safetyRating = safetyResponse.data.safetyInfo.overallSafety;
                  }
                } catch (safetyErr) {
                  console.warn("Failed to fetch safety rating for hotel:", hotel.hotelId || hotel.id, safetyErr);
                }
              }
              
              return baseHotel;
            })
          );
          
          setHotels(transformedHotels);
        } else {
          console.error("No hotels found in Amadeus response:", data);
          setError("No hotels found for your search criteria");
          setHotels([]);
        }
      } catch (err) {
        console.error("Hotel search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search hotels");
        toast.error("Failed to search hotels. Please try again.");
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    searchHotels();
  }, [criteria.destination, criteria.checkIn, criteria.checkOut, criteria.guests]);

  return { hotels, loading, error };
};

// This function has been removed to force use of real Amadeus data only