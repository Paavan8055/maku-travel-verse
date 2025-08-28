import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewEnhancementRequest {
  action: 'create' | 'verify' | 'moderate' | 'upload_photo';
  reviewData?: any;
  reviewId?: string;
  photoData?: {
    photo_url: string;
    photo_caption?: string;
    file_size?: number;
    file_type?: string;
  };
  moderationData?: {
    status: 'approved' | 'rejected' | 'pending';
    notes?: string;
  };
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

    const { action, reviewData, reviewId, photoData, moderationData } = await req.json() as ReviewEnhancementRequest;

    console.log(`[REVIEW-ENHANCEMENT] Processing action: ${action}`);

    switch (action) {
      case 'create': {
        if (!reviewData) {
          throw new Error('Review data is required for create action');
        }

        // Enhanced review creation with verification check
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, status, booking_data')
          .eq('id', reviewData.booking_id)
          .eq('user_id', reviewData.user_id)
          .single();

        const isVerified = booking && ['confirmed', 'completed'].includes(booking.status);

        const { data: newReview, error } = await supabase
          .from('detailed_reviews')
          .insert({
            ...reviewData,
            is_verified: isVerified,
            supplier_verified: isVerified,
            review_source: 'user',
            moderation_status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          review: newReview,
          is_verified: isVerified
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'upload_photo': {
        if (!reviewId || !photoData) {
          throw new Error('Review ID and photo data are required');
        }

        const { data: photo, error } = await supabase
          .from('review_photos')
          .insert({
            review_id: reviewId,
            ...photoData,
            is_approved: false
          })
          .select()
          .single();

        if (error) throw error;

        // Update review with photo URL reference
        await supabase
          .from('detailed_reviews')
          .update({
            photo_urls: supabase.sql`array_append(COALESCE(photo_urls, ARRAY[]::text[]), ${photoData.photo_url})`
          })
          .eq('id', reviewId);

        return new Response(JSON.stringify({
          success: true,
          photo: photo
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'moderate': {
        if (!reviewId || !moderationData) {
          throw new Error('Review ID and moderation data are required');
        }

        const { data: review, error } = await supabase
          .from('detailed_reviews')
          .update({
            moderation_status: moderationData.status,
            moderator_notes: moderationData.notes
          })
          .eq('id', reviewId)
          .select()
          .single();

        if (error) throw error;

        // If approved, also approve associated photos
        if (moderationData.status === 'approved') {
          await supabase
            .from('review_photos')
            .update({ is_approved: true })
            .eq('review_id', reviewId);
        }

        return new Response(JSON.stringify({
          success: true,
          review: review
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'verify': {
        if (!reviewId) {
          throw new Error('Review ID is required for verification');
        }

        // Check if review is connected to a confirmed booking
        const { data: review } = await supabase
          .from('detailed_reviews')
          .select('booking_id, user_id')
          .eq('id', reviewId)
          .single();

        if (!review) throw new Error('Review not found');

        const { data: booking } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', review.booking_id)
          .eq('user_id', review.user_id)
          .single();

        const isVerified = booking && ['confirmed', 'completed'].includes(booking.status);

        const { data: updatedReview, error } = await supabase
          .from('detailed_reviews')
          .update({
            is_verified: isVerified,
            supplier_verified: isVerified
          })
          .eq('id', reviewId)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          review: updatedReview,
          is_verified: isVerified
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[REVIEW-ENHANCEMENT] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});