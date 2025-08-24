import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
}

const generateHotelBedsSignature = async (apiKey: string, secret: string, timestamp: number): Promise<string> => {
  const stringToSign = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Enhanced pricing extraction with tax breakdown
const extractPricingDetails = (hotel: any) => {
  const pricing = {
    netAmount: hotel.minRate || 0,
    sellingRate: hotel.sellingRate || hotel.minRate || 0,
    hotelSellingRate: hotel.hotelSellingRate,
    currency: hotel.currency || 'USD',
    rateType: hotel.rateType || 'PUBLIC',
    packaging: hotel.packaging || false,
    commissionable: hotel.commissionable || false,
    taxesIncluded: hotel.taxes?.allIncluded || false,
    taxBreakdown: hotel.taxes?.taxes || [],
    totalTaxes: hotel.taxes?.taxes?.reduce((sum: number, tax: any) => sum + (tax.amount || 0), 0) || 0,
    commission: hotel.commission || 0,
    rateComments: hotel.rateComments || '',
    offers: hotel.offers || [],
    discount: hotel.discount || 0,
    discountPCT: hotel.discountPCT || 0
  };
  
  return pricing;
};

// Rate limiting and retry logic
const makeResilientRequest = async (url: string, options: RequestInit, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (response.status >= 500 && attempt < maxRetries) {
        // Server error - retry with backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Request failed after ${maxRetries} attempts`);
};

const searchHotels = async (params: HotelSearchParams) => {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

  const requestBody = {
    stay: {
      checkIn: params.checkIn,
      checkOut: params.checkOut
    },
    occupancies: [
      {
        rooms: params.rooms || 1,
        adults: params.adults,
        children: params.children || 0
      }
    ],
    destination: {
      code: params.destination // This should be a destination code
    },
    filter: {
      maxHotels: 50
    }
  };

  const response = await makeResilientRequest(`${ENV_CONFIG.hotelbeds.baseUrl}/hotel-api/1.0/hotels`, {
    method: 'POST',
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`HotelBeds search failed: ${response.statusText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      destination, 
      checkIn, 
      checkOut, 
      guests = 2, 
      rooms = 1 
    } = await req.json();

    logger.info('HotelBeds hotel search:', { destination, checkIn, checkOut, guests, rooms });

    // Enhanced destination code mapping
    const getCityMapping = () => {
      return {
        // Major cities
        'sydney': 'SYD',
        'melbourne': 'MEL',
        'brisbane': 'BNE',
        'perth': 'PER',
        'adelaide': 'ADL',
        'canberra': 'CBR',
        'paris': 'PAR',
        'london': 'LON',
        'new york': 'NYC',
        'tokyo': 'TYO',
        'singapore': 'SIN',
        'hong kong': 'HKG',
        'bangkok': 'BKK',
        'dubai': 'DXB',
        'bali': 'DPS',
        'jakarta': 'CGK',
        'kuala lumpur': 'KUL',
        'manila': 'MNL',
        'delhi': 'DEL',
        'mumbai': 'BOM',
        'istanbul': 'IST',
        'rome': 'ROM',
        'madrid': 'MAD',
        'barcelona': 'BCN',
        'amsterdam': 'AMS',
        'frankfurt': 'FRA',
        'zurich': 'ZUR',
        'vienna': 'VIE',
        'prague': 'PRG',
        'budapest': 'BUD',
        'warsaw': 'WAW',
        'stockholm': 'STO',
        'oslo': 'OSL',
        'copenhagen': 'CPH',
        'helsinki': 'HEL',
        'moscow': 'MOW',
        'cairo': 'CAI',
        'johannesburg': 'JNB',
        'cape town': 'CPT',
        'casablanca': 'CAS',
        'nairobi': 'NBO',
        'los angeles': 'LAX',
        'san francisco': 'SFO',
        'chicago': 'CHI',
        'miami': 'MIA',
        'las vegas': 'LAS',
        'toronto': 'YYZ',
        'vancouver': 'YVR',
        'montreal': 'YUL',
        'mexico city': 'MEX',
        'rio de janeiro': 'RIO',
        'sao paulo': 'SAO',
        'buenos aires': 'BUE',
        'lima': 'LIM',
        'bogota': 'BOG',
        'santiago': 'SCL'
      };
    };

    const cityMapping = getCityMapping();
    const destCode = cityMapping[destination.toLowerCase()];
    
    if (!destCode) {
      logger.warn('Destination not found in mapping:', destination);
      return new Response(JSON.stringify({
        success: false,
        error: `Destination "${destination}" is not supported. Please try a major city.`,
        source: 'hotelbeds',
        supportedDestinations: Object.keys(cityMapping).slice(0, 20) // Show some examples
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const hotelResults = await searchHotels({
      destination: destCode,
      checkIn,
      checkOut,
      adults: guests,
      rooms
    });

    // Check if hotelResults has the expected structure
    // HotelBeds response has nested structure: { hotels: { hotels: [...] } }
    const hotelsArray = hotelResults?.hotels?.hotels;
    if (!hotelResults || !hotelResults.hotels || !Array.isArray(hotelsArray)) {
      logger.warn('No hotels found in HotelBeds response or invalid structure:', {
        hasResults: !!hotelResults,
        hasHotelsObject: !!hotelResults?.hotels,
        hotelsTotal: hotelResults?.hotels?.total,
        hotelsArrayLength: Array.isArray(hotelsArray) ? hotelsArray.length : 'not array',
        auditData: hotelResults?.auditData
      });
      return new Response(JSON.stringify({
        success: true,
        source: 'hotelbeds',
        hotels: [],
        searchCriteria: { destination, checkIn, checkOut, guests, rooms },
        message: 'No hotels found for this destination and dates'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced transformation with detailed pricing and content
    const transformedHotels = await Promise.all(hotelsArray.map(async (hotel: any) => {
      // Extract pricing details with tax breakdown
      const pricing = extractPricingDetails(hotel);
      
      // Get enriched content if available
      let enrichedContent = null;
      try {
        const contentResponse = await fetch(`${ENV_CONFIG.hotelbeds.baseUrl}/hotel-content-api/1.0/hotels?codes=${hotel.code}&language=ENG`, {
          headers: {
            'Api-key': Deno.env.get('HOTELBEDS_API_KEY'),
            'X-Signature': await generateHotelBedsSignature(
              Deno.env.get('HOTELBEDS_API_KEY'),
              Deno.env.get('HOTELBEDS_SECRET'),
              Math.floor(Date.now() / 1000)
            ),
            'Accept': 'application/json'
          }
        });
        
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          enrichedContent = contentData.hotels?.[0];
        }
      } catch (error) {
        logger.warn('Failed to fetch enriched content for hotel:', hotel.code, error.message);
      }

      return {
        id: hotel.code.toString(),
        source: 'hotelbeds',
        name: hotel.name,
        location: hotel.destinationName || destination,
        address: hotel.address || '',
        rating: hotel.categoryCode ? parseInt(hotel.categoryCode) : null,
        reviews: null,
        reviewScore: hotel.ranking ? (hotel.ranking / 10) : null,
        
        // Enhanced pricing with tax breakdown
        pricing: {
          ...pricing,
          currency: hotel.currency || 'USD',
          rateType: hotel.rateType || 'unknown',
          packaging: hotel.packaging || false,
          commissionable: hotel.commissionable || false,
          taxes: {
            included: pricing.taxesIncluded,
            breakdown: pricing.taxBreakdown,
            total: pricing.totalTaxes
          }
        },
        
        // Legacy price field for backward compatibility
        price: {
          amount: pricing.netAmount || pricing.sellingRate || hotel.minRate,
          currency: hotel.currency || 'USD',
          per: 'night'
        },
        
        // Enhanced images and content
        images: enrichedContent?.images?.map((img: any) => ({
          url: img.path,
          type: img.imageTypeCode,
          order: img.order,
          roomCode: img.roomCode
        })) || hotel.images?.map((img: any) => ({ url: img.path })) || [],
        
        // Enhanced amenities
        amenities: enrichedContent?.facilities?.map((f: any) => ({
          code: f.facilityCode,
          name: f.description?.content || f.description,
          group: f.facilityGroupCode
        })) || hotel.facilities?.map((f: any) => f.description) || [],
        
        distance: null,
        coordinates: (hotel.latitude && hotel.longitude) ? {
          latitude: parseFloat(hotel.latitude),
          longitude: parseFloat(hotel.longitude)
        } : enrichedContent?.coordinates ? {
          latitude: parseFloat(enrichedContent.coordinates.latitude),
          longitude: parseFloat(enrichedContent.coordinates.longitude)
        } : null,
        
        // Enhanced room information
        rooms: enrichedContent?.rooms?.map((room: any) => ({
          code: room.roomCode,
          type: room.typeDescription?.content || room.description?.content || 'Standard Room',
          description: room.description?.content || '',
          maxPax: room.maxPax,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          facilities: room.roomFacilities?.map((f: any) => f.description?.content || f.description) || [],
          price: pricing.netAmount || pricing.sellingRate,
          available: !!hotel.minRate
        })) || [{
          type: 'Standard Room',
          beds: '1 King Bed',
          size: null,
          guests: guests,
          price: pricing.netAmount || pricing.sellingRate || hotel.minRate,
          amenities: [],
          available: !!hotel.minRate
        }],
        
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Free cancellation until 24 hours before check-in'
        },
        verified: true,
        
        // Additional metadata
        metadata: {
          categoryCode: hotel.categoryCode,
          destinationCode: hotel.destinationCode,
          zoneCode: hotel.zoneCode,
          chainCode: enrichedContent?.chainCode,
          lastUpdate: enrichedContent?.lastUpdate
        }
      };
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      source: 'hotelbeds',
      hotels: transformedHotels,
      searchCriteria: { destination, checkIn, checkOut, guests, rooms }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('HotelBeds search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'hotelbeds'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});