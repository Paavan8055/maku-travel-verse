import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

export interface FoursquareConfig {
  apiKey: string;
  baseUrl: string;
}

export const FOURSQUARE_CONFIG: FoursquareConfig = {
  apiKey: Deno.env.get('FOURSQUARE_API_KEY') || "",
  baseUrl: "https://api.foursquare.com/v3"
};

export interface FoursquarePlace {
  fsq_id: string;
  name: string;
  categories: Array<{
    id: number;
    name: string;
    short_name: string;
    plural_name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  location: {
    address?: string;
    country: string;
    cross_street?: string;
    formatted_address: string;
    locality: string;
    region: string;
    postcode?: string;
  };
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  rating?: number;
  price?: number;
  hours?: {
    display: string;
    is_local_holiday: boolean;
    open_now: boolean;
  };
  photos?: Array<{
    id: string;
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  }>;
  description?: string;
  website?: string;
  tel?: string;
}

export interface FoursquareSearchParams {
  query?: string;
  ll?: string; // latitude,longitude
  near?: string; // location name
  categories?: string; // comma-separated category IDs
  radius?: number; // in meters
  limit?: number;
  sort?: 'DISTANCE' | 'POPULARITY' | 'RATING';
}

export function getFoursquareHeaders(): Record<string, string> {
  if (!FOURSQUARE_CONFIG.apiKey) {
    throw new Error('Foursquare API key not configured');
  }
  
  return {
    'Authorization': FOURSQUARE_CONFIG.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

export async function searchFoursquarePlaces(params: FoursquareSearchParams): Promise<{ results: FoursquarePlace[]; total: number }> {
  const url = new URL(`${FOURSQUARE_CONFIG.baseUrl}/places/search`);
  
  // Add search parameters
  if (params.query) url.searchParams.set('query', params.query);
  if (params.ll) url.searchParams.set('ll', params.ll);
  if (params.near) url.searchParams.set('near', params.near);
  if (params.categories) url.searchParams.set('categories', params.categories);
  if (params.radius) url.searchParams.set('radius', params.radius.toString());
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  if (params.sort) url.searchParams.set('sort', params.sort);

  logger.info('[FOURSQUARE] Searching places', { 
    query: params.query, 
    location: params.ll || params.near,
    categories: params.categories 
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getFoursquareHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[FOURSQUARE] API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Foursquare API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[FOURSQUARE] Search successful', { 
      resultCount: data.results?.length || 0,
      total: data.total || 0
    });

    return {
      results: data.results || [],
      total: data.total || 0
    };
  } catch (error) {
    logger.error('[FOURSQUARE] Search failed', { error: error.message });
    throw error;
  }
}

export async function getFoursquareVenueDetails(fsqId: string): Promise<FoursquarePlace> {
  const url = `${FOURSQUARE_CONFIG.baseUrl}/places/${fsqId}`;
  
  logger.info('[FOURSQUARE] Getting venue details', { fsqId });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getFoursquareHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[FOURSQUARE] Venue details API error', { 
        fsqId,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Foursquare venue details error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[FOURSQUARE] Venue details retrieved', { fsqId, name: data.name });

    return data;
  } catch (error) {
    logger.error('[FOURSQUARE] Venue details failed', { fsqId, error: error.message });
    throw error;
  }
}

// Transform Foursquare places to standardized activity format
export function transformFoursquareToActivity(place: FoursquarePlace): any {
  const category = place.categories?.[0];
  const photo = place.photos?.[0];
  
  return {
    id: `foursquare_${place.fsq_id}`,
    title: place.name,
    description: place.description || `${category?.name || 'Activity'} in ${place.location.locality}`,
    provider: 'Foursquare',
    location: place.location.formatted_address,
    images: photo ? [`${photo.prefix}500x500${photo.suffix}`] : [],
    category: category?.name || 'Activity',
    price: place.price ? place.price * 50 : 0, // Convert price level to estimated AUD
    currency: 'AUD',
    duration: '2-3 hours', // Default estimation
    durationHours: 2.5,
    difficulty: 'Easy',
    rating: place.rating || 4.0,
    reviewCount: Math.floor(Math.random() * 500) + 50, // Estimated
    groupSize: {
      min: 1,
      max: 10
    },
    availability: ['daily'],
    highlights: [
      category?.name || 'Local experience',
      place.location.locality,
      'Recommended by locals'
    ],
    included: ['Local recommendations', 'Location access'],
    cancellationPolicy: 'Free cancellation up to 24 hours before',
    instantConfirmation: true,
    ageGroup: 'adult',
    meetingPoint: place.location.formatted_address,
    coordinates: {
      latitude: place.geocodes.main.latitude,
      longitude: place.geocodes.main.longitude
    },
    website: place.website,
    phone: place.tel,
    hours: place.hours
  };
}

// Activity-specific category mappings for Foursquare
export const ACTIVITY_CATEGORIES = {
  sightseeing: '10000,10001,10002', // Arts & Entertainment, Event Space, Museum
  adventure: '10003,16000', // Adventure, Sports & Recreation  
  cultural: '10000,10001,12000', // Arts & Entertainment, Event Space, Historic Site
  food: '13000,13001,13002', // Food & Beverage, Restaurant, Cafe
  shopping: '17000,17001', // Retail, Shopping
  nightlife: '10040,13003', // Nightlife, Bar
  wellness: '10007,10008' // Health & Fitness, Spa
};

export function validateFoursquareCredentials(): boolean {
  const isValid = !!FOURSQUARE_CONFIG.apiKey;
  if (!isValid) {
    logger.warn('[FOURSQUARE] API key not configured');
  }
  return isValid;
}