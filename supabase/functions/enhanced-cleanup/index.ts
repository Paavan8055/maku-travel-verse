import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import logger from "../_shared/logger.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const body = await req.json()
    const correlationId = body?.correlationId || crypto.randomUUID()
    const cleanupType = body?.cleanupType || 'comprehensive'

    logger.info('Starting enhanced cleanup', { correlationId, cleanupType })

    const results = {
      travel_fund_expired: 0,
      old_bookings_expired: 0,
      stripe_synced: 0,
      errors: 0,
      total_processed: 0
    }

    // 1. Clean up travel-fund bookings without payment intents (immediate expiry)
    const { data: travelFundBookings, error: tfError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .eq('booking_type', 'travel-fund')
      .is('booking_data->>stripe_payment_intent_id', null)

    if (tfError) {
      logger.error('Error fetching travel fund bookings', tfError, { correlationId })
    } else if (travelFundBookings?.length) {
      logger.info(`Processing ${travelFundBookings.length} travel fund bookings`, { correlationId })
      
      for (const booking of travelFundBookings) {
        try {
          const { error: updateError } = await supabaseClient
            .from('bookings')
            .update({ 
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id)

          if (updateError) {
            logger.error('Error updating travel fund booking', updateError, { correlationId, bookingId: booking.id })
            results.errors++
          } else {
            results.travel_fund_expired++
            logger.info('Expired travel fund booking', { correlationId, bookingId: booking.id })
          }
        } catch (error) {
          logger.error('Error processing travel fund booking', error, { correlationId, bookingId: booking.id })
          results.errors++
        }
      }
    }

    // 2. Clean up old bookings (> 24 hours) without payment intents
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: oldBookings, error: oldError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .neq('booking_type', 'travel-fund')
      .lt('created_at', oneDayAgo)
      .is('booking_data->>stripe_payment_intent_id', null)

    if (oldError) {
      logger.error('Error fetching old bookings', oldError, { correlationId })
    } else if (oldBookings?.length) {
      logger.info(`Processing ${oldBookings.length} old bookings`, { correlationId })
      
      for (const booking of oldBookings) {
        try {
          const { error: updateError } = await supabaseClient
            .from('bookings')
            .update({ 
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id)

          if (updateError) {
            logger.error('Error updating old booking', updateError, { correlationId, bookingId: booking.id })
            results.errors++
          } else {
            results.old_bookings_expired++
            logger.info('Expired old booking', { correlationId, bookingId: booking.id })
          }
        } catch (error) {
          logger.error('Error processing old booking', error, { correlationId, bookingId: booking.id })
          results.errors++
        }
      }
    }

    // 3. Process bookings with payment intents (sync with Stripe)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: paymentBookings, error: paymentError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', tenMinutesAgo)
      .not('booking_data->>stripe_payment_intent_id', 'is', null)

    if (paymentError) {
      logger.error('Error fetching payment bookings', paymentError, { correlationId })
    } else if (paymentBookings?.length) {
      logger.info(`Processing ${paymentBookings.length} payment bookings`, { correlationId })
      
      for (const booking of paymentBookings) {
        try {
          const paymentIntentId = booking.booking_data?.stripe_payment_intent_id
          
          if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
            
            let newStatus = 'pending'
            
            switch (paymentIntent.status) {
              case 'succeeded':
                newStatus = 'confirmed'
                break
              case 'canceled':
              case 'payment_failed':
                newStatus = 'expired'
                break
              case 'requires_payment_method':
              case 'requires_confirmation':
                // Cancel abandoned payment intents
                try {
                  await stripe.paymentIntents.cancel(paymentIntentId)
                  newStatus = 'expired'
                  logger.info('Cancelled abandoned payment intent', { correlationId, paymentIntentId })
                } catch (cancelError) {
                  logger.warn('Failed to cancel payment intent', { correlationId, paymentIntentId, error: cancelError })
                  newStatus = 'expired'
                }
                break
            }

            if (newStatus !== 'pending') {
              const { error: updateError } = await supabaseClient
                .from('bookings')
                .update({ 
                  status: newStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', booking.id)

              if (updateError) {
                logger.error('Error updating payment booking', updateError, { correlationId, bookingId: booking.id })
                results.errors++
              } else {
                results.stripe_synced++
                logger.info('Synced payment booking', { 
                  correlationId, 
                  bookingId: booking.id, 
                  oldStatus: 'pending',
                  newStatus,
                  stripeStatus: paymentIntent.status
                })
              }
            }
          }
        } catch (error) {
          logger.error('Error processing payment booking', error, { correlationId, bookingId: booking.id })
          results.errors++
        }
      }
    }

    results.total_processed = results.travel_fund_expired + results.old_bookings_expired + results.stripe_synced
    
    const executionStartTime = Date.now()
    
    // Log audit record
    const { error: auditError } = await supabaseClient.from('cleanup_audit').insert({
      cleanup_type: 'enhanced_comprehensive',
      triggered_by: body?.trigger || 'automated',
      bookings_processed: results.total_processed,
      bookings_expired: results.travel_fund_expired + results.old_bookings_expired,
      payments_cancelled: 0, // Count handled within stripe_synced
      errors_encountered: results.errors,
      execution_time_ms: Date.now() - executionStartTime,
      details: { 
        results, 
        correlationId,
        cleanup_categories: {
          travel_fund_expired: results.travel_fund_expired,
          old_bookings_expired: results.old_bookings_expired,
          stripe_synced: results.stripe_synced
        }
      }
    })
    
    if (auditError) {
      logger.error('Error creating audit record', auditError, { correlationId })
    }

    logger.info('Enhanced cleanup completed', { correlationId, results })

    return new Response(
      JSON.stringify({ 
        success: true,
        correlationId,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    logger.error('Enhanced cleanup error', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})