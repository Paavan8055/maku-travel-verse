import { useState, useEffect, useReducer, useMemo, useCallback } from "react";
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
  hotelName?: string;
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

// State management with reducer for stability
interface SearchState {
  hotels: Hotel[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  meta: SearchMeta | null;
}

type SearchAction = 
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: { hotels: Hotel[]; meta: SearchMeta | null } }
  | { type: 'SEARCH_ERROR'; payload: string }
  | { type: 'SEARCH_EMPTY'; payload: { error?: string; meta?: SearchMeta | null } };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SEARCH_START':
      return { ...state, loading: true, error: null, isEmpty: false };
    case 'SEARCH_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        hotels: action.payload.hotels, 
        meta: action.payload.meta,
        isEmpty: action.payload.hotels.length === 0,
        error: null 
      };
    case 'SEARCH_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        hotels: [], 
        isEmpty: true,
        meta: null 
      };
    case 'SEARCH_EMPTY':
      return { 
        ...state, 
        loading: false, 
        isEmpty: true, 
        hotels: [], 
        error: action.payload.error || null,
        meta: action.payload.meta || null 
      };
    default:
      return state;
  }
};

export const useHotelSearch = (criteria: HotelSearchCriteria | null) => {
  const [state, dispatch] = useReducer(searchReducer, {
    hotels: [],
    loading: false,
    error: null,
    isEmpty: false,
    meta: null
  });

  // Memoize search criteria to prevent unnecessary re-renders - only when criteria is provided
  const memoizedCriteria = useMemo(() => criteria, [
    criteria?.destination,
    criteria?.checkIn,
    criteria?.checkOut,
    criteria?.guests,
    criteria?.hotelName
  ]);

  // Stable search function
  const searchHotels = useCallback(async (searchCriteria: typeof memoizedCriteria, signal: AbortSignal) => {
    try {
      dispatch({ type: 'SEARCH_START' });

        const { data, error: functionError } = await supabase.functions.invoke('amadeus-hotel-search', {
        body: {
          destination: searchCriteria.destination,
          checkIn: searchCriteria.checkIn, // FIXED: Use checkIn not checkInDate
          checkOut: searchCriteria.checkOut, // FIXED: Use checkOut not checkOutDate
          guests: searchCriteria.guests,
          rooms: 1,
          hotelName: searchCriteria.hotelName
        }
      });

      // Check if request was aborted
      if (signal.aborted) return;

      if (functionError) {
        console.error("Amadeus API error:", functionError);
        dispatch({ type: 'SEARCH_ERROR', payload: "Failed to search hotels with Amadeus API" });
        toast.error("Hotel search failed. Please try again.");
        return;
      }

      if (data?.success) {
        if (data.isEmpty || !data.hotels || data.hotels.length === 0) {
          dispatch({ 
            type: 'SEARCH_EMPTY', 
            payload: { 
              error: data.error || "No hotels found for your search criteria",
              meta: data.meta 
            }
          });
          
          if (data.meta?.dateAdjusted && data.meta?.suggestedDates) {
            toast.info(`Moved search to ${data.meta.suggestedDates.checkIn} - ${data.meta.suggestedDates.checkOut} for test availability`);
          } else if (data.meta?.alternativeSuggestions?.length > 0) {
            toast.info("No hotels found. " + data.meta.alternativeSuggestions[0]);
          }
        } else {
          if (data.meta?.dateAdjusted && data.meta?.suggestedDates) {
            toast.info(`Dates adjusted to ${data.meta.suggestedDates.checkIn} - ${data.meta.suggestedDates.checkOut} for better availability`);
          }
          
          // Transform hotels without making additional API calls for now (for stability)
          const transformedHotels = data.hotels.map(transformAmadeusHotel);
          
          dispatch({ 
            type: 'SEARCH_SUCCESS', 
            payload: { 
              hotels: transformedHotels, 
              meta: data.meta 
            }
          });
        }
      } else {
        dispatch({ 
          type: 'SEARCH_ERROR', 
          payload: data?.error || "Failed to search hotels" 
        });
        toast.error("Hotel search failed. Please try again.");
      }
    } catch (err) {
      if (signal.aborted) return;
      
      console.error("Hotel search error:", err);
      dispatch({ 
        type: 'SEARCH_ERROR', 
        payload: err instanceof Error ? err.message : "Failed to search hotels" 
      });
      toast.error("Failed to search hotels. Please try again.");
    }
  }, []);

  useEffect(() => {
    // Only search if criteria is provided and has required fields
    if (!memoizedCriteria?.destination || !memoizedCriteria?.checkIn || !memoizedCriteria?.checkOut) {
      return;
    }

    const controller = new AbortController();
    searchHotels(memoizedCriteria, controller.signal);
    
    return () => {
      controller.abort();
    };
  }, [memoizedCriteria, searchHotels]);

  return { 
    hotels: state.hotels, 
    loading: state.loading, 
    error: state.error, 
    isEmpty: state.isEmpty, 
    meta: state.meta 
  };
};

// This function has been removed to force use of real Amadeus data only