
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const MIN_LEAD_DAYS = parseInt(Deno.env.get("MIN_HOTEL_LEAD_DAYS") || "7");
const MAX_RADIUS_KM = 25;
const BASE_RADIUS_KM = 10;

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SearchContext {
  cityCode?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  roomQuantity: number;
  radius?: number;
}

interface SearchMeta {
  pathTaken: string[];
  dateAdjusted: boolean;
  suggestedDates?: { checkIn: string; checkOut: string };
  alternativeAreas?: string[];
  apiCallsUsed: number;
  errors: Array<{ step: string; error: string; statusCode?: number }>;
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

// Enhanced date handling with auto-adjustment
const ensureDateLead = (checkIn: string, checkOut: string): { 
  checkInDate: string; 
  checkOutDate: string; 
  dateAdjusted: boolean; 
  suggestedDates?: { checkIn: string; checkOut: string }; 
} => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new Error('Invalid date format provided');
  }
  
  if (checkOutDate <= checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }
  
  const leadDays = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  if (leadDays < MIN_LEAD_DAYS) {
    const adjustedCheckIn = new Date(today);
    adjustedCheckIn.setDate(today.getDate() + MIN_LEAD_DAYS);
    const stayLength = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    const adjustedCheckOut = new Date(adjustedCheckIn);
    adjustedCheckOut.setDate(adjustedCheckIn.getDate() + stayLength);
    
    return {
      checkInDate: adjustedCheckIn.toISOString().split('T')[0],
      checkOutDate: adjustedCheckOut.toISOString().split('T')[0],
      dateAdjusted: true,
      suggestedDates: {
        checkIn: adjustedCheckIn.toISOString().split('T')[0],
        checkOut: adjustedCheckOut.toISOString().split('T')[0]
      }
    };
  }
  
  return {
    checkInDate: checkIn,
    checkOutDate: checkOut,
    dateAdjusted: false
  };
};

// Enhanced city resolution with Amadeus API
const resolveCity = async (input: { destination?: string; cityCode?: string; latitude?: number; longitude?: number }, accessToken: string): Promise<{
  cityCode?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
}> => {
  const destination = input.destination || input.cityCode;
  
  if (!destination && !input.latitude) {
    throw new Error('Destination or coordinates are required');
  }

  // A: Direct cityCode validation
  if (input.cityCode && /^[A-Z]{3}$/.test(input.cityCode)) {
    return { cityCode: input.cityCode };
  }
  
  // If it's already a 3-letter code, return as is
  if (destination && /^[A-Z]{3}$/.test(destination)) {
    return { cityCode: destination };
  }

  const cityMappings = getCityMapping();
  const normalizedDestination = destination?.toLowerCase().trim();
  
  // Direct mapping first
  if (normalizedDestination && cityMappings[normalizedDestination]) {
    return { cityCode: cityMappings[normalizedDestination], cityName: destination };
  }
  
  try {
    // B: Try Amadeus cities API
    if (destination) {
      const citiesResponse = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations/cities?keyword=${encodeURIComponent(destination)}&max=5`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json();
        if (citiesData.data?.[0]) {
          const city = citiesData.data[0];
          return {
            cityCode: city.iataCode,
            cityName: city.name,
            latitude: city.geoCode?.latitude,
            longitude: city.geoCode?.longitude
          };
        }
      }
    }
    
    // C: Try general locations API
    if (destination) {
      const locationsResponse = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(destination)}&subType=CITY,AIRPORT&max=10`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        const city = locationsData.data?.find((loc: any) => loc.subType === 'CITY') || locationsData.data?.[0];
        if (city) {
          return {
            cityCode: city.iataCode,
            cityName: city.name,
            latitude: city.geoCode?.latitude,
            longitude: city.geoCode?.longitude
          };
        }
      }
    }
  } catch (error) {
    console.warn('Amadeus location resolution failed:', error.message);
  }
  
  // Fallback to static mapping or throw
  for (const [city, code] of Object.entries(cityMappings)) {
    if (normalizedDestination && (city.includes(normalizedDestination) || normalizedDestination.includes(city))) {
      return { cityCode: code, cityName: destination };
    }
  }
  
  // Use coordinates if available
  if (input.latitude && input.longitude) {
    return { latitude: input.latitude, longitude: input.longitude };
  }
  
  throw new Error(`Unable to resolve city: ${destination}`);
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

// Multi-strategy search implementation
const searchPrimaryV3 = async (ctx: SearchContext, accessToken: string): Promise<{ ok: boolean; data: any[]; statusCode: number; error?: string }> => {
  if (!ctx.cityCode) return { ok: false, data: [], statusCode: 400, error: 'No cityCode available' };
  
  const searchParams = new URLSearchParams({
    cityCode: ctx.cityCode,
    checkInDate: ctx.checkInDate,
    checkOutDate: ctx.checkOutDate,
    adults: ctx.adults.toString(),
    roomQuantity: ctx.roomQuantity.toString()
  });
  
  if (ctx.radius) searchParams.append('radius', ctx.radius.toString());
  
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${searchParams}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    const result = await response.json();
    return {
      ok: response.ok,
      data: result.data || [],
      statusCode: response.status,
      error: response.ok ? undefined : result.errors?.[0]?.detail || response.statusText
    };
  } catch (error) {
    return { ok: false, data: [], statusCode: 500, error: error.message };
  }
};

const searchFallbackV2 = async (ctx: SearchContext, accessToken: string): Promise<{ ok: boolean; data: any[]; statusCode: number; error?: string }> => {
  if (!ctx.cityCode) return { ok: false, data: [], statusCode: 400, error: 'No cityCode available' };
  
  const searchParams = new URLSearchParams({
    cityCode: ctx.cityCode,
    checkInDate: ctx.checkInDate,
    checkOutDate: ctx.checkOutDate,
    adults: ctx.adults.toString(),
    roomQuantity: ctx.roomQuantity.toString()
  });
  
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/hotel-offers?${searchParams}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    const result = await response.json();
    return {
      ok: response.ok,
      data: result.data || [],
      statusCode: response.status,
      error: response.ok ? undefined : result.errors?.[0]?.detail || response.statusText
    };
  } catch (error) {
    return { ok: false, data: [], statusCode: 500, error: error.message };
  }
};

const listHotelsByCity = async (cityCode: string, accessToken: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=15&radiusUnit=KM&hotelSource=ALL`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    if (response.ok) {
      const result = await response.json();
      return result.data?.map((hotel: any) => hotel.hotelId).slice(0, 100) || [];
    }
  } catch (error) {
    console.warn('Hotel list by city failed:', error.message);
  }
  return [];
};

const listHotelsByGeocode = async (latitude: number, longitude: number, radiusKm: number, accessToken: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}&radiusUnit=KM&hotelSource=ALL`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    if (response.ok) {
      const result = await response.json();
      return result.data?.map((hotel: any) => hotel.hotelId).slice(0, 100) || [];
    }
  } catch (error) {
    console.warn('Hotel list by geocode failed:', error.message);
  }
  return [];
};

const offersByHotelIds = async (ctx: SearchContext, hotelIds: string[], accessToken: string): Promise<{ ok: boolean; data: any[]; statusCode: number; error?: string }> => {
  if (!hotelIds.length) return { ok: false, data: [], statusCode: 400, error: 'No hotel IDs provided' };
  
  const searchParams = new URLSearchParams({
    hotelIds: hotelIds.join(','),
    checkInDate: ctx.checkInDate,
    checkOutDate: ctx.checkOutDate,
    adults: ctx.adults.toString(),
    roomQuantity: ctx.roomQuantity.toString()
  });
  
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?${searchParams}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    const result = await response.json();
    return {
      ok: response.ok,
      data: result.data || [],
      statusCode: response.status,
      error: response.ok ? undefined : result.errors?.[0]?.detail || response.statusText
    };
  } catch (error) {
    return { ok: false, data: [], statusCode: 500, error: error.message };
  }
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
    const input = await req.json();
    const { 
      destination,
      cityCode,
      latitude,
      longitude,
      checkInDate, 
      checkOutDate, 
      guests = 1,
      rooms = 1
    } = input;

    console.log('=== Amadeus Hotel Search Request ===', input);

    const meta: SearchMeta = {
      pathTaken: [],
      dateAdjusted: false,
      apiCallsUsed: 0,
      errors: []
    };

    // Enhanced date handling with auto-adjustment
    const dateResult = ensureDateLead(checkInDate, checkOutDate);
    const searchDates = {
      checkInDate: dateResult.checkInDate,
      checkOutDate: dateResult.checkOutDate
    };
    
    if (dateResult.dateAdjusted) {
      meta.dateAdjusted = true;
      meta.suggestedDates = dateResult.suggestedDates;
      console.log('Dates adjusted for minimum lead time:', meta.suggestedDates);
    }

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    meta.apiCallsUsed++;

    // Enhanced city resolution
    const cityResolution = await resolveCity({ destination, cityCode, latitude, longitude }, accessToken);
    meta.apiCallsUsed++;
    
    const searchContext: SearchContext = {
      ...cityResolution,
      ...searchDates,
      adults: guests,
      roomQuantity: rooms,
      radius: BASE_RADIUS_KM
    };

    console.log('Resolved search context:', searchContext);

    // Multi-strategy search chain
    let searchResult: { ok: boolean; data: any[]; statusCode: number; error?: string } | null = null;

    // Primary: v3 by cityCode
    if (searchContext.cityCode) {
      console.log('Attempting primary v3 search...');
      searchResult = await searchPrimaryV3(searchContext, accessToken);
      meta.apiCallsUsed++;
      meta.pathTaken.push('v3_primary');
      
      if (!searchResult.ok) {
        meta.errors.push({ step: 'v3_primary', error: searchResult.error || 'Unknown error', statusCode: searchResult.statusCode });
      }
    }

    // Fallback 1: v2 by cityCode
    if ((!searchResult?.ok || !searchResult.data.length) && searchContext.cityCode) {
      console.log('Attempting v2 fallback...');
      searchResult = await searchFallbackV2(searchContext, accessToken);
      meta.apiCallsUsed++;
      meta.pathTaken.push('v2_fallback');
      
      if (!searchResult.ok) {
        meta.errors.push({ step: 'v2_fallback', error: searchResult.error || 'Unknown error', statusCode: searchResult.statusCode });
      }
    }

    // Fallback 2: hotel list → by-hotel offers
    if ((!searchResult?.ok || !searchResult.data.length) && searchContext.cityCode) {
      console.log('Attempting hotel list by city...');
      const hotelIds = await listHotelsByCity(searchContext.cityCode, accessToken);
      meta.apiCallsUsed++;
      meta.pathTaken.push('hotel_list_city');
      
      if (hotelIds.length > 0) {
        console.log(`Found ${hotelIds.length} hotels, searching offers...`);
        searchResult = await offersByHotelIds(searchContext, hotelIds, accessToken);
        meta.apiCallsUsed++;
        meta.pathTaken.push('offers_by_hotels');
        
        if (!searchResult.ok) {
          meta.errors.push({ step: 'offers_by_hotels', error: searchResult.error || 'Unknown error', statusCode: searchResult.statusCode });
        }
      }
    }

    // Fallback 3: geocode search with expanding radius
    if ((!searchResult?.ok || !searchResult.data.length) && searchContext.latitude && searchContext.longitude) {
      for (const radius of [BASE_RADIUS_KM, MAX_RADIUS_KM]) {
        console.log(`Attempting geocode search with ${radius}km radius...`);
        const hotelIds = await listHotelsByGeocode(searchContext.latitude, searchContext.longitude, radius, accessToken);
        meta.apiCallsUsed++;
        meta.pathTaken.push(`geocode_${radius}km`);
        
        if (hotelIds.length > 0) {
          searchResult = await offersByHotelIds(searchContext, hotelIds, accessToken);
          meta.apiCallsUsed++;
          meta.pathTaken.push(`offers_geocode_${radius}km`);
          
          if (searchResult.ok && searchResult.data.length > 0) {
            break;
          } else if (!searchResult.ok) {
            meta.errors.push({ step: `offers_geocode_${radius}km`, error: searchResult.error || 'Unknown error', statusCode: searchResult.statusCode });
          }
        }
      }
    }

    // Fallback 4: date bump (+7 days) and retry once
    if ((!searchResult?.ok || !searchResult.data.length) && !meta.dateAdjusted) {
      console.log('Attempting date bump fallback...');
      const bumpedCheckIn = new Date(searchContext.checkInDate);
      bumpedCheckIn.setDate(bumpedCheckIn.getDate() + 7);
      const bumpedCheckOut = new Date(searchContext.checkOutDate);
      bumpedCheckOut.setDate(bumpedCheckOut.getDate() + 7);
      
      const bumpedContext = {
        ...searchContext,
        checkInDate: bumpedCheckIn.toISOString().split('T')[0],
        checkOutDate: bumpedCheckOut.toISOString().split('T')[0]
      };
      
      if (bumpedContext.cityCode) {
        searchResult = await searchPrimaryV3(bumpedContext, accessToken);
        meta.apiCallsUsed++;
        meta.pathTaken.push('date_bump_v3');
        meta.dateAdjusted = true;
        meta.suggestedDates = {
          checkIn: bumpedContext.checkInDate,
          checkOut: bumpedContext.checkOutDate
        };
        
        if (!searchResult.ok) {
          meta.errors.push({ step: 'date_bump_v3', error: searchResult.error || 'Unknown error', statusCode: searchResult.statusCode });
        }
      }
    }

    console.log('Search completed:', {
      success: searchResult?.ok && searchResult.data.length > 0,
      dataCount: searchResult?.data.length || 0,
      pathTaken: meta.pathTaken,
      apiCallsUsed: meta.apiCallsUsed
    });

    // Check if we have any results
    if (!searchResult?.ok || !searchResult.data.length) {
      // Provide friendly guidance instead of hard error
      const isEmpty = true;
      const friendlyError = meta.dateAdjusted 
        ? `No test-environment offers found for ${searchContext.cityName || searchContext.cityCode || destination}. We tried adjusting your dates to ${meta.suggestedDates?.checkIn} - ${meta.suggestedDates?.checkOut}.`
        : `No test-environment offers found for ${searchContext.cityName || searchContext.cityCode || destination} on these dates.`;
      
      return new Response(JSON.stringify({
        success: true,
        hotels: [],
        isEmpty: true,
        error: friendlyError,
        meta: {
          ...meta,
          totalResults: 0,
          isEmpty: true,
          message: 'Try different dates or nearby areas',
          alternativeSuggestions: [
            meta.suggestedDates ? 'Try the suggested dates above' : 'Try dates 1-2 weeks from now',
            'Search for nearby cities or areas',
            'Consider different guest counts or room configurations'
          ]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced transformation with better data handling
    const transformedHotels = searchResult.data?.map((offer: any) => {
      const hotel = offer.hotel;
      const bestOffer = offer.offers?.[0];
      
      // Calculate nights for proper total pricing
      const checkInDate = new Date(searchContext.checkInDate);
      const checkOutDate = new Date(searchContext.checkOutDate);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
      const pricePerNight = bestOffer ? parseFloat(bestOffer.price.total) / nights : 150;

      return {
        id: hotel.hotelId,
        source: 'amadeus',
        name: hotel.name || 'Luxury Hotel',
        description: hotel.description?.text || 'Experience luxury and comfort with modern amenities and exceptional service.',
        starRating: hotel.rating || 4,
        location: {
          address: hotel.address?.lines?.join(', ') || 'City Center',
          city: hotel.address?.cityName || searchContext.cityCode,
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
      cityResolved: searchContext.cityCode || `${searchContext.latitude},${searchContext.longitude}`,
      pathTaken: meta.pathTaken,
      dateAdjusted: meta.dateAdjusted,
      searchSuccess: true
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      hotels: transformedHotels,
      searchCriteria: { 
        destination: searchContext.cityCode || destination,
        checkInDate: searchContext.checkInDate, 
        checkOutDate: searchContext.checkOutDate, 
        guests, 
        rooms 
      },
      meta: {
        ...meta,
        totalResults: transformedHotels.length,
        apiProvider: 'Amadeus',
        searchId: crypto.randomUUID()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Amadeus Hotel Search Critical Error ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      input: req.url
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'amadeus',
      isEmpty: true,
      meta: {
        pathTaken: ['error'],
        dateAdjusted: false,
        apiCallsUsed: 0,
        errors: [{ step: 'critical', error: error.message }],
        message: 'Please try again with different search criteria',
        alternativeSuggestions: [
          'Check your destination name or try a nearby city',
          'Ensure dates are in the future',
          'Try different guest counts or room configurations'
        ]
      },
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
