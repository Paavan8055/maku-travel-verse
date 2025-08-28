import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  destinationId: string;
  destinationName: string;
  country: string;
  includeSupplierData?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { destinationId, destinationName, country, includeSupplierData } = await req.json() as ContentRequest;

    console.log(`[CONTENT-AGGREGATOR] Aggregating content for ${destinationName}, ${country}`);

    const aggregatedContent = {
      destination: {
        id: destinationId,
        name: destinationName,
        country: country
      },
      description: null,
      highlights: [],
      safety_info: null,
      weather_info: null,
      images: [],
      points_of_interest: [],
      travel_alerts: []
    };

    // Fetch from Amadeus Safe Place API if coordinates provided
    if (includeSupplierData) {
      try {
        // Get safety information
        const safetyResponse = await supabase.functions.invoke('amadeus-safe-place', {
          body: { latitude: 0, longitude: 0 } // You'd need actual coordinates
        });

        if (safetyResponse.data?.success) {
          aggregatedContent.safety_info = safetyResponse.data.safetyInfo;
        }

        // Get points of interest
        const poiResponse = await supabase.functions.invoke('amadeus-points-of-interest', {
          body: { latitude: 0, longitude: 0, radius: 10 }
        });

        if (poiResponse.data?.success) {
          aggregatedContent.points_of_interest = poiResponse.data.pointsOfInterest || [];
        }

        // Get hotel images from HotelBeds
        const hotelContentResponse = await supabase.functions.invoke('hotelbeds-content', {
          body: { 
            destinationCode: destinationId,
            language: 'ENG'
          }
        });

        if (hotelContentResponse.data?.success) {
          aggregatedContent.images = hotelContentResponse.data.hotels
            ?.flatMap((hotel: any) => hotel.images?.map((img: any) => ({
              url: img.path,
              category: img.imageTypeCode,
              caption: img.description || hotel.name,
              source: 'hotelbeds'
            }))) || [];
        }

      } catch (supplierError) {
        console.error('[CONTENT-AGGREGATOR] Supplier API error:', supplierError);
      }
    }

    // Store aggregated content in database
    const { data: existingContent } = await supabase
      .from('destination_content')
      .select('*')
      .eq('destination_id', destinationId)
      .single();

    if (existingContent) {
      // Update existing content
      await supabase
        .from('destination_content')
        .update({
          supplier_data: aggregatedContent,
          content_source: 'aggregated',
          updated_at: new Date().toISOString()
        })
        .eq('destination_id', destinationId);
    } else {
      // Create new content entry
      await supabase
        .from('destination_content')
        .insert({
          destination_id: destinationId,
          destination_name: destinationName,
          country: country,
          supplier_data: aggregatedContent,
          content_source: 'aggregated',
          content_status: 'draft'
        });
    }

    // Store images separately for better management
    if (aggregatedContent.images.length > 0) {
      const imageInserts = aggregatedContent.images.slice(0, 10).map((img: any, index: number) => ({
        destination_id: destinationId,
        image_url: img.url,
        image_caption: img.caption,
        image_category: img.category || 'general',
        image_source: img.source || 'supplier',
        display_order: index,
        is_featured: index === 0
      }));

      await supabase
        .from('content_images')
        .upsert(imageInserts, { onConflict: 'destination_id,image_url' });
    }

    // Store POI data
    if (aggregatedContent.points_of_interest.length > 0) {
      const poiInserts = aggregatedContent.points_of_interest.map((poi: any) => ({
        destination_id: destinationId,
        poi_id: poi.id,
        name: poi.name,
        category: poi.category,
        description: poi.shortDescription || '',
        coordinates: poi.geoCode || {},
        supplier_data: poi,
        rating: poi.rank ? (5 - (poi.rank / 10)) : null
      }));

      await supabase
        .from('poi_content')
        .upsert(poiInserts, { onConflict: 'destination_id,poi_id' });
    }

    console.log(`[CONTENT-AGGREGATOR] Successfully aggregated content for ${destinationName}`);

    return new Response(JSON.stringify({
      success: true,
      content: aggregatedContent,
      images_count: aggregatedContent.images.length,
      poi_count: aggregatedContent.points_of_interest.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[CONTENT-AGGREGATOR] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});