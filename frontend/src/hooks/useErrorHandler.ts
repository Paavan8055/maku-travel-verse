import { useCallback } from 'react';
import { toast } from 'sonner';
import logger from '@/utils/logger';

interface ErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  logError?: boolean;
  retryCallback?: () => void;
}

interface HandleErrorParams {
  error: unknown;
  options?: ErrorHandlerOptions;
}

export const useErrorHandler = () => {
  const handleError = useCallback(({ error, options = {} }: HandleErrorParams) => {
    const {
      context = 'application',
      showToast = true,
      logError = true,
      retryCallback
    } = options;

    // Log error if enabled
    if (logError) {
      logger.error(`[${context}] Error:`, error);
    }

    // Convert error to Error object if needed
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Determine user-friendly message
    const getUserMessage = (err: Error): string => {
      const message = err.message.toLowerCase();

      // Network and connection errors
      if (message.includes('network') || message.includes('failed to fetch') || message.includes('connection')) {
        return 'Connection error. Please check your internet connection and try again.';
      }

      // Authentication errors
      if (message.includes('amadeus_auth_invalid_credentials') || message.includes('unauthorized')) {
        return 'Service temporarily unavailable. Our team has been notified.';
      }

      // Rate limiting and overload
      if (message.includes('circuit breaker') || message.includes('rate limit') || message.includes('overload')) {
        return 'Service is temporarily busy. Please try again in a few minutes.';
      }

      // Validation errors
      if (message.includes('missing required parameters') || message.includes('validation')) {
        return 'Please check your input and try again.';
      }

      // Date validation
      if (message.includes('check-in date cannot be in the past')) {
        return 'Please select a check-in date that is today or in the future.';
      }

      if (message.includes('check-out date must be after check-in')) {
        return 'Please ensure your check-out date is after your check-in date.';
      }

      // Search specific errors
      if (message.includes('no hotels found') || message.includes('no flights found') || message.includes('no activities found')) {
        return 'No results found for your search criteria. Try adjusting your dates or location.';
      }

      // Payment errors
      if (message.includes('payment') && message.includes('failed')) {
        return 'Payment could not be processed. Please check your payment details and try again.';
      }

      // Booking errors
      if (message.includes('booking') && message.includes('failed')) {
        return 'Booking could not be completed. Please try again or contact support.';
      }

      // Default message based on context
      switch (context) {
        case 'hotel-search':
          return 'Unable to search hotels at this time. Please try again.';
        case 'flight-search':
          return 'Unable to search flights at this time. Please try again.';
        case 'activity-search':
          return 'Unable to search activities at this time. Please try again.';
        case 'booking':
          return 'Unable to complete booking at this time. Please try again.';
        case 'payment':
          return 'Payment processing failed. Please try again.';
        default:
          return 'Something went wrong. Please try again.';
      }
    };

    // Determine if this is a system error that needs special handling
    const isSystemError = (err: Error): boolean => {
      const message = err.message.toLowerCase();
      return message.includes('amadeus_auth_invalid_credentials') ||
             message.includes('circuit breaker') ||
             message.includes('service unavailable') ||
             message.includes('internal server error');
    };

    const userMessage = getUserMessage(errorObj);
    const isSystemLevel = isSystemError(errorObj);

    // Show toast notification if enabled
    if (showToast) {
      const toastOptions = {
        duration: isSystemLevel ? 8000 : 5000,
        action: retryCallback && isSystemLevel ? {
          label: "Retry in 1 min",
          onClick: () => {
            setTimeout(retryCallback, 60000);
          }
        } : undefined
      };

      toast.error(userMessage, toastOptions);
    }

    return {
      userMessage,
      isSystemError: isSystemLevel,
      originalError: errorObj
    };
  }, []);

  // Specific error handlers for common scenarios
  const handleNetworkError = useCallback((error: unknown, retryCallback?: () => void) => {
    return handleError({
      error,
      options: {
        context: 'network',
        retryCallback
      }
    });
  }, [handleError]);

  const handleValidationError = useCallback((error: unknown, field?: string) => {
    const message = field 
      ? `Please check the ${field} field and try again.`
      : 'Please check your input and try again.';
    
    toast.error(message);
    logger.warn('Validation error:', error);

    return {
      userMessage: message,
      isSystemError: false,
      originalError: error instanceof Error ? error : new Error(String(error))
    };
  }, []);

  const handleBookingError = useCallback((error: unknown, bookingType?: string) => {
    return handleError({
      error,
      options: {
        context: 'booking',
        showToast: true,
        logError: true
      }
    });
  }, [handleError]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handleBookingError
  };
};