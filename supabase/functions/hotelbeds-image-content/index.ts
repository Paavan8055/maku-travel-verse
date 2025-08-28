import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { getHotelBedsCredentials } from "../_shared/config.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateHotelBedsSignature = async (apiKey: string, secret: string, timestamp: number): Promise<string> => {
  const stringToSign = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelCode } = await req.json();
    
    if (!hotelCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Hotel code is required'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    logger.info(`[HOTELBEDS-IMAGES] Fetching images for hotel: ${hotelCode}`);

    // Get HotelBeds credentials
    const { apiKey, secret } = getHotelBedsCredentials('hotel');
    
    if (!apiKey || !secret) {
      throw new Error('HotelBeds hotel API credentials not configured');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

    // Fetch hotel content with images
    const contentUrl = `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels/${hotelCode}/details`;
    
    logger.info(`[HOTELBEDS-IMAGES] Making request to: ${contentUrl}`);
    
    const response = await fetch(contentUrl, {
      method: 'GET',
      headers: {
        'Api-key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn(`[HOTELBEDS-IMAGES] No content found for hotel: ${hotelCode}`);
        return new Response(JSON.stringify({
          success: true,
          images: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const errorText = await response.text();
      logger.error(`[HOTELBEDS-IMAGES] API Error: ${response.status} - ${errorText}`);
      
      throw new Error(`HotelBeds API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.hotel) {
      logger.warn(`[HOTELBEDS-IMAGES] No hotel data in response for: ${hotelCode}`);
      return new Response(JSON.stringify({
        success: true,
        images: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract and format images
    const hotel = data.hotel;
    const images = [];
    
    // Process hotel images
    if (hotel.images && Array.isArray(hotel.images)) {
      for (const image of hotel.images) {
        if (image.path) {
          images.push({
            url: image.path,
            type: image.imageTypeCode || 'GEN',
            order: image.order || 0,
            roomCode: image.roomCode,
            category: getImageCategory(image.imageTypeCode),
            title: `${hotel.name?.content || 'Hotel'} - ${getImageCategory(image.imageTypeCode)}`
          });
        }
      }
    }

    // Sort images by order and type priority
    images.sort((a, b) => {
      const typeOrder = { 'GEN': 0, 'HAB': 1, 'RES': 2, 'COM': 3, 'DEP': 4 };
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 5;
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 5;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.order || 0) - (b.order || 0);
    });

    logger.info(`[HOTELBEDS-IMAGES] Found ${images.length} images for hotel: ${hotelCode}`);

    return new Response(JSON.stringify({
      success: true,
      images: images.slice(0, 10), // Limit to 10 images
      hotelCode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[HOTELBEDS-IMAGES] Error fetching images:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      images: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getImageCategory(imageTypeCode: string): string {
  const categories: Record<string, string> = {
    'GEN': 'exterior',
    'HAB': 'room',
    'RES': 'restaurant',
    'COM': 'common_area',
    'DEP': 'sports',
    'SER': 'service',
    'CON': 'conference',
    'HAL': 'lobby',
    'PIS': 'pool',
    'PLY': 'beach',
    'BAR': 'bar',
    'GYM': 'fitness',
    'SPA': 'spa'
  };
  
  return categories[imageTypeCode] || 'hotel';
}