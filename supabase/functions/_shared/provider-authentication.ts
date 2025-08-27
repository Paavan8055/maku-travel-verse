// Independent Provider Authentication Management System
import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

// Base interfaces for provider authentication
export interface AuthToken {
  token: string;
  expiresAt: number;
  issuedAt: number;
}

export interface ProviderAuthConfig {
  providerId: string;
  tokenTTL: number; // milliseconds
  retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

// Abstract base class for provider authentication
export abstract class BaseProviderAuth {
  protected tokenCache: Map<string, AuthToken> = new Map();
  protected config: ProviderAuthConfig;

  constructor(config: ProviderAuthConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<string>;
  abstract validateCredentials(): boolean;
  
  protected isTokenValid(token: AuthToken): boolean {
    const bufferTime = 300000; // 5 minutes buffer
    return Date.now() < (token.expiresAt - bufferTime);
  }

  async getValidToken(): Promise<string> {
    const cacheKey = `${this.config.providerId}_token`;
    const cachedToken = this.tokenCache.get(cacheKey);
    
    if (cachedToken && this.isTokenValid(cachedToken)) {
      logger.debug(`[${this.config.providerId.toUpperCase()}] Using cached token`);
      return cachedToken.token;
    }

    logger.info(`[${this.config.providerId.toUpperCase()}] Requesting new token`);
    const newToken = await this.authenticate();
    
    // Cache the new token
    const tokenData: AuthToken = {
      token: newToken,
      expiresAt: Date.now() + this.config.tokenTTL,
      issuedAt: Date.now()
    };
    
    this.tokenCache.set(cacheKey, tokenData);
    return newToken;
  }

  clearTokenCache(): void {
    this.tokenCache.clear();
    logger.info(`[${this.config.providerId.toUpperCase()}] Token cache cleared`);
  }
}

// Sabre Authentication Manager
export class SabreAuthManager extends BaseProviderAuth {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isProduction: boolean;

  constructor(isProduction = false) {
    super({
      providerId: 'sabre',
      tokenTTL: 3600000, // 1 hour
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000
      }
    });
    
    this.isProduction = isProduction;
    this.clientId = ENV_CONFIG.SABRE_CLIENT_ID || "";
    this.clientSecret = ENV_CONFIG.SABRE_CLIENT_SECRET || "";
  }

  validateCredentials(): boolean {
    const pcc = this.isProduction 
      ? Deno.env.get('SABRE_PROD_PCC') 
      : Deno.env.get('SABRE_TEST_PCC');
    
    return !!(this.clientId && this.clientSecret && pcc);
  }

  async authenticate(): Promise<string> {
    if (!this.validateCredentials()) {
      throw new Error('Sabre credentials not configured');
    }

    const startTime = Date.now();
    const tokenUrl = this.isProduction 
      ? "https://api.havail.sabre.com/v2/auth/token"
      : "https://api-crt.cert.havail.sabre.com/v2/auth/token";

    const pcc = this.isProduction 
      ? Deno.env.get('SABRE_PROD_PCC') 
      : Deno.env.get('SABRE_TEST_PCC');

    try {
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'PCC': pcc!
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          pcc: pcc!
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error('[SABRE] Authentication failed:', {
          status: tokenResponse.status,
          error: errorText
        });
        throw new Error(`Sabre authentication failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
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
}

// Amadeus Authentication Manager
export class AmadeusAuthManager extends BaseProviderAuth {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    super({
      providerId: 'amadeus',
      tokenTTL: 1799000, // 29 minutes 59 seconds (Amadeus tokens last 30 minutes)
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000
      }
    });
    
    this.clientId = ENV_CONFIG.AMADEUS_CLIENT_ID || "";
    this.clientSecret = ENV_CONFIG.AMADEUS_CLIENT_SECRET || "";
  }

  validateCredentials(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  async authenticate(): Promise<string> {
    if (!this.validateCredentials()) {
      throw new Error('Amadeus credentials not configured');
    }

    const startTime = Date.now();
    const tokenUrl = "https://test.api.amadeus.com/v1/security/oauth2/token";

    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error('[AMADEUS] Authentication failed:', {
          status: tokenResponse.status,
          error: errorText
        });
        throw new Error(`Amadeus authentication failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
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
}

// HotelBeds Authentication Manager (API Key based)
export class HotelBedsAuthManager extends BaseProviderAuth {
  private readonly hotelApiKey: string;
  private readonly hotelSecret: string;
  private readonly activityApiKey: string;
  private readonly activitySecret: string;

  constructor() {
    super({
      providerId: 'hotelbeds',
      tokenTTL: 0, // API key doesn't expire, but we use for consistency
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000
      }
    });
    
    this.hotelApiKey = ENV_CONFIG.HOTELBEDS_HOTEL_API_KEY || "";
    this.hotelSecret = ENV_CONFIG.HOTELBEDS_HOTEL_SECRET || "";
    this.activityApiKey = ENV_CONFIG.HOTELBEDS_ACTIVITY_API_KEY || "";
    this.activitySecret = ENV_CONFIG.HOTELBEDS_ACTIVITY_SECRET || "";
  }

  validateCredentials(): boolean {
    return !!(this.hotelApiKey && this.hotelSecret && this.activityApiKey && this.activitySecret);
  }

  async authenticate(): Promise<string> {
    // HotelBeds uses API key, so we return a placeholder
    if (!this.validateCredentials()) {
      throw new Error('HotelBeds credentials not configured');
    }
    
    logger.info('[HOTELBEDS] API key validated successfully');
    return 'api_key_validated';
  }

  async generateSignature(service: 'hotel' | 'activity', timestamp?: number): Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
  }> {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const config = service === 'hotel' 
      ? { apiKey: this.hotelApiKey, secret: this.hotelSecret }
      : { apiKey: this.activityApiKey, secret: this.activitySecret };

    if (!config.apiKey || !config.secret) {
      throw new Error(`HotelBeds ${service} credentials not configured`);
    }

    try {
      const signatureString = config.apiKey + config.secret + ts;
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      const signature = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

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
}

// Provider Authentication Factory
export class ProviderAuthFactory {
  private static instances: Map<string, BaseProviderAuth> = new Map();

  static getSabreAuth(isProduction = false): SabreAuthManager {
    const key = `sabre_${isProduction ? 'prod' : 'test'}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new SabreAuthManager(isProduction));
    }
    return this.instances.get(key) as SabreAuthManager;
  }

  static getAmadeusAuth(): AmadeusAuthManager {
    const key = 'amadeus';
    if (!this.instances.has(key)) {
      this.instances.set(key, new AmadeusAuthManager());
    }
    return this.instances.get(key) as AmadeusAuthManager;
  }

  static getHotelBedsAuth(): HotelBedsAuthManager {
    const key = 'hotelbeds';
    if (!this.instances.has(key)) {
      this.instances.set(key, new HotelBedsAuthManager());
    }
    return this.instances.get(key) as HotelBedsAuthManager;
  }

  static clearAllCaches(): void {
    this.instances.forEach(auth => auth.clearTokenCache());
    logger.info('[AUTH-FACTORY] All provider token caches cleared');
  }
}