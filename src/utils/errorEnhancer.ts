import { correlationId } from './correlationId';
import logger from './logger';

interface EnhancedError extends Error {
  correlationId?: string;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  recoverable?: boolean;
  userMessage?: string;
}

export class ErrorEnhancer {
  static enhance(
    error: Error, 
    context: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): EnhancedError {
    const enhanced = error as EnhancedError;
    
    // Add correlation ID for tracking
    enhanced.correlationId = correlationId.getCurrentId();
    
    // Add context for debugging
    enhanced.context = {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      ...context
    };
    
    // Set severity
    enhanced.severity = severity;
    
    // Determine if error is recoverable
    enhanced.recoverable = ErrorEnhancer.isRecoverable(error);
    
    // Generate user-friendly message
    enhanced.userMessage = ErrorEnhancer.getUserMessage(error, severity);
    
    // Log enhanced error
    logger.error('Enhanced error created', {
      correlationId: enhanced.correlationId,
      message: enhanced.message,
      severity,
      context: enhanced.context,
      stack: enhanced.stack
    });
    
    return enhanced;
  }
  
  private static isRecoverable(error: Error): boolean {
    // Network errors are often recoverable
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
    
    // Rate limiting is recoverable
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return true;
    }
    
    // Timeout errors are recoverable
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return true;
    }
    
    // Validation errors are not recoverable without user action
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return false;
    }
    
    // Default to non-recoverable for safety
    return false;
  }
  
  private static getUserMessage(error: Error, severity: string): string {
    const baseMessage = error.message;
    
    switch (severity) {
      case 'critical':
        return 'A critical error occurred. Please contact support if this persists.';
      
      case 'high':
        if (baseMessage.includes('payment') || baseMessage.includes('billing')) {
          return 'There was an issue processing your payment. Please try again or contact support.';
        }
        if (baseMessage.includes('booking')) {
          return 'Unable to complete your booking. Please try again or contact support.';
        }
        return 'An important operation failed. Please try again or contact support.';
      
      case 'medium':
        if (baseMessage.includes('search')) {
          return 'Search temporarily unavailable. Please try again in a moment.';
        }
        if (baseMessage.includes('load')) {
          return 'Unable to load content. Please refresh the page.';
        }
        return 'Something went wrong. Please try again.';
      
      case 'low':
        return 'A minor issue occurred. You can continue using the application.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  static createRecoveryAction(error: EnhancedError): {
    action: 'retry' | 'reload' | 'contact' | 'ignore';
    delay?: number;
    maxRetries?: number;
  } {
    if (!error.recoverable) {
      return { action: 'contact' };
    }
    
    if (error.message.includes('rate limit')) {
      return { action: 'retry', delay: 5000, maxRetries: 3 };
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return { action: 'retry', delay: 2000, maxRetries: 5 };
    }
    
    if (error.message.includes('timeout')) {
      return { action: 'retry', delay: 1000, maxRetries: 3 };
    }
    
    if (error.severity === 'low') {
      return { action: 'ignore' };
    }
    
    return { action: 'reload' };
  }
  
  static formatForDisplay(error: EnhancedError): {
    title: string;
    message: string;
    variant: 'default' | 'destructive' | 'warning';
    action?: string;
  } {
    const recoveryAction = ErrorEnhancer.createRecoveryAction(error);
    
    let variant: 'default' | 'destructive' | 'warning' = 'default';
    let title = 'Error';
    
    switch (error.severity) {
      case 'critical':
      case 'high':
        variant = 'destructive';
        title = 'Critical Error';
        break;
      case 'medium':
        variant = 'warning';
        title = 'Warning';
        break;
      case 'low':
        variant = 'default';
        title = 'Notice';
        break;
    }
    
    let actionText: string | undefined;
    switch (recoveryAction.action) {
      case 'retry':
        actionText = 'Retrying automatically...';
        break;
      case 'reload':
        actionText = 'Please refresh the page';
        break;
      case 'contact':
        actionText = 'Please contact support';
        break;
    }
    
    return {
      title,
      message: error.userMessage || error.message,
      variant,
      action: actionText
    };
  }
}

// Convenience function for quick error enhancement
export const enhanceError = (
  error: Error,
  context?: Record<string, any>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): EnhancedError => {
  return ErrorEnhancer.enhance(error, context, severity);
};