import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { passportImageUrl, userId } = await req.json()

    // TODO: Integrate with OCR service (AWS Textract, Google Vision, etc.)
    // For now, simulate validation logic
    console.log(`Validating passport for user ${userId} with image: ${passportImageUrl}`)

    // Simulate OCR extraction
    const mockOcrResult = {
      country: 'AUS',
      passportNumber: 'N1234567',
      expiryDate: '2030-12-31',
      isValid: true,
      confidence: 0.95
    }

    // Update passport_info table with validation result
    const { data, error } = await supabase
      .from('passport_info')
      .update({
        verified: mockOcrResult.isValid && mockOcrResult.confidence > 0.9,
        country: mockOcrResult.country,
        passport_number: mockOcrResult.passportNumber,
        expiry_date: mockOcrResult.expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update passport info' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: mockOcrResult.isValid && mockOcrResult.confidence > 0.9,
        extractedData: mockOcrResult,
        data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})