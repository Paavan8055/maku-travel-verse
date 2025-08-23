import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/simpleLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivitySearchParams {
  destination: string;
  from?: string;
  to?: string;
  occupancy?: Array<{ rooms: number; adults: number; children: number }>;
  language: string;
}

// Generate HMAC SHA256 signature for HotelBeds API
async function generateSignature(apiKey: string, secret: string, timestamp: number): Promise<string> {
  const message = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function searchHotelbedsActivities(params: ActivitySearchParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  
  logger.info('HotelBeds activities credentials check:', {
    apiKeyExists: !!apiKey,
    secretExists: !!secret
  });
  
  if (!apiKey || !secret) {
    logger.error('HotelBeds activities credentials missing');
    throw new Error('HotelBeds credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateSignature(apiKey, secret, timestamp);
  
  const requestBody = {
    language: params.language || 'en',
    from: params.from || new Date().toISOString().split('T')[0],
    to: params.to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    destination: {
      code: params.destination,
      type: 'ZONE' // Can be ZONE, COUNTRY, or CITY
    },
    occupancy: params.occupancy || [{ rooms: 1, adults: 2, children: 0 }],
    pagination: {
      itemsPerPage: 50,
      page: 1
    }
  };

  logger.info('HotelBeds Activities search request:', requestBody);

  const response = await fetch('https://api.test.hotelbeds.com/activity-api/3.0/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('HotelBeds Activities API error:', errorText);
    throw new Error(`HotelBeds Activities search failed: ${response.statusText}`);
  }

  return await response.json();
}

function transformHotelbedsActivities(activities: any[]): any[] {
  return activities.map((activity: any) => ({
    id: `hotelbeds-${activity.code}`,
    title: activity.name,
    description: activity.description?.split('\n')[0] || activity.name,
    provider: 'HotelBeds',
    location: `${activity.country?.description}, ${activity.destination?.name}`,
    images: activity.images?.map((img: any) => img.url) || ['/assets/activity-default.jpg'],
    category: activity.type?.description || 'Experience',
    price: activity.modalities?.[0]?.rates?.[0]?.rateDetails?.[0]?.totalAmount || 0,
    currency: activity.modalities?.[0]?.rates?.[0]?.rateDetails?.[0]?.currency || 'EUR',
    duration: activity.duration?.description || 'varies',
    durationHours: activity.duration?.value || 0,
    difficulty: 'moderate',
    rating: 4.0 + Math.random() * 1, // Random rating between 4.0-5.0
    reviewCount: Math.floor(Math.random() * 1000) + 100,
    groupSize: { min: 1, max: 20 },
    availability: ['Daily'],
    highlights: activity.highlights?.split('\n').slice(0, 3) || [activity.name],
    included: activity.included?.split('\n') || ['Professional guide'],
    cancellationPolicy: activity.cancellationPolicies?.[0]?.description || 'Contact provider',
    instantConfirmation: true,
    ageGroup: 'adult',
    meetingPoint: activity.meetingPoint || 'To be confirmed',
    source: 'hotelbeds',
    originalData: {
      code: activity.code,
      type: activity.type,
      modalities: activity.modalities
    }
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: ActivitySearchParams = await req.json();
    
    logger.info('HotelBeds Activities search:', params);

    const activitiesResult = await searchHotelbedsActivities(params);
    
    logger.info('HotelBeds Activities search successful:', activitiesResult.activities?.length || 0, 'activities found');

    const transformedActivities = activitiesResult.activities ? 
      transformHotelbedsActivities(activitiesResult.activities) : [];

    return new Response(JSON.stringify({
      success: true,
      activities: transformedActivities,
      searchCriteria: params,
      totalResults: transformedActivities.length,
      source: 'hotelbeds'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('HotelBeds Activities search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Activities search failed',
      activities: [],
      source: 'hotelbeds'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});