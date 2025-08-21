// Simple client-side logger implementation.
// Log levels can be configured via the VITE_LOG_LEVEL environment variable.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Define an order for each log level so that higher severity levels
// always log when lower levels are filtered out.
const levelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Determine the current log level from the environment. Fall back to 'info'
// when not specified. In Vite, client-side environment variables are
// exposed via import.meta.env.
const envLevel = (import.meta as any)?.env?.VITE_LOG_LEVEL ?? 'info';
const currentLevel = (envLevel as LogLevel) in levelOrder ? (envLevel as LogLevel) : 'info';

// Helper to check if a message should be logged given its severity.
function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[currentLevel];
}

const logger = {
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (shouldLog('info')) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (shouldLog('warn')) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (shouldLog('error')) console.error(...args);
  },
};

export default logger;