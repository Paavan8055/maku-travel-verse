// Simple logger for Supabase Edge Functions
interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

class Logger {
  private logLevel: 'info' | 'warn' | 'error' | 'debug' = 'info';

  private formatMessage(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    console[level as keyof Console](`[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`);
  }

  info(message: string, data?: any): void {
    this.formatMessage('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.formatMessage('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.formatMessage('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.formatMessage('debug', message, data);
  }
}

const logger = new Logger();
export default logger;