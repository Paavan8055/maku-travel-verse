import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

// Enhanced Sabre authentication with better error handling and environment support
export const getSabreAccessToken = async (isProduction = false): Promise<string> => {
  const clientId = Deno.env.get('SABRE_CLIENT_ID');
  const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    logger.error('[SABRE] Missing credentials', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });
    throw new Error('Sabre credentials not configured');
  }

  const startTime = Date.now();
  
  // Use appropriate endpoint based on environment
  const tokenUrl = isProduction 
    ? "https://api.havail.sabre.com/v2/auth/token"
    : "https://api-crt.cert.havail.sabre.com/v2/auth/token";
  
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  try {
    logger.info('[SABRE] Requesting token from:', { tokenUrl, environment: isProduction ? 'production' : 'test' });
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'grant_type=client_credentials'
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[SABRE] Token request failed', {
        error: {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        }
      });
      
      logger.error('[SABRE] Authentication failed', {
        error: {
          error: {},
          duration
        }
      });
      
      throw new Error(`Sabre authentication failed: ${response.status}`);
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      logger.error('[SABRE] No access token in response', { tokenData });
      throw new Error('No access token received from Sabre');
    }

    logger.info('[SABRE] Authentication successful', { duration });
    return tokenData.access_token;
  } catch (error) {
    logger.error('[SABRE] Token request exception', { error: error.message });
    throw error;
  }
};

// Enhanced Sabre API request wrapper with retry logic
export const makeSabreRequest = async (
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
  isProduction = false
): Promise<Response> => {
  const baseUrl = isProduction
    ? "https://api.havail.sabre.com"
    : "https://api-crt.cert.havail.sabre.com";
  
  const url = `${baseUrl}${endpoint}`;
  
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  logger.info('[SABRE] Making API request', { url, method: options.method || 'GET' });
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[SABRE] API request failed', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
  }
  
  return response;
};