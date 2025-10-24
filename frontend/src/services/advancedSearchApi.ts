/**
 * Advanced Search API Client for Maku.Travel
 * Provides integration with enhanced search capabilities
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '';

// ============================================================================
// Types
// ============================================================================

export interface PriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface AdvancedHotelSearchParams {
  destination: string;
  checkin: string;
  checkout: string;
  guests?: { adults: number; children: number };
  rooms?: number;
  price_range?: PriceRange;
  star_rating?: number[];
  guest_rating?: number;
  amenities?: string[];
  property_types?: string[];
  sort_by?: 'price' | 'rating' | 'distance' | 'popularity' | 'review_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface MultiCityLeg {
  origin: string;
  destination: string;
  departure_date: string;
}

export interface AdvancedFlightSearchParams {
  search_type: 'one-way' | 'round-trip' | 'multi-city';
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  multi_city_legs?: MultiCityLeg[];
  passengers?: { adults: number; children: number; infants: number };
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  price_range?: PriceRange;
  max_stops?: number;
  preferred_airlines?: string[];
  sort_by?: 'price' | 'duration' | 'departure_time' | 'stops' | 'airline';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface AdvancedActivitySearchParams {
  destination: string;
  start_date: string;
  end_date?: string;
  participants?: { adults: number; children: number };
  price_range?: PriceRange;
  categories?: string[];
  activity_types?: string[];
  min_rating?: number;
  sort_by?: 'price' | 'rating' | 'duration' | 'popularity';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface SearchMetadata {
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
  search_duration_ms: number;
  from_cache: boolean;
  filters_applied: Record<string, any>;
}

export interface HotelResult {
  hotel_id: string;
  name: string;
  star_rating: number;
  guest_rating: number;
  review_count: number;
  price_per_night: number;
  total_price: number;
  currency: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  amenities: string[];
  property_type: string;
  images: string[];
  distance_from_center_km: number;
  cancellation_policy: string;
  provider: string;
  availability: boolean;
}

export interface FlightResult {
  flight_id: string;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  stop_cities: string[];
  cabin_class: string;
  price: number;
  currency: string;
  seats_available: number;
  baggage_allowance: Record<string, any>;
  provider: string;
}

export interface ActivityResult {
  activity_id: string;
  title: string;
  description: string;
  category: string;
  activity_type: string;
  duration_hours: number;
  price: number;
  currency: string;
  rating: number;
  review_count: number;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  images: string[];
  languages: string[];
  accessibility: boolean;
  provider: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Advanced hotel search with comprehensive filtering
 */
export async function advancedHotelSearch(params: AdvancedHotelSearchParams) {
  try {
    const response = await axios.post<{
      success: boolean;
      results: HotelResult[];
      metadata: SearchMetadata;
      flexible_dates_available: boolean;
    }>(`${API_BASE_URL}/api/search/hotels/advanced`, params);
    
    return response.data;
  } catch (error) {
    console.error('Advanced hotel search failed:', error);
    throw error;
  }
}

/**
 * Advanced flight search with multi-city support
 */
export async function advancedFlightSearch(params: AdvancedFlightSearchParams) {
  try {
    const response = await axios.post<{
      success: boolean;
      results: FlightResult[];
      metadata: SearchMetadata;
      search_type: string;
    }>(`${API_BASE_URL}/api/search/flights/advanced`, params);
    
    return response.data;
  } catch (error) {
    console.error('Advanced flight search failed:', error);
    throw error;
  }
}

/**
 * Advanced activity search with filtering
 */
export async function advancedActivitySearch(params: AdvancedActivitySearchParams) {
  try {
    const response = await axios.post<{
      success: boolean;
      results: ActivityResult[];
      metadata: SearchMetadata;
    }>(`${API_BASE_URL}/api/search/activities/advanced`, params);
    
    return response.data;
  } catch (error) {
    console.error('Advanced activity search failed:', error);
    throw error;
  }
}

/**
 * Get user's search history
 */
export async function getSearchHistory(userId: string, limit: number = 10) {
  try {
    const response = await axios.get<{
      success: boolean;
      history: Array<{
        search_id: string;
        type: string;
        query: string;
        timestamp: string;
        result_count: number;
      }>;
      user_id: string;
    }>(`${API_BASE_URL}/api/search/history/${userId}`, {
      params: { limit }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get search history:', error);
    throw error;
  }
}

/**
 * Get search autocomplete suggestions
 */
export async function getSearchSuggestions(
  query: string,
  type: 'destination' | 'hotel' | 'activity' = 'destination'
) {
  try {
    const response = await axios.get<{
      success: boolean;
      query: string;
      suggestions: Array<{
        id: string;
        text: string;
        type: string;
      }>;
    }>(`${API_BASE_URL}/api/search/suggestions`, {
      params: { query, type }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    throw error;
  }
}
