import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferSearchParams {
  fromType: 'ATLAS' | 'IATA' | 'GIATA';
  fromCode: string;
  toType: 'ATLAS' | 'IATA' | 'GIATA';
  toCode: string;
  outbound: {
    date: string;
    time: string;
  };
  inbound?: {
    date: string;
    time: string;
  };
  occupancy: Array<{
    adults: number;
    children: number;
    infants: number;
  }>;
  language: string;
}

// Generate SHA-256 signature for HotelBeds API (matching official documentation)
async function generateSignature(apiKey: string, secret: string, timestamp: number): Promise<string> {
  const signatureString = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  
  // Generate SHA-256 hash (not HMAC)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex string
  const signature = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature;
}

async function searchHotelbedsTransfers(params: TransferSearchParams): Promise<any> {
  const apiKey = Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_ACTIVITY_SECRET');
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateSignature(apiKey, secret, timestamp);
  
  const requestBody = {
    language: params.language || 'en',
    from: {
      type: params.fromType,
      code: params.fromCode
    },
    to: {
      type: params.toType,
      code: params.toCode
    },
    outbound: params.outbound,
    inbound: params.inbound,
    occupancy: params.occupancy,
    clientReference: `MAKU-${Date.now()}`
  };

  logger.info('HotelBeds Transfers search request:', requestBody);

  const response = await fetch(`${ENV_CONFIG.hotelbeds.baseUrl}/transfer-api/1.0/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'X-Signature': signature,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('HotelBeds Transfers API error:', errorText);
    throw new Error(`HotelBeds Transfers search failed: ${response.statusText}`);
  }

  return await response.json();
}

function transformHotelbedsTransfers(transfers: any[]): any[] {
  return transfers.map((transfer: any) => ({
    id: `hotelbeds-transfer-${transfer.id}`,
    transferType: transfer.transferType,
    vehicle: {
      category: transfer.category?.name || 'Standard',
      description: transfer.content?.vehicle?.description || transfer.category?.name,
      maxPassengers: transfer.maxPax || 4,
      maxBaggage: transfer.maxBaggage || 2,
      features: transfer.content?.vehicle?.features || []
    },
    price: {
      amount: transfer.price?.totalAmount || 0,
      currency: transfer.price?.currencyId || 'EUR',
      net: transfer.price?.net || 0
    },
    pickUp: {
      date: transfer.pickupInformation?.date,
      time: transfer.pickupInformation?.time,
      location: transfer.pickupInformation?.pickup?.description,
      address: transfer.pickupInformation?.pickup?.address,
      coordinates: {
        latitude: transfer.pickupInformation?.pickup?.latitude || 0,
        longitude: transfer.pickupInformation?.pickup?.longitude || 0
      }
    },
    dropOff: {
      location: transfer.pickupInformation?.dropoff?.description,
      address: transfer.pickupInformation?.dropoff?.address,
      coordinates: {
        latitude: transfer.pickupInformation?.dropoff?.latitude || 0,
        longitude: transfer.pickupInformation?.dropoff?.longitude || 0
      }
    },
    duration: {
      estimated: transfer.content?.transferDetailInfo?.duration || 'Variable',
      unit: 'minutes'
    },
    policies: {
      cancellation: transfer.cancellationPolicies?.[0] || {
        description: 'Contact provider for cancellation policy'
      }
    },
    provider: 'HotelBeds',
    source: 'hotelbeds',
    originalData: transfer
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: TransferSearchParams = await req.json();
    
    logger.info('HotelBeds Transfers search:', params);

    const transfersResult = await searchHotelbedsTransfers(params);
    
    logger.info('HotelBeds Transfers search successful:', transfersResult.transfers?.length || 0, 'transfers found');

    const transformedTransfers = transfersResult.transfers ? 
      transformHotelbedsTransfers(transfersResult.transfers) : [];

    return new Response(JSON.stringify({
      success: true,
      transfers: transformedTransfers,
      searchCriteria: params,
      totalResults: transformedTransfers.length,
      source: 'hotelbeds'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('HotelBeds Transfers search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Transfers search failed',
      transfers: [],
      source: 'hotelbeds'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});