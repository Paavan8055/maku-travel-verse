// Centralized error handling for all edge functions
// Provides consistent error responses and critical alert generation

import logger from './logger.ts';

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  bookingId?: string;
  provider?: string;
  operation?: string;
  requestData?: any;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  correlationId?: string;
  retryable?: boolean;
  fallbackData?: any;
}

export class ErrorHandler {
  static async handleProviderError(
    error: any,
    context: ErrorContext,
    supabase: any
  ): Promise<ErrorResponse> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const correlationId = context.correlationId || crypto.randomUUID();
    
    logger.error(`[ERROR-HANDLER] Provider error in ${context.operation}`, {
      error: errorMessage,
      provider: context.provider,
      correlationId,
      context
    });

    // Determine error type and appropriate response
    let errorCode = 'PROVIDER_ERROR';
    let userMessage = 'Service temporarily unavailable. Please try again later.';
    let retryable = true;
    let shouldCreateAlert = false;

    if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
      errorCode = 'AUTH_ERROR';
      userMessage = 'Service authentication failed. Please contact support.';
      retryable = false;
      shouldCreateAlert = true;
    } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      errorCode = 'PERMISSION_ERROR';
      userMessage = 'Service access denied. Please contact support.';
      retryable = false;
      shouldCreateAlert = true;
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      errorCode = 'RATE_LIMIT';
      userMessage = 'Service busy. Please try again in a few minutes.';
      retryable = true;
    } else if (errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
      errorCode = 'QUOTA_EXCEEDED';
      userMessage = 'Service quota exceeded. Please try again later.';
      retryable = true;
      shouldCreateAlert = true;
    } else if (errorMessage.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';
      userMessage = 'Service response timeout. Please try again.';
      retryable = true;
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorCode = 'NETWORK_ERROR';
      userMessage = 'Network connectivity issue. Please try again.';
      retryable = true;
    }

    // Create critical alert for serious issues
    if (shouldCreateAlert) {
      await this.createCriticalAlert(supabase, {
        alertType: errorCode,
        message: `${context.provider} ${context.operation}: ${errorMessage}`,
        severity: errorCode === 'AUTH_ERROR' || errorCode === 'PERMISSION_ERROR' ? 'high' : 'medium',
        bookingId: context.bookingId,
        requiresManualAction: true,
        metadata: {
          provider: context.provider,
          operation: context.operation,
          correlationId,
          originalError: errorMessage
        }
      });
    }

    return {
      success: false,
      error: userMessage,
      code: errorCode,
      correlationId,
      retryable
    };
  }

  static async handleBookingError(
    error: any,
    context: ErrorContext,
    supabase: any
  ): Promise<ErrorResponse> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const correlationId = context.correlationId || crypto.randomUUID();
    
    logger.error(`[ERROR-HANDLER] Booking error in ${context.operation}`, {
      error: errorMessage,
      bookingId: context.bookingId,
      correlationId,
      context
    });

    // All booking errors are critical and require alerts
    await this.createCriticalAlert(supabase, {
      alertType: 'BOOKING_ERROR',
      message: `Booking ${context.operation} failed: ${errorMessage}`,
      severity: 'high',
      bookingId: context.bookingId,
      requiresManualAction: true,
      metadata: {
        operation: context.operation,
        correlationId,
        userId: context.userId,
        requestData: context.requestData,
        originalError: errorMessage
      }
    });

    return {
      success: false,
      error: 'Booking request failed. Our team has been notified and will assist you shortly.',
      code: 'BOOKING_ERROR',
      correlationId,
      retryable: false
    };
  }

  static async handleSystemError(
    error: any,
    context: ErrorContext,
    supabase: any
  ): Promise<ErrorResponse> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const correlationId = context.correlationId || crypto.randomUUID();
    
    logger.error(`[ERROR-HANDLER] System error in ${context.operation}`, {
      error: errorMessage,
      correlationId,
      context,
      stack: error instanceof Error ? error.stack : undefined
    });

    // System errors require immediate attention
    await this.createCriticalAlert(supabase, {
      alertType: 'SYSTEM_ERROR',
      message: `System error in ${context.operation}: ${errorMessage}`,
      severity: 'high',
      requiresManualAction: true,
      metadata: {
        operation: context.operation,
        correlationId,
        stack: error instanceof Error ? error.stack : undefined,
        originalError: errorMessage
      }
    });

    return {
      success: false,
      error: 'System error occurred. Our team has been notified.',
      code: 'SYSTEM_ERROR',
      correlationId,
      retryable: false
    };
  }

  static async createCriticalAlert(supabase: any, alertData: {
    alertType: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    bookingId?: string;
    requiresManualAction?: boolean;
    metadata?: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('critical_alerts')
        .insert({
          alert_type: alertData.alertType,
          message: alertData.message,
          severity: alertData.severity,
          booking_id: alertData.bookingId,
          requires_manual_action: alertData.requiresManualAction || false,
          metadata: alertData.metadata || {}
        });

      if (error) {
        logger.error('[ERROR-HANDLER] Failed to create critical alert', error);
      } else {
        logger.info('[ERROR-HANDLER] Critical alert created', {
          type: alertData.alertType,
          severity: alertData.severity,
          bookingId: alertData.bookingId
        });
      }
    } catch (alertError) {
      logger.error('[ERROR-HANDLER] Critical alert creation failed', alertError);
    }
  }

  static createCorsResponse(body: any, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    });
  }

  static createSuccessResponse(data: any, correlationId?: string): Response {
    return this.createCorsResponse({
      success: true,
      data,
      correlationId
    });
  }

  static createErrorResponse(errorResponse: ErrorResponse): Response {
    const status = errorResponse.code === 'AUTH_ERROR' || errorResponse.code === 'PERMISSION_ERROR' ? 403 :
                   errorResponse.code === 'RATE_LIMIT' ? 429 :
                   errorResponse.code === 'QUOTA_EXCEEDED' ? 503 :
                   errorResponse.retryable ? 502 : 500;

    return this.createCorsResponse(errorResponse, status);
  }
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private maxFailures = 5,
    private resetTimeout = 60000, // 1 minute
    private halfOpenRetryDelay = 5000 // 5 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        logger.info('[CIRCUIT-BREAKER] Moving to half-open state');
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
        logger.info('[CIRCUIT-BREAKER] Operation successful - circuit closed');
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.maxFailures) {
      this.state = 'open';
      logger.warn('[CIRCUIT-BREAKER] Circuit breaker opened', {
        failures: this.failures,
        maxFailures: this.maxFailures
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}