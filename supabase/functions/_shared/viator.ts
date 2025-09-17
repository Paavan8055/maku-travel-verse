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
  bookingQuestions?: ViatorBookingQuestion[];
  productOptions?: ViatorProductOption[];
}

export interface ViatorBookingQuestion {
  id: string;
  question: string;
  required: boolean;
  questionType: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: Array<{
    value: string;
    label: string;
  }>;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface ViatorProductOption {
  productOptionCode: string;
  title: string;
  description?: string;
  languageGuides?: string[];
  pricing: {
    currency: string;
    price: number;
  };
  ageBands?: Array<{
    ageBand: string;
    minimumAge: number;
    maximumAge?: number;
  }>;
  duration?: string;
  maxTravelers?: number;
}

export interface ViatorAvailability {
  productCode: string;
  localDate: string;
  available: boolean;
  status: 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT';
  vacancies?: number;
  pricing?: {
    currency: string;
    price: number;
  };
  nextAvailableDate?: string;
}

export interface ViatorBookingData {
  productCode: string;
  optionCode: string;
  travelDate: string;
  travelers: Array<{
    bandId: string;
    firstName: string;
    lastName: string;
    title?: string;
    leadTraveler?: boolean;
  }>;
  bookingQuestionAnswers?: Array<{
    questionId: string;
    answer: string;
  }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
  };
}

export interface ViatorBookingResponse {
  bookingReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  totalPrice: {
    currency: string;
    amount: number;
  };
  voucher?: {
    type: 'URL' | 'PDF';
    url: string;
  };
  confirmation?: {
    confirmationNumber: string;
    instructions: string;
  };
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

// Enhanced Viator API functions for certification compliance

export async function getViatorProductBookingQuestions(productCode: string): Promise<ViatorBookingQuestion[]> {
  const url = `${VIATOR_CONFIG.baseUrl}/products/${productCode}/booking-questions`;
  
  logger.info('[VIATOR] Getting product booking questions', { productCode });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getViatorHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] Booking questions API error', { 
        productCode,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator booking questions error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Booking questions retrieved', { productCode, questionCount: data.length });

    return data || [];
  } catch (error) {
    logger.error('[VIATOR] Booking questions failed', { productCode, error: error.message });
    return []; // Return empty array on error to not break booking flow
  }
}

export async function checkViatorProductAvailability(
  productCode: string, 
  month: string, 
  year: string
): Promise<ViatorAvailability[]> {
  const url = `${VIATOR_CONFIG.baseUrl}/products/${productCode}/availability`;
  
  const requestBody = {
    productCode,
    month: month.padStart(2, '0'),
    year
  };

  logger.info('[VIATOR] Checking product availability', { productCode, month, year });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] Availability API error', { 
        productCode,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator availability error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Availability retrieved', { 
      productCode, 
      availableDates: data.length 
    });

    return data || [];
  } catch (error) {
    logger.error('[VIATOR] Availability check failed', { productCode, error: error.message });
    throw error;
  }
}

export async function createViatorBooking(bookingData: ViatorBookingData): Promise<ViatorBookingResponse> {
  const url = `${VIATOR_CONFIG.baseUrl}/bookings`;
  
  logger.info('[VIATOR] Creating booking', { 
    productCode: bookingData.productCode,
    travelDate: bookingData.travelDate,
    travelerCount: bookingData.travelers.length
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] Booking creation API error', { 
        productCode: bookingData.productCode,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator booking error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Booking created successfully', { 
      productCode: bookingData.productCode,
      bookingReference: data.bookingReference,
      status: data.status
    });

    return data;
  } catch (error) {
    logger.error('[VIATOR] Booking creation failed', { 
      productCode: bookingData.productCode, 
      error: error.message 
    });
    throw error;
  }
}

export async function getViatorBookingDetails(bookingReference: string): Promise<ViatorBookingResponse> {
  const url = `${VIATOR_CONFIG.baseUrl}/bookings/${bookingReference}`;
  
  logger.info('[VIATOR] Getting booking details', { bookingReference });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getViatorHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] Booking details API error', { 
        bookingReference,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator booking details error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Booking details retrieved', { bookingReference, status: data.status });

    return data;
  } catch (error) {
    logger.error('[VIATOR] Booking details failed', { bookingReference, error: error.message });
    throw error;
  }
}

export async function cancelViatorBooking(
  bookingReference: string, 
  reason?: string
): Promise<{ success: boolean; refundAmount?: number; currency?: string }> {
  const url = `${VIATOR_CONFIG.baseUrl}/bookings/${bookingReference}/cancel`;
  
  const requestBody = {
    reason: reason || 'Customer request'
  };

  logger.info('[VIATOR] Cancelling booking', { bookingReference, reason });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getViatorHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[VIATOR] Booking cancellation API error', { 
        bookingReference,
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Viator cancellation error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    logger.info('[VIATOR] Booking cancelled successfully', { 
      bookingReference, 
      refundAmount: data.refundAmount 
    });

    return {
      success: true,
      refundAmount: data.refundAmount,
      currency: data.currency
    };
  } catch (error) {
    logger.error('[VIATOR] Booking cancellation failed', { bookingReference, error: error.message });
    throw error;
  }
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