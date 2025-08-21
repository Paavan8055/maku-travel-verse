import { correlationId, withCorrelationId } from './correlationId';
import { supabase } from '@/integrations/supabase/client';
import logger from './logger';

// Global error reporting utilities
export interface ErrorReport {
  error: Error;
  context?: {
    section?: string;
    userId?: string;
    bookingId?: string;
    searchParams?: Record<string, any>;
    componentStack?: string;
    [key: string]: any;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  async reportError({ error, context = {}, severity = 'medium' }: ErrorReport): Promise<string> {
    const errorData = withCorrelationId({
      error: error.message,
      stack: error.stack,
      name: error.name,
      severity,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      ...context
    });

    // Log locally first
    logger.error('Error reported:', errorData);

    // Add to processing queue
    this.errorQueue.push({ error, context: { ...context, correlationId: errorData.correlationId }, severity });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }

    // Report to Sentry if available
    this.reportToSentry(error, errorData, severity);

    // Store in correlation tracking
    await this.storeCorrelationData(errorData);

    return errorData.correlationId;
  }

  private async processErrorQueue() {
    if (this.errorQueue.length === 0) return;
    
    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const errorReport = this.errorQueue.shift();
        if (errorReport) {
          await this.processErrorReport(errorReport);
        }
      }
    } catch (err) {
      logger.error('Error processing error queue:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processErrorReport(errorReport: ErrorReport) {
    // Additional processing logic can be added here
    // e.g., sending to external services, triggering alerts, etc.
    
    // For now, just ensure it's logged
    logger.info('Processing error report:', {
      correlationId: errorReport.context?.correlationId,
      severity: errorReport.severity
    });
  }

  private reportToSentry(error: Error, errorData: any, severity: string) {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      
      Sentry.withScope((scope: any) => {
        scope.setTag('correlationId', errorData.correlationId);
        scope.setTag('severity', severity);
        
        if (errorData.section) {
          scope.setTag('section', errorData.section);
        }
        
        if (errorData.userId) {
          scope.setUser({ id: errorData.userId });
        }

        scope.setContext('errorDetails', {
          correlationId: errorData.correlationId,
          timestamp: errorData.timestamp,
          url: errorData.url,
          userAgent: errorData.userAgent
        });

        const sentryLevel = severity === 'critical' ? 'fatal' : 
                           severity === 'high' ? 'error' :
                           severity === 'medium' ? 'warning' : 'info';
        scope.setLevel(sentryLevel);

        Sentry.captureException(error);
      });
    }
  }

  private async storeCorrelationData(errorData: any) {
    try {
      await supabase.from('correlation_tracking').insert({
        correlation_id: errorData.correlationId,
        request_type: 'error_report',
        request_data: {
          error: errorData.error,
          section: errorData.section,
          severity: errorData.severity,
          url: errorData.url,
          userAgent: errorData.userAgent
        },
        status: 'error',
        user_id: errorData.userId || null
      });
    } catch (err) {
      logger.error('Failed to store correlation data:', err);
    }
  }

  // Performance tracking
  async trackPerformance(
    operation: string,
    duration: number,
    context: Record<string, any> = {}
  ) {
    const performanceData = withCorrelationId({
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...context
    });

    logger.info('Performance tracked:', performanceData);

    try {
      await supabase.from('correlation_tracking').insert({
        correlation_id: performanceData.correlationId,
        request_type: 'performance_tracking',
        request_data: {
          operation,
          duration,
          ...context
        },
        status: 'completed',
        duration_ms: duration
      });
    } catch (err) {
      logger.error('Failed to store performance data:', err);
    }

    return performanceData.correlationId;
  }

  // User action tracking
  async trackUserAction(
    action: string,
    data: Record<string, any> = {}
  ) {
    const actionData = withCorrelationId({
      action,
      timestamp: new Date().toISOString(),
      ...data
    });

    logger.info('User action tracked:', actionData);

    // Add breadcrumb to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.addBreadcrumb({
        message: action,
        category: 'user-action',
        level: 'info',
        data: {
          correlationId: actionData.correlationId,
          ...data
        }
      });
    }

    return actionData.correlationId;
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Convenience functions
export const reportError = (error: Error, context?: any, severity?: 'low' | 'medium' | 'high' | 'critical') => 
  errorReporter.reportError({ error, context, severity });

export const trackPerformance = (operation: string, duration: number, context?: Record<string, any>) =>
  errorReporter.trackPerformance(operation, duration, context);

export const trackUserAction = (action: string, data?: Record<string, any>) =>
  errorReporter.trackUserAction(action, data);