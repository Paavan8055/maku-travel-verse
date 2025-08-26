import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";

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
    logger.info('[SABRE-FLIGHT] Request received', { method: req.method });
    
    const { 
      originLocationCode, 
      destinationLocationCode, 
      departureDate, 
      returnDate,
      adults = 1 
    } = await req.json();

    logger.info('Sabre flight search parameters:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();
    logger.info('✅ Successfully obtained Sabre token');

    // Build Sabre search request
    const searchRequest = {
      OTA_AirLowFareSearchRQ: {
        Version: "1",
        POS: {
          Source: [{
            PseudoCityCode: "F9CE",
            RequestorID: {
              Type: "1",
              ID: "1",
              CompanyName: {
                Code: "TN"
              }
            }
          }]
        },
        OriginDestinationInformation: [{
          RPH: "1",
          DepartureDateTime: `${departureDate}T00:00:00`,
          OriginLocation: { LocationCode: originLocationCode },
          DestinationLocation: { LocationCode: destinationLocationCode }
        }],
        TravelPreferences: {
          MaxStopsQuantity: 3
        },
        TravelerInfoSummary: {
          AirTravelerAvail: [{
            PassengerTypeQuantity: {
              Code: "ADT",
              Quantity: adults
            }
          }]
        }
      }
    };

    // Add return flight if specified
    if (returnDate) {
      searchRequest.OTA_AirLowFareSearchRQ.OriginDestinationInformation.push({
        RPH: "2",
        DepartureDateTime: `${returnDate}T00:00:00`,
        OriginLocation: { LocationCode: destinationLocationCode },
        DestinationLocation: { LocationCode: originLocationCode }
      });
    }

    const searchUrl = `${ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com'}/v1/offers/shop`;
    
    logger.info('Making Sabre API request');

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Sabre API error:', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Sabre API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.info('✅ Successfully retrieved Sabre flight offers');

    // Transform Sabre response to standard format
    const transformedData = {
      data: data.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary || [],
      meta: {
        count: data.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary?.length || 0
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...transformedData
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    logger.error('Sabre flight search error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Sabre flight search failed',
        details: 'Unable to search for flights at this time'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});