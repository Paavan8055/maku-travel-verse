export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined
export const LOG_LEVEL: LogLevel = envLevel ?? (import.meta.env.PROD ? 'info' : 'debug')

const order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function shouldLog(level: LogLevel) {
  return order[level] >= order[LOG_LEVEL]
}

const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug(...args)
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info(...args)
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error(...args)
  },
}

export default logger
