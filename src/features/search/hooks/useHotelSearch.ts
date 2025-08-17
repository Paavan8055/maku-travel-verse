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

interface SearchMeta {
  pathTaken: string[];
  dateAdjusted: boolean;
  suggestedDates?: { checkIn: string; checkOut: string };
  alternativeAreas?: string[];
  apiCallsUsed: number;
  errors: Array<{ step: string; error: string; statusCode?: number }>;
  totalResults: number;
  isEmpty?: boolean;
  message?: string;
  alternativeSuggestions?: string[];
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
  const [isEmpty, setIsEmpty] = useState(false);
  const [meta, setMeta] = useState<SearchMeta | null>(null);

  useEffect(() => {
    console.log("Hotel search criteria:", criteria);
    
    // Set default values if criteria is missing to force real API calls
    // Use dates further in the future for better hotel availability
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);
    const tenDaysFromNow = new Date(Date.now() + 10 * 86400000);
    
    const searchCriteria = {
      destination: criteria.destination || "Sydney",
      checkIn: criteria.checkIn || sevenDaysFromNow.toISOString().split('T')[0], // 7 days from now
      checkOut: criteria.checkOut || tenDaysFromNow.toISOString().split('T')[0], // 10 days from now (3 night stay)
      guests: criteria.guests || 2
    };
    
    console.log("Using search criteria (with defaults):", searchCriteria);

    const searchHotels = async () => {
      console.log("Starting hotel search...");
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      setMeta(null);

      try {
        console.log("Calling amadeus-hotel-search function with:", {
          destination: searchCriteria.destination,
          checkInDate: searchCriteria.checkIn,
          checkOutDate: searchCriteria.checkOut,
          guests: searchCriteria.guests
        });

        // Use enhanced Amadeus Hotel Search API with robust fallback strategy
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-hotel-search', {
          body: {
            destination: searchCriteria.destination,
            checkInDate: searchCriteria.checkIn,
            checkOutDate: searchCriteria.checkOut,
            guests: searchCriteria.guests,
            rooms: 1
          }
        });

        console.log("Amadeus hotel search response:", { data, error: functionError });

        if (functionError) {
          console.error("Amadeus API error:", functionError);
          setError("Failed to search hotels with Amadeus API");
          toast.error("Hotel search failed. Please try again.");
          setHotels([]);
          setIsEmpty(true);
          return;
        }

        // Handle the response with new metadata structure
        if (data?.success) {
          setMeta(data.meta || null);
          
          if (data.isEmpty || !data.hotels || data.hotels.length === 0) {
            console.log("No hotels found, showing empty state with suggestions");
            setIsEmpty(true);
            setHotels([]);
            setError(data.error || "No hotels found for your search criteria");
            
            // Show helpful message based on metadata
            if (data.meta?.dateAdjusted && data.meta?.suggestedDates) {
              toast.info(`Moved search to ${data.meta.suggestedDates.checkIn} - ${data.meta.suggestedDates.checkOut} for test availability`);
            } else if (data.meta?.alternativeSuggestions?.length > 0) {
              toast.info("No hotels found. " + data.meta.alternativeSuggestions[0]);
            }
          } else {
            console.log("Found real hotel data:", data.hotels.length, "hotels");
            
            // Show date adjustment notification if applicable
            if (data.meta?.dateAdjusted && data.meta?.suggestedDates) {
              toast.info(`Dates adjusted to ${data.meta.suggestedDates.checkIn} - ${data.meta.suggestedDates.checkOut} for better availability`);
            }
            
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
            setIsEmpty(false);
          }
        } else {
          console.error("API call failed:", data);
          setError(data?.error || "Failed to search hotels");
          setHotels([]);
          setIsEmpty(true);
          toast.error("Hotel search failed. Please try again.");
        }
      } catch (err) {
        console.error("Hotel search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search hotels");
        toast.error("Failed to search hotels. Please try again.");
        setHotels([]);
        setIsEmpty(true);
      } finally {
        setLoading(false);
      }
    };

    searchHotels();
  }, [criteria.destination, criteria.checkIn, criteria.checkOut, criteria.guests]);

  return { hotels, loading, error, isEmpty, meta };
};

// This function has been removed to force use of real Amadeus data only