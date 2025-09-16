import { useCallback } from 'react';
import { correlationId, withCorrelationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

interface ErrorContext {
  section?: string;
  userId?: string;
  bookingId?: string;
  searchParams?: Record<string, any>;
  userAgent?: string;
  url?: string;
  [key: string]: any;
}

interface ErrorReportingConfig {
  enableSentry?: boolean;
  enableCustomLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
}

export const useErrorReporting = (config: ErrorReportingConfig = {}) => {
  const {
    enableSentry = true,
    enableCustomLogging = true,
    logLevel = 'error'
  } = config;

  const reportError = useCallback((
    error: Error,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    const errorData = withCorrelationId({
      error: error.message,
      stack: error.stack,
      name: error.name,
      severity,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    });

    // Custom logging
    if (enableCustomLogging) {
      switch (logLevel) {
        case 'error':
          logger.error('Error reported:', errorData);
          break;
        case 'warn':
          logger.warn('Warning reported:', errorData);
          break;
        case 'info':
          logger.info('Info reported:', errorData);
          break;
      }
    }

    // Sentry reporting
    if (enableSentry && typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      
      Sentry.withScope((scope: any) => {
        // Set correlation ID as tag
        scope.setTag('correlationId', errorData.correlationId);
        scope.setTag('severity', severity);
        
        // Set context sections
        if (context.section) {
          scope.setTag('section', context.section);
        }
        
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }

        // Set additional context
        scope.setContext('errorDetails', {
          correlationId: errorData.correlationId,
          timestamp: errorData.timestamp,
          url: errorData.url,
          userAgent: errorData.userAgent
        });

        if (context.bookingId) {
          scope.setContext('booking', { bookingId: context.bookingId });
        }

        if (context.searchParams) {
          scope.setContext('search', context.searchParams);
        }

        // Set severity level
        const sentryLevel = severity === 'critical' ? 'fatal' : 
                           severity === 'high' ? 'error' :
                           severity === 'medium' ? 'warning' : 'info';
        scope.setLevel(sentryLevel);

        Sentry.captureException(error);
      });
    }

    return errorData.correlationId;
  }, [enableSentry, enableCustomLogging, logLevel]);

  const reportEvent = useCallback((
    eventName: string,
    data: Record<string, any> = {},
    level: 'info' | 'warning' | 'error' = 'info'
  ) => {
    const eventData = withCorrelationId({
      event: eventName,
      timestamp: new Date().toISOString(),
      level,
      data
    });

    if (enableCustomLogging) {
      logger.info('Event reported:', eventData);
    }

    if (enableSentry && typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.addBreadcrumb({
        message: eventName,
        level: level,
        data: {
          correlationId: eventData.correlationId,
          ...data
        }
      });
    }

    return eventData.correlationId;
  }, [enableSentry, enableCustomLogging]);

  const setUserContext = useCallback((userId: string, email?: string, additionalData?: Record<string, any>) => {
    if (enableSentry && typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.setUser({
        id: userId,
        email,
        ...additionalData
      });
    }

    logger.info('User context set:', withCorrelationId({ userId, email }));
  }, [enableSentry]);

  const clearUserContext = useCallback(() => {
    if (enableSentry && typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.setUser(null);
    }

    logger.info('User context cleared');
  }, [enableSentry]);

  const addBreadcrumb = useCallback((
    message: string,
    category?: string,
    data?: Record<string, any>
  ) => {
    const breadcrumbData = withCorrelationId({
      message,
      category: category || 'user-action',
      timestamp: new Date().toISOString(),
      data
    });

    if (enableCustomLogging) {
      logger.info('Breadcrumb added:', breadcrumbData);
    }

    if (enableSentry && typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;
      Sentry.addBreadcrumb({
        message,
        category: category || 'user-action',
        level: 'info',
        data: {
          correlationId: breadcrumbData.correlationId,
          ...data
        }
      });
    }
  }, [enableSentry, enableCustomLogging]);

  return {
    reportError,
    reportEvent,
    setUserContext,
    clearUserContext,
    addBreadcrumb,
    getCurrentCorrelationId: () => correlationId.getCurrentId()
  };
};