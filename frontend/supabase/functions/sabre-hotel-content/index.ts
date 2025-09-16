import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";


interface SabreHotelContentRequest {
  hotelId: string;
  correlationId?: string;
}

interface SabreHotelImage {
  url: string;
  caption: string;
  category: string;
  width?: number;
  height?: number;
}

const generateSabreSignature = (clientId: string, secret: string, timestamp: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + clientId + timestamp);
  const hashBuffer = crypto.subtle.digestSync('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, correlationId = 'no-correlation' }: SabreHotelContentRequest = await req.json();
    
    const clientId = Deno.env.get('SABRE_CLIENT_ID');
    const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
    const baseUrl = Deno.env.get('SABRE_BASE_URL');
    
    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error('Missing Sabre credentials');
    }

    console.log(`[${correlationId}] [SABRE-HOTEL-CONTENT] Fetching content for hotel: ${hotelId}`);

    // Get access token
    const tokenResponse = await fetch(`${baseUrl}/v2/auth/token`, {
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

    if (!tokenResponse.ok) {
      throw new Error(`Sabre auth failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Fetch hotel property description
    const propertyResponse = await fetch(
      `${baseUrl}/v1/shop/hotels/content?chain=${hotelId.substring(0, 2)}&property=${hotelId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!propertyResponse.ok) {
      console.log(`[${correlationId}] [SABRE-HOTEL-CONTENT] Property not found: ${propertyResponse.status}`);
      return new Response(JSON.stringify({
        success: false,
        images: [],
        error: 'Hotel property not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const propertyData = await propertyResponse.json();
    const property = propertyData.PropertyInfo;

    // Extract images from property data
    const images: SabreHotelImage[] = [];
    
    if (property?.ImageItems?.ImageItem) {
      const imageItems = Array.isArray(property.ImageItems.ImageItem) 
        ? property.ImageItems.ImageItem 
        : [property.ImageItems.ImageItem];
      
      for (const item of imageItems) {
        if (item.URL) {
          images.push({
            url: item.URL,
            caption: item.Caption || property.HotelName || 'Hotel Image',
            category: mapSabreImageCategory(item.Category),
            width: item.Width ? parseInt(item.Width) : undefined,
            height: item.Height ? parseInt(item.Height) : undefined,
          });
        }
      }
    }

    // Sort images by category priority
    images.sort((a, b) => {
      const priority = {
        'exterior': 1,
        'lobby': 2,
        'room': 3,
        'amenity': 4,
        'restaurant': 5,
        'other': 6
      };
      return (priority[a.category] || 6) - (priority[b.category] || 6);
    });

    console.log(`[${correlationId}] [SABRE-HOTEL-CONTENT] Retrieved ${images.length} images`);

    return new Response(JSON.stringify({
      success: true,
      images: images.slice(0, 8), // Limit to 8 images
      hotelName: property?.HotelName,
      source: 'sabre'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[SABRE-HOTEL-CONTENT] Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      images: [],
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function mapSabreImageCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'EXTERIOR': 'exterior',
    'LOBBY': 'lobby',
    'GUESTROOM': 'room',
    'SUITE': 'room',
    'RESTAURANT': 'restaurant',
    'BAR': 'restaurant',
    'POOL': 'amenity',
    'FITNESS': 'amenity',
    'SPA': 'amenity',
    'MEETING': 'amenity',
    'BUSINESS': 'amenity'
  };
  
  return categoryMap[category?.toUpperCase()] || 'other';
}