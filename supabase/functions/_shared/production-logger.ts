// Production-ready structured logger for edge functions
export interface ProductionLogContext {
  correlationId?: string;
  userId?: string;
  functionName?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  context: ProductionLogContext;
  environment: string;
  service: string;
}

class ProductionLogger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string = 'edge-function') {
    this.serviceName = serviceName;
    this.environment = Deno.env.get('ENVIRONMENT') || 'development';
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context: ProductionLogContext = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        functionName: this.serviceName,
        environment: this.environment
      },
      environment: this.environment,
      service: this.serviceName
    };
  }

  private formatForConsole(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry;
    const correlationId = context.correlationId || 'no-correlation';
    const operation = context.operation || 'unknown';
    
    const prefix = `[${timestamp}] [${level}] [${correlationId}] [${operation}]`;
    
    // In production, exclude sensitive context from console logs
    const safeContext = this.sanitizeContext(context);
    
    if (Object.keys(safeContext).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(safeContext)}`;
    }
    return `${prefix} ${message}`;
  }

  private sanitizeContext(context: ProductionLogContext): ProductionLogContext {
    const sanitized = { ...context };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Remove large objects to keep logs manageable
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        const serialized = JSON.stringify(value);
        if (serialized.length > 1000) {
          sanitized[key] = '[LARGE_OBJECT_TRUNCATED]';
        }
      }
    }
    
    return sanitized;
  }

  private outputLog(entry: LogEntry): void {
    const formattedMessage = this.formatForConsole(entry);
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(formattedMessage);
        break;
    }
    
    // In production, also send to external logging service
    if (this.environment === 'production') {
      this.sendToExternalLogger(entry);
    }
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    try {
      // This would integrate with services like DataDog, LogDNA, etc.
      // For now, we'll use the system_logs table
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return; // Skip external logging if not configured
      }

      await fetch(`${supabaseUrl}/rest/v1/system_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          correlation_id: entry.context.correlationId,
          service_name: entry.service,
          log_level: entry.level.toLowerCase(),
          level: entry.level.toLowerCase(),
          message: entry.message,
          metadata: entry.context,
          request_id: entry.context.requestId,
          user_id: entry.context.userId,
          duration_ms: entry.context.duration,
          status_code: entry.context.statusCode
        })
      });
    } catch (error) {
      // Don't let logging errors break the main function
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: ProductionLogContext): void {
    if (this.environment === 'development') {
      const entry = this.createLogEntry('DEBUG', message, context);
      this.outputLog(entry);
    }
  }

  info(message: string, context?: ProductionLogContext): void {
    const entry = this.createLogEntry('INFO', message, context);
    this.outputLog(entry);
  }

  warn(message: string, context?: ProductionLogContext): void {
    const entry = this.createLogEntry('WARN', message, context);
    this.outputLog(entry);
  }

  error(message: string, error?: any, context?: ProductionLogContext): void {
    const errorContext = { ...context };
    
    if (error) {
      errorContext.error = error instanceof Error ? {
        message: error.message,
        stack: this.environment === 'development' ? error.stack : '[REDACTED]',
        name: error.name
      } : error;
    }
    
    const entry = this.createLogEntry('ERROR', message, errorContext);
    this.outputLog(entry);
  }

  fatal(message: string, error?: any, context?: ProductionLogContext): void {
    const errorContext = { ...context };
    
    if (error) {
      errorContext.error = error instanceof Error ? {
        message: error.message,
        stack: error.stack, // Always include stack for fatal errors
        name: error.name
      } : error;
    }
    
    const entry = this.createLogEntry('FATAL', message, errorContext);
    this.outputLog(entry);
  }

  // Structured logging for specific operations
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: ProductionLogContext
  ): void {
    this.info(`${method} ${path} ${statusCode}`, {
      ...context,
      operation: 'http_request',
      statusCode,
      duration,
      method,
      path
    });
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context?: ProductionLogContext
  ): void {
    const level = success ? 'info' : 'error';
    const message = `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`;
    
    this[level](message, {
      ...context,
      operation: 'database_operation',
      table,
      duration,
      success
    });
  }

  logApiCall(
    provider: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    success: boolean,
    context?: ProductionLogContext
  ): void {
    const level = success ? 'info' : 'error';
    const message = `API call to ${provider}${endpoint} ${success ? 'succeeded' : 'failed'}`;
    
    this[level](message, {
      ...context,
      operation: 'api_call',
      provider,
      endpoint,
      statusCode,
      duration,
      success
    });
  }

  logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
    context?: ProductionLogContext
  ): void {
    const level = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    
    this[level](`Security event: ${eventType}`, {
      ...context,
      operation: 'security_event',
      eventType,
      severity,
      details
    });
  }
}

// Factory function to create logger instances
export function createLogger(serviceName: string): ProductionLogger {
  return new ProductionLogger(serviceName);
}

// Default logger instance
export const logger = new ProductionLogger();
export default logger;
