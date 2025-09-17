import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import logger from "../_shared/logger.ts"
import { 
  getViatorProductDetails,
  getViatorProductBookingQuestions,
  ViatorProduct,
  ViatorBookingQuestion
} from "../_shared/viator.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductDetailsRequest {
  productCode: string
  includeBookingQuestions?: boolean
}

interface ProductDetailsResponse {
  product: ViatorProduct
  bookingQuestions?: ViatorBookingQuestion[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { productCode, includeBookingQuestions = false } = await req.json() as ProductDetailsRequest

    logger.info('[VIATOR-PRODUCT-DETAILS] Getting product details', {
      productCode,
      includeBookingQuestions
    })

    // Get product details
    const product = await getViatorProductDetails(productCode)

    const response: ProductDetailsResponse = {
      product
    }

    // Get booking questions if requested
    if (includeBookingQuestions) {
      try {
        const bookingQuestions = await getViatorProductBookingQuestions(productCode)
        response.bookingQuestions = bookingQuestions
        
        logger.info('[VIATOR-PRODUCT-DETAILS] Booking questions retrieved', {
          productCode,
          questionCount: bookingQuestions.length
        })
      } catch (error) {
        logger.warn('[VIATOR-PRODUCT-DETAILS] Failed to get booking questions', {
          productCode,
          error: error.message
        })
        // Don't fail the entire request if booking questions fail
        response.bookingQuestions = []
      }
    }

    logger.info('[VIATOR-PRODUCT-DETAILS] Product details retrieved successfully', {
      productCode,
      title: product.title
    })

    return new Response(
      JSON.stringify({
        success: true,
        ...response
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    logger.error('[VIATOR-PRODUCT-DETAILS] Failed to get product details', {
      error: error.message,
      stack: error.stack
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to get product details'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})