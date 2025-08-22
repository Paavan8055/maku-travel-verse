import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import logger from '@/utils/logger';

interface EnhancedErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  logError?: boolean;
  retryCallback?: () => void;
  userGuidance?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface HandleErrorParams {
  error: unknown;
  options?: EnhancedErrorHandlerOptions;
}

interface ErrorResult {
  userMessage: string;
  isSystemError: boolean;
  originalError: Error;
  severity: string;
  actionable: boolean;
  suggestions?: string[];
}

export const useEnhancedErrorHandler = () => {
  const { t } = useTranslation();

  const handleError = useCallback(({ error, options = {} }: HandleErrorParams): ErrorResult => {
    const {
      context = 'application',
      showToast = true,
      logError = true,
      retryCallback,
      userGuidance,
      severity = 'medium'
    } = options;

    // Log error if enabled
    if (logError) {
      logger.error(`[${context}] Error:`, error);
    }

    // Convert error to Error object if needed
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Enhanced error categorization and user guidance
    const analyzeError = (err: Error) => {
      const message = err.message.toLowerCase();
      
      // Network and connection errors
      if (message.includes('network') || message.includes('failed to fetch') || message.includes('connection')) {
        return {
          userMessage: t('errors.network.message'),
          severity: 'medium',
          actionable: true,
          suggestions: [
            t('errors.network.checkConnection'),
            t('errors.network.tryAgainLater'),
            t('errors.network.contactSupport')
          ]
        };
      }

      // Authentication errors
      if (message.includes('amadeus_auth_invalid_credentials') || message.includes('unauthorized')) {
        return {
          userMessage: t('errors.auth.serviceUnavailable'),
          severity: 'high',
          actionable: false,
          suggestions: [
            t('errors.auth.teamNotified'),
            t('errors.auth.tryAgainLater')
          ]
        };
      }

      // Rate limiting and overload
      if (message.includes('circuit breaker') || message.includes('rate limit') || message.includes('overload')) {
        return {
          userMessage: t('errors.rateLimit.message'),
          severity: 'medium',
          actionable: true,
          suggestions: [
            t('errors.rateLimit.waitAndRetry'),
            t('errors.rateLimit.reducedLoad'),
            t('errors.rateLimit.tryOffPeak')
          ]
        };
      }

      // Validation errors
      if (message.includes('missing required parameters') || message.includes('validation')) {
        return {
          userMessage: userGuidance || t('errors.validation.checkInput'),
          severity: 'low',
          actionable: true,
          suggestions: [
            t('errors.validation.reviewForm'),
            t('errors.validation.requiredFields'),
            t('errors.validation.formatCheck')
          ]
        };
      }

      // Date validation errors
      if (message.includes('check-in date cannot be in the past')) {
        return {
          userMessage: t('errors.dates.pastCheckIn'),
          severity: 'low',
          actionable: true,
          suggestions: [
            t('errors.dates.selectFutureDate'),
            t('errors.dates.checkCalendar')
          ]
        };
      }

      if (message.includes('check-out date must be after check-in')) {
        return {
          userMessage: t('errors.dates.invalidOrder'),
          severity: 'low',
          actionable: true,
          suggestions: [
            t('errors.dates.adjustCheckOut'),
            t('errors.dates.verifyDates')
          ]
        };
      }

      // Search specific errors
      if (message.includes('no hotels found') || message.includes('no flights found') || message.includes('no activities found')) {
        return {
          userMessage: t('errors.search.noResults'),
          severity: 'low',
          actionable: true,
          suggestions: [
            t('errors.search.tryDifferentDates'),
            t('errors.search.expandLocation'),
            t('errors.search.adjustFilters'),
            t('errors.search.contactAgent')
          ]
        };
      }

      // Payment errors
      if (message.includes('payment') && message.includes('failed')) {
        return {
          userMessage: t('errors.payment.failed'),
          severity: 'high',
          actionable: true,
          suggestions: [
            t('errors.payment.checkDetails'),
            t('errors.payment.tryDifferentCard'),
            t('errors.payment.contactBank'),
            t('errors.payment.contactSupport')
          ]
        };
      }

      // Booking errors
      if (message.includes('booking') && message.includes('failed')) {
        return {
          userMessage: t('errors.booking.failed'),
          severity: 'high',
          actionable: true,
          suggestions: [
            t('errors.booking.verifyAvailability'),
            t('errors.booking.checkPayment'),
            t('errors.booking.contactSupport')
          ]
        };
      }

      // Context-specific defaults
      const contextMessages: Record<string, any> = {
        'hotel-search': {
          userMessage: t('errors.context.hotelSearch'),
          suggestions: [t('errors.context.adjustCriteria'), t('errors.context.tryAgain')]
        },
        'flight-search': {
          userMessage: t('errors.context.flightSearch'),
          suggestions: [t('errors.context.checkDates'), t('errors.context.tryAgain')]
        },
        'activity-search': {
          userMessage: t('errors.context.activitySearch'),
          suggestions: [t('errors.context.adjustLocation'), t('errors.context.tryAgain')]
        },
        'booking': {
          userMessage: t('errors.context.booking'),
          suggestions: [t('errors.context.contactSupport')]
        },
        'payment': {
          userMessage: t('errors.context.payment'),
          suggestions: [t('errors.context.checkPaymentMethod')]
        }
      };

      return contextMessages[context] || {
        userMessage: t('errors.generic.message'),
        suggestions: [t('errors.generic.tryAgain')]
      };
    };

    const analysis = analyzeError(errorObj);
    const isSystemLevel = ['high', 'critical'].includes(analysis.severity || severity);

    // Enhanced toast notification with actions
    if (showToast) {
      const toastDuration = isSystemLevel ? 10000 : 6000;
      
      toast.error(analysis.userMessage || t('errors.generic.message'), {
        duration: toastDuration,
        description: analysis.suggestions?.[0],
        action: retryCallback && isSystemLevel ? {
          label: t('common.retryIn1Min'),
          onClick: () => {
            setTimeout(retryCallback, 60000);
            toast.info(t('common.retryScheduled'));
          }
        } : retryCallback ? {
          label: t('common.tryAgain'),
          onClick: retryCallback
        } : undefined
      });

      // Show additional guidance for actionable errors
      if (analysis.actionable && analysis.suggestions && analysis.suggestions.length > 1) {
        setTimeout(() => {
          toast.info(t('errors.helpTitle'), {
            description: analysis.suggestions.slice(1, 3).join(' • '),
            duration: 8000
          });
        }, 1000);
      }
    }

    return {
      userMessage: analysis.userMessage || t('errors.generic.message'),
      isSystemError: isSystemLevel,
      originalError: errorObj,
      severity: analysis.severity || severity,
      actionable: analysis.actionable || false,
      suggestions: analysis.suggestions
    };
  }, [t]);

  // Specialized error handlers
  const handleNetworkError = useCallback((error: unknown, retryCallback?: () => void) => {
    return handleError({
      error,
      options: {
        context: 'network',
        retryCallback,
        severity: 'medium'
      }
    });
  }, [handleError]);

  const handleValidationError = useCallback((error: unknown, field?: string) => {
    const guidance = field ? t('errors.validation.specificField', { field }) : undefined;
    
    return handleError({
      error,
      options: {
        context: 'validation',
        userGuidance: guidance,
        severity: 'low'
      }
    });
  }, [handleError, t]);

  const handleBookingError = useCallback((error: unknown, bookingType?: string) => {
    return handleError({
      error,
      options: {
        context: 'booking',
        severity: 'high',
        userGuidance: bookingType ? t('errors.booking.typeSpecific', { type: bookingType }) : undefined
      }
    });
  }, [handleError, t]);

  const handleCriticalError = useCallback((error: unknown, context?: string) => {
    return handleError({
      error,
      options: {
        context: context || 'critical',
        severity: 'critical',
        showToast: true,
        logError: true
      }
    });
  }, [handleError]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handleBookingError,
    handleCriticalError
  };
};