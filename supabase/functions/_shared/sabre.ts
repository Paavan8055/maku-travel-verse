// Sabre API configuration and utilities
import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

export interface SabreConfig {
  tokenUrl: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export function getSabreConfig(isProduction: boolean = false): SabreConfig {
  if (isProduction) {
    return {
      tokenUrl: "https://api.havail.sabre.com/v2/auth/token",
      baseUrl: "https://api.havail.sabre.com",
      clientId: ENV_CONFIG.SABRE_CLIENT_ID || "",
      clientSecret: ENV_CONFIG.SABRE_CLIENT_SECRET || ""
    };
  }
  
  return {
    tokenUrl: "https://api-crt.cert.havail.sabre.com/v2/auth/token",
    baseUrl: "https://api-crt.cert.havail.sabre.com",
    clientId: ENV_CONFIG.SABRE_CLIENT_ID || "",
    clientSecret: ENV_CONFIG.SABRE_CLIENT_SECRET || ""
  };
}

export const SABRE_CONFIG: SabreConfig = getSabreConfig();

export async function getSabreAccessToken(isProduction: boolean = false): Promise<string> {
  const startTime = Date.now();
  
  try {
    const config = getSabreConfig(isProduction);
    
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Sabre credentials not configured');
    }

    const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

    // Use environment-appropriate PCC
    const pcc = isProduction 
      ? Deno.env.get('SABRE_PROD_PCC') 
      : Deno.env.get('SABRE_TEST_PCC');
    
    if (!pcc) {
      throw new Error(`Sabre PCC not configured for ${isProduction ? 'production' : 'test'} environment`);
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'PCC': pcc
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        pcc
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

export function validateSabreCredentials(isProduction: boolean = false): boolean {
  const config = getSabreConfig(isProduction);
  const pcc = isProduction 
    ? Deno.env.get('SABRE_PROD_PCC') 
    : Deno.env.get('SABRE_TEST_PCC');
  
  return !!(config.clientId && config.clientSecret && pcc);
}

export function getSabrePCC(isProduction: boolean = false): string | null {
  return isProduction 
    ? Deno.env.get('SABRE_PROD_PCC') || null
    : Deno.env.get('SABRE_TEST_PCC') || null;
}

export function getSabreEPR(): string | null {
  return Deno.env.get('SABRE_EPR_ID') || null;
}