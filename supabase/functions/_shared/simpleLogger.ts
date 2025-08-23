// Simple console-based logger for Supabase Edge Runtime compatibility
interface LogEntry {
  level: string;
  message: string;
  data?: any;
  timestamp: string;
}

class SimpleLogger {
  private formatLog(level: string, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  private output(logEntry: LogEntry): void {
    const logString = `[${logEntry.level.toUpperCase()}] ${logEntry.message}`;
    
    if (logEntry.data) {
      console.log(logString, logEntry.data);
    } else {
      console.log(logString);
    }
  }

  debug(message: string, data?: any): void {
    this.output(this.formatLog('debug', message, data));
  }

  info(message: string, data?: any): void {
    this.output(this.formatLog('info', message, data));
  }

  warn(message: string, data?: any): void {
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, data?: any): void {
    this.output(this.formatLog('error', message, data));
  }
}

const logger = new SimpleLogger();
export default logger;