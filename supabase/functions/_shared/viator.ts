import logger from "./logger.ts";

export interface ViatorConfig {
  apiKey: string;
  baseUrl: string;
}

export const VIATOR_CONFIG: ViatorConfig = {
  apiKey: Deno.env.get('VIATOR_API_KEY') || "",
  baseUrl: "https://api.viator.com/partner"
};

export interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  pricing: {
    summary: {
      fromPrice: number;
      fromPriceBeforeDiscount?: number;
      currency: string;
    };
  };
  images: Array<{
    variants: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  }>;
  location: {
    startPoint: string;
    endPoint: string;
  };
  reviews: {
    combinedAverageRating: number;
    totalReviews: number;
  };
  cancellation: {
    refund: string;
    details: string;
  };
  itinerary: {
    hasFlexibleItinerary: boolean;
    duration: string;
  };
  inclusions: string[];
  exclusions: string[];
  additionalInfo: string[];
  logistics: {
    start: {
      time: string;
      location: string;
    };
    end: {
      time: string;
      location: string;
    };
  };
  tags: string[];
}

export interface ViatorSearchParams {
  destination: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  subcategoryId?: string;
  sortBy?: 'PRICE_FROM_LOW_TO_HIGH' | 'PRICE_FROM_HIGH_TO_LOW' | 'REVIEW_AVG_RATING_D' | 'TOTAL_REVIEWS_D';
  topX?: string;
  currencyCode?: string;
  count?: number;
  startFrom?: number;
}

export function getViatorHeaders(): Record<string, string> {
  if (!VIATOR_CONFIG.apiKey) {
    throw new Error('Viator API key not configured');
  }
  
  return {
    'exp-api-key': VIATOR_CONFIG.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json;version=2.0'
  };
}

export async function searchViatorProducts(params: ViatorSearchParams): Promise<{ products: ViatorProduct[]; totalCount: number }> {
  const url = `${VIATOR_CONFIG.baseUrl}/products/search`;
  
  const requestBody = {
    filtering: {
      destination: params.destination,
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.subcategoryId && { subcategoryId: params.subcategoryId })
    },
    sorting: {
      sortBy: params.sortBy || 'REVIEW_AVG_RATING_D'
    },
    pagination: {
      count: params.count || 20,
      startFrom: params.startFrom || 0
    },
    currency: params.currencyCode || 'AUD'
  };

  logger.info('[VIATOR] Searching products', { 
    destination: params.destination,
    startDate: params.startDate,
    categoryId: params.categoryId
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Search successful', { 
      productCount: data.products?.length || 0,
      totalCount: data.totalCount || 0
    });

    return {
      products: data.products || [],
      totalCount: data.totalCount || 0
    };
  } catch (error) {
    logger.error('[VIATOR] Search failed', { error: error.message });
    throw error;
  }
}

export async function getViatorProductDetails(productCode: string): Promise<ViatorProduct> {
  const url = `${VIATOR_CONFIG.baseUrl}/products/${productCode}`;
  
  logger.info('[VIATOR] Getting product details', { productCode });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getViatorHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] Product details API error', { 
        productCode,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator product details error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Product details retrieved', { productCode, title: data.title });

    return data;
  } catch (error) {
    logger.error('[VIATOR] Product details failed', { productCode, error: error.message });
    throw error;
  }
}

// Transform Viator products to standardized activity format
export function transformViatorToActivity(product: ViatorProduct): any {
  const mainImage = product.images?.[0]?.variants?.find(v => v.width >= 400)?.url;
  const duration = parseDuration(product.duration || product.itinerary?.duration);
  
  return {
    id: `viator_${product.productCode}`,
    title: product.title,
    description: product.shortDescription || product.description,
    provider: 'Viator',
    location: product.location?.startPoint || 'Location TBD',
    images: mainImage ? [mainImage] : [],
    category: determineCategoryFromTags(product.tags),
    price: product.pricing?.summary?.fromPrice || 0,
    currency: product.pricing?.summary?.currency || 'AUD',
    duration: duration.display,
    durationHours: duration.hours,
    difficulty: determineDifficulty(product.tags),
    rating: product.reviews?.combinedAverageRating || 4.5,
    reviewCount: product.reviews?.totalReviews || 0,
    groupSize: {
      min: 1,
      max: 15
    },
    availability: ['daily'],
    highlights: product.additionalInfo?.slice(0, 3) || ['Premium experience', 'Expert guide', 'Small group'],
    included: product.inclusions || [],
    cancellationPolicy: product.cancellation?.details || 'Free cancellation available',
    instantConfirmation: true,
    ageGroup: 'adult',
    meetingPoint: product.logistics?.start?.location || product.location?.startPoint,
    viatorData: {
      productCode: product.productCode,
      hasFlexibleItinerary: product.itinerary?.hasFlexibleItinerary
    }
  };
}

function parseDuration(duration: string): { display: string; hours: number } {
  if (!duration) return { display: '2-3 hours', hours: 2.5 };
  
  // Parse various duration formats
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/i);
  const dayMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:day|d)/i);
  const minuteMatch = duration.match(/(\d+)\s*(?:minute|min|m)/i);
  
  if (dayMatch) {
    const days = parseFloat(dayMatch[1]);
    return { display: `${days} day${days > 1 ? 's' : ''}`, hours: days * 8 };
  } else if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return { display: `${hours} hour${hours > 1 ? 's' : ''}`, hours };
  } else if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1]);
    const hours = minutes / 60;
    return { display: `${minutes} minutes`, hours };
  }
  
  return { display: duration, hours: 3 }; // Default fallback
}

function determineCategoryFromTags(tags: string[]): string {
  if (!tags || tags.length === 0) return 'sightseeing';
  
  const tagString = tags.join(' ').toLowerCase();
  
  if (tagString.includes('food') || tagString.includes('culinary') || tagString.includes('wine')) return 'food';
  if (tagString.includes('adventure') || tagString.includes('outdoor') || tagString.includes('extreme')) return 'adventure';
  if (tagString.includes('cultural') || tagString.includes('museum') || tagString.includes('historic')) return 'cultural';
  if (tagString.includes('shopping') || tagString.includes('market')) return 'shopping';
  if (tagString.includes('nightlife') || tagString.includes('entertainment')) return 'nightlife';
  if (tagString.includes('wellness') || tagString.includes('spa') || tagString.includes('yoga')) return 'wellness';
  
  return 'sightseeing';
}

function determineDifficulty(tags: string[]): string {
  if (!tags || tags.length === 0) return 'Easy';
  
  const tagString = tags.join(' ').toLowerCase();
  
  if (tagString.includes('extreme') || tagString.includes('challenging') || tagString.includes('difficult')) return 'Hard';
  if (tagString.includes('moderate') || tagString.includes('active') || tagString.includes('walking')) return 'Medium';
  
  return 'Easy';
}

export function validateViatorCredentials(): boolean {
  const isValid = !!VIATOR_CONFIG.apiKey;
  if (!isValid) {
    logger.warn('[VIATOR] API key not configured');
  }
  return isValid;
}

// Viator category mappings
export const VIATOR_CATEGORIES = {
  sightseeing: 'c1', // Tours & Sightseeing
  adventure: 'c2', // Outdoor Activities
  cultural: 'c8', // Cultural & Theme Tours
  food: 'c9', // Food, Wine & Nightlife
  shopping: 'c24', // Shopping & Fashion
  nightlife: 'c9', // Food, Wine & Nightlife
  wellness: 'c21' // Health & Beauty
};