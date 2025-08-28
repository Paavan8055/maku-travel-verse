// Simple logger utility for edge functions
export interface LogContext {
  correlationId?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const correlationId = context?.correlationId || 'no-correlation';
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${correlationId}]`;
    
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }
    return `${prefix} ${message}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: any, context?: LogContext): void {
    const errorContext = { ...context };
    if (error) {
      errorContext.error = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error;
    }
    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    console.debug(this.formatMessage('debug', message, context));
  }
}

const logger = new Logger();
export default logger;