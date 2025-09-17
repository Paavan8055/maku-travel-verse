import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";

// Enhanced Viator client for full certification compliance
interface ViatorCertificationRequest {
  action: 'availability' | 'questions' | 'book' | 'cancel' | 'modify';
  productCode: string;
  optionCode?: string;
  travelDate?: string;
  travelers?: ViatorTraveler[];
  bookingQuestionAnswers?: ViatorBookingAnswer[];
  customerInfo?: ViatorCustomerInfo;
  bookingReference?: string;
}

interface ViatorTraveler {
  bandId: string;
  firstName: string;
  lastName: string;
  title?: string;
  leadTraveler?: boolean;
}

interface ViatorBookingAnswer {
  questionId: string;
  answer: string;
}

interface ViatorCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
}

interface ViatorAvailabilityResponse {
  productCode: string;
  available: boolean;
  dates: Array<{
    date: string;
    status: 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT';
    pricing?: {
      currency: string;
      price: number;
    };
  }>;
}

interface ViatorBookingResponse {
  bookingReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  totalPrice: {
    currency: string;
    amount: number;
  };
  voucher?: {
    type: 'URL' | 'PDF';
    url: string;
  };
  confirmation?: {
    confirmationNumber: string;
    instructions: string;
  };
}

const VIATOR_CONFIG = {
  apiKey: Deno.env.get('VIATOR_API_KEY') || "",
  baseUrl: "https://api.viator.com/partner"
};

function getViatorHeaders(): Record<string, string> {
  if (!VIATOR_CONFIG.apiKey) {
    throw new Error('Viator API key not configured');
  }
  
  return {
    'exp-api-key': VIATOR_CONFIG.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json;version=2.0'
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const requestBody: ViatorCertificationRequest = await req.json();
    const { action, productCode } = requestBody;

    logger.info('[VIATOR-CERT] Processing request', { action, productCode });

    // Validate Viator credentials
    if (!VIATOR_CONFIG.apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Viator API not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    let result: any;

    switch (action) {
      case 'availability':
        result = await checkProductAvailability(productCode, requestBody.travelDate);
        break;
      
      case 'questions':
        result = await getProductBookingQuestions(productCode, supabase);
        break;
      
      case 'book':
        result = await createViatorBooking(requestBody, supabase);
        break;
      
      case 'cancel':
        result = await cancelViatorBooking(requestBody.bookingReference!, supabase);
        break;
      
      case 'modify':
        result = await modifyViatorBooking(requestBody, supabase);
        break;
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[VIATOR-CERT] Request failed', { error: error.message, stack: error.stack });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function checkProductAvailability(
  productCode: string, 
  travelDate?: string
): Promise<ViatorAvailabilityResponse> {
  const url = `${VIATOR_CONFIG.baseUrl}/products/${productCode}/availability`;
  
  const requestBody = {
    productCode,
    ...(travelDate && { 
      month: travelDate.substring(5, 7),
      year: travelDate.substring(0, 4)
    })
  };

  logger.info('[VIATOR-CERT] Checking availability', { productCode, travelDate });

  const response = await fetch(url, {
    method: 'POST',
    headers: getViatorHeaders(),
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[VIATOR-CERT] Availability API error', { 
      status: response.status, 
      error: errorText 
    });
    throw new Error(`Viator availability error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    productCode,
    available: data.length > 0,
    dates: data.map((item: any) => ({
      date: item.localDate,
      status: item.status,
      pricing: item.pricing ? {
        currency: item.pricing.currency,
        price: item.pricing.price
      } : undefined
    }))
  };
}

async function getProductBookingQuestions(
  productCode: string,
  supabase: any
): Promise<any[]> {
  // First check if we have cached questions
  const { data: cachedQuestions } = await supabase
    .from('viator_booking_questions')
    .select('*')
    .eq('product_code', productCode);

  if (cachedQuestions && cachedQuestions.length > 0) {
    logger.info('[VIATOR-CERT] Using cached booking questions', { productCode });
    return cachedQuestions;
  }

  // Fetch from Viator API
  const url = `${VIATOR_CONFIG.baseUrl}/products/${productCode}/booking-questions`;
  
  logger.info('[VIATOR-CERT] Fetching booking questions', { productCode });

  const response = await fetch(url, {
    method: 'GET',
    headers: getViatorHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[VIATOR-CERT] Booking questions API error', { 
      status: response.status, 
      error: errorText 
    });
    return []; // Return empty array to not break booking flow
  }

  const questions = await response.json();
  
  // Cache the questions in database
  if (questions && questions.length > 0) {
    const questionData = questions.map((q: any) => ({
      product_code: productCode,
      question_id: q.id,
      question_text: q.question,
      question_type: q.questionType,
      required: q.required,
      options: q.options || [],
      validation_rules: q.validationRules || {}
    }));

    await supabase
      .from('viator_booking_questions')
      .upsert(questionData, { onConflict: 'product_code,question_id' });

    logger.info('[VIATOR-CERT] Cached booking questions', { 
      productCode, 
      questionCount: questions.length 
    });
  }

  return questions;
}

async function createViatorBooking(
  request: ViatorCertificationRequest,
  supabase: any
): Promise<ViatorBookingResponse> {
  const { productCode, optionCode, travelDate, travelers, bookingQuestionAnswers, customerInfo } = request;

  if (!travelDate || !travelers || !customerInfo) {
    throw new Error('Missing required booking information');
  }

  const url = `${VIATOR_CONFIG.baseUrl}/bookings`;
  
  const bookingData = {
    productCode,
    optionCode,
    travelDate,
    travelers,
    bookingQuestionAnswers: bookingQuestionAnswers || [],
    customerInfo
  };

  logger.info('[VIATOR-CERT] Creating booking', { 
    productCode,
    travelDate,
    travelerCount: travelers.length
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: getViatorHeaders(),
    body: JSON.stringify(bookingData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[VIATOR-CERT] Booking creation failed', { 
      status: response.status, 
      error: errorText 
    });
    throw new Error(`Viator booking failed: ${response.status}`);
  }

  const bookingResult = await response.json();
  
  // Store booking in enhanced tracking table
  try {
    await supabase
      .from('viator_bookings_enhanced')
      .insert({
        viator_booking_reference: bookingResult.bookingReference,
        product_code: productCode,
        option_code: optionCode,
        travel_date: travelDate,
        travelers: travelers,
        booking_questions_answers: bookingQuestionAnswers || {},
        booking_status: bookingResult.status?.toLowerCase() || 'pending',
        confirmation_details: bookingResult.confirmation || {},
        voucher_info: bookingResult.voucher || {},
        total_amount: bookingResult.totalPrice?.amount,
        currency: bookingResult.totalPrice?.currency || 'AUD'
      });

    logger.info('[VIATOR-CERT] Booking stored in database', { 
      bookingReference: bookingResult.bookingReference 
    });
  } catch (dbError) {
    logger.error('[VIATOR-CERT] Failed to store booking in database', { dbError });
    // Don't fail the booking if database storage fails
  }

  return bookingResult;
}

async function cancelViatorBooking(
  bookingReference: string,
  supabase: any
): Promise<any> {
  const url = `${VIATOR_CONFIG.baseUrl}/bookings/${bookingReference}/cancel`;
  
  logger.info('[VIATOR-CERT] Cancelling booking', { bookingReference });

  const response = await fetch(url, {
    method: 'POST',
    headers: getViatorHeaders(),
    body: JSON.stringify({ reason: 'Customer requested cancellation' })
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[VIATOR-CERT] Booking cancellation failed', { 
      status: response.status, 
      error: errorText 
    });
    throw new Error(`Viator cancellation failed: ${response.status}`);
  }

  const result = await response.json();

  // Update booking status in database
  try {
    await supabase
      .from('viator_bookings_enhanced')
      .update({ 
        booking_status: 'cancelled',
        confirmation_details: result
      })
      .eq('viator_booking_reference', bookingReference);

    logger.info('[VIATOR-CERT] Booking cancellation updated in database', { bookingReference });
  } catch (dbError) {
    logger.error('[VIATOR-CERT] Failed to update cancellation in database', { dbError });
  }

  return result;
}

async function modifyViatorBooking(
  request: ViatorCertificationRequest,
  supabase: any
): Promise<any> {
  const { bookingReference, travelDate, travelers } = request;

  if (!bookingReference) {
    throw new Error('Booking reference required for modification');
  }

  const url = `${VIATOR_CONFIG.baseUrl}/bookings/${bookingReference}/modify`;
  
  const modificationData = {
    ...(travelDate && { travelDate }),
    ...(travelers && { travelers })
  };

  logger.info('[VIATOR-CERT] Modifying booking', { bookingReference, modificationData });

  const response = await fetch(url, {
    method: 'PUT',
    headers: getViatorHeaders(),
    body: JSON.stringify(modificationData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[VIATOR-CERT] Booking modification failed', { 
      status: response.status, 
      error: errorText 
    });
    throw new Error(`Viator modification failed: ${response.status}`);
  }

  const result = await response.json();

  // Update booking in database
  try {
    await supabase
      .from('viator_bookings_enhanced')
      .update({ 
        travel_date: travelDate,
        travelers: travelers,
        confirmation_details: result,
        booking_status: result.status?.toLowerCase() || 'confirmed'
      })
      .eq('viator_booking_reference', bookingReference);

    logger.info('[VIATOR-CERT] Booking modification updated in database', { bookingReference });
  } catch (dbError) {
    logger.error('[VIATOR-CERT] Failed to update modification in database', { dbError });
  }

  return result;
}