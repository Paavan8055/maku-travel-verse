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

// Rate limiting and retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

const AMADEUS_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  jitter: true
};

// Circuit breaker state
let circuitBreakerState = {
  state: 'closed' as 'closed' | 'open' | 'half-open',
  failureCount: 0,
  lastFailure: 0,
  timeout: 60000, // 1 minute
  threshold: 5
};

export async function getAmadeusAccessToken(): Promise<string> {
  const startTime = Date.now();
  
  try {
    if (!AMADEUS_CONFIG.clientId || !AMADEUS_CONFIG.clientSecret) {
      throw new Error('Amadeus credentials not configured');
    }

    // Check circuit breaker
    if (circuitBreakerState.state === 'open') {
      if (Date.now() - circuitBreakerState.lastFailure < circuitBreakerState.timeout) {
        throw new Error('Amadeus API temporarily unavailable (circuit breaker open)');
      } else {
        circuitBreakerState.state = 'half-open';
        logger.info('[AMADEUS] Circuit breaker moving to half-open state');
      }
    }

    const tokenResponse = await makeAmadeusRequest(AMADEUS_CONFIG.tokenUrl, {
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

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      logger.error('[AMADEUS] No access token in response:', tokenData);
      throw new Error('No access token received from Amadeus');
    }

    // Reset circuit breaker on success
    if (circuitBreakerState.state === 'half-open') {
      circuitBreakerState.state = 'closed';
      circuitBreakerState.failureCount = 0;
      logger.info('[AMADEUS] Circuit breaker reset to closed state');
    }

    const duration = Date.now() - startTime;
    logger.info('[AMADEUS] Authentication successful', { duration });
    
    return tokenData.access_token;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Update circuit breaker on failure
    circuitBreakerState.failureCount++;
    if (circuitBreakerState.failureCount >= circuitBreakerState.threshold) {
      circuitBreakerState.state = 'open';
      circuitBreakerState.lastFailure = Date.now();
      logger.warn('[AMADEUS] Circuit breaker opened due to failures', { 
        failureCount: circuitBreakerState.failureCount 
      });
    }
    
    logger.error('[AMADEUS] Authentication failed', { error, duration });
    throw error;
  }
}

// Enhanced Amadeus request with exponential backoff and rate limiting
async function makeAmadeusRequest(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      const retryAfter = response.headers.get('Retry-After');
      
      if (retryCount < AMADEUS_RETRY_CONFIG.maxRetries) {
        const delay = calculateBackoffDelay(retryCount, retryAfter);
        
        logger.warn(`[AMADEUS] Rate limited, retrying in ${delay}ms`, {
          retryCount: retryCount + 1,
          rateLimitReset,
          retryAfter
        });
        
        await sleep(delay);
        return makeAmadeusRequest(url, options, retryCount + 1);
      } else {
        throw new Error('Amadeus API rate limit exceeded after max retries');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[AMADEUS] Request failed:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url.split('?')[0] // Log URL without query params for security
      });
      throw new Error(`Amadeus API error: ${response.status} - ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (retryCount < AMADEUS_RETRY_CONFIG.maxRetries && isRetryableError(error)) {
      const delay = calculateBackoffDelay(retryCount);
      
      logger.warn(`[AMADEUS] Request failed, retrying in ${delay}ms`, {
        retryCount: retryCount + 1,
        error: error.message
      });
      
      await sleep(delay);
      return makeAmadeusRequest(url, options, retryCount + 1);
    }
    
    throw error;
  }
}

function calculateBackoffDelay(retryCount: number, retryAfter?: string | null): number {
  // Use Retry-After header if provided
  if (retryAfter) {
    const retryAfterMs = parseInt(retryAfter) * 1000;
    if (!isNaN(retryAfterMs) && retryAfterMs > 0) {
      return Math.min(retryAfterMs, AMADEUS_RETRY_CONFIG.maxDelay);
    }
  }
  
  // Exponential backoff: baseDelay * 2^retryCount
  let delay = AMADEUS_RETRY_CONFIG.baseDelay * Math.pow(2, retryCount);
  
  // Add jitter to avoid thundering herd
  if (AMADEUS_RETRY_CONFIG.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.min(delay, AMADEUS_RETRY_CONFIG.maxDelay);
}

function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  
  // Retry on network errors, timeouts, and server errors
  return message.includes('network') ||
         message.includes('timeout') ||
         message.includes('connect') ||
         message.includes('5');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function validateAmadeusCredentials(): boolean {
  return !!(AMADEUS_CONFIG.clientId && AMADEUS_CONFIG.clientSecret);
}