import { useCallback, useRef } from 'react';
import { useErrorHandler } from './useErrorHandler';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch') ||
        message.includes('connection')
      );
    }
    return false;
  },
  onRetry: () => {}
};

export const useRetryWithBackoff = (options: RetryOptions = {}) => {
  const { handleError } = useErrorHandler();
  const config = { ...defaultOptions, ...options };
  const isRetrying = useRef<Set<string>>(new Set());

  const calculateDelay = useCallback((attempt: number): number => {
    let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter ±25%
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(delay, 0);
  }, [config]);

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    const operationId = context || Math.random().toString(36).substr(2, 9);
    
    // Prevent multiple concurrent retries of the same operation
    if (isRetrying.current.has(operationId)) {
      throw new Error(`Operation ${operationId} is already being retried`);
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        isRetrying.current.add(operationId);
        const result = await operation();
        isRetrying.current.delete(operationId);
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt > config.maxRetries) {
          break;
        }
        
        // Check if we should retry this error
        if (!config.retryCondition(error, attempt)) {
          break;
        }
        
        const delay = calculateDelay(attempt);
        
        console.warn(
          `[Retry] Attempt ${attempt}/${config.maxRetries} failed for ${operationId}. ` +
          `Retrying in ${Math.round(delay)}ms...`,
          error
        );
        
        config.onRetry(error, attempt);
        
        await sleep(delay);
      }
    }
    
    isRetrying.current.delete(operationId);
    
    // Handle the final error
    handleError({
      error: lastError,
      options: {
        context: `retry-failed-${context}`,
        showToast: true,
        logError: true
      }
    });
    
    throw lastError;
  }, [config, calculateDelay, sleep, handleError]);

  // Utility for wrapping promises with retry logic
  const wrapWithRetry = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return (...args: T): Promise<R> => {
      return retry(() => fn(...args), context);
    };
  }, [retry]);

  // Circuit breaker pattern
  const createCircuitBreaker = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: {
      failureThreshold?: number;
      resetTimeout?: number;
      monitoringPeriod?: number;
    } = {}
  ) => {
    const {
      failureThreshold = 5,
      resetTimeout = 60000, // 1 minute
      monitoringPeriod = 10000 // 10 seconds
    } = options;

    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let failureCount = 0;
    let lastFailureTime = 0;
    let successCount = 0;

    return async (...args: T): Promise<R> => {
      const now = Date.now();

      // Reset failure count if monitoring period has passed
      if (now - lastFailureTime > monitoringPeriod) {
        failureCount = 0;
      }

      // Check circuit state
      if (state === 'open') {
        if (now - lastFailureTime > resetTimeout) {
          state = 'half-open';
          successCount = 0;
          console.log('[Circuit Breaker] Transitioning to half-open state');
        } else {
          throw new Error('Circuit breaker is open - service temporarily unavailable');
        }
      }

      try {
        const result = await fn(...args);

        // Success handling
        if (state === 'half-open') {
          successCount++;
          if (successCount >= 3) {
            state = 'closed';
            failureCount = 0;
            console.log('[Circuit Breaker] Circuit closed - service recovered');
          }
        } else if (state === 'closed') {
          failureCount = 0; // Reset on success
        }

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        if (state === 'half-open' || (state === 'closed' && failureCount >= failureThreshold)) {
          state = 'open';
          console.error(`[Circuit Breaker] Circuit opened - failures: ${failureCount}`);
        }

        throw error;
      }
    };
  }, []);

  // Rate limiter
  const createRateLimiter = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    requestsPerSecond: number = 10
  ) => {
    const tokens = useRef(requestsPerSecond);
    const lastRefill = useRef(Date.now());

    return async (...args: T): Promise<R> => {
      const now = Date.now();
      const timePassed = (now - lastRefill.current) / 1000;
      
      // Refill tokens
      tokens.current = Math.min(
        requestsPerSecond,
        tokens.current + timePassed * requestsPerSecond
      );
      lastRefill.current = now;

      if (tokens.current < 1) {
        const waitTime = (1 - tokens.current) / requestsPerSecond * 1000;
        await sleep(waitTime);
        tokens.current = 0;
      } else {
        tokens.current -= 1;
      }

      return fn(...args);
    };
  }, [sleep]);

  return {
    retry,
    wrapWithRetry,
    createCircuitBreaker,
    createRateLimiter,
    isRetrying: (operationId: string) => isRetrying.current.has(operationId)
  };
};