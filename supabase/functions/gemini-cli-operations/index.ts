import { corsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import logger from "../_shared/logger.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { operation, data } = await req.json();
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    let prompt = '';
    
    switch (operation) {
      case 'generate-destination':
        prompt = `Create a comprehensive destination guide for ${data.destination}. Include:
        - Overview and highlights
        - Best time to visit
        - Top attractions
        - Local culture and customs
        - Travel tips
        Format as engaging travel content for MAKU.Travel.`;
        break;
        
      case 'create-itinerary':
        prompt = `Create a ${data.days}-day itinerary for ${data.destination}. Include:
        - Daily schedule with activities
        - Recommended accommodations
        - Transportation between locations
        - Budget estimates
        - Local dining recommendations
        Make it practical and exciting for travelers.`;
        break;
        
      case 'generate-hotel-desc':
        prompt = `Write an engaging hotel description for ${data.hotelName} in ${data.location}. Include:
        - Unique features and amenities
        - Location benefits
        - Target traveler type
        - Call-to-action for booking
        Keep it under 200 words, professional yet inviting.`;
        break;
        
      case 'travel-tips':
        prompt = `Provide essential travel tips for ${data.destination}. Cover:
        - Cultural etiquette
        - Safety considerations
        - Money and payments
        - Local transportation
        - Communication tips
        Make it practical and actionable.`;
        break;
        
      case 'test-prompt':
        prompt = data.prompt;
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedContent = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated';

    logger.info(`Gemini CLI operation ${operation} completed successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: generatedContent,
        operation,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error in gemini-cli-operations:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});