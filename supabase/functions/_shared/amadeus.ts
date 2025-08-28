// Amadeus API configuration and utilities
import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

export interface AmadeusConfig {
  tokenUrl: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export const AMADEUS_CONFIG: AmadeusConfig = {
  tokenUrl: "https://test.api.amadeus.com/v1/security/oauth2/token",
  baseUrl: "https://test.api.amadeus.com",
  clientId: ENV_CONFIG.AMADEUS_CLIENT_ID || "",
  clientSecret: ENV_CONFIG.AMADEUS_CLIENT_SECRET || ""
};

export async function getAmadeusAccessToken(): Promise<string> {
  const startTime = Date.now();
  
  try {
    if (!AMADEUS_CONFIG.clientId || !AMADEUS_CONFIG.clientSecret) {
      throw new Error('Amadeus credentials not configured');
    }

    const tokenResponse = await fetch(AMADEUS_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CONFIG.clientId,
        client_secret: AMADEUS_CONFIG.clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(`[AMADEUS] Token request failed:`, {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      throw new Error(`Amadeus authentication failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      logger.error('[AMADEUS] No access token in response:', tokenData);
      throw new Error('No access token received from Amadeus');
    }

    const duration = Date.now() - startTime;
    logger.info('[AMADEUS] Authentication successful', { duration });
    
    return tokenData.access_token;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[AMADEUS] Authentication failed', { error, duration });
    throw error;
  }
}

export function validateAmadeusCredentials(): boolean {
  return !!(AMADEUS_CONFIG.clientId && AMADEUS_CONFIG.clientSecret);
}