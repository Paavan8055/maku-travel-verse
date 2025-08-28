// Unified API client for all provider integrations
// Provides consistent error handling, retry logic, and logging across providers

import logger from './logger.ts';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
  responseTime: number;
}

export class ApiClient {
  private config: ApiClientConfig;
  private correlationId: string;

  constructor(config: ApiClientConfig, correlationId?: string) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    this.correlationId = correlationId || crypto.randomUUID();
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = 0
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      logger.debug(`[API-CLIENT] Request: ${options.method || 'GET'} ${url}`, {
        correlationId: this.correlationId,
        attempt: retry + 1,
        maxRetries: this.config.maxRetries
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': this.correlationId,
          ...this.config.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`[API-CLIENT] HTTP Error: ${response.status} ${response.statusText}`, {
          url,
          correlationId: this.correlationId,
          responseTime,
          errorBody: errorText.substring(0, 500)
        });

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            responseTime
          };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.debug(`[API-CLIENT] Success: ${response.status}`, {
        url,
        correlationId: this.correlationId,
        responseTime,
        dataSize: JSON.stringify(data).length
      });

      return {
        success: true,
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`[API-CLIENT] Request failed: ${errorMessage}`, {
        url,
        correlationId: this.correlationId,
        attempt: retry + 1,
        responseTime,
        error
      });

      // Retry logic for network errors and 5xx errors
      if (retry < (this.config.maxRetries! - 1) && this.shouldRetry(error)) {
        const delay = this.config.retryDelay! * Math.pow(2, retry) + Math.random() * 1000;
        
        logger.info(`[API-CLIENT] Retrying in ${delay}ms`, {
          url,
          correlationId: this.correlationId,
          nextAttempt: retry + 2
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retry + 1);
      }

      return {
        success: false,
        error: errorMessage,
        responseTime
      };
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    return (
      error.name === 'AbortError' ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('5')
    );
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers
    });
  }

  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

// Provider-specific client factories
export class AmadeusApiClient extends ApiClient {
  constructor(correlationId?: string) {
    super({
      baseUrl: 'https://test.api.amadeus.com',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000
    }, correlationId);
  }

  async authenticate(): Promise<string | null> {
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      logger.error('[AMADEUS-CLIENT] Missing credentials');
      return null;
    }

    try {
      const response = await this.post('/v1/security/oauth2/token', {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      });

      if (response.success && response.data?.access_token) {
        return response.data.access_token;
      }

      logger.error('[AMADEUS-CLIENT] Authentication failed', response.error);
      return null;
    } catch (error) {
      logger.error('[AMADEUS-CLIENT] Authentication error', error);
      return null;
    }
  }
}

export class SabreApiClient extends ApiClient {
  constructor(correlationId?: string) {
    super({
      baseUrl: 'https://api.sabre.com',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000
    }, correlationId);
  }

  async authenticate(): Promise<string | null> {
    const clientId = Deno.env.get('SABRE_CLIENT_ID');
    const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      logger.error('[SABRE-CLIENT] Missing credentials');
      return null;
    }

    try {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      
      const response = await this.post('/v2/auth/token', 
        'grant_type=client_credentials',
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      );

      if (response.success && response.data?.access_token) {
        return response.data.access_token;
      }

      logger.error('[SABRE-CLIENT] Authentication failed', response.error);
      return null;
    } catch (error) {
      logger.error('[SABRE-CLIENT] Authentication error', error);
      return null;
    }
  }
}

export class HotelBedsApiClient extends ApiClient {
  constructor(service: 'hotel' | 'activity' = 'hotel', correlationId?: string) {
    super({
      baseUrl: service === 'hotel' ? 'https://api.test.hotelbeds.com' : 'https://api.test.hotelbeds.com',
      timeout: 45000,
      maxRetries: 2,
      retryDelay: 2000
    }, correlationId);
  }

  async createSignature(apiKey: string, secret: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${apiKey}${secret}${timestamp}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getAuthHeaders(service: 'hotel' | 'activity' = 'hotel'): Promise<Record<string, string> | null> {
    const apiKey = Deno.env.get(service === 'hotel' ? 'HOTELBEDS_HOTEL_API_KEY' : 'HOTELBEDS_ACTIVITY_API_KEY');
    const secret = Deno.env.get(service === 'hotel' ? 'HOTELBEDS_HOTEL_SECRET' : 'HOTELBEDS_ACTIVITY_SECRET');

    if (!apiKey || !secret) {
      logger.error(`[HOTELBEDS-CLIENT] Missing ${service} credentials`);
      return null;
    }

    try {
      const signature = await this.createSignature(apiKey, secret);
      
      return {
        'Api-key': apiKey,
        'X-Signature': signature,
        'Accept': 'application/json'
      };
    } catch (error) {
      logger.error(`[HOTELBEDS-CLIENT] Failed to create ${service} auth headers`, error);
      return null;
    }
  }
}