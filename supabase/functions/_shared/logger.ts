import pino from 'npm:pino';

const logger = pino({
  level: Deno.env.get('LOG_LEVEL') ?? (Deno.env.get('NODE_ENV') === 'production' ? 'info' : 'debug'),
});

export default logger;
