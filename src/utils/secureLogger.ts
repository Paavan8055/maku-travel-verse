// Secure logging utility that prevents sensitive data exposure
interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

interface SecureLogContext {
  correlationId?: string;
  userId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class SecureLogger {
  private static instance: SecureLogger;
  private isDevelopment = import.meta.env.DEV;
  private sensitivePatterns = [
    /sk_test_[a-zA-Z0-9]+/g, // Stripe test keys
    /sk_live_[a-zA-Z0-9]+/g, // Stripe live keys
    /pk_test_[a-zA-Z0-9]+/g, // Stripe publishable test keys
    /pk_live_[a-zA-Z0-9]+/g, // Stripe publishable live keys
    /client_secret_[a-zA-Z0-9]+/g, // Stripe client secrets
    /Bearer\s+[-._~+/A-Za-z0-9]+=*/g, // Bearer tokens
    /password["\s]*[:=]["\s]*[^"\s]+/gi, // Password fields
    /email["\s]*[:=]["\s]*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi, // Email addresses
    /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, // Credit card numbers
  ];

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private sanitizeMessage(message: string): string {
    let sanitized = message;
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeMessage(obj);
    }
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove sensitive keys entirely
      if (['password', 'secret', 'token', 'key', 'authorization'].some(sensitive => 
        key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }
    return sanitized;
  }

  private formatMessage(level: string, message: string, context?: SecureLogContext): string {
    const timestamp = new Date().toISOString();
    const correlationId = context?.correlationId || 'no-correlation';
    const component = context?.component || 'unknown';
    
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}] [${correlationId}]`;
    
    const sanitizedMessage = this.sanitizeMessage(message);
    
    if (context && Object.keys(context).length > 0) {
      const sanitizedContext = this.sanitizeObject(context);
      return `${prefix} ${sanitizedMessage} ${JSON.stringify(sanitizedContext)}`;
    }
    return `${prefix} ${sanitizedMessage}`;
  }

  debug(message: string, context?: SecureLogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: SecureLogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: SecureLogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: any, context?: SecureLogContext): void {
    const errorContext = { ...context };
    if (error) {
      errorContext.error = error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : '[REDACTED]',
        name: error.name
      } : this.sanitizeObject(error);
    }
    console.error(this.formatMessage('error', message, errorContext));
  }

  // Production-safe logging for user actions
  userAction(action: string, userId?: string, details?: any): void {
    this.info('User action performed', {
      component: 'UserAction',
      action,
      userId: userId || 'anonymous',
      details: this.sanitizeObject(details)
    });
  }

  // Security event logging
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any): void {
    this.warn(`Security event: ${event}`, {
      component: 'Security',
      severity,
      event,
      details: this.sanitizeObject(details)
    });
  }
}

export const secureLogger = SecureLogger.getInstance();
export default secureLogger;