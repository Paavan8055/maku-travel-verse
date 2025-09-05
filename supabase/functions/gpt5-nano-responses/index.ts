import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import OpenAI via ESM for Deno compatibility
import OpenAI from "https://esm.sh/openai@4.67.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { input, model = "gpt-5-nano-2025-08-07", store = true } = await req.json();

    if (!input) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating OpenAI client and generating response with GPT-5 Nano...');
    
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    // Use the new Responses API with GPT-5 Nano
    const response = await openai.responses.create({
      model: model,
      input: input,
      store: store,
    });

    console.log('GPT-5 Nano response generated successfully');

    return new Response(
      JSON.stringify({ 
        output_text: response.output_text,
        model: model,
        created: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gpt5-nano-responses function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate response',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});