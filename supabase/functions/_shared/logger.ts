// Unified logger utility for all edge functions
const logger = {
  debug: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const correlationId = globalThis.correlationId || 'no-correlation';
    console.log(`[${timestamp}] [DEBUG] [${correlationId}] ${message}`, data ? JSON.stringify(data) : '');
  },
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const correlationId = globalThis.correlationId || 'no-correlation';
    console.log(`[${timestamp}] [INFO] [${correlationId}] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const correlationId = globalThis.correlationId || 'no-correlation';
    console.warn(`[${timestamp}] [WARN] [${correlationId}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const correlationId = globalThis.correlationId || 'no-correlation';
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[${timestamp}] [ERROR] [${correlationId}] ${message}`, errorData ? JSON.stringify(errorData) : '');
  }
};

export default logger;