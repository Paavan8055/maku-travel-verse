// Sabre API configuration and utilities
import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

export interface SabreConfig {
  tokenUrl: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export const SABRE_CONFIG: SabreConfig = {
  tokenUrl: "https://api-crt.cert.havail.sabre.com/v2/auth/token",
  baseUrl: "https://api-crt.cert.havail.sabre.com",
  clientId: ENV_CONFIG.SABRE_CLIENT_ID || "",
  clientSecret: ENV_CONFIG.SABRE_CLIENT_SECRET || ""
};

export async function getSabreAccessToken(): Promise<string> {
  const startTime = Date.now();
  
  try {
    if (!SABRE_CONFIG.clientId || !SABRE_CONFIG.clientSecret) {
      throw new Error('Sabre credentials not configured');
    }

    const credentials = btoa(`${SABRE_CONFIG.clientId}:${SABRE_CONFIG.clientSecret}`);

    const tokenResponse = await fetch(SABRE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(`[SABRE] Token request failed:`, {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      throw new Error(`Sabre authentication failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      logger.error('[SABRE] No access token in response:', tokenData);
      throw new Error('No access token received from Sabre');
    }

    const duration = Date.now() - startTime;
    logger.info('[SABRE] Authentication successful', { duration });
    
    return tokenData.access_token;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[SABRE] Authentication failed', { error, duration });
    throw error;
  }
}

export function validateSabreCredentials(): boolean {
  return !!(SABRE_CONFIG.clientId && SABRE_CONFIG.clientSecret);
}