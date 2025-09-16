// HotelBeds API configuration and utilities
import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

export interface HotelBedsConfig {
  hotel: {
    apiKey: string;
    secret: string;
    baseUrl: string;
  };
  activity: {
    apiKey: string;
    secret: string;
    baseUrl: string;
  };
}

export const HOTELBEDS_CONFIG: HotelBedsConfig = {
  hotel: {
    apiKey: ENV_CONFIG.HOTELBEDS_HOTEL_API_KEY || "",
    secret: ENV_CONFIG.HOTELBEDS_HOTEL_SECRET || "",
    baseUrl: "https://api.test.hotelbeds.com"
  },
  activity: {
    apiKey: ENV_CONFIG.HOTELBEDS_ACTIVITY_API_KEY || "",
    secret: ENV_CONFIG.HOTELBEDS_ACTIVITY_SECRET || "",
    baseUrl: "https://api.test.hotelbeds.com"
  }
};

export async function generateHotelBedsSignature(
  service: 'hotel' | 'activity',
  method: string = 'GET',
  uri: string = '',
  timestamp?: number
): Promise<{ signature: string; timestamp: number; apiKey: string }> {
  const config = HOTELBEDS_CONFIG[service];
  const ts = timestamp || Math.floor(Date.now() / 1000);
  
  if (!config.apiKey || !config.secret) {
    throw new Error(`HotelBeds ${service} credentials not configured`);
  }

  try {
    // Create the signature string
    const signatureString = config.apiKey + config.secret + ts;
    
    // Convert to UTF-8 bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to hex string
    const signature = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    logger.debug(`[HOTELBEDS-${service.toUpperCase()}] Generated signature`, {
      apiKey: config.apiKey,
      timestamp: ts,
      signatureLength: signature.length
    });

    return {
      signature,
      timestamp: ts,
      apiKey: config.apiKey
    };
  } catch (error) {
    logger.error(`[HOTELBEDS-${service.toUpperCase()}] Signature generation failed:`, error);
    throw new Error(`Failed to generate HotelBeds ${service} signature`);
  }
}

export function validateHotelBedsCredentials(service: 'hotel' | 'activity'): boolean {
  const config = HOTELBEDS_CONFIG[service];
  return !!(config.apiKey && config.secret);
}

export function getHotelBedsHeaders(service: 'hotel' | 'activity', signature: string, timestamp: number, apiKey: string) {
  return {
    'Api-key': apiKey,
    'X-Signature': signature,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip'
  };
}