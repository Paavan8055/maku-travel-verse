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
  | { type: 'SEARCH_ERROR'; payload: string | { message: string; systemError: boolean; originalError: any } }
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
        error: typeof action.payload === 'string' ? action.payload : action.payload.message, 
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

      // PHASE 1 & 2: Enhanced error handling with user-friendly messages
      if (functionError) {
        console.error("❌ Hotel search function error:", functionError);
        
        // Provide specific error messages based on error type
        let userMessage = "Hotel search failed. Please try again.";
        if (functionError.message?.includes('AMADEUS_AUTH_INVALID_CREDENTIALS')) {
          userMessage = "Hotel search temporarily unavailable. Please try again later.";
        } else if (functionError.message?.includes('network') || functionError.message?.includes('timeout')) {
          userMessage = "Connection issue. Please check your internet and try again.";
        }
        
        dispatch({ type: 'SEARCH_ERROR', payload: "Unable to search hotels at this time" });
        toast.error(userMessage);
        return;
      }

      // PHASE 2: Handle both success and system error responses
      if (data?.success) {
        // Log data quality for monitoring
        if (data.meta?.dataSource) {
          console.log(`✅ Hotel data received from: ${data.meta.dataSource}`);
        }
        
        if (data.isEmpty || !data.hotels || data.hotels.length === 0) {
          dispatch({ 
            type: 'SEARCH_EMPTY', 
            payload: { 
              error: data.error || "No hotels found for your search criteria",
              meta: data.meta 
            }
          });
          
          // Enhanced user feedback for empty results
          if (data.meta?.suggestions?.length > 0) {
            toast.info(`No hotels found. Try: ${data.meta.suggestions[0]}`);
          } else if (data.meta?.dateAdjusted && data.meta?.suggestedDates) {
            toast.info(`Moved search to ${data.meta.suggestedDates.checkIn} - ${data.meta.suggestedDates.checkOut} for test availability`);
          } else {
            toast.info("No hotels found for your criteria. Try different dates or locations.");
          }
        } else {
          if (data.meta?.dateAdjusted && data.meta?.suggestedDates) {
            toast.info(`Dates adjusted to ${data.meta.suggestedDates.checkIn} - ${data.meta.suggestedDates.checkOut} for better availability`);
          }
          
          // PHASE 2: Use only real Amadeus data
          const transformedHotels = data.hotels.map(transformAmadeusHotel);
          
          // Show success notification for live data
          if (data.meta?.dataSource === 'amadeus_live') {
            toast.success(`Found ${transformedHotels.length} hotels with live pricing`);
          }
          
          dispatch({ 
            type: 'SEARCH_SUCCESS', 
            payload: { 
              hotels: transformedHotels, 
              meta: data.meta 
            }
          });
        }
      } else if (data?.systemError) {
        // PHASE 1: Handle system-level errors (circuit breaker, service unavailable)
        console.error("🚨 System error:", data.technicalError);
        
        let userMessage = "Hotel search is temporarily unavailable. Please try again in a few minutes.";
        if (data.retryAfter) {
          userMessage = `Hotel search temporarily unavailable. Please try again in ${data.retryAfter} seconds.`;
        }
        
        dispatch({ type: 'SEARCH_ERROR', payload: data.error || "Service temporarily unavailable" });
        toast.error(userMessage);
      } else {
        // Generic failure
        dispatch({ 
          type: 'SEARCH_ERROR', 
          payload: data?.error || "Failed to search hotels" 
        });
        toast.error("Hotel search failed. Please try again.");
      }
    } catch (err: any) {
      if (signal.aborted) return;
      
      console.error("Hotel search error:", err);
      
      let errorMessage = "Failed to search hotels. Please try again.";
      let systemError = false;
      
      // Enhanced error handling for different failure types
      if (err?.message) {
        if (err.message.includes('AMADEUS_AUTH_INVALID_CREDENTIALS')) {
          errorMessage = 'Hotel search is temporarily unavailable. Our team has been notified.';
          systemError = true;
        } else if (err.message.includes('Circuit breaker')) {
          errorMessage = 'Hotel search service is temporarily overloaded. Please try again in a few minutes.';
          systemError = true;
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Connection error. Please check your internet and try again.';
        }
      }
      
      dispatch({ 
        type: 'SEARCH_ERROR', 
        payload: { 
          message: errorMessage,
          systemError,
          originalError: err?.message 
        }
      });
      
      if (systemError) {
        toast.error(errorMessage, { duration: 8000 });
      } else {
        toast.error(errorMessage);
      }
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