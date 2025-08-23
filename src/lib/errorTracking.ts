import { supabase } from '@/integrations/supabase/client';

interface ErrorTrackingOptions {
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  userContext?: Record<string, any>;
  requestContext?: Record<string, any>;
  correlationId?: string;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private enabled = true;

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  async trackError(
    error: Error | string,
    options: ErrorTrackingOptions = {}
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const stackTrace = typeof error === 'object' && error.stack ? error.stack : undefined;
      
      const { error: trackingError } = await supabase.functions.invoke('error-tracking', {
        body: {
          error_type: typeof error === 'string' ? 'manual' : error.constructor.name,
          error_message: errorMessage,
          stack_trace: stackTrace,
          user_context: options.userContext || {},
          request_context: options.requestContext || {},
          severity: options.severity || 'error',
          correlation_id: options.correlationId || crypto.randomUUID()
        }
      });

      if (trackingError) {
        console.warn('Failed to track error:', trackingError);
      }
    } catch (trackingError) {
      console.warn('Error tracking failed:', trackingError);
    }
  }

  async trackPerformance(
    operation: string,
    duration: number,
    context?: Record<string, any>
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.trackError(`Performance: ${operation} took ${duration}ms`, {
        severity: duration > 5000 ? 'warning' : 'info',
        requestContext: {
          operation,
          duration,
          ...context
        }
      });
    } catch (error) {
      console.warn('Performance tracking failed:', error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.trackError(event.error || event.message, {
      severity: 'error',
      requestContext: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(event.reason, {
      severity: 'error',
      requestContext: {
        type: 'unhandledrejection'
      }
    });
  });
}