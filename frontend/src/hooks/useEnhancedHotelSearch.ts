import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from "@/utils/logger";

interface HotelSearchCriteria {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  hotelName?: string;
}

interface EnhancedHotel {
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
  provider: string;
  // HotelBeds specific
  boardTypes?: string[];
  roomOptions?: Array<{
    id: string;
    name: string;
    description: string;
    bedType: string;
    occupancy: number;
    size: string;
    pricePerNight: number;
    boardType: 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
    amenities: string[];
    cancellationPolicy: string;
    isRefundable: boolean;
  }>;
  // Enhanced features
  deals?: {
    type: string;
    description: string;
    savings: number;
  };
  safetyRating?: string;
  pointsOfInterest?: any[];
}

interface SearchState {
  hotels: EnhancedHotel[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  provider: string | null;
  fallbackUsed: boolean;
}

export const useEnhancedHotelSearch = (criteria: HotelSearchCriteria | null) => {
  const [state, setState] = useState<SearchState>({
    hotels: [],
    loading: false,
    error: null,
    isEmpty: false,
    provider: null,
    fallbackUsed: false
  });

  const searchHotels = useCallback(async (searchCriteria: HotelSearchCriteria) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔍 Enhanced hotel search with criteria:', searchCriteria);

      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            destination: searchCriteria.destination,
            checkIn: searchCriteria.checkIn,
            checkOut: searchCriteria.checkOut,
            guests: searchCriteria.guests,
            rooms: searchCriteria.rooms,
            currency: 'AUD',
            hotelName: searchCriteria.hotelName,
            // HotelBeds specific parameters
            occupancy: [{
              adults: Math.floor(searchCriteria.guests / searchCriteria.rooms),
              children: searchCriteria.guests % searchCriteria.rooms
            }]
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Search failed');
      }

      // Enhanced hotel processing with image fetching
      const enhancedHotels = await Promise.all(
        (data.data || []).map(async (hotel: any) => {
          let images = hotel.images || [];
          
          // For Amadeus hotels, fetch additional photos
          if (hotel.provider === 'amadeus' && (!images.length || images.length < 3)) {
            try {
              const { data: photosData } = await supabase.functions.invoke('amadeus-hotel-photos', {
                body: { hotelId: hotel.id }
              });
              
              if (photosData?.success && photosData.photos?.length > 0) {
                images = [...images, ...photosData.photos.map((p: any) => p.url)];
              }
            } catch (photoError) {
              logger.warn(`Failed to fetch photos for hotel ${hotel.id}:`, photoError);
            }
          }

          return {
            ...hotel,
            images: images.length > 0 ? images : ['/assets/hotel-business.jpg'],
            // Ensure all required fields
            rating: hotel.rating || hotel.starRating || 4.0,
            reviewCount: hotel.reviewCount || 0,
            amenities: hotel.amenities || ['WiFi', 'Reception'],
            cancellationPolicy: hotel.cancellationPolicy || 'Standard cancellation policy applies',
            breakfast: hotel.breakfast || false,
            provider: data.provider || 'unknown',
            // Enhanced data structure
            roomOptions: hotel.roomOptions || [],
            boardTypes: hotel.boardTypes || ['room_only'],
            deals: hotel.deals,
            safetyRating: hotel.safetyRating,
            pointsOfInterest: hotel.pointsOfInterest || []
          } as EnhancedHotel;
        })
      );

      setState({
        hotels: enhancedHotels,
        loading: false,
        error: null,
        isEmpty: enhancedHotels.length === 0,
        provider: data.provider,
        fallbackUsed: data.fallbackUsed || false
      });

      // User feedback
      if (data.fallbackUsed) {
        toast.info("Showing sample hotels while we restore full service.");
      } else if (enhancedHotels.length > 0) {
        toast.success(`Found ${enhancedHotels.length} hotels with ${data.provider} provider`);
      } else {
        toast.info("No hotels found for your search criteria. Try different dates or locations.");
      }

    } catch (error) {
      logger.error("Enhanced hotel search error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        hotels: [],
        isEmpty: true
      }));
      
      toast.error(`Hotel search failed: ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    if (!criteria?.destination || !criteria?.checkIn || !criteria?.checkOut) {
      return;
    }

    const controller = new AbortController();
    searchHotels(criteria);
    
    return () => {
      controller.abort();
    };
  }, [criteria, searchHotels]);

  return {
    ...state,
    refetch: () => criteria && searchHotels(criteria)
  };
};