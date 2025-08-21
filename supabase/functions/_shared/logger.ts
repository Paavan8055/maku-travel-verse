/* global Deno */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const envLevel = Deno.env.get('LOG_LEVEL') as LogLevel | undefined
const nodeEnv = Deno.env.get('NODE_ENV')
export const LOG_LEVEL: LogLevel = envLevel ?? (nodeEnv === 'production' ? 'info' : 'debug')

const order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function shouldLog(level: LogLevel) {
  return order[level] >= order[LOG_LEVEL]
}

export const logger = {
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
