import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    logger.info('Sabre flight offers request received');
    const body = await req.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0,
      cabinClass = 'Economy',
    } = body;
    if (!origin || !destination || !departureDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: origin, destination, or departureDate' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
    const accessToken = await getSabreAccessToken();
    const sabreData = await searchOffers(
      { origin, destination, departureDate, returnDate, adults, children, infants, cabinClass },
      accessToken,
    );
    const offers = transformSabreOffers(sabreData);
    return new Response(JSON.stringify({ success: true, offers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Sabre flight offers error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
