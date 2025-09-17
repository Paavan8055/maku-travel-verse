import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts"
import { 
  createViatorBooking, 
  getViatorProductBookingQuestions,
  checkViatorProductAvailability,
  ViatorBookingData,
  ViatorBookingResponse 
} from "../_shared/viator.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ViatorBookingRequest {
  productCode: string
  optionCode?: string
  travelDate: string
  travelers: Array<{
    firstName: string
    lastName: string
    title?: string
    dateOfBirth?: string
    bandId?: string
  }>
  bookingQuestionAnswers: Array<{
    questionId: string
    answer: string
  }>
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    country?: string
  }
  specialRequests?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { productCode, optionCode, travelDate, travelers, bookingQuestionAnswers, customerInfo, specialRequests } = await req.json() as ViatorBookingRequest

    logger.info('[VIATOR-BOOKING] Processing booking request', {
      productCode,
      travelDate,
      travelerCount: travelers.length,
      customerEmail: customerInfo.email
    })

    // Step 1: Get product booking questions to validate answers
    const bookingQuestions = await getViatorProductBookingQuestions(productCode)
    
    // Step 2: Validate required booking questions are answered
    const requiredQuestions = bookingQuestions.filter(q => q.required)
    const answeredQuestionIds = bookingQuestionAnswers.map(a => a.questionId)
    const missingAnswers = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id))

    if (missingAnswers.length > 0) {
      logger.error('[VIATOR-BOOKING] Missing required booking question answers', {
        productCode,
        missingQuestions: missingAnswers.map(q => q.id)
      })
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required booking information',
          missingQuestions: missingAnswers
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 3: Check availability for the requested date
    const [year, month] = travelDate.split('-')
    const availability = await checkViatorProductAvailability(productCode, month, year)
    const dateAvailability = availability.find(a => a.localDate === travelDate)

    if (!dateAvailability || !dateAvailability.available) {
      logger.warn('[VIATOR-BOOKING] Product not available for requested date', {
        productCode,
        travelDate,
        available: dateAvailability?.available
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product not available for selected date',
          nextAvailableDate: dateAvailability?.nextAvailableDate
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 4: Create booking data for Viator API
    const viatorBookingData: ViatorBookingData = {
      productCode,
      optionCode: optionCode || 'DEFAULT',
      travelDate,
      travelers: travelers.map((traveler, index) => ({
        bandId: traveler.bandId || 'ADULT',
        firstName: traveler.firstName,
        lastName: traveler.lastName,
        title: traveler.title,
        leadTraveler: index === 0
      })),
      bookingQuestionAnswers,
      customerInfo: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        country: customerInfo.country || 'AU'
      }
    }

    // Step 5: Create booking with Viator
    const viatorBookingResponse: ViatorBookingResponse = await createViatorBooking(viatorBookingData)

    // Step 6: Store booking in our database
    const { data: mainBooking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        booking_type: 'activity',
        booking_reference: `VIATOR_${viatorBookingResponse.bookingReference}`,
        status: viatorBookingResponse.status.toLowerCase(),
        total_amount: viatorBookingResponse.totalPrice.amount,
        currency: viatorBookingResponse.totalPrice.currency,
        booking_data: {
          productCode,
          optionCode,
          travelDate,
          travelers,
          customerInfo,
          specialRequests,
          viator_booking_reference: viatorBookingResponse.bookingReference
        },
        user_id: null // Will be set if user is authenticated
      })
      .select()
      .single()

    if (bookingError) {
      logger.error('[VIATOR-BOOKING] Failed to store main booking', {
        error: bookingError.message,
        productCode,
        viatorReference: viatorBookingResponse.bookingReference
      })
      throw new Error('Failed to store booking record')
    }

    // Step 7: Store Viator-specific booking data
    const { error: viatorBookingError } = await supabaseClient
      .from('viator_bookings')
      .insert({
        booking_id: mainBooking.id,
        viator_booking_reference: viatorBookingResponse.bookingReference,
        product_code: productCode,
        booking_status: viatorBookingResponse.status.toLowerCase(),
        booking_data: viatorBookingData,
        customer_answers: bookingQuestionAnswers.reduce((acc, answer) => {
          acc[answer.questionId] = answer.answer
          return acc
        }, {} as Record<string, string>),
        voucher_info: viatorBookingResponse.voucher
      })

    if (viatorBookingError) {
      logger.error('[VIATOR-BOOKING] Failed to store Viator booking data', {
        error: viatorBookingError.message,
        bookingId: mainBooking.id,
        viatorReference: viatorBookingResponse.bookingReference
      })
      
      // Try to clean up main booking
      await supabaseClient
        .from('bookings')
        .delete()
        .eq('id', mainBooking.id)
      
      throw new Error('Failed to store Viator booking data')
    }

    // Step 8: Store booking questions and answers
    if (bookingQuestions.length > 0) {
      const { error: questionsError } = await supabaseClient
        .from('viator_booking_questions')
        .upsert(
          bookingQuestions.map(question => ({
            product_code: productCode,
            question_id: question.id,
            question_text: question.question,
            question_type: question.questionType,
            required: question.required,
            options: question.options || null,
            validation_rules: question.validationRules || {}
          })),
          { onConflict: 'product_code,question_id' }
        )

      if (questionsError) {
        logger.warn('[VIATOR-BOOKING] Failed to store booking questions', {
          error: questionsError.message,
          productCode
        })
      }
    }

    logger.info('[VIATOR-BOOKING] Booking completed successfully', {
      productCode,
      bookingId: mainBooking.id,
      viatorReference: viatorBookingResponse.bookingReference,
      status: viatorBookingResponse.status,
      totalAmount: viatorBookingResponse.totalPrice.amount
    })

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: mainBooking.id,
          bookingReference: mainBooking.booking_reference,
          viatorReference: viatorBookingResponse.bookingReference,
          status: viatorBookingResponse.status,
          totalPrice: viatorBookingResponse.totalPrice,
          voucher: viatorBookingResponse.voucher,
          confirmation: viatorBookingResponse.confirmation
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    logger.error('[VIATOR-BOOKING] Booking failed', {
      error: error.message,
      stack: error.stack
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Booking failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})