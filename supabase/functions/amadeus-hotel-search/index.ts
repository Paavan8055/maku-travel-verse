import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomQuantity?: number;
  adults?: number;
  radius?: number;
  radiusUnit?: string;
  amenities?: string[];
  ratings?: string[];
  hotelChain?: string;
  priceRange?: string;
  bestRateOnly?: boolean;
}

// Comprehensive city mapping for better coverage
const getCityMapping = (): { [key: string]: string } => ({
  // Major Global Cities
  'new york': 'NYC', 'london': 'LON', 'paris': 'PAR', 'tokyo': 'TYO', 'sydney': 'SYD',
  'melbourne': 'MEL', 'brisbane': 'BNE', 'perth': 'PER', 'adelaide': 'ADL', 'darwin': 'DRW',
  'mumbai': 'BOM', 'delhi': 'DEL', 'bangalore': 'BLR', 'chennai': 'MAA', 'kolkata': 'CCU',
  'singapore': 'SIN', 'hong kong': 'HKG', 'bangkok': 'BKK', 'kuala lumpur': 'KUL',
  'jakarta': 'CGK', 'manila': 'MNL', 'seoul': 'SEL', 'osaka': 'OSA', 'beijing': 'PEK',
  'shanghai': 'SHA', 'guangzhou': 'CAN', 'dubai': 'DXB', 'doha': 'DOH', 'abu dhabi': 'AUH',
  'riyadh': 'RUH', 'cairo': 'CAI', 'casablanca': 'CMN', 'johannesburg': 'JNB',
  'cape town': 'CPT', 'nairobi': 'NBO', 'lagos': 'LOS', 'accra': 'ACC',
  'los angeles': 'LAX', 'san francisco': 'SFO', 'chicago': 'CHI', 'miami': 'MIA',
  'boston': 'BOS', 'washington': 'WAS', 'toronto': 'YYZ', 'vancouver': 'YVR',
  'montreal': 'YUL', 'mexico city': 'MEX', 'cancun': 'CUN', 'lima': 'LIM',
  'sao paulo': 'SAO', 'rio de janeiro': 'RIO', 'buenos aires': 'BUE', 'bogota': 'BOG',
  'santiago': 'SCL', 'caracas': 'CCS', 'quito': 'UIO', 'la paz': 'LPB',
  'rome': 'ROM', 'milan': 'MIL', 'venice': 'VCE', 'florence': 'FLR', 'naples': 'NAP',
  'madrid': 'MAD', 'barcelona': 'BCN', 'seville': 'SVQ', 'valencia': 'VLC',
  'berlin': 'BER', 'munich': 'MUC', 'frankfurt': 'FRA', 'hamburg': 'HAM', 'cologne': 'CGN',
  'amsterdam': 'AMS', 'brussels': 'BRU', 'zurich': 'ZUR', 'geneva': 'GVA',
  'vienna': 'VIE', 'prague': 'PRG', 'budapest': 'BUD', 'warsaw': 'WAW',
  'stockholm': 'STO', 'copenhagen': 'CPH', 'oslo': 'OSL', 'helsinki': 'HEL',
  'reykjavik': 'KEF', 'dublin': 'DUB', 'edinburgh': 'EDI', 'manchester': 'MAN',
  'birmingham': 'BHX', 'glasgow': 'GLA', 'lisbon': 'LIS', 'porto': 'OPO',
  'athens': 'ATH', 'thessaloniki': 'SKG', 'istanbul': 'IST', 'ankara': 'ANK',
  'tel aviv': 'TLV', 'jerusalem': 'JRS', 'amman': 'AMM', 'beirut': 'BEY',
  'kuwait city': 'KWI', 'muscat': 'MCT', 'manama': 'BAH', 'tashkent': 'TAS',
  'almaty': 'ALA', 'astana': 'NUR', 'baku': 'BAK', 'tbilisi': 'TBS',
  'yerevan': 'EVN', 'kathmandu': 'KTM', 'dhaka': 'DAC', 'colombo': 'CMB',
  'male': 'MLE', 'thimphu': 'PBH', 'islamabad': 'ISB', 'karachi': 'KHI',
  'lahore': 'LHE', 'kabul': 'KBL'
});

// Validate and format dates
const validateDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

// Enhanced city code resolution
const resolveCityCode = (destination: string): string => {
  if (!destination) {
    throw new Error('Destination is required');
  }

  // If it's already a 3-letter code, return as is
  if (/^[A-Z]{3}$/.test(destination)) {
    return destination;
  }

  const cityMappings = getCityMapping();
  const normalizedDestination = destination.toLowerCase().trim();
  
  // Direct mapping
  if (cityMappings[normalizedDestination]) {
    return cityMappings[normalizedDestination];
  }
  
  // Partial matching for common variations
  for (const [city, code] of Object.entries(cityMappings)) {
    if (city.includes(normalizedDestination) || normalizedDestination.includes(city)) {
      return code;
    }
  }
  
  // If no mapping found, try to extract first 3 letters and uppercase
  const fallbackCode = destination.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  if (fallbackCode.length === 3) {
    console.warn(`Using fallback city code ${fallbackCode} for destination: ${destination}`);
    return fallbackCode;
  }
  
  throw new Error(`Unable to resolve city code for destination: ${destination}`);
};

const getAmadeusAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus auth failed:', errorText);
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const searchHotels = async (params: HotelSearchParams, accessToken: string) => {
  const searchParams = new URLSearchParams({
    cityCode: params.cityCode,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
  });

  if (params.roomQuantity) searchParams.append('roomQuantity', params.roomQuantity.toString());
  if (params.adults) searchParams.append('adults', params.adults.toString());
  if (params.radius) searchParams.append('radius', params.radius.toString());
  if (params.radiusUnit) searchParams.append('radiusUnit', params.radiusUnit);
  if (params.amenities?.length) searchParams.append('amenities', params.amenities.join(','));
  if (params.ratings?.length) searchParams.append('ratings', params.ratings.join(','));
  if (params.hotelChain) searchParams.append('hotelChain', params.hotelChain);
  if (params.priceRange) searchParams.append('priceRange', params.priceRange);
  if (params.bestRateOnly !== undefined) searchParams.append('bestRateOnly', params.bestRateOnly.toString());

  console.log('Amadeus API call:', `https://test.api.amadeus.com/v2/shopping/hotel-offers?${searchParams}`);

  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/hotel-offers?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel search error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      params: params
    });
    throw new Error(`Hotel search failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Amadeus API response:', {
    dataCount: result.data?.length || 0,
    meta: result.meta,
    warnings: result.warnings
  });

  return result;
};

// Enhanced amenity parsing
const parseAmenities = (amenities: any[]): string[] => {
  if (!amenities || !Array.isArray(amenities)) return ['WiFi', 'Restaurant', 'Fitness Center'];
  
  const amenityMap: { [key: string]: string } = {
    'WIFI': 'Free WiFi',
    'INTERNET': 'Internet Access',
    'PARKING': 'Parking',
    'POOL': 'Swimming Pool',
    'SPA': 'Spa',
    'FITNESS': 'Fitness Center',
    'RESTAURANT': 'Restaurant',
    'BAR': 'Bar/Lounge',
    'ROOM_SERVICE': 'Room Service',
    'CONCIERGE': 'Concierge',
    'BUSINESS_CENTER': 'Business Center',
    'MEETING_ROOMS': 'Meeting Rooms',
    'LAUNDRY': 'Laundry Service',
    'PET_FRIENDLY': 'Pet Friendly',
    'DISABLED_FACILITIES': 'Accessible',
    'AIR_CONDITIONING': 'Air Conditioning',
    'ELEVATOR': 'Elevator',
    'SAFE': 'Safe',
    'MINIBAR': 'Minibar'
  };

  return amenities
    .map(amenity => {
      const code = amenity.amenity?.category || amenity.description || amenity;
      return amenityMap[code] || amenity.description || code;
    })
    .filter(Boolean)
    .slice(0, 10); // Limit to 10 amenities
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      destination,
      checkInDate, 
      checkOutDate, 
      guests = 1,
      rooms = 1,
      radius = 5,
      amenities,
      ratings,
      hotelChain,
      priceRange
    } = await req.json();

    console.log('=== Amadeus Hotel Search Request ===', {
      destination,
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      radius
    });

    // Validate required fields
    if (!destination) {
      throw new Error('Destination is required');
    }
    if (!checkInDate || !checkOutDate) {
      throw new Error('Check-in and check-out dates are required');
    }

    // Validate and format dates
    const formattedCheckIn = validateDate(checkInDate);
    const formattedCheckOut = validateDate(checkOutDate);

    // Validate date logic
    const checkIn = new Date(formattedCheckIn);
    const checkOut = new Date(formattedCheckOut);
    if (checkOut <= checkIn) {
      throw new Error('Check-out date must be after check-in date');
    }

    // Resolve city code
    const cityCode = resolveCityCode(destination);
    console.log(`Resolved city code: ${destination} -> ${cityCode}`);

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();

    // Search hotels
    const hotelOffers = await searchHotels({
      cityCode,
      checkInDate: formattedCheckIn,
      checkOutDate: formattedCheckOut,
      roomQuantity: rooms,
      adults: guests,
      radius,
      amenities,
      ratings,
      hotelChain,
      priceRange,
      bestRateOnly: true
    }, accessToken);

    // Enhanced transformation with better data handling
    const transformedHotels = hotelOffers.data?.map((offer: any) => {
      const hotel = offer.hotel;
      const bestOffer = offer.offers?.[0];
      
      // Calculate nights for proper total pricing
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
      const pricePerNight = bestOffer ? parseFloat(bestOffer.price.total) / nights : 150;

      return {
        id: hotel.hotelId,
        source: 'amadeus',
        name: hotel.name || 'Luxury Hotel',
        description: hotel.description?.text || 'Experience luxury and comfort with modern amenities and exceptional service.',
        starRating: hotel.rating || 4,
        location: {
          address: hotel.address?.lines?.join(', ') || 'City Center',
          city: hotel.address?.cityName || cityCode,
          country: hotel.address?.countryCode || 'Unknown',
          latitude: hotel.geoCode?.latitude,
          longitude: hotel.geoCode?.longitude
        },
        contact: {
          phone: hotel.contact?.phone,
          fax: hotel.contact?.fax,
          email: hotel.contact?.email
        },
        amenities: parseAmenities(hotel.amenities),
        images: hotel.media?.map((media: any) => media.uri).filter(Boolean) || ['/placeholder.svg'],
        pricePerNight: Math.round(pricePerNight),
        currency: bestOffer?.price?.currency || 'USD',
        totalPrice: bestOffer ? Math.round(parseFloat(bestOffer.price.total)) : Math.round(pricePerNight * nights),
        cancellationPolicy: bestOffer?.policies?.cancellation?.description?.text || 'Free cancellation until 24 hours before check-in',
        breakfast: bestOffer?.boardType === 'BREAKFAST',
        freeWifi: hotel.amenities?.some((a: any) => 
          ['WIFI', 'INTERNET'].includes(a.amenity?.category)
        ) ?? true,
        pool: hotel.amenities?.some((a: any) => a.amenity?.category === 'POOL') ?? false,
        gym: hotel.amenities?.some((a: any) => a.amenity?.category === 'FITNESS') ?? false,
        spa: hotel.amenities?.some((a: any) => a.amenity?.category === 'SPA') ?? false,
        parking: hotel.amenities?.some((a: any) => a.amenity?.category === 'PARKING') ?? false,
        petFriendly: hotel.amenities?.some((a: any) => a.amenity?.category === 'PET_FRIENDLY') ?? false,
        checkInTime: bestOffer?.policies?.checkInOut?.checkIn || '15:00',
        checkOutTime: bestOffer?.policies?.checkInOut?.checkOut || '11:00',
        roomTypes: offer.offers?.map((roomOffer: any) => ({
          type: roomOffer.room?.type || 'Standard Room',
          description: roomOffer.room?.description?.text || 'Comfortable room with modern amenities',
          occupancy: roomOffer.guests?.adults || guests,
          price: Math.round(parseFloat(roomOffer.price.total)),
          currency: roomOffer.price.currency,
          bedType: roomOffer.room?.bedType,
          size: roomOffer.room?.size
        })) || [],
        policies: {
          cancellation: bestOffer?.policies?.cancellation,
          deposit: bestOffer?.policies?.deposit,
          guarantee: bestOffer?.policies?.guarantee
        }
      };
    }) || [];

    console.log(`=== Search Complete ===`, {
      hotelsFound: transformedHotels.length,
      cityCode,
      searchSuccess: true
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      hotels: transformedHotels,
      searchCriteria: { 
        destination: cityCode, 
        checkInDate: formattedCheckIn, 
        checkOutDate: formattedCheckOut, 
        guests, 
        rooms 
      },
      meta: {
        totalResults: transformedHotels.length,
        apiProvider: 'Amadeus',
        searchId: crypto.randomUUID()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Amadeus Hotel Search Error ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'amadeus',
      details: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});