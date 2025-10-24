/**
 * AI Personalization API Client for Maku.Travel
 * Provides persona detection, smart pre-fill, and journey recommendations
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '';

// ============================================================================
// Types
// ============================================================================

export type TravelPersona = 
  | 'budget_traveler'
  | 'luxury_seeker'
  | 'adventurer'
  | 'culture_enthusiast'
  | 'family_traveler'
  | 'business_traveler'
  | 'wellness_seeker'
  | 'foodie'
  | 'digital_nomad';

export type JourneyType = 'solo' | 'romantic' | 'family' | 'friends' | 'business' | 'group';

export interface PersonaDetectionInput {
  user_id: string;
  search_history?: Array<{
    destination: string;
    accommodation_type?: string;
    price_range?: { min: number; max: number };
    activities?: string[];
  }>;
  booking_history?: Array<{
    destination: string;
    accommodation_type?: string;
    total_spent?: number;
    activities?: string[];
  }>;
  preferences?: {
    budget_range?: { min: number; max: number };
    favorite_destinations?: string[];
    preferred_activities?: string[];
  };
}

export interface PersonaResult {
  persona: TravelPersona;
  confidence: number;
  characteristics: {
    name: string;
    description: string;
    price_sensitivity: string;
    preferred_accommodations: string[];
    avg_budget_per_day: number;
    preferred_activities: string[];
    booking_window_days: number;
    flexibility: string;
  };
  reasoning: string;
  secondary_personas?: Array<{
    persona: TravelPersona;
    confidence: number;
  }>;
}

export interface SmartPrefillRequest {
  user_id: string;
  search_context?: {
    type: 'hotel' | 'flight' | 'activity';
    partial_input?: string;
  };
}

export interface SmartPrefillResponse {
  suggestions: {
    destination?: string;
    dates?: {
      checkin?: string;
      checkout?: string;
      departure?: string;
      return?: string;
    };
    guests?: {
      adults: number;
      children: number;
    };
    budget_range?: {
      min: number;
      max: number;
    };
    preferences?: {
      accommodation_type?: string;
      amenities?: string[];
      activities?: string[];
    };
  };
  reasoning: string;
  confidence: number;
}

export interface JourneyTypeRequest {
  destination?: string;
  travelers?: {
    adults: number;
    children: number;
  };
  duration_days?: number;
  activities?: string[];
  accommodation_preferences?: string[];
}

export interface JourneyTypeResponse {
  journey_type: JourneyType;
  confidence: number;
  recommendations: {
    accommodations: string[];
    activities: string[];
    dining: string[];
    tips: string[];
  };
  reasoning: string;
}

export interface PersonaProfile {
  persona: TravelPersona;
  name: string;
  description: string;
  characteristics: Record<string, any>;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Detect user's travel persona based on history and preferences
 */
export async function detectPersona(input: PersonaDetectionInput): Promise<PersonaResult> {
  try {
    const response = await axios.post<{
      success: boolean;
      persona: PersonaResult;
    }>(`${API_BASE_URL}/api/personalization/persona`, input);
    
    return response.data.persona;
  } catch (error) {
    console.error('Persona detection failed:', error);
    throw error;
  }
}

/**
 * Get smart pre-fill suggestions for search forms
 */
export async function getSmartPrefill(request: SmartPrefillRequest): Promise<SmartPrefillResponse> {
  try {
    const response = await axios.post<{
      success: boolean;
      suggestions: SmartPrefillResponse;
    }>(`${API_BASE_URL}/api/personalization/smart-prefill`, request);
    
    return response.data.suggestions;
  } catch (error) {
    console.error('Smart pre-fill failed:', error);
    throw error;
  }
}

/**
 * Detect journey type and get recommendations
 */
export async function detectJourneyType(request: JourneyTypeRequest): Promise<JourneyTypeResponse> {
  try {
    const response = await axios.post<{
      success: boolean;
      journey: JourneyTypeResponse;
    }>(`${API_BASE_URL}/api/personalization/journey-type`, request);
    
    return response.data.journey;
  } catch (error) {
    console.error('Journey type detection failed:', error);
    throw error;
  }
}

/**
 * Get personalized recommendations based on user persona
 */
export async function getPersonalizedRecommendations(
  userId: string,
  destinationType?: 'beach' | 'city' | 'mountain' | 'countryside'
) {
  try {
    const response = await axios.get<{
      success: boolean;
      recommendations: {
        destinations: Array<{
          name: string;
          country: string;
          match_score: number;
          reasons: string[];
        }>;
        activities: Array<{
          name: string;
          type: string;
          match_score: number;
        }>;
        accommodations: Array<{
          type: string;
          price_range: { min: number; max: number };
        }>;
      };
    }>(`${API_BASE_URL}/api/personalization/recommendations/${userId}`, {
      params: { destination_type: destinationType }
    });
    
    return response.data.recommendations;
  } catch (error) {
    console.error('Failed to get personalized recommendations:', error);
    throw error;
  }
}

/**
 * Get all available persona profiles
 */
export async function getAllPersonas(): Promise<PersonaProfile[]> {
  try {
    const response = await axios.get<{
      success: boolean;
      personas: PersonaProfile[];
    }>(`${API_BASE_URL}/api/personalization/personas/all`);
    
    return response.data.personas;
  } catch (error) {
    console.error('Failed to get personas:', error);
    throw error;
  }
}

/**
 * Get all journey types
 */
export async function getAllJourneyTypes() {
  try {
    const response = await axios.get<{
      success: boolean;
      journey_types: Array<{
        type: JourneyType;
        name: string;
        description: string;
        typical_duration_days: number;
        recommended_budget_per_day: number;
      }>;
    }>(`${API_BASE_URL}/api/personalization/journey-types/all`);
    
    return response.data.journey_types;
  } catch (error) {
    console.error('Failed to get journey types:', error);
    throw error;
  }
}
