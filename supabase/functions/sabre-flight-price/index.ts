import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSabreAccessToken, SABRE_CONFIG } from "../_shared/sabre.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SabreAirPriceRequest {
  itinerary: any;
  passengers: any[];
  validatingCarrier?: string;
  searchId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SabreAirPriceRequest = await req.json();
    logger.info('[SABRE-AIRPRICE] Price confirmation request:', params);

    const accessToken = await getSabreAccessToken();
    
    const priceRequest = {
      OTA_AirPriceRQ: {
        POS: {
          Source: [{
            PseudoCityCode: process.env.SABRE_PCC || "F9FE",
            RequestorID: {
              Type: "1",
              ID: "1",
              CompanyName: {
                Code: "TN"
              }
            }
          }]
        },
        AirItinerary: params.itinerary,
        TravelerInfoSummary: {
          AirTravelerAvail: params.passengers.map((passenger: any, index: number) => ({
            PassengerTypeQuantity: {
              Code: passenger.type || "ADT",
              Quantity: 1
            }
          }))
        },
        PriceRequestInformation: {
          OptionalQualifiers: {
            PricingQualifiers: {
              ValidatingCarrier: params.validatingCarrier || ""
            }
          }
        }
      }
    };

    const response = await fetch(`${SABRE_CONFIG.baseUrl}/v1/shop/flights/price`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(priceRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[SABRE-AIRPRICE] API request failed:', {
        status: response.status,
        error: errorText
      });
      throw new Error(`Sabre AirPrice failed: ${response.status}`);
    }

    const data = await response.json();
    logger.info('[SABRE-AIRPRICE] Price confirmation successful');

    // Extract pricing information
    const priceInfo = data.OTA_AirPriceRS?.PricedItinerary?.AirItineraryPricingInfo;
    const fareInfo = priceInfo?.ItinTotalFare;
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        priceConfirmed: true,
        totalFare: fareInfo?.TotalFare,
        baseFare: fareInfo?.BaseFare,
        taxes: fareInfo?.Taxes,
        currency: fareInfo?.TotalFare?.CurrencyCode,
        fareBreakdown: priceInfo?.PTC_FareBreakdowns,
        validatingCarrier: priceInfo?.ValidatingCarrier,
        searchId: params.searchId,
        pricingDate: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('[SABRE-AIRPRICE] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Price confirmation failed',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});