import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnonymizationRequest {
  bookingId?: string;
  batchSize?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: AnonymizationRequest = await req.json();
    
    console.log('AI training anonymization request:', {
      bookingId: params.bookingId,
      batchSize: params.batchSize || 100
    });

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    if (params.bookingId) {
      // Process specific booking
      try {
        await supabaseClient.rpc('anonymize_booking_for_ai', {
          _booking_id: params.bookingId
        });
        processedCount = 1;
        console.log(`Anonymized booking ${params.bookingId} for AI training`);
      } catch (error) {
        errorCount = 1;
        errors.push(`Error processing booking ${params.bookingId}: ${error.message}`);
        console.error('Anonymization error:', error);
      }
    } else {
      // Process batch of old guest bookings
      const batchSize = params.batchSize || 100;
      
      try {
        await supabaseClient.rpc('auto_anonymize_old_guest_bookings');
        
        // Check how many were processed by querying the AI training table
        const { data: recentlyAnonymized } = await supabaseClient
          .from('ai_training_bookings')
          .select('id')
          .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
          .limit(batchSize);
        
        processedCount = recentlyAnonymized?.length || 0;
        console.log(`Batch anonymization completed: ${processedCount} bookings processed`);
      } catch (error) {
        errorCount = 1;
        errors.push(`Batch anonymization error: ${error.message}`);
        console.error('Batch anonymization error:', error);
      }
    }

    // Also run cleanup of expired tokens
    try {
      await supabaseClient.rpc('cleanup_expired_guest_tokens');
      console.log('Cleaned up expired guest tokens');
    } catch (error) {
      console.error('Token cleanup error:', error);
      errors.push(`Token cleanup error: ${error.message}`);
    }

    // Get AI training data statistics
    const { data: aiDataStats } = await supabaseClient
      .from('ai_training_bookings')
      .select('booking_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const statsByType = aiDataStats?.reduce((acc: any, item: any) => {
      acc[item.booking_type] = (acc[item.booking_type] || 0) + 1;
      return acc;
    }, {}) || {};

    return new Response(JSON.stringify({
      success: true,
      anonymization: {
        processedCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      },
      aiTrainingStats: {
        last24Hours: aiDataStats?.length || 0,
        byType: statsByType
      },
      message: processedCount > 0 
        ? `Successfully anonymized ${processedCount} booking(s) for AI training`
        : 'No bookings were processed'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('AI training anonymization error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});